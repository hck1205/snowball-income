import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { PersistedScenarioState } from '@/jotai/snowball/types';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { buildScenarioSimSummary } from '@/shared/lib/snowball';
import { formatSummaryKRW } from '@/shared/utils';
import type { ScenarioPayload } from '@/shared/lib/supabase';
import CommunityWriteView from '@/pages/Community/CommunityWritePage/CommunityWritePage.view';
import type { CommunityWriteViewModel } from '@/pages/Community/CommunityWritePage/CommunityWritePage.types';
import type {
  ScenarioCandidate,
  ScenarioCandidates,
  UseScenarioComposer
} from '@/pages/Community/CommunityWritePage/hooks';
import { useScenarioCandidates } from '@/pages/Community/CommunityWritePage/hooks';

/**
 * 시뮬레이션 첨부 행동 계약 (**"첨부" 토글 + 1단계 피커**):
 *   토글 OFF(기본) — 피커 숨김(미첨부). 본문만으로 게시 가능(optional).
 *   토글 ON — 워크스페이스 시나리오 전부를 라디오 카드로. 무효는 비활성 카드로 남김.
 *             카드를 고르면 **즉시** composer.attachScenario로 첨부(별도 버튼 없음).
 *             토글을 다시 OFF하면 composer.detachScenario로 해제.
 *   외부 첨부(수정 모드) — 서버 payload가 로드되면 토글이 자동 ON, 요약 카드만 노출(해제=토글 OFF).
 */

const { readPersistedAppStateMock } = vi.hoisted(() => ({ readPersistedAppStateMock: vi.fn() }));

vi.mock('@/jotai', () => ({ readPersistedAppState: readPersistedAppStateMock }));

// Tiptap 에디터는 이 테스트의 관심사가 아니다 — 접근 가능한 textbox 스텁으로 대체.
vi.mock('@/components/community/RichTextEditor', () => ({
  RichTextEditor: ({ ariaLabel }: { ariaLabel: string }) => <textarea aria-label={ariaLabel} readOnly />
}));

const settings = (): PersistedScenarioState['investmentSettings'] => ({
  initialInvestment: 10_000_000,
  monthlyContribution: 1_000_000,
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
});

const scenario = (overrides: Partial<PersistedScenarioState> = {}): PersistedScenarioState => ({
  id: 'local-1',
  name: '은퇴 준비 30년',
  portfolio: {
    tickerProfiles: [],
    includedTickerIds: [],
    weightByTickerId: {},
    fixedByTickerId: {},
    selectedTickerId: null
  },
  investmentSettings: settings(),
  ...overrides
});

/**
 * selectable(검증 통과)하지만 included 티커 프로필이 엔진 계약을 못 채워(id만 있음) 요약은
 * 계산 불가(null)인 payload. included 2개 → 컨텍스트 줄 "티커 2개".
 */
const attachPayload = {
  portfolio: {
    tickerProfiles: [{ id: 'a' }, { id: 'b' }],
    includedTickerIds: ['a', 'b'],
    weightByTickerId: {},
    fixedByTickerId: {},
    selectedTickerId: null
  },
  investmentSettings: { initialInvestment: 10_000_000, monthlyContribution: 1_000_000 }
} as unknown as ScenarioPayload;

/** 시뮬 요약 계산이 가능한 유효 payload(1개 included). */
const validAttachPayload = {
  portfolio: {
    tickerProfiles: [
      {
        id: 't1',
        ticker: 'SCHD',
        initialPrice: 100,
        dividendYield: 3.5,
        dividendGrowth: 8,
        expectedTotalReturn: 11.5,
        frequency: 'quarterly'
      }
    ],
    includedTickerIds: ['t1'],
    weightByTickerId: { t1: 1 },
    fixedByTickerId: {},
    selectedTickerId: 't1'
  },
  investmentSettings: settings()
} as unknown as ScenarioPayload;

const candidate = (over: Partial<ScenarioCandidate> = {}): ScenarioCandidate => ({
  id: 'c1',
  name: '공격적 성장',
  payload: attachPayload,
  selectable: true,
  summary: null,
  tickerCount: 5,
  initial: 10_000_000,
  monthly: 500_000,
  ...over
});

const baseComposer = (overrides: Partial<UseScenarioComposer> = {}): UseScenarioComposer => ({
  mode: 'new',
  loadState: 'ready',
  title: '',
  initialBodyHtml: '',
  isPublic: true,
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

const baseVM = (composer: UseScenarioComposer, candidates: ScenarioCandidates): CommunityWriteViewModel => ({
  composer,
  candidates,
  authReady: true,
  isLoggedIn: true,
  onLogin: vi.fn()
});

const renderView = (vm: CommunityWriteViewModel) =>
  render(
    <MemoryRouter>
      <CommunityWriteView viewModel={vm} />
    </MemoryRouter>
  );

describe('로그인 게이트 — 표준 소셜 로그인 버튼', () => {
  const gateVM = (onLogin = vi.fn()): CommunityWriteViewModel => ({
    ...baseVM(baseComposer(), { status: 'empty' }),
    isLoggedIn: false,
    onLogin
  });

  it('비로그인이면 구글/카카오 표준 버튼을 노출한다', () => {
    renderView(gateVM());
    expect(screen.getByRole('button', { name: COMMUNITY_COPY.login.google })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COMMUNITY_COPY.login.kakao })).toBeInTheDocument();
  });

  it('구글 버튼 클릭이 onLogin("google")을 부른다', async () => {
    const onLogin = vi.fn();
    renderView(gateVM(onLogin));
    await userEvent.click(screen.getByRole('button', { name: COMMUNITY_COPY.login.google }));
    expect(onLogin).toHaveBeenCalledWith('google');
  });

  it('카카오 버튼 클릭이 onLogin("kakao")을 부른다', async () => {
    const onLogin = vi.fn();
    renderView(gateVM(onLogin));
    await userEvent.click(screen.getByRole('button', { name: COMMUNITY_COPY.login.kakao }));
    expect(onLogin).toHaveBeenCalledWith('kakao');
  });
});

/** 섹션 헤더의 "첨부" 토글(native checkbox, aria-label="첨부"). */
const attachToggle = () => screen.getByRole('checkbox', { name: '첨부' });
const enableAttach = () => userEvent.click(attachToggle());

describe('시뮬레이션 섹션 — "첨부" 토글', () => {
  const twoCands: ScenarioCandidates = {
    status: 'ready',
    candidates: [candidate({ id: 'c1', name: '공격적 성장' }), candidate({ id: 'c2', name: '안정 배당' })]
  };

  it('토글이 기본 OFF면 피커가 숨겨진다(미첨부)', () => {
    renderView(baseVM(baseComposer(), twoCands));

    expect(attachToggle()).not.toBeChecked();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('토글 ON이면 시나리오 피커가 나타난다("첨부 안 함" 라디오는 없다)', async () => {
    renderView(baseVM(baseComposer(), twoCands));
    await enableAttach();

    expect(screen.getByRole('radiogroup', { name: '첨부할 시나리오' })).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    // 시나리오 2개만 — "첨부 안 함" 라디오는 토글로 대체돼 사라졌다
    expect(radios).toHaveLength(2);
    expect(screen.queryByRole('radio', { name: /첨부 안 함/ })).not.toBeInTheDocument();
    // 기본은 아무 카드도 미체크(optional)
    expect(screen.getByRole('radio', { name: /공격적 성장/ })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: /안정 배당/ })).toHaveAttribute('aria-checked', 'false');
    // "지금 열려 있음" 태그는 제거됐다
    expect(screen.queryByText('지금 열려 있음')).not.toBeInTheDocument();
  });

  it('토글을 다시 OFF하면 detachScenario를 부르고 피커를 감춘다', async () => {
    const composer = baseComposer();
    renderView(baseVM(composer, twoCands));

    await enableAttach();
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();

    await userEvent.click(attachToggle());
    expect(composer.detachScenario).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('토글 ON일 때 카드에 요약 숫자(SimSummaryStats attach)가 표시된다', async () => {
    const summary = buildScenarioSimSummary(validAttachPayload);
    expect(summary).not.toBeNull();
    const cands: ScenarioCandidates = {
      status: 'ready',
      candidates: [candidate({ id: 'c1', payload: validAttachPayload, summary, tickerCount: summary!.tickerCount })]
    };
    renderView(baseVM(baseComposer(), cands));
    await enableAttach();

    expect(screen.getByText(formatSummaryKRW(summary!.finalMonthlyDividend))).toBeInTheDocument();
    expect(screen.getByText(`${summary!.durationYears}년`)).toBeInTheDocument();
  });
});

describe('택1 피커 — 선택 즉시 첨부 (1단계)', () => {
  const cands = (): ScenarioCandidates => ({
    status: 'ready',
    candidates: [
      candidate({ id: 'c1', name: '공격적 성장', payload: attachPayload }),
      candidate({ id: 'c2', name: '안정 배당', payload: validAttachPayload })
    ]
  });

  it('시나리오 카드를 고르면 즉시 attachScenario(payload)를 부른다 (버튼 없음)', async () => {
    const composer = baseComposer();
    renderView(baseVM(composer, cands()));
    await enableAttach();

    await userEvent.click(screen.getByRole('radio', { name: /안정 배당/ }));

    // 선택 = 첨부 — 별도 커밋 버튼 없이 즉시 커밋된다
    expect(composer.attachScenario).toHaveBeenCalledTimes(1);
    expect(composer.attachScenario).toHaveBeenCalledWith(validAttachPayload);
    // 구 2단계 커밋 버튼은 더 이상 없다
    expect(screen.queryByRole('button', { name: '이 시나리오 첨부' })).not.toBeInTheDocument();
  });

  it('고른 뒤 첨부되면 그 카드가 체크된다', async () => {
    const { rerender } = renderView(baseVM(baseComposer(), cands()));
    await enableAttach();

    // c2 선택 → 뷰 로컬 selectedId=c2
    await userEvent.click(screen.getByRole('radio', { name: /안정 배당/ }));

    // 첨부 성공을 컴포저 상태 갱신으로 재현(같은 컴포넌트 인스턴스라 selectedId·토글 ON 유지)
    rerender(
      <MemoryRouter>
        <CommunityWriteView viewModel={baseVM(baseComposer({ attachedPayload: validAttachPayload }), cands())} />
      </MemoryRouter>
    );

    expect(screen.getByRole('radio', { name: /안정 배당/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /공격적 성장/ })).toHaveAttribute('aria-checked', 'false');
    // 첨부 안내가 노출된다
    expect(screen.getByText(/첨부 시점의 설정이 저장돼요/)).toBeInTheDocument();
  });
});

describe('택1 피커 — 무효 시나리오 비활성 카드', () => {
  it('무효 payload는 목록에서 빼지 않고 비활성 카드 + 사유로 남기고, 눌러도 첨부하지 않는다', async () => {
    const composer = baseComposer();
    const cands: ScenarioCandidates = {
      status: 'ready',
      candidates: [
        candidate({ id: 'c1', name: '공격적 성장' }),
        candidate({
          id: 'c2',
          name: '실험용',
          selectable: false,
          disabledReason: '시뮬레이션 설정이 비어 있어요. 시뮬레이터에서 먼저 구성해주세요.'
        })
      ]
    };
    renderView(baseVM(composer, cands));
    await enableAttach();

    const disabled = screen.getByRole('radio', { name: /실험용/ });
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    expect(within(disabled).getByText(/첨부할 수 없어요/)).toBeInTheDocument();

    // 비활성 카드를 눌러도 첨부되지 않는다
    await userEvent.click(disabled);
    expect(composer.attachScenario).not.toHaveBeenCalled();
    expect(disabled).toHaveAttribute('aria-checked', 'false');
  });
});

describe('택1 피커 — 빈 상태', () => {
  it('토글 ON인데 후보가 없으면 시뮬레이터로 가는 링크를 보여준다', async () => {
    renderView(baseVM(baseComposer(), { status: 'empty' }));
    await enableAttach();

    expect(screen.getByText('아직 첨부할 시뮬레이션이 없어요')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '시뮬레이터로 가기' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('토글 ON + loading 동안엔 첨부 영역을 렌더하지 않는다(빈 상태 깜빡임 방지)', async () => {
    renderView(baseVM(baseComposer(), { status: 'loading' }));
    await enableAttach();

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryByText('아직 첨부할 시뮬레이션이 없어요')).not.toBeInTheDocument();
  });
});

describe('첨부됨 — 외부 첨부(수정 모드)', () => {
  it('서버 payload가 있으면 토글이 자동 ON, 요약 카드만 노출하고 피커는 감춘다', async () => {
    const composer = baseComposer({ attachedPayload: attachPayload });
    const cands: ScenarioCandidates = {
      status: 'ready',
      candidates: [candidate({ id: 'c1', name: '공격적 성장', payload: validAttachPayload })]
    };
    renderView(baseVM(composer, cands));

    // 첨부가 있으면 토글이 자동으로 켜진다
    expect(attachToggle()).toBeChecked();
    expect(screen.getByText('티커 2개 · 초기 ₩10,000,000 · 월 ₩1,000,000')).toBeInTheDocument();
    expect(screen.getByText(/첨부 시점의 설정이 저장돼요/)).toBeInTheDocument();
    // 외부 첨부 요약 카드는 피커를 대체한다(해제는 카드 버튼이 아니라 헤더 토글)
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();

    // 토글 OFF → 해제
    await userEvent.click(attachToggle());
    expect(composer.detachScenario).toHaveBeenCalledTimes(1);
  });
});

describe('게시 설정 — 비공개 토글 + 안내 문구', () => {
  it('공개/비공개 안내 문구가 토글과 같은 행에 표시되고 상태에 따라 전환된다', () => {
    const { rerender } = renderView(baseVM(baseComposer({ isPublic: true }), { status: 'empty' }));
    expect(screen.getByRole('checkbox', { name: '비공개' })).not.toBeChecked();
    expect(screen.getByText(COMMUNITY_COPY.write.visibilityPublic)).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <CommunityWriteView viewModel={baseVM(baseComposer({ isPublic: false }), { status: 'empty' })} />
      </MemoryRouter>
    );
    expect(screen.getByRole('checkbox', { name: '비공개' })).toBeChecked();
    expect(screen.getByText(COMMUNITY_COPY.write.visibilityPrivate)).toBeInTheDocument();
  });
});

describe('useScenarioCandidates — 후보 매핑', () => {
  it('시나리오 전부를 후보로 매핑한다', async () => {
    readPersistedAppStateMock.mockResolvedValueOnce({
      ok: true,
      payload: {
        activeScenarioId: 'local-2',
        scenarios: [scenario({ id: 'local-1', name: '첫째' }), scenario({ id: 'local-2', name: '둘째' })]
      }
    });

    const { result } = renderHook(() => useScenarioCandidates());

    await waitFor(() => expect(result.current.status).toBe('ready'));
    const ready = result.current as Extract<ScenarioCandidates, { status: 'ready' }>;
    expect(ready.candidates.map((c) => c.name)).toEqual(['첫째', '둘째']);
  });

  it('무효 시나리오는 selectable=false + 사유로 남기되, 선택 가능한 게 있으면 ready', async () => {
    const invalid = scenario({
      id: 'bad',
      name: '실험용',
      portfolio: {
        tickerProfiles: Array.from({ length: 51 }, (_, i) => ({ id: `t${i}` })),
        includedTickerIds: [],
        weightByTickerId: {},
        fixedByTickerId: {},
        selectedTickerId: null
      } as unknown as PersistedScenarioState['portfolio']
    });
    readPersistedAppStateMock.mockResolvedValueOnce({
      ok: true,
      payload: { activeScenarioId: 'bad', scenarios: [invalid, scenario({ id: 'ok', name: '정상' })] }
    });

    const { result } = renderHook(() => useScenarioCandidates());

    await waitFor(() => expect(result.current.status).toBe('ready'));
    const ready = result.current as Extract<ScenarioCandidates, { status: 'ready' }>;
    const bad = ready.candidates.find((c) => c.id === 'bad');
    expect(bad?.selectable).toBe(false);
    expect(bad?.disabledReason).toBeTruthy();
  });

  it('시나리오가 0개면 empty', async () => {
    readPersistedAppStateMock.mockResolvedValueOnce({
      ok: true,
      payload: { activeScenarioId: '', scenarios: [] }
    });

    const { result } = renderHook(() => useScenarioCandidates());
    await waitFor(() => expect(result.current.status).toBe('empty'));
  });

  it('전부 무효면 empty로 접는다(무행동 목록 방지)', async () => {
    const invalid = scenario({
      id: 'bad',
      portfolio: {
        tickerProfiles: Array.from({ length: 51 }, (_, i) => ({ id: `t${i}` })),
        includedTickerIds: [],
        weightByTickerId: {},
        fixedByTickerId: {},
        selectedTickerId: null
      } as unknown as PersistedScenarioState['portfolio']
    });
    readPersistedAppStateMock.mockResolvedValueOnce({
      ok: true,
      payload: { activeScenarioId: 'bad', scenarios: [invalid] }
    });

    const { result } = renderHook(() => useScenarioCandidates());
    await waitFor(() => expect(result.current.status).toBe('empty'));
  });
});
