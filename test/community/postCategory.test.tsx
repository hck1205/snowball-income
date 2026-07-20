import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { profileAtom, sessionAtom } from '@/jotai/community';
import type { PersistedScenarioState } from '@/jotai/snowball/types';
import { COMMUNITY_COPY, getSelectablePostCategories, toPostCategory } from '@/shared/constants/community';

/**
 * 자유게시판 글 종류(posts.category) — 자유 · 질문&고민 · 인사이트 · 건의사항 · 공지.
 *
 * 고정하는 계약 4가지:
 *   1) 드롭다운은 **게시판(kind='board')에만** 있다. 갤러리(portfolio)에는 없다.
 *   2) '공지'는 **운영자에게만** 선택지다 → 비운영자 4개, 운영자 5개.
 *   3) 저장은 **기본값과 다를 때만** category 키를 보낸다 —
 *      마이그레이션 전 DB 에서도 '자유' 게시/무변경 수정이 42703 없이 성공하고,
 *      **수정 모드에서 기존 값이 조용히 리셋되지 않는다**(뷰가 아니라 IO 인자로 단정).
 *   4) 목록 배지는 게시판 글의 비기본 분류에만 붙는다.
 */

const w = COMMUNITY_COPY.write;

const validScenario: PersistedScenarioState = {
  id: 'local-1',
  name: '내 시나리오',
  portfolio: {
    tickerProfiles: [],
    includedTickerIds: [],
    weightByTickerId: {},
    fixedByTickerId: {},
    selectedTickerId: null
  },
  investmentSettings: {
    initialInvestment: 10_000_000,
    monthlyContribution: 500_000,
    targetMonthlyDividend: 2_000_000,
    investmentStartDate: '2026-01-01',
    durationYears: 20,
    reinvestDividends: true,
    reinvestDividendPercent: 100,
    taxRate: 15.4,
    reinvestTiming: 'sameMonth',
    dpsGrowthMode: 'annualStep',
    showQuickEstimate: false,
    showSplitGraphs: false,
    isResultCompact: false,
    isYearlyAreaFillOn: true,
    showPortfolioDividendCenter: true,
    visibleYearlySeries: {
      totalContribution: true,
      assetValue: true,
      annualDividend: false,
      monthlyDividend: false,
      cumulativeDividend: false
    }
  }
};

/** 수정 모드에서 서버가 돌려줄 원본 글. 기본은 **건의사항**(기본값이 아닌 값) 글이다. */
const defaultServerDetail: Record<string, unknown> = {
  id: 'post-1',
  user_id: 'user-1',
  title: '기존 글',
  body: '<p>기존 본문</p>',
  is_public: true,
  payload: null,
  category: 'suggestion'
};

let serverDetail: Record<string, unknown> = defaultServerDetail;

const setServerDetail = (over: Record<string, unknown>) => {
  serverDetail = { ...defaultServerDetail, ...over };
};

vi.mock('@/components/community/RichTextEditor', () => ({
  RichTextEditor: ({ ariaLabel }: { ariaLabel: string }) => <textarea aria-label={ariaLabel} readOnly />
}));

vi.mock('@/jotai', () => ({
  readPersistedAppState: vi.fn(async () => ({
    ok: true,
    payload: { activeScenarioId: 'local-1', scenarios: [validScenario] }
  }))
}));

vi.mock('@/shared/lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/supabase')>();
  return {
    ...actual,
    getSupabaseClient: vi.fn(async () => ({}) as unknown),
    fetchPostDetail: vi.fn(async () => serverDetail as unknown),
    publishPost: vi.fn(async (_client: unknown, input: Record<string, unknown>) => ({ id: 'new-id', ...input })),
    updatePost: vi.fn(async (_client: unknown, id: string, patch: Record<string, unknown>) => ({ id, ...patch }))
  };
});

vi.mock('@/components/community', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/community')>();
  return {
    ...actual,
    useCommunityAuth: (() => ({ authReady: true, login: vi.fn() })) as unknown as typeof actual.useCommunityAuth
  };
});

const { usePostComposer } = await import('@/pages/Community/CommunityWritePage/hooks/usePostComposer');
const { default: CommunityWritePage } = await import('@/pages/Community/CommunityWritePage');
const { PostRow } = await import('@/components/community');
const { publishPost, updatePost } = await import('@/shared/lib/supabase');
type PostListItem = import('@/shared/lib/supabase').PostListItem;

const store = createStore();
store.set(sessionAtom, { user: { id: 'user-1' } } as never);

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <MemoryRouter>{children}</MemoryRouter>
  </Provider>
);

const renderPage = (kind: 'board' | 'portfolio', admin: boolean) => {
  const s = createStore();
  s.set(sessionAtom, { user: { id: 'user-1' } } as never);
  s.set(profileAtom, { id: 'user-1', display_name: 'n', avatar_url: null, is_admin: admin });

  return render(
    <Provider store={s}>
      <MemoryRouter>
        <CommunityWritePage kind={kind} />
      </MemoryRouter>
    </Provider>
  );
};

/** 수정 모드는 라우트 파라미터 `id`가 있어야 한다 — 컨테이너가 useParams로 신규/수정을 가른다. */
const renderEditPage = (admin: boolean) => {
  const s = createStore();
  s.set(sessionAtom, { user: { id: 'user-1' } } as never);
  s.set(profileAtom, { id: 'user-1', display_name: 'n', avatar_url: null, is_admin: admin });

  return render(
    <Provider store={s}>
      <MemoryRouter initialEntries={['/community/board/post-1/edit']}>
        <Routes>
          <Route path="/community/board/:id/edit" element={<CommunityWritePage kind="board" />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

const optionLabels = (select: HTMLElement) =>
  within(select)
    .getAllByRole('option')
    .map((option) => option.textContent);

beforeEach(() => {
  serverDetail = defaultServerDetail;
  vi.mocked(publishPost).mockClear();
  vi.mocked(updatePost).mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('글 종류 드롭다운 — 표면별 노출', () => {
  it('게시판 글쓰기에는 글 종류 드롭다운이 있다', async () => {
    renderPage('board', false);

    expect(await screen.findByRole('combobox', { name: w.fieldCategory })).toBeInTheDocument();
  });

  it('갤러리 글쓰기에는 글 종류 드롭다운이 없다', async () => {
    renderPage('portfolio', false);

    // 폼이 떠 있는지 먼저 확인해야 "아직 안 그려짐"을 통과로 오인하지 않는다.
    expect(await screen.findByLabelText(w.bodyAriaLabel)).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: w.fieldCategory })).not.toBeInTheDocument();
  });

  it('갤러리는 운영자에게도 글 종류 드롭다운을 보여주지 않는다', async () => {
    renderPage('portfolio', true);

    expect(await screen.findByLabelText(w.bodyAriaLabel)).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: w.fieldCategory })).not.toBeInTheDocument();
  });
});

describe("글 종류 드롭다운 — '공지'는 운영자 전용", () => {
  it('비운영자에게는 공지를 뺀 4개가 표시 순서대로 보인다', async () => {
    renderPage('board', false);

    const select = await screen.findByRole('combobox', { name: w.fieldCategory });
    expect(optionLabels(select)).toEqual([
      w.categoryLabels.free,
      w.categoryLabels.question,
      w.categoryLabels.insight,
      w.categoryLabels.suggestion
    ]);
  });

  it('운영자에게는 공지까지 5개가 보인다', async () => {
    renderPage('board', true);

    const select = await screen.findByRole('combobox', { name: w.fieldCategory });
    expect(optionLabels(select)).toEqual([
      w.categoryLabels.free,
      w.categoryLabels.question,
      w.categoryLabels.insight,
      w.categoryLabels.suggestion,
      w.categoryLabels.notice
    ]);
  });

  it("기본 선택은 '자유'다", async () => {
    renderPage('board', false);

    const select = await screen.findByRole('combobox', { name: w.fieldCategory });
    expect((select as HTMLSelectElement).value).toBe('free');
  });

  it('⭐ 운영자가 아니어도 **수정 중인 글이 공지면** 그 선택지가 남아 값이 리셋되지 않는다', async () => {
    setServerDetail({ category: 'notice' });
    renderEditPage(false);

    const select = await screen.findByRole('combobox', { name: w.fieldCategory });
    await waitFor(() => expect((select as HTMLSelectElement).value).toBe('notice'));
    expect(optionLabels(select)).toContain(w.categoryLabels.notice);
  });

  /**
   * ⭐ 선택지는 **기준선(서버 값)** 으로 계산해야 한다. 라이브 선택값으로 계산하면 사용자가
   * 한 번이라도 '자유'를 고르는 순간 '공지'가 목록에서 사라져 **되돌릴 수 없고**, 그대로 저장하면
   * 자기 공지 글이 조용히 강등된다. 그래서 "로드 직후 있다"가 아니라 **왕복**을 단정한다.
   */
  it('⭐ 비운영자가 공지 글에서 자유로 바꿨다가 **되돌릴 수 있다** (선택지가 사라지지 않는다)', async () => {
    setServerDetail({ category: 'notice' });
    const user = userEvent.setup();
    renderEditPage(false);

    const select = await screen.findByRole('combobox', { name: w.fieldCategory });
    await waitFor(() => expect((select as HTMLSelectElement).value).toBe('notice'));

    await user.selectOptions(select, 'free');
    expect((select as HTMLSelectElement).value).toBe('free');
    // 여기서 '공지'가 사라지면 되돌릴 길이 없다.
    expect(optionLabels(select)).toContain(w.categoryLabels.notice);

    await user.selectOptions(select, 'notice');
    expect((select as HTMLSelectElement).value).toBe('notice');
  });
});

describe('getSelectablePostCategories (순수)', () => {
  it('비운영자는 공지가 빠진다', () => {
    expect(getSelectablePostCategories(false)).toEqual(['free', 'question', 'insight', 'suggestion']);
  });

  it('운영자는 다섯 다', () => {
    expect(getSelectablePostCategories(true)).toEqual([
      'free',
      'question',
      'insight',
      'suggestion',
      'notice'
    ]);
  });

  it('현재 값이 목록 밖이면 뒤에 덧붙는다', () => {
    expect(getSelectablePostCategories(false, 'notice')).toEqual([
      'free',
      'question',
      'insight',
      'suggestion',
      'notice'
    ]);
  });

  it('이미 있는 현재 값은 중복 추가되지 않는다', () => {
    expect(getSelectablePostCategories(false, 'suggestion')).toEqual([
      'free',
      'question',
      'insight',
      'suggestion'
    ]);
  });

  /**
   * ⭐ 신규 두 종류는 **운영자 전용이 아니다**. 여기서 한 번 더 못박아 두면
   * ADMIN_ONLY_POST_CATEGORIES 에 실수로 끼어드는 회귀를 즉시 잡는다.
   */
  it('질문과 고민 · 인사이트는 일반 사용자도 고를 수 있다', () => {
    const allowed = getSelectablePostCategories(false);

    expect(allowed).toContain('question');
    expect(allowed).toContain('insight');
    expect(allowed).not.toContain('notice');
  });
});

describe('toPostCategory — 서버 값 정규화', () => {
  it("마이그레이션 전(키 부재)은 '자유'로 떨어진다", () => {
    expect(toPostCategory(undefined)).toBe('free');
  });

  it("미지의 값도 '자유'로 떨어진다", () => {
    expect(toPostCategory('spam')).toBe('free');
  });

  it('알려진 슬러그는 그대로', () => {
    expect(toPostCategory('notice')).toBe('notice');
  });

  it('확장된 슬러그(question · insight)도 그대로 통과한다', () => {
    expect(toPostCategory('question')).toBe('question');
    expect(toPostCategory('insight')).toBe('insight');
  });
});

describe('usePostComposer — 저장 인자 (IO 계약)', () => {
  it("신규 '자유' 글은 category 키 자체를 보내지 않는다 (마이그레이션 전에도 게시 성공)", async () => {
    const { result } = renderHook(() => usePostComposer(undefined, 'board'), { wrapper });

    act(() => result.current.setTitle('자유글'));
    act(() => result.current.handleBodyChange('<p>본문</p>'));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(publishPost).toHaveBeenCalledTimes(1));
    const input = vi.mocked(publishPost).mock.calls[0][1] as Record<string, unknown>;
    expect('category' in input).toBe(false);
  });

  it("신규 '건의사항' 글은 category='suggestion'을 보낸다", async () => {
    const { result } = renderHook(() => usePostComposer(undefined, 'board'), { wrapper });

    act(() => result.current.setTitle('건의'));
    act(() => result.current.handleBodyChange('<p>본문</p>'));
    act(() => result.current.setCategory('suggestion'));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(publishPost).toHaveBeenCalledTimes(1));
    const input = vi.mocked(publishPost).mock.calls[0][1] as Record<string, unknown>;
    expect(input.category).toBe('suggestion');
  });

  it("신규 '질문&고민' 글은 category='question'을 보낸다", async () => {
    const { result } = renderHook(() => usePostComposer(undefined, 'board'), { wrapper });

    act(() => result.current.setTitle('질문 있어요'));
    act(() => result.current.handleBodyChange('<p>본문</p>'));
    act(() => result.current.setCategory('question'));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(publishPost).toHaveBeenCalledTimes(1));
    const input = vi.mocked(publishPost).mock.calls[0][1] as Record<string, unknown>;
    expect(input.category).toBe('question');
  });

  it("신규 '인사이트' 글은 category='insight'를 보낸다", async () => {
    const { result } = renderHook(() => usePostComposer(undefined, 'board'), { wrapper });

    act(() => result.current.setTitle('배당 성장률 뜯어보기'));
    act(() => result.current.handleBodyChange('<p>본문</p>'));
    act(() => result.current.setCategory('insight'));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(publishPost).toHaveBeenCalledTimes(1));
    const input = vi.mocked(publishPost).mock.calls[0][1] as Record<string, unknown>;
    expect(input.category).toBe('insight');
  });

  /**
   * ⭐ 확장 후에도 "기본값이면 키를 생략" 규칙이 살아 있어야 한다 — 새 슬러그를 CHECK 에 넣는
   * 마이그레이션(20260727000000)을 아직 실행하지 않은 DB 에서도 '자유' 게시는 성공해야 한다.
   */
  it('⭐ 서버 값이 인사이트인 글을 안 건드리고 수정하면 patch에 category 키가 없다', async () => {
    setServerDetail({ category: 'insight' });
    const { result } = renderHook(() => usePostComposer('post-1', 'board'), { wrapper });

    await waitFor(() => expect(result.current.loadState).toBe('ready'));
    expect(result.current.category).toBe('insight');

    act(() => result.current.setTitle('제목만 고침'));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(updatePost).toHaveBeenCalledTimes(1));
    const patch = vi.mocked(updatePost).mock.calls[0][2] as Record<string, unknown>;
    expect('category' in patch).toBe(false);
  });

  it('갤러리에서는 setCategory를 불러도 무동작이고 category 키도 안 나간다', async () => {
    const { result } = renderHook(() => usePostComposer(undefined, 'portfolio'), { wrapper });

    act(() => result.current.setCategory('notice'));
    expect(result.current.categoryAllowed).toBe(false);
    expect(result.current.category).toBe('free');

    act(() => result.current.setTitle('시나리오 공유'));
    act(() => result.current.handleBodyChange('<p>본문</p>'));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(publishPost).toHaveBeenCalledTimes(1));
    const input = vi.mocked(publishPost).mock.calls[0][1] as Record<string, unknown>;
    expect('category' in input).toBe(false);
  });

  it('⭐ 수정 모드에서 분류를 안 건드리면 patch에 category 키가 없다 (기존 값 보존)', async () => {
    const { result } = renderHook(() => usePostComposer('post-1', 'board'), { wrapper });

    await waitFor(() => expect(result.current.loadState).toBe('ready'));
    // 서버 값이 폼에 그대로 실린다 — 기본값으로 리셋되지 않는다.
    expect(result.current.category).toBe('suggestion');

    act(() => result.current.setTitle('제목만 고침'));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(updatePost).toHaveBeenCalledTimes(1));
    const patch = vi.mocked(updatePost).mock.calls[0][2] as Record<string, unknown>;
    expect('category' in patch).toBe(false);
    expect(patch.title).toBe('제목만 고침');
  });

  it('⭐ 마이그레이션 전(응답에 category 없음) 게시판 글 수정도 category 키 없이 저장된다', async () => {
    setServerDetail({ category: undefined });
    const { result } = renderHook(() => usePostComposer('post-1', 'board'), { wrapper });

    await waitFor(() => expect(result.current.loadState).toBe('ready'));
    expect(result.current.category).toBe('free');

    act(() => result.current.setTitle('제목만 고침'));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(updatePost).toHaveBeenCalledTimes(1));
    const patch = vi.mocked(updatePost).mock.calls[0][2] as Record<string, unknown>;
    expect('category' in patch).toBe(false);
  });

  it('분류를 실제로 바꾸면 patch에 새 값이 실린다', async () => {
    const { result } = renderHook(() => usePostComposer('post-1', 'board'), { wrapper });

    await waitFor(() => expect(result.current.loadState).toBe('ready'));
    act(() => result.current.setCategory('notice'));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(updatePost).toHaveBeenCalledTimes(1));
    const patch = vi.mocked(updatePost).mock.calls[0][2] as Record<string, unknown>;
    expect(patch.category).toBe('notice');
  });

  it('갤러리 수정은 기존 저장 계약이 그대로다 (회귀 가드)', async () => {
    const { result } = renderHook(() => usePostComposer('post-1', 'portfolio'), { wrapper });

    await waitFor(() => expect(result.current.loadState).toBe('ready'));
    act(() => result.current.setTitle('제목 수정'));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(updatePost).toHaveBeenCalledTimes(1));
    const patch = vi.mocked(updatePost).mock.calls[0][2] as Record<string, unknown>;
    expect('category' in patch).toBe(false);
    expect(patch.isPublic).toBe(true);
  });
});

describe('글쓰기 화면 — 드롭다운 선택이 폼에 반영된다', () => {
  it('운영자가 공지를 고르면 선택값이 바뀐다', async () => {
    const user = userEvent.setup();
    renderPage('board', true);

    const select = await screen.findByRole('combobox', { name: w.fieldCategory });
    await user.selectOptions(select, 'notice');

    expect((select as HTMLSelectElement).value).toBe('notice');
  });
});

describe('목록 배지 (PostRow)', () => {
  const item = (overrides: Partial<PostListItem> = {}): PostListItem =>
    ({
      id: 'p1',
      user_id: 'u1',
      kind: 'board',
      category: 'free',
      title: '글 제목',
      description: null,
      is_public: true,
      has_payload: false,
      sim_summary: null,
      like_count: 0,
      view_count: 0,
      comment_count: 0,
      created_at: '2026-07-14T00:00:00Z',
      updated_at: '2026-07-14T00:00:00Z',
      author: null,
      ...overrides
    }) as PostListItem;

  const renderRow = (data: PostListItem) =>
    render(
      <MemoryRouter>
        <PostRow item={data} />
      </MemoryRouter>
    );

  it('공지 글에는 "공지" 배지가 붙는다', () => {
    renderRow(item({ category: 'notice' }));

    expect(screen.getByText(w.categoryLabels.notice)).toBeInTheDocument();
  });

  it('건의사항 글에는 "건의사항" 배지가 붙는다', () => {
    renderRow(item({ category: 'suggestion' }));

    expect(screen.getByText(w.categoryLabels.suggestion)).toBeInTheDocument();
  });

  it('질문&고민 글에는 "질문&고민" 배지가 붙는다', () => {
    renderRow(item({ category: 'question' }));

    expect(screen.getByText(w.categoryLabels.question)).toBeInTheDocument();
  });

  it('인사이트 글에는 "인사이트" 배지가 붙는다', () => {
    renderRow(item({ category: 'insight' }));

    expect(screen.getByText(w.categoryLabels.insight)).toBeInTheDocument();
  });

  it('자유(기본) 글에는 배지가 없다 — 피드가 배지로 뒤덮이지 않는다', () => {
    renderRow(item({ category: 'free' }));

    expect(screen.queryByText(w.categoryLabels.free)).not.toBeInTheDocument();
  });

  it('갤러리 글(kind=portfolio)에는 분류 배지가 붙지 않는다', () => {
    renderRow(item({ kind: 'portfolio', category: 'notice' }));

    expect(screen.queryByText(w.categoryLabels.notice)).not.toBeInTheDocument();
  });

  it('마이그레이션 전(컬럼 부재) 행에서도 죽지 않고 배지 없이 렌더된다', () => {
    const legacy = item();
    delete (legacy as Record<string, unknown>).category;

    renderRow(legacy);

    expect(screen.getByText('글 제목')).toBeInTheDocument();
    expect(screen.queryByText(w.categoryLabels.notice)).not.toBeInTheDocument();
  });
});
