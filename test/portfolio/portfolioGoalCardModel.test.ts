// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { buildPortfolioGoalCardModel, toProgressBucket } from '@/pages/Portfolio/components';
import type { PortfolioGoalBasis } from '@/pages/Portfolio/components';
import type { GoalScenarioViewModel } from '@/pages/Portfolio/hooks';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';

/**
 * 목표 달성 카드 화면 모델(순수 함수)의 **경계값 계약**과 **렌더 게이트**.
 *
 * 페이지 행동 테스트로는 만들 수 없는 값들을 여기서 만든다 — 달성률이 반올림으로 100%가 되는 순간,
 * 시뮬 도달월이 과거인 조합(E′) 같은 것들이다. 이 경계에서 "100%로 보이는데 아직 못 닿았다"가
 * 도달 문구로 새거나 **과거 날짜가 "예상 달성"으로 나오면** 사용자는 사실이 아닌 것을 믿게 된다.
 */

const copy = PORTFOLIO_COPY;

/** 🔴 목표 도메인은 **원화 입력**이다. 요약 타일의 USD 포맷터를 넘기면 환율배 틀린다. */
const formatKrwAmount = (krw: number) => `₩${krw.toLocaleString('ko-KR')}`;

const MEASURED: PortfolioGoalBasis = { kind: 'measured', amountKrw: 996_000 };
const SIMULATED: PortfolioGoalBasis = { kind: 'fallback', reason: 'no-holdings' };

const baseGoal = (overrides: Partial<GoalScenarioViewModel> = {}): GoalScenarioViewModel => ({
  status: 'reached',
  isLoading: false,
  errorReason: null,
  scenarioName: '내 포트폴리오',
  tickers: ['SCHD'],
  tickerCount: 1,
  conditions: {
    initialInvestment: 100_000_000,
    monthlyContribution: 1_000_000,
    durationYears: 20,
    investmentStartDate: '2024-01-01',
    reinvestDividends: true,
    reinvestDividendPercent: 100,
    taxRate: 15.4,
    tickerCount: 1
  },
  hasTarget: true,
  targetMonthlyDividend: 1_000_000,
  currentAmount: 996_000,
  currentMode: null,
  isCurrentFallback: false,
  currentAsOf: null,
  currentBasis: 'measured',
  progressRatio: 0.996,
  // 0.996 → 반올림하면 100. 표시 숫자와 도달 판정이 갈리는 유일한 구간이다.
  progressPercent: 100,
  reachedMonth: { year: 2031, month: 4, monthIndex: 88, monthlyDividend: 1_000_100 },
  reachedYearIndex: 8,
  isAlreadyReached: false,
  evaluatedAt: { year: 2026, month: 6 },
  ...overrides
});

const build = (goal: GoalScenarioViewModel, basis: PortfolioGoalBasis = MEASURED, holdingsCount = 3) =>
  buildPortfolioGoalCardModel({
    goal,
    basis,
    holdingsStatus: 'ready',
    holdingsCount,
    formatKrwAmount
  });

/** 카드가 렌더되는 전제를 단정으로 못 박는다 — null 이면 그 자체가 회귀다. */
const tileByLabel = (model: ReturnType<typeof build>, label: string) => {
  if (model === null) throw new Error('카드가 렌더되지 않았다(모델이 null)');
  return model.tiles.find((tile) => tile.label === label);
};

describe('buildPortfolioGoalCardModel — 달성률 100% 표시가 "도달"로 새지 않는다', () => {
  it('99.6%가 100%로 반올림돼도 병기 문장은 "아직 오는 중"이다', () => {
    const model = build(baseGoal());

    expect(model?.meter?.percent).toBe(100);
    expect(model?.meter?.sentence).toBe(copy.goal.meter.sentence('₩1,000,000', '₩996,000'));
    expect(model?.meter?.sentence).not.toContain('도달했습니다');
    // 예상 달성은 여전히 **미래 시점**으로 남는다("이미 달성"이 아니다).
    expect(tileByLabel(model, copy.goal.tiles.eta)?.value).toBe(copy.goal.tiles.etaMonth(2031, 4));
    expect(model?.statusLine).toEqual({
      tone: 'success',
      text: copy.goal.status.reached(copy.goal.tiles.etaMonth(2031, 4), '₩1,000,000')
    });
    expect(model?.isAlreadyReached).toBe(false);
  });

  it('기간 내 미도달인데 반올림이 100%가 돼도 "기간 내 미도달"을 유지하고 다음 행동을 준다', () => {
    const model = build(baseGoal({ status: 'not-reached', reachedMonth: null, reachedYearIndex: null }));

    expect(model?.meter?.percent).toBe(100);
    expect(tileByLabel(model, copy.goal.tiles.eta)?.value).toBe(copy.goal.tiles.etaNotReached);
    expect(model?.statusLine?.tone).toBe('warning');
    expect(model?.actionLabel).toBe(copy.goal.status.changeConditions);
    expect(model?.reachedInRange).toBe(false);
  });

  it('이미 달성일 때만 미터를 100%로 못 박고 도달 문장을 붙인다 (남은 금액 타일은 사라진다)', () => {
    const model = build(
      baseGoal({
        status: 'already-reached',
        currentAmount: 1_200_000,
        progressRatio: 1.2,
        progressPercent: 100,
        isAlreadyReached: true
      })
    );

    expect(model?.meter).toEqual({ percent: 100, sentence: copy.goal.meter.sentenceReached('₩1,000,000') });
    expect(tileByLabel(model, copy.goal.tiles.eta)?.value).toBe(copy.goal.tiles.etaAlready);
    expect(tileByLabel(model, copy.goal.tiles.remaining)).toBeUndefined();
    expect(model?.emphasizeEditTarget).toBe(true);
    expect(model?.isAlreadyReached).toBe(true);
    // 실측 기준이면 "지금 보유한 종목" 문장, 폴백이면 그렇게 말하면 거짓이다.
    expect(model?.statusLine?.text).toBe(copy.goal.status.already('₩1,000,000'));
  });

  it('폴백에서 이미 달성이면 "지금 보유한"이라 말하지 않는다', () => {
    const model = build(
      baseGoal({
        status: 'already-reached',
        currentBasis: 'simulated',
        currentAmount: 1_200_000,
        isAlreadyReached: true
      }),
      SIMULATED,
      0
    );

    expect(model?.statusLine?.text).toBe(copy.goal.status.alreadyFallback('₩1,000,000'));
    expect(model?.statusLine?.text).not.toContain('지금 보유한');
  });
});

describe('buildPortfolioGoalCardModel — E′ 시뮬 도달월이 과거', () => {
  it('실측 기준에서 도달월이 오늘 이전이면 과거 날짜를 절대 보여 주지 않는다', () => {
    const model = build(
      baseGoal({
        status: 'reached',
        reachedMonth: { year: 2024, month: 3, monthIndex: 3, monthlyDividend: 1_000_100 },
        reachedYearIndex: 1
      })
    );

    const eta = tileByLabel(model, copy.goal.tiles.eta);
    expect(eta?.value).toBe(copy.goal.tiles.etaPast);
    expect(eta?.hint).toBe(copy.goal.tiles.etaPastHint);
    expect(eta?.value).not.toContain('2024');
    expect(model?.statusLine).toEqual({ tone: 'warning', text: copy.goal.status.etaPast });
    expect(model?.actionLabel).toBe(copy.goal.status.etaPastCta);
  });

  it('도달월이 이번 달이어도(=이미 지났을 수 있다) 예상 시점이라 말하지 않는다', () => {
    const model = build(
      baseGoal({ reachedMonth: { year: 2026, month: 6, monthIndex: 30, monthlyDividend: 1_000_100 } })
    );

    expect(tileByLabel(model, copy.goal.tiles.eta)?.value).toBe(copy.goal.tiles.etaPast);
  });

  it('폴백(시뮬 기준)에서는 E′ 가 성립하지 않는다 — 같은 계열이라 already-reached 가 먼저 잡는다', () => {
    const model = build(
      baseGoal({
        currentBasis: 'simulated',
        reachedMonth: { year: 2024, month: 3, monthIndex: 3, monthlyDividend: 1_000_100 },
        reachedYearIndex: 1
      }),
      SIMULATED,
      0
    );

    expect(tileByLabel(model, copy.goal.tiles.eta)?.value).toBe(copy.goal.tiles.etaMonth(2024, 3));
  });
});

describe('buildPortfolioGoalCardModel — 기준 안내는 한 슬롯에 한 줄', () => {
  it('실측 + 예상 달성 시점이 함께 보이면 두 숫자의 출처를 한 문장으로 말한다', () => {
    const model = build(baseGoal());

    expect(model?.basisNote).toEqual({ text: copy.goal.basis.mixed, actionLabel: null });
  });

  it('보유가 비었으면 사유 + [종목 추가] (유일하게 여기서 할 일이 있는 폴백)', () => {
    const model = build(baseGoal({ currentBasis: 'simulated' }), SIMULATED, 0);

    expect(model?.basisNote).toEqual({
      text: copy.goal.basis.noHoldings,
      actionLabel: copy.goal.basis.noHoldingsAction
    });
  });

  it('수량 미입력은 액션을 달지 않는다 (할 일이 바로 아래 표 안에 있다)', () => {
    const model = build(baseGoal({ currentBasis: 'simulated' }), { kind: 'fallback', reason: 'no-quantity' });

    expect(model?.basisNote).toEqual({ text: copy.goal.basis.noQuantity, actionLabel: null });
  });

  it('환율 실패는 원화 기준임을 함께 말한다', () => {
    const model = build(baseGoal({ currentBasis: 'simulated' }), { kind: 'fallback', reason: 'fx-unavailable' });

    expect(model?.basisNote?.text).toBe(copy.goal.basis.fxUnavailable);
    expect(model?.basisNote?.actionLabel).toBeNull();
  });

  it('보유 저장소 읽기 실패는 노트를 그리지 않는다 (상단 배너가 이미 말했다)', () => {
    const model = build(baseGoal({ currentBasis: 'simulated' }), { kind: 'fallback', reason: 'read-failed' });

    expect(model?.basisNote).toBeNull();
  });

  it('실측 + 이미 달성이면 섞인 기준이 없으므로 노트도 없다', () => {
    const model = build(
      baseGoal({ status: 'already-reached', currentAmount: 2_000_000, isAlreadyReached: true })
    );

    expect(model?.basisNote).toBeNull();
  });
});

describe('buildPortfolioGoalCardModel — 렌더 게이트', () => {
  it('보유를 읽는 중이면 카드를 만들지 않는다 (떴다 사라지는 깜빡임 방지)', () => {
    const model = buildPortfolioGoalCardModel({
      goal: baseGoal({ isLoading: true, status: 'loading' }),
      basis: { kind: 'pending' },
      holdingsStatus: 'loading',
      holdingsCount: 0,
      formatKrwAmount
    });

    expect(model).toBeNull();
  });

  it('시뮬 저장 데이터로 계산할 수 없으면 카드가 아예 뜨지 않는다 (반쪽 에러 카드 금지)', () => {
    const model = build(baseGoal({ status: 'error', errorReason: 'invalid-data', hasTarget: false }));

    expect(model).toBeNull();
  });

  it('보유 0 + 목표 없음이면 카드를 만들지 않는다 (첫 행동은 "종목 추가" 하나여야 한다)', () => {
    const model = build(baseGoal({ status: 'no-target', hasTarget: false }), SIMULATED, 0);

    expect(model).toBeNull();
  });

  it('보유 0 + 목표 있음이면 카드를 남긴다 (이미 정해 둔 진행을 화면에서 지우지 않는다)', () => {
    const model = build(baseGoal({ currentBasis: 'simulated' }), SIMULATED, 0);

    expect(model).not.toBeNull();
    expect(model?.hasTarget).toBe(true);
    expect(model?.currentBasis).toBe('simulated');
  });

  it('보유는 있는데 시뮬 로딩 중이면 골격만 (타일 값은 —, 미터는 값 없음)', () => {
    const model = build(baseGoal({ isLoading: true, status: 'loading', hasTarget: false }), { kind: 'pending' });

    expect(model?.isLoading).toBe(true);
    expect(model?.meter).toBeNull();
    expect(model?.statusLine).toBeNull();
    expect(model?.basisNote).toBeNull();
    expect(model?.tiles.every((tile) => tile.value === copy.summary.tiles.empty)).toBe(true);
  });
});

describe('buildPortfolioGoalCardModel — 목표 미설정 불변식 (AC6)', () => {
  it.each([0, -1, -500_000])('목표가 %s이면 달성률·예상 달성·상태 문장을 만들지 않는다', (target) => {
    const model = build(
      baseGoal({
        status: 'no-target',
        hasTarget: false,
        targetMonthlyDividend: target,
        progressRatio: null,
        progressPercent: null,
        reachedMonth: null,
        reachedYearIndex: null,
        isAlreadyReached: false
      })
    );

    expect(model?.showSetupPanel).toBe(true);
    expect(model?.tiles).toEqual([]);
    expect(model?.meter).toBeNull();
    expect(model?.statusLine).toBeNull();
    expect(model?.showEditTarget).toBe(false);
    expect(model?.actionLabel).toBeNull();
    expect(model?.progressPercent).toBeNull();
    expect(model?.conditionRows).toEqual([]);
  });
});

describe('buildPortfolioGoalCardModel — 가정 요약 목표 그룹', () => {
  it('목표가 있으면 계산에 쓰인 조건을 그대로 밝힌다 (ETA 의 유일한 근거)', () => {
    const rows = build(baseGoal())?.conditionRows ?? [];
    const valueOf = (label: string) => rows.find((row) => row.label === label)?.value;

    expect(valueOf(copy.goal.conditions.initialInvestment)).toBe('₩100,000,000');
    expect(valueOf(copy.goal.conditions.duration)).toBe(copy.goal.conditions.durationValue(20));
    expect(valueOf(copy.goal.conditions.startDate)).toBe('2024년 1월 1일');
    expect(valueOf(copy.goal.conditions.taxRate)).toBe(copy.goal.conditions.taxRateValue(15.4));
    expect(valueOf(copy.goal.conditions.tickerCount)).toBe(copy.goal.conditions.tickerCountValue(1));
  });

  it('세율이 없던 구버전 저장본은 "기본값"으로 말한다 (0%로 지어내지 않는다)', () => {
    const goal = baseGoal();
    const conditions = goal.conditions;
    if (conditions === null) throw new Error('픽스처에 조건이 있어야 한다');

    const rows = build({ ...goal, conditions: { ...conditions, taxRate: undefined } })?.conditionRows ?? [];

    expect(rows.find((row) => row.label === copy.goal.conditions.taxRate)?.value).toBe(
      copy.goal.conditions.taxRateUnknown
    );
  });
});

describe('toProgressBucket — 연속값을 저카디널리티 라벨로', () => {
  it.each([
    [0, false, '0-25'],
    [24.9, false, '0-25'],
    [25, false, '25-50'],
    [49.99, false, '25-50'],
    [50, false, '50-75'],
    [74.9, false, '50-75'],
    [75, false, '75-100'],
    [100, false, '75-100']
  ])('%s%% (미도달) → %s', (percent, isReached, expected) => {
    expect(toProgressBucket(percent as number, isReached as boolean)).toBe(expected);
  });

  it('도달 판정은 비율보다 우선한다 (부동소수로 99.99%인 도달도 reached)', () => {
    expect(toProgressBucket(99.99, true)).toBe('reached');
    expect(toProgressBucket(0, true)).toBe('reached');
  });
});
