import { PORTFOLIO_COPY } from '../../copy';
import type { GoalScenarioViewModel, PortfolioHoldingsStatus } from '../../hooks';
import type {
  GoalBasisNoteModel,
  GoalConditionRow,
  GoalStatusLineModel,
  GoalTileModel,
  PortfolioGoalBasis,
  PortfolioGoalCardModel,
  ResolvePortfolioGoalBasisInput
} from './GoalCard.types';

/**
 * 목표 달성 카드의 **순수 계층**. DOM·시계·전역 상태를 읽지 않는다(전부 인자로 받는다).
 *
 * 🔴 이 파일이 다루는 금액은 **전부 원화**다. 페이지 요약 타일의 포맷터(`formatAmount`, USD 입력)를
 * 여기 넘기면 조용히 환율배 틀린 숫자가 나오고 화면 어디에도 오류 표시가 없다 — 반드시 원화 입력
 * 포맷터(`formatKrwAmount`)를 넘긴다. 실측 월배당(USD)은 `resolvePortfolioGoalBasis`가 딱 한 번 환산한다.
 */

const copy = PORTFOLIO_COPY;
const DASH = copy.summary.tiles.empty;

/** GA `goal_widget_view`의 진행률 버킷. 연속값(달성률)을 그대로 보내지 않기 위한 저카디널리티 라벨. */
export type GoalProgressBucket = '0-25' | '25-50' | '50-75' | '75-100' | 'reached';

/**
 * 달성률 → 버킷. **도달 판정은 비율이 아니라 `isReached`**(엔진의 도달 판정)로 받는다 —
 * 부동소수 결합순서 때문에 "99.999%인데 도달"·"100%인데 미도달"이 모두 가능하다.
 */
export const toProgressBucket = (progressPercent: number, isReached: boolean): GoalProgressBucket => {
  if (isReached) return 'reached';
  if (progressPercent < 25) return '0-25';
  if (progressPercent < 50) return '25-50';
  if (progressPercent < 75) return '50-75';
  return '75-100';
};

/**
 * 달성률의 현재값 기준을 정한다. **판정 순서는 고정이다 — 보유 먼저, 환율은 그 다음.**
 * 보유가 없으면 환율을 기다릴 이유가 없다(기다리면 영영 골격만 보는 화면이 생긴다).
 *
 * `stale`(값은 있는데 갱신만 실패)은 `measured`다 — 값이 있으면 쓴다.
 */
export const resolvePortfolioGoalBasis = (input: ResolvePortfolioGoalBasisInput): PortfolioGoalBasis => {
  if (input.holdingsStatus === 'loading') return { kind: 'pending' };
  if (input.holdingsStatus === 'read-error') return { kind: 'fallback', reason: 'read-failed' };
  if (input.holdingsCount === 0) return { kind: 'fallback', reason: 'no-holdings' };
  if (input.includedCount === 0) return { kind: 'fallback', reason: 'no-quantity' };

  // 조회 중을 실패보다 **먼저** 본다 — 아직 실패하지 않은 상태를 "불러오지 못했다"고 말하지 않는다.
  if (input.fxStatus === 'loading') return { kind: 'pending' };
  if (input.fxRateKrwPerUsd === null) return { kind: 'fallback', reason: 'fx-unavailable' };

  // 환산은 여기서 **한 번만**. 이 값이 목표·달성률·남은 금액 비교의 유일한 단위다.
  return { kind: 'measured', amountKrw: input.monthlyAfterTaxUsd * input.fxRateKrwPerUsd };
};

/** `YYYY-MM-DD` → `2024년 1월 1일`. 파싱 실패(구버전 데이터)면 원문 그대로(거짓말보다 낫다). */
const formatStartDate = (isoDate: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;

  return `${Number(match[1])}년 ${Number(match[2])}월 ${Number(match[3])}일`;
};

/**
 * 가정 요약의 목표 그룹 행. 예상 달성 시점이 **어떤 조건에서 나왔는지**를 화면에 남기는 유일한 자리라
 * 목표가 있을 때는 빼지 않는다(없으면 ETA 의 근거가 화면 어디에도 없다).
 */
const buildGoalConditionRows = (
  goal: GoalScenarioViewModel,
  formatKrwAmount: (krw: number) => string
): GoalConditionRow[] => {
  const conditions = goal.conditions;
  if (!conditions || !goal.hasTarget) return [];

  return [
    { label: copy.goal.conditions.initialInvestment, value: formatKrwAmount(conditions.initialInvestment) },
    { label: copy.goal.conditions.monthlyContribution, value: formatKrwAmount(conditions.monthlyContribution) },
    { label: copy.goal.conditions.duration, value: copy.goal.conditions.durationValue(conditions.durationYears) },
    { label: copy.goal.conditions.startDate, value: formatStartDate(conditions.investmentStartDate) },
    {
      label: copy.goal.conditions.reinvest,
      value: conditions.reinvestDividends
        ? copy.goal.conditions.reinvestOn(conditions.reinvestDividendPercent)
        : copy.goal.conditions.reinvestOff
    },
    {
      label: copy.goal.conditions.taxRate,
      value:
        conditions.taxRate === undefined
          ? copy.goal.conditions.taxRateUnknown
          : copy.goal.conditions.taxRateValue(conditions.taxRate)
    },
    { label: copy.goal.conditions.tickerCount, value: copy.goal.conditions.tickerCountValue(conditions.tickerCount) }
  ];
};

/**
 * 기준 안내는 한 슬롯에 **한 줄만**. 우선순위대로 하나를 고른다.
 *
 * `read-failed`는 문구를 두지 않는다 — 상단 danger 배너가 이미 말했고, 목표 쪽에서 사용자가 할 수 있는
 * 일이 없다. `measured` + 이미 달성도 두지 않는다(시뮬 시점이 화면에 없어 섞인 기준 자체가 없다).
 */
const buildBasisNote = (basis: PortfolioGoalBasis, isAlreadyReached: boolean): GoalBasisNoteModel | null => {
  if (basis.kind === 'fallback') {
    if (basis.reason === 'no-holdings') {
      return { text: copy.goal.basis.noHoldings, actionLabel: copy.goal.basis.noHoldingsAction };
    }
    // 수량은 바로 아래 표에서 고친다 — 여기에 액션 버튼을 두면 같은 행동을 두 번 권하는 셈이다.
    if (basis.reason === 'no-quantity') return { text: copy.goal.basis.noQuantity, actionLabel: null };
    if (basis.reason === 'fx-unavailable') return { text: copy.goal.basis.fxUnavailable, actionLabel: null };

    return null;
  }

  if (basis.kind === 'measured' && !isAlreadyReached) {
    return { text: copy.goal.basis.mixed, actionLabel: null };
  }

  return null;
};

export type BuildPortfolioGoalCardModelInput = {
  goal: GoalScenarioViewModel;
  basis: PortfolioGoalBasis;
  holdingsStatus: PortfolioHoldingsStatus;
  holdingsCount: number;
  /** ⚠ **원화 입력** 포맷터. 요약 타일의 USD 포맷터를 넘기면 값이 환율배 틀린다(파일 상단 경고). */
  formatKrwAmount: (krw: number) => string;
};

/**
 * 훅 결과 + 기준 + 보유 상태 → 카드 화면 모델. **`null` 반환 = 카드 미렌더.**
 *
 * 렌더 게이트를 뷰가 아니라 이 순수 함수가 소유해야 "목표 미설정인데 달성률이 보인다"류 사고가
 * 두 곳으로 갈리지 않는다. 미렌더 경로는 넷이다:
 * ①보유를 아직 읽는 중(카드가 떴다 사라지는 깜빡임 방지) ②보유 0 + 목표 없음(첫 행동은 "종목 추가" 하나)
 * ③시뮬 저장소 읽기·검증 실패(이 화면은 멀쩡히 동작 중이라 반쪽 에러 카드를 얹지 않는다)
 * ④보유 읽기 실패 + 목표 없음.
 */
export const buildPortfolioGoalCardModel = ({
  goal,
  basis,
  holdingsStatus,
  holdingsCount,
  formatKrwAmount
}: BuildPortfolioGoalCardModelInput): PortfolioGoalCardModel | null => {
  // ① 보유 확정 전에 카드를 그리면 목표 미설정으로 판명될 때 카드가 떴다 사라진다.
  if (holdingsStatus === 'loading') return null;
  // ③ 시뮬 저장 데이터로 계산할 수 없다 — 사실은 GA(operation_error)로만 남는다.
  if (goal.status === 'error') return null;

  const hasHoldings = holdingsCount > 0;

  const base: PortfolioGoalCardModel = {
    isLoading: false,
    showSetupPanel: false,
    meter: null,
    tiles: [],
    basisNote: null,
    statusLine: null,
    actionLabel: null,
    showEditTarget: false,
    emphasizeEditTarget: false,
    hasTarget: false,
    progressPercent: null,
    currentBasis: goal.currentBasis,
    isAlreadyReached: false,
    reachedInRange: false,
    conditionRows: []
  };

  if (goal.isLoading) {
    // ② 보유가 0인 채 로딩이면 목표 유무를 아직 모른다 — 골격을 띄웠다 지우지 않는다.
    if (!hasHoldings) return null;

    return {
      ...base,
      isLoading: true,
      tiles: [
        { label: copy.goal.tiles.target, value: DASH },
        { label: copy.goal.tiles.remaining, value: DASH, hint: copy.goal.tiles.remainingHint },
        { label: copy.goal.tiles.eta, value: DASH }
      ]
    };
  }

  // 목표 미설정(또는 저장된 포트폴리오 없음) — 목표를 정하는 유일한 표면.
  if (!goal.hasTarget) {
    if (!hasHoldings) return null;

    return { ...base, showSetupPanel: true };
  }

  const target = formatKrwAmount(goal.targetMonthlyDividend);
  const currentAmount = goal.currentAmount ?? 0;
  const currentText = formatKrwAmount(currentAmount);
  const durationYears = goal.conditions?.durationYears ?? 0;
  const percent = goal.isAlreadyReached ? 100 : (goal.progressPercent ?? 0);

  const tiles: GoalTileModel[] = [{ label: copy.goal.tiles.target, value: target }];

  /*
   * 남은 금액 = 목표 − 현재. 이미 넘어섰으면 자리 자체를 만들지 않는다 —
   * 0원·음수를 "남은 금액"이라 부르면 거짓말이 된다.
   */
  const remainingAmount = goal.targetMonthlyDividend - currentAmount;
  if (!goal.isAlreadyReached && remainingAmount > 0) {
    tiles.push({
      label: copy.goal.tiles.remaining,
      value: formatKrwAmount(remainingAmount),
      hint: copy.goal.tiles.remainingHint
    });
  }

  /*
   * E′ — 시뮬 도달월이 오늘 이전. 실측 기준일 때만 생긴다(같은 계열이면 already-reached가 먼저 잡는다).
   * **과거 날짜가 화면에 절대 나오지 않는다**가 이 분기의 불변식이다.
   */
  const isPastReach =
    basis.kind === 'measured' &&
    goal.reachedMonth !== null &&
    goal.reachedMonth.year * 12 + goal.reachedMonth.month <= goal.evaluatedAt.year * 12 + goal.evaluatedAt.month;

  let etaTile: GoalTileModel;
  let statusLine: GoalStatusLineModel;
  let actionLabel: string | null = null;

  if (goal.isAlreadyReached) {
    etaTile = { label: copy.goal.tiles.eta, value: copy.goal.tiles.etaAlready };
    statusLine = {
      tone: 'success',
      // 폴백이면 "지금 보유한"이라 말할 수 없다 — 판정 기준을 문장이 정확히 밝힌다.
      text: basis.kind === 'measured' ? copy.goal.status.already(target) : copy.goal.status.alreadyFallback(target)
    };
  } else if (isPastReach) {
    etaTile = { label: copy.goal.tiles.eta, value: copy.goal.tiles.etaPast, hint: copy.goal.tiles.etaPastHint };
    statusLine = { tone: 'warning', text: copy.goal.status.etaPast };
    actionLabel = copy.goal.status.etaPastCta;
  } else if (goal.reachedMonth) {
    const monthLabel = copy.goal.tiles.etaMonth(goal.reachedMonth.year, goal.reachedMonth.month);
    etaTile = {
      label: copy.goal.tiles.eta,
      value: monthLabel,
      ...(goal.reachedYearIndex === null ? {} : { hint: copy.goal.tiles.etaHintYearIndex(goal.reachedYearIndex) })
    };
    statusLine = { tone: 'success', text: copy.goal.status.reached(monthLabel, target) };
  } else {
    // 값을 비우지 않고 "왜 비었는지"를 값으로 말한다.
    etaTile = {
      label: copy.goal.tiles.eta,
      value: copy.goal.tiles.etaNotReached,
      hint: copy.goal.tiles.etaHintDuration(durationYears)
    };
    statusLine = { tone: 'warning', text: copy.goal.status.notReached(durationYears, target) };
    actionLabel = copy.goal.status.changeConditions;
  }

  tiles.push(etaTile);

  return {
    ...base,
    tiles,
    meter: {
      /*
       * "도달했다"는 문장은 **엔진 판정(isAlreadyReached)에만** 붙인다. 반올림된 99.6%가 100%로
       * 보여도 문장은 "오는 중"이다.
       */
      percent,
      sentence: goal.isAlreadyReached
        ? copy.goal.meter.sentenceReached(target)
        : copy.goal.meter.sentence(target, currentText)
    },
    basisNote: buildBasisNote(basis, goal.isAlreadyReached),
    statusLine,
    actionLabel,
    showEditTarget: true,
    // 이미 넘어섰으면 다음 행동이 "목표 올리기"라 한 단계 강조한다.
    emphasizeEditTarget: goal.isAlreadyReached,
    hasTarget: true,
    progressPercent: percent,
    isAlreadyReached: goal.isAlreadyReached,
    reachedInRange: goal.reachedMonth !== null || goal.isAlreadyReached,
    conditionRows: buildGoalConditionRows(goal, formatKrwAmount)
  };
};
