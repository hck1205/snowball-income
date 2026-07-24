import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import type { PostListItem } from '@/shared/lib/supabase';

/**
 * "내가 쓴 글" 화면(`/community/my-posts`) — 존재 이유는 **비공개 글을 볼 곳이 여기밖에 없다**는
 * 것이다 (갤러리/게시판 목록 쿼리는 `is_public = true` 를 명시적으로 건다).
 * 그래서 이 파일은 세 층을 같이 본다:
 *   ① 데이터 훅이 공개 필터 없는 `fetchMyPosts` 로 조회하는가 (비공개가 실제로 내려오는가)
 *   ② 목록 뷰가 공개/비공개를 텍스트로 구분해 보여주고, 빈/실패 상태를 사용자에게 알리는가
 *   ③ 페이지 뷰가 비로그인 딥링크를 로그인 게이트로 막는가
 */

vi.mock('@/shared/lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/supabase')>();
  return {
    ...actual,
    getSupabaseClient: vi.fn(async () => ({}) as unknown),
    fetchMyPosts: vi.fn(async () => [] as PostListItem[])
  };
});

const { useMyPosts } = await import('@/pages/Community/CommunityMyPostsPage/hooks');
const { MyPostsSectionView } = await import('@/pages/Community/CommunityMyPostsPage/components');
const CommunityMyPostsView = (
  await import('@/pages/Community/CommunityMyPostsPage/CommunityMyPostsPage.view')
).default;
const supa = await import('@/shared/lib/supabase');
const { sessionAtom } = await import('@/jotai/community');

const m = COMMUNITY_COPY.myPosts;

const makePost = (over: Partial<PostListItem> = {}): PostListItem =>
  ({
    id: 'post-1',
    user_id: 'user-1',
    kind: 'portfolio',
    title: '비공개 포트폴리오',
    description: null,
    is_public: false,
    has_payload: true,
    sim_summary: null,
    like_count: 0,
    view_count: 0,
    comment_count: 0,
    created_at: '2026-07-20T00:00:00.000Z',
    updated_at: '2026-07-20T00:00:00.000Z',
    author: null,
    ...over
  }) as PostListItem;

const renderView = (viewModel: Parameters<typeof MyPostsSectionView>[0]['viewModel']) =>
  render(
    <MemoryRouter>
      <MyPostsSectionView viewModel={viewModel} />
    </MemoryRouter>
  );

describe('MyPostsSectionView — 표시 계약', () => {
  it('비공개 글도 목록에 보이고, 공개/비공개를 라벨 텍스트로 구분한다', () => {
    renderView({
      status: 'ready',
      retry: vi.fn(),
      items: [
        makePost({ id: 'p1', title: '비공개 포트폴리오', is_public: false }),
        makePost({ id: 'p2', title: '공개한 글', is_public: true })
      ]
    });

    const section = screen.getByRole('region', { name: m.sectionLabel });
    const privateItem = within(section).getByRole('link', { name: /비공개 포트폴리오/ });
    const publicItem = within(section).getByRole('link', { name: /공개한 글/ });

    // 색이 아니라 텍스트로 구분된다.
    expect(privateItem).toHaveTextContent(m.visibilityPrivate);
    expect(publicItem).toHaveTextContent(m.visibilityPublic);
  });

  it('글 종류에 맞는 상세 경로로 링크한다 (갤러리/게시판)', () => {
    renderView({
      status: 'ready',
      retry: vi.fn(),
      items: [
        makePost({ id: 'p1', title: '갤러리 글', kind: 'portfolio' }),
        makePost({ id: 'p2', title: '게시판 글', kind: 'board' })
      ]
    });

    expect(screen.getByRole('link', { name: /갤러리 글/ })).toHaveAttribute(
      'href',
      '/community/portfolio/p1'
    );
    expect(screen.getByRole('link', { name: /게시판 글/ })).toHaveAttribute('href', '/community/board/p2');
  });

  it('공개 전환 버튼을 목록에 두지 않는다 (되돌리기 어려운 동작은 상세/수정에서)', () => {
    renderView({
      status: 'ready',
      retry: vi.fn(),
      items: [makePost({ is_public: false })]
    });

    const section = screen.getByRole('region', { name: m.sectionLabel });
    expect(within(section).queryAllByRole('button')).toHaveLength(0);
    // 대신 어디서 바꾸는지 안내가 상시 노출된다.
    expect(within(section).getByText(m.hint)).toBeInTheDocument();
  });

  it('글이 없으면 빈 상태를 보여준다', () => {
    renderView({ status: 'empty', retry: vi.fn(), items: [] });
    expect(screen.getByText(m.emptyTitle)).toBeInTheDocument();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('불러오기에 실패하면 사유를 알리고 다시 시도할 수 있다', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    renderView({ status: 'error', retry, items: [] });

    expect(screen.getByRole('alert')).toHaveTextContent(m.errorTitle);
    await user.click(screen.getByRole('button', { name: m.retry }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('불러오는 중에는 진행 상태를 알린다', () => {
    renderView({ status: 'loading', retry: vi.fn(), items: [] });
    expect(screen.getByRole('status')).toHaveTextContent(m.listLoading);
  });
});

describe('CommunityMyPostsView — 독립 화면 게이트', () => {
  const renderPage = (over: { authReady?: boolean; isLoggedIn?: boolean; onLogin?: () => void } = {}) =>
    render(
      <MemoryRouter>
        <CommunityMyPostsView
          viewModel={{
            authReady: true,
            isLoggedIn: true,
            onLogin: vi.fn(),
            ...over
          }}
        />
      </MemoryRouter>
    );

  it('로그인 상태에서는 "내가 쓴 글" 제목과 목록 섹션을 보여준다', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: m.title })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: m.sectionLabel })).toBeInTheDocument();
  });

  it('세션 확인 전에는 게이트 대신 로딩만 보여준다 (성급한 로그인 유도 금지)', () => {
    renderPage({ authReady: false });
    expect(screen.getByText(m.loading)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: m.title })).not.toBeInTheDocument();
  });

  it('비로그인 딥링크면 목록 대신 소셜 로그인 게이트를 보여준다', async () => {
    const onLogin = vi.fn();
    const user = userEvent.setup();
    renderPage({ isLoggedIn: false, onLogin });

    expect(screen.getByText(m.loginGateTitle)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: m.sectionLabel })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: COMMUNITY_COPY.login.google }));
    expect(onLogin).toHaveBeenCalledWith('google');
  });
});

describe('useMyPosts — 조회 계약', () => {
  const setup = () => {
    const store = createStore();
    store.set(sessionAtom, { access_token: 'tok', user: { id: 'user-1' } } as unknown as Session);
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
    return renderHook(() => useMyPosts(), { wrapper });
  };

  beforeEach(() => {
    vi.mocked(supa.fetchMyPosts).mockReset();
    vi.mocked(supa.fetchMyPosts).mockResolvedValue([]);
  });

  it('공개 필터 없는 fetchMyPosts 로 내 글을 조회한다 — 비공개가 결과에 포함된다', async () => {
    vi.mocked(supa.fetchMyPosts).mockResolvedValue([
      makePost({ id: 'private-1', is_public: false }),
      makePost({ id: 'public-1', is_public: true })
    ]);

    const { result } = setup();

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(supa.fetchMyPosts).toHaveBeenCalledWith(expect.anything(), 'user-1');
    expect(result.current.items.map((item) => item.id)).toEqual(['private-1', 'public-1']);
    expect(result.current.items.some((item) => !item.is_public)).toBe(true);
  });

  it('조회가 실패하면 error 상태가 되고, retry 가 다시 조회한다', async () => {
    vi.mocked(supa.fetchMyPosts).mockRejectedValueOnce(new Error('network'));

    const { result } = setup();
    await waitFor(() => expect(result.current.status).toBe('error'));

    vi.mocked(supa.fetchMyPosts).mockResolvedValue([makePost({ id: 'private-1' })]);
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.items).toHaveLength(1);
  });

  it('글이 하나도 없으면 empty 상태다', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.status).toBe('empty'));
  });
});
