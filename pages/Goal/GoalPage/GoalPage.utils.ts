import { GOAL_COPY } from '../copy';
import type { GoalScenarioViewModel } from '../hooks';
import type { GoalConditionRow, GoalViewModel } from './GoalPage.types';

const copy = GOAL_COPY;

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

/** `YYYY-MM-DD` → `2024년 1월 1일`. 파싱 실패(구버전 데이터)면 원문을 그대로 보여 준다(거짓말보다 낫다). */
const formatStartDate = (isoDate: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  return `${Number(match[1])}년 ${Number(match[2])}월 ${Number(match[3])}일`;
};

const buildAsOfLine = (goal: GoalScenarioViewModel): string => {
  const parts: string[] = [];
  if (goal.scenarioName) parts.push(goal.scenarioName);
  if (goal.tickerCount > 0 && goal.tickers[0]) {
    parts.push(copy.hero.tickerSummary(goal.tickers[0], goal.tickerCount));
  }
  parts.push(copy.hero.asOfEvaluated(goal.evaluatedAt.year, goal.evaluatedAt.month));
  return copy.hero.asOf(parts);
};

const buildConditionRows = (
  goal: GoalScenarioViewModel,
  formatAmount: (value: number) => string
): GoalConditionRow[] | null => {
  const conditions = goal.conditions;
  if (!conditions) return null;

  return [
    { label: copy.conditions.initialInvestment, value: formatAmount(conditions.initialInvestment) },
    { label: copy.conditions.monthlyContribution, value: formatAmount(conditions.monthlyContribution) },
    { label: copy.conditions.duration, value: copy.conditions.durationValue(conditions.durationYears) },
    { label: copy.conditions.startDate, value: formatStartDate(conditions.investmentStartDate) },
    {
      label: copy.conditions.reinvest,
      value: conditions.reinvestDividends
        ? copy.conditions.reinvestOn(conditions.reinvestDividendPercent)
        : copy.conditions.reinvestOff
    },
    {
      label: copy.conditions.taxRate,
      value:
        conditions.taxRate === undefined
          ? copy.conditions.taxRateUnknown
          : copy.conditions.taxRateValue(conditions.taxRate)
    },
    { label: copy.conditions.tickerCount, value: copy.conditions.tickerCountValue(conditions.tickerCount) }
  ];
};

export type BuildGoalViewModelInput = {
  goal: GoalScenarioViewModel;
  /** 표시 통화가 반영된 금액 포맷터(컨테이너가 만든다 — 이 화면에는 통화 토글이 없고 읽기만 한다). */
  formatAmount: (value: number) => string;
};

/**
 * 훅 결과 + 포맷터 → 화면 모델. **순수 함수**다(DOM·시간·전역 상태 무접촉).
 *
 * 상태 7종을 여기서 한 번에 갈라 두는 이유: 뷰가 `status`를 다시 해석하면 분기가 두 곳으로 갈라져
 * "목표 미설정인데 달성률이 보인다" 같은 사고가 조용히 생긴다. 뷰는 null 여부만 본다.
 */
export const buildGoalViewModel = ({ goal, formatAmount }: BuildGoalViewModelInput): GoalViewModel => {
  const base: GoalViewModel = {
    status: goal.status,
    isLoading: goal.isLoading,
    errorReason: goal.errorReason,
    asOfLine: buildAsOfLine(goal),
    showEmptyState: false,
    errorMessage: null,
    showSetupPanel: false,
    target: null,
    current: { value: copy.tiles.empty, hint: null },
    meter: null,
    remaining: null,
    eta: null,
    statusLine: null,
    showChangeConditions: false,
    showEditTarget: false,
    emphasizeEditTarget: false,
    conditions: null
  };

  if (goal.status === 'loading') return base;

  if (goal.status === 'empty') return { ...base, showEmptyState: true };

  if (goal.status === 'error') {
    return {
      ...base,
      showEmptyState: true,
      // 두 사유는 사실이 다르다 — "조건이 잘못됐다"와 "저장소를 못 읽었다"를 한 문장으로 뭉치지 않는다.
      errorMessage: goal.errorReason === 'read-failed' ? copy.error.readFailed : copy.error.invalidData
    };
  }

  const current: GoalViewModel['current'] = {
    value: goal.currentAmount === null ? copy.tiles.empty : formatAmount(goal.currentAmount),
    hint: goal.isCurrentFallback ? copy.tiles.currentHintBeforeStart : copy.tiles.currentHint
  };
  const conditions = buildConditionRows(goal, formatAmount);

  // C — 목표 미설정. 달성률·예상 달성·상태 문장은 **만들지 않는다**(AC6).
  if (!goal.hasTarget) {
    return { ...base, current, conditions, showSetupPanel: true };
  }

  const target = formatAmount(goal.targetMonthlyDividend);
  const percent = goal.progressPercent ?? 0;
  const durationYears = goal.conditions?.durationYears ?? 0;

  /*
   * 남은 금액 = 목표 − 현재 예상 월배당. 달성률(%)만으로는 "그래서 얼마가 더 필요한가"가 안 보인다.
   * 이미 넘어선 경우(≤0)는 만들지 않는다 — 0원·음수를 "남은 금액"으로 보여 주면 거짓말이 된다.
   */
  const remainingAmount = goal.targetMonthlyDividend - (goal.currentAmount ?? 0);
  const remaining =
    goal.isAlreadyReached || remainingAmount <= 0
      ? null
      : { value: formatAmount(remainingAmount), hint: copy.tiles.remainingHint };

  const withTarget: GoalViewModel = {
    ...base,
    current,
    conditions,
    target,
    remaining,
    showEditTarget: true,
    meter: {
      percent,
      /*
       * "도달했다"는 문장은 **엔진의 도달 판정**(isAlreadyReached)에만 붙인다.
       * 반올림된 퍼센트로 판정하면 99.6%가 100%로 표시되면서 아직 못 닿은 목표를 "도달"이라 말하게 된다.
       */
      sentence: goal.isAlreadyReached
        ? copy.meter.sentenceReached(target)
        : copy.meter.sentence(target, current.value)
    }
  };

  // F — 시작 시점에 이미 목표 이상. 미터는 100%로 채우고, 다음 행동은 "목표 올리기"다.
  if (goal.status === 'already-reached') {
    return {
      ...withTarget,
      meter: { percent: 100, sentence: copy.meter.sentenceReached(target) },
      // 이미 넘어섰으므로 "남은 금액"은 존재하지 않는다(위 remaining도 null이지만 의도를 명시한다).
      remaining: null,
      eta: { value: copy.tiles.etaAlready, hint: null },
      statusLine: { tone: 'success', text: copy.status.already(target) },
      emphasizeEditTarget: true
    };
  }

  // E — 기간 안에 도달.
  if (goal.reachedMonth) {
    const monthLabel = copy.tiles.etaMonth(goal.reachedMonth.year, goal.reachedMonth.month);
    return {
      ...withTarget,
      eta: {
        value: monthLabel,
        hint: goal.reachedYearIndex === null ? null : copy.tiles.etaHintYearIndex(goal.reachedYearIndex)
      },
      statusLine: { tone: 'success', text: copy.status.reached(monthLabel, target) }
    };
  }

  // D — 기간 안에 미도달. 값을 비우지 않고 "왜 비었는지"를 값으로 말한다.
  return {
    ...withTarget,
    eta: { value: copy.tiles.etaNotReached, hint: copy.tiles.etaHintDuration(durationYears) },
    statusLine: { tone: 'warning', text: copy.status.notReached(durationYears, target) },
    showChangeConditions: true
  };
};

/**
 * 라이브 리전 문구. **하이드레이션이 끝난 뒤 한 번만** 낭독되게, 로딩 동안에는 로딩 문장을 유지한다
 * (문자열이 안 바뀌면 스크린리더도 다시 읽지 않는다).
 */
export const buildGoalLiveMessage = (goal: GoalScenarioViewModel): string => {
  switch (goal.status) {
    case 'loading':
      return copy.live.loading;
    case 'empty':
      return copy.live.empty;
    case 'error':
      return copy.live.error;
    case 'no-target':
      return copy.live.noTarget;
    case 'already-reached':
      return copy.live.already;
    case 'reached':
      return copy.live.reached(
        goal.progressPercent ?? 0,
        goal.reachedMonth ? copy.tiles.etaMonth(goal.reachedMonth.year, goal.reachedMonth.month) : ''
      );
    case 'not-reached':
    default:
      return copy.live.notReached(goal.progressPercent ?? 0);
  }
};
