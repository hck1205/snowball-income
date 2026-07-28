import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import CommunityDetailView from '@/pages/Community/CommunityDetailPage/CommunityDetailPage.view';
import type { CommunityDetailViewModel } from '@/pages/Community/CommunityDetailPage/CommunityDetailPage.types';

/**
 * 글 상세 **본문 첫 줄**의 계약 (2026-07-28 사용자 결정).
 *
 *   [← 목록]                                            [수정] [삭제]
 *   ─────────────────────── 제목 ───────────────────────
 *
 * 🔴 여기서 지키는 가장 중요한 것은 **수정·삭제가 작성자 본인에게만 보인다**는 것이다.
 *   남의 글에서 새면 데이터 손실로 이어지는 결함이라, 배치를 옮길 때마다 이 테스트가 따라와야 한다.
 *   (배치 자체는 "제목보다 앞선다"는 DOM 순서로만 단정한다 — 좌우 정렬은 CSS라 jsdom이 계산하지 않는다.)
 */
vi.mock('@/pages/Community/CommunityDetailPage/components', () => ({
  CommentSection: () => <div data-testid="comments" />,
  ScenarioPreview: () => <div data-testid="preview" />
}));

const d = COMMUNITY_COPY.detail;

const buildViewModel = (overrides: { isOwner?: boolean } = {}): CommunityDetailViewModel =>
  ({
    detail: {
      status: 'ready',
      post: {
        id: 'p1',
        title: '내 배당 포트폴리오',
        body: '<p>SCHD 중심 구성이에요.</p>',
        payload: null,
        user_id: 'u9',
        created_at: '2026-07-01T00:00:00.000Z',
        like_count: 3,
        view_count: 10,
        author: { display_name: '작성자', avatar_url: null }
      },
      viewCount: 10,
      likeCount: 3,
      liked: false,
      likePending: false,
      isOwner: overrides.isOwner ?? false,
      deleting: false,
      openInSimulatorHref: null,
      retry: vi.fn(),
      toggleLike: vi.fn(),
      remove: vi.fn()
    },
    comments: {},
    isLoggedIn: true,
    currentUserId: 'u9',
    listPath: '/community/board',
    onRequireLogin: vi.fn(),
    onEdit: vi.fn(),
    onOpenInSimulator: vi.fn(),
    canShare: false,
    onShare: vi.fn(),
    shareToastMessage: ''
  }) as unknown as CommunityDetailViewModel;

const renderView = (overrides: { isOwner?: boolean } = {}) =>
  render(
    <MemoryRouter initialEntries={['/community/board/p1']}>
      <CommunityDetailView viewModel={buildViewModel(overrides)} />
    </MemoryRouter>
  );

/** A 가 B 보다 문서상 앞서는가. */
const comesBefore = (a: HTMLElement, b: HTMLElement) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('글 상세 본문 첫 줄 — 목록 복귀 + 소유자 액션', () => {
  it('"← 목록"은 헤더가 아니라 본문에 있고, 제목보다 먼저 온다', () => {
    renderView();

    const back = screen.getByRole('button', { name: COMMUNITY_COPY.nav.list });
    const title = screen.getByRole('heading', { name: '내 배당 포트폴리오' });
    expect(comesBefore(back, title)).toBe(true);
  });

  it('🔴 남의 글에서는 수정·삭제가 아예 없다', () => {
    renderView({ isOwner: false });

    expect(screen.queryByRole('button', { name: d.edit })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: d.delete })).not.toBeInTheDocument();
    // 목록 복귀는 소유 여부와 무관하게 남는다(액션이 없어도 줄이 무너지지 않는다).
    expect(screen.getByRole('button', { name: COMMUNITY_COPY.nav.list })).toBeInTheDocument();
  });

  it('내 글이면 수정·삭제가 목록 버튼과 같은 줄(제목 위)에 온다', () => {
    renderView({ isOwner: true });

    const back = screen.getByRole('button', { name: COMMUNITY_COPY.nav.list });
    const edit = screen.getByRole('button', { name: d.edit });
    const remove = screen.getByRole('button', { name: d.delete });
    const title = screen.getByRole('heading', { name: '내 배당 포트폴리오' });

    expect(comesBefore(back, edit)).toBe(true);
    expect(comesBefore(edit, remove)).toBe(true);
    expect(comesBefore(remove, title)).toBe(true);
  });

  it('삭제는 곧바로 지우지 않고 확인 다이얼로그를 먼저 띄운다', async () => {
    const user = userEvent.setup();
    renderView({ isOwner: true });

    await user.click(screen.getByRole('button', { name: d.delete }));

    // 확인 라벨이 상단 바의 "삭제"와 같은 문구라 다이얼로그 안으로 범위를 좁혀 단정한다.
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(d.deleteConfirmTitle)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: d.deleteConfirm })).toBeInTheDocument();
  });
});
