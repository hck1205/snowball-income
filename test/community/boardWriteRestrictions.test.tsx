import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { profileAtom, sessionAtom, isCommunityAdminAtom } from '@/jotai/community';
import type { PersistedScenarioState } from '@/jotai/snowball/types';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import type { CommunityWriteViewModel } from '@/pages/Community/CommunityWritePage/CommunityWritePage.types';
import type { ScenarioCandidates, UsePostComposer } from '@/pages/Community/CommunityWritePage/hooks';

/**
 * 두 가지 제약을 **UI와 저장 로직 양쪽에서** 못박는다.
 *   1) 자유게시판(kind='board')은 시뮬 첨부가 없다 — 섹션 미렌더 + payload 키 미전송.
 *   2) 공개/비공개 선택은 운영자 전용 — 비운영자는 UI 없음, 신규는 공개 고정,
 *      **기존 비공개 글 수정 시 그 값이 보존**된다(UI가 없다고 공개로 뒤집히면 안 된다).
 */

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

const attachPayload = {
  portfolio: validScenario.portfolio,
  investmentSettings: validScenario.investmentSettings
};

/** 수정 모드에서 서버가 돌려줄 원본 글 — **비공개 + 첨부 있음**(구 게시판 글의 하위호환 상황). */
const defaultServerDetail: Record<string, unknown> = {
  id: 'post-1',
  user_id: 'user-1',
  title: '기존 글',
  body: '<p>기존 본문</p>',
  is_public: false,
  payload: attachPayload
};

let serverDetail: Record<string, unknown> = defaultServerDetail;

const setServerDetail = (over: Record<string, unknown>) => {
  serverDetail = { ...defaultServerDetail, ...over };
};

// Tiptap 에디터는 이 테스트의 관심사가 아니다 — 접근 가능한 textbox 스텁으로 대체.
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
    publishPost: vi.fn(async (_client: unknown, input: Record<string, unknown>) => ({
      id: 'new-id',
      ...input
    })),
    updatePost: vi.fn(async (_client: unknown, id: string, patch: Record<string, unknown>) => ({
      id,
      ...patch
    }))
  };
});

// 목킹 이후에 import 해야 목이 적용된 심볼을 받는다.
const { usePostComposer } = await import('@/pages/Community/CommunityWritePage/hooks/usePostComposer');
const { default: CommunityWriteView } =
  await import('@/pages/Community/CommunityWritePage/CommunityWritePage.view');
const { publishPost, updatePost } = await import('@/shared/lib/supabase');

// ── 훅 하네스 ──────────────────────────────────────────────────────────────
const store = createStore();
store.set(sessionAtom, { user: { id: 'user-1' } } as never);

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <MemoryRouter>{children}</MemoryRouter>
  </Provider>
);

// ── 뷰 하네스 ──────────────────────────────────────────────────────────────
const baseComposer = (overrides: Partial<UsePostComposer> = {}): UsePostComposer => ({
  mode: 'new',
  loadState: 'ready',
  title: '',
  initialBodyHtml: '',
  isPublic: true,
  attachAllowed: true,
  attachedPayload: null,
  errors: {},
  submitError: false,
  submitting: false,
  dirty: false,
  canSubmit: false,
  setTitle: vi.fn(),
  handleBodyChange: vi.fn(),
  setIsPublic: vi.fn(),
  attachScenario: vi.fn(),
  detachScenario: vi.fn(),
  submit: vi.fn(async () => {}),
  ...overrides
});

const renderView = (overrides: Partial<CommunityWriteViewModel> = {}) =>
  render(
    <MemoryRouter>
      <CommunityWriteView
        viewModel={{
          composer: baseComposer(),
          candidates: { status: 'empty' } as ScenarioCandidates,
          authReady: true,
          isLoggedIn: true,
          isAdmin: true,
          kind: 'portfolio',
          listPath: '/community',
          onLogin: vi.fn(),
          ...overrides
        }}
      />
    </MemoryRouter>
  );

beforeEach(() => {
  serverDetail = defaultServerDetail;
  vi.mocked(publishPost).mockClear();
  vi.mocked(updatePost).mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('자유게시판 글쓰기 — 시뮬 첨부 없음 (UI)', () => {
  it("갤러리(portfolio) 글쓰기에는 '첨부' 토글과 시뮬레이션 섹션이 있다", () => {
    renderView({ kind: 'portfolio' });

    expect(screen.getByRole('checkbox', { name: '첨부' })).toBeInTheDocument();
    expect(screen.getByText(COMMUNITY_COPY.write.fieldAttachment)).toBeInTheDocument();
  });

  it("게시판(board) 글쓰기에는 '첨부' 토글도 시뮬레이션 섹션도 없다", () => {
    renderView({
      kind: 'board',
      composer: baseComposer({ attachAllowed: false })
    });

    expect(screen.queryByRole('checkbox', { name: '첨부' })).not.toBeInTheDocument();
    expect(screen.queryByText(COMMUNITY_COPY.write.fieldAttachment)).not.toBeInTheDocument();
  });
});

describe('공개/비공개 선택 — 운영자 전용 (UI)', () => {
  it('운영자에게는 비공개 스위치가 보인다', () => {
    renderView({ isAdmin: true });

    expect(screen.getByRole('checkbox', { name: '비공개' })).toBeInTheDocument();
  });

  it('비운영자에게는 비공개 스위치도, 빈 껍데기 "게시 설정" 섹션도 없다', () => {
    renderView({ isAdmin: false });

    expect(screen.queryByRole('checkbox', { name: '비공개' })).not.toBeInTheDocument();
    expect(screen.queryByText(COMMUNITY_COPY.write.sectionPublish)).not.toBeInTheDocument();
  });
});

describe('usePostComposer — 게시판 첨부 차단 (저장 로직)', () => {
  it('게시판에서는 attachScenario를 불러도 첨부되지 않는다 (뷰가 실수해도 안 샌다)', () => {
    const { result } = renderHook(() => usePostComposer(undefined, 'board'), { wrapper });

    act(() => result.current.attachScenario(attachPayload));

    expect(result.current.attachAllowed).toBe(false);
    expect(result.current.attachedPayload).toBeNull();
  });

  it('게시판은 본문이 필수다 — 제목만으로는 게시 불가', () => {
    const { result } = renderHook(() => usePostComposer(undefined, 'board'), { wrapper });

    act(() => result.current.setTitle('제목만'));
    act(() => result.current.attachScenario(attachPayload));

    expect(result.current.canSubmit).toBe(false);

    act(() => result.current.handleBodyChange('<p>본문</p>'));
    expect(result.current.canSubmit).toBe(true);
  });

  it('게시판 신규 글의 publishPost 입력에 payload 키 자체가 없다', async () => {
    const { result } = renderHook(() => usePostComposer(undefined, 'board'), { wrapper });

    act(() => result.current.setTitle('자유글'));
    act(() => result.current.handleBodyChange('<p>본문</p>'));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(publishPost).toHaveBeenCalledTimes(1));
    const input = vi.mocked(publishPost).mock.calls[0][1] as Record<string, unknown>;
    expect('payload' in input).toBe(false);
    expect(input.kind).toBe('board');
  });

  it('갤러리 신규 글은 기존대로 payload 키를 보낸다 (무변경 회귀 가드)', async () => {
    const { result } = renderHook(() => usePostComposer(undefined, 'portfolio'), { wrapper });

    act(() => result.current.setTitle('시나리오 공유'));
    act(() => result.current.attachScenario(attachPayload));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(publishPost).toHaveBeenCalledTimes(1));
    const input = vi.mocked(publishPost).mock.calls[0][1] as Record<string, unknown>;
    expect(input.payload).not.toBeNull();
  });
});

describe('usePostComposer — 공개 범위 (저장 로직)', () => {
  it('비운영자의 새 글(공개 UI가 없어 setIsPublic 미호출)은 is_public=true로 저장된다', async () => {
    const { result } = renderHook(() => usePostComposer(undefined, 'board'), { wrapper });

    act(() => result.current.setTitle('새 글'));
    act(() => result.current.handleBodyChange('<p>본문</p>'));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(publishPost).toHaveBeenCalledTimes(1));
    const input = vi.mocked(publishPost).mock.calls[0][1] as Record<string, unknown>;
    expect(input.isPublic).toBe(true);
  });

  it('⭐ 비운영자가 기존 비공개 글을 수정해도 is_public=false가 유지된다', async () => {
    const { result } = renderHook(() => usePostComposer('post-1', 'board'), { wrapper });

    await waitFor(() => expect(result.current.loadState).toBe('ready'));
    expect(result.current.isPublic).toBe(false);

    act(() => result.current.setTitle('제목만 고침'));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(updatePost).toHaveBeenCalledTimes(1));
    const patch = vi.mocked(updatePost).mock.calls[0][2] as Record<string, unknown>;
    expect(patch.isPublic).toBe(false);
  });

  /**
   * 과거에는 `kind='board' + body=null + payload≠null` 글을 만들 수 있었다.
   * 첨부를 "없는 것"으로만 취급하면 그런 글이 "내용 없음"으로 판정돼 **제목 오타조차 고칠 수 없게
   * 잠긴다**(첨부는 화면에 안 보이니 사용자는 원인도 모른다). 수정 모드에서만 본문 대체로 인정한다.
   */
  it('본문 없이 첨부만 있던 기존 게시판 글도 제목만 고쳐 저장할 수 있다', async () => {
    setServerDetail({ body: null });
    const { result } = renderHook(() => usePostComposer('post-1', 'board'), { wrapper });

    await waitFor(() => expect(result.current.loadState).toBe('ready'));
    // 첨부는 화면에서 여전히 안 보인다 — 게시 가능 판정에만 인정된다.
    expect(result.current.attachedPayload).toBeNull();

    act(() => result.current.setTitle('제목 오타 수정'));
    expect(result.current.canSubmit).toBe(true);

    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(updatePost).toHaveBeenCalledTimes(1));
    const patch = vi.mocked(updatePost).mock.calls[0][2] as Record<string, unknown>;
    expect(patch.title).toBe('제목 오타 수정');
    // 그래도 저장 인자에는 첨부를 싣지 않는다 → 서버의 기존 payload가 보존된다.
    expect('payload' in patch).toBe(false);
  });

  it('게시판 **신규** 글은 첨부 대체가 없어 여전히 본문 없이 제출 불가', async () => {
    const { result } = renderHook(() => usePostComposer(undefined, 'board'), { wrapper });

    act(() => result.current.setTitle('제목만'));
    expect(result.current.canSubmit).toBe(false);

    await act(async () => {
      await result.current.submit();
    });

    expect(publishPost).not.toHaveBeenCalled();
    expect(result.current.errors.body).toBeTruthy();
  });

  it('게시판 글 수정은 payload 키를 안 보내 서버의 기존 첨부가 보존된다', async () => {
    const { result } = renderHook(() => usePostComposer('post-1', 'board'), { wrapper });

    await waitFor(() => expect(result.current.loadState).toBe('ready'));
    // 서버엔 첨부가 있지만 게시판 화면에서는 "없는 것"으로 보인다.
    expect(result.current.attachedPayload).toBeNull();

    act(() => result.current.setTitle('제목만 고침'));
    await act(async () => {
      await result.current.submit();
    });

    await waitFor(() => expect(updatePost).toHaveBeenCalledTimes(1));
    const patch = vi.mocked(updatePost).mock.calls[0][2] as Record<string, unknown>;
    expect('payload' in patch).toBe(false);
  });
});

describe('isCommunityAdminAtom — 마이그레이션 전 프로필 하위호환', () => {
  it('is_admin 컬럼이 없는 프로필 응답에서도 죽지 않고 일반 사용자로 동작한다', () => {
    const s = createStore();
    // 마이그레이션 전: PostgREST가 is_admin 키 자체를 안 돌려준다.
    s.set(profileAtom, { id: 'u1', display_name: 'n', avatar_url: null } as never);

    expect(s.get(isCommunityAdminAtom)).toBe(false);
  });

  it('is_admin=true인 프로필만 운영자로 판정된다', () => {
    const s = createStore();
    s.set(profileAtom, { id: 'u1', display_name: 'n', avatar_url: null, is_admin: true });

    expect(s.get(isCommunityAdminAtom)).toBe(true);
  });
});
