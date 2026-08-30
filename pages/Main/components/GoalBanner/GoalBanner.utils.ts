import type { SimulationResult } from '@/shared/types';
import { LANDING_GOAL_ASSUMPTIONS, type LandingGoal } from '@/shared/constants/landingGoals';
import { findAssetTargetYear, findTargetYear } from '@/shared/lib/snowball';
import { formatMonths, monthsToReachAmount, principalForMonthlyDividend } from '@/shared/lib/goalPlan';
import type { GoalOutcome } from './GoalBanner.types';

/**
 * 첫 화면에서 고른 목표를 **지금 이 시뮬레이션 기준으로 판정**한다 — 순수 함수.
 *
 * ## 왜 필요한가 (2026-08-27 사용자 지적)
 * 목표 버튼을 눌러 계산기에 도착해도 화면이 아무 말도 하지 않았다. 배당 목표는 값만 조용히
 * 채워졌고, 자산 목표는 채울 자리조차 없었다. 방문자 입장에서는 **고른 것이 사라진** 것이다.
 *
 * ## 🔴 자산 목표를 배당으로 환산하지 않는다
 * 1억을 배당률 4% 로 바꾸면 "월 28만원"이 되지만, 사용자가 실제로 담는 종목의 배당률은 4% 가
 * 아니다 — 엔진이 "월 28만 달성"이라 말하는 시점의 자산은 1억이 아니다. 그래서 자산 목표는
 * **자산 열을 직접 훑어**(`findAssetTargetYear`) 판정한다. 엔진 입력은 한 글자도 바뀌지 않는다.
 *
 * ## 두 숫자를 나란히 놓는다
 * `landingEstimate` 는 첫 화면 카드가 말했던 값(일반 가정)이고, `answer` 는 **지금 담은 종목**의
 * 답이다. 둘이 다른 것이 정상이고, 그 차이가 곧 계산기를 쓰는 이유다 — 어느 하나만 보여 주면
 * 방문자는 "왜 아까랑 다르지?"에서 멈춘다.
 */
export const resolveGoalOutcome = (
  goal: LandingGoal,
  rows: readonly SimulationResult[]
): GoalOutcome => {
  const landingEstimate = buildLandingEstimate(goal);

  if (rows.length === 0) {
    return { goal, status: 'unknown', answer: UNKNOWN_ANSWER, reachedInYears: null, landingEstimate };
  }

  const reachedYear =
    goal.kind === 'asset'
      ? findAssetTargetYear(rows, goal.amount)
      : findTargetYear(rows, goal.amount);

  if (reachedYear === undefined) {
    return {
      goal,
      status: 'missed',
      answer: `지금 조건으로는 ${rows.length}년 안에 닿지 않습니다`,
      reachedInYears: null,
      landingEstimate
    };
  }

  /* 달력 연도 → **N년차**. 엔진이 주는 것은 연도 라벨뿐이라 첫 행을 기준으로 뺀다
     (`ResultSummaryCard.utils` 의 `findTargetReachYearIndex` 와 같은 계산이다). */
  const reachedInYears = reachedYear - rows[0].year + 1;

  return {
    goal,
    status: 'reached',
    answer: `지금 조건이면 ${reachedInYears}년째에 닿습니다`,
    reachedInYears,
    landingEstimate
  };
};

/** 계산 결과가 없을 때. 🔴 숫자를 지어내지 않는다 — 무엇이 없는지 말한다. */
const UNKNOWN_ANSWER = '종목을 담으면 달성 시점을 계산해 드립니다';

/**
 * 첫 화면 카드가 말했던 값. 🔴 **그 카드와 같은 가정·같은 함수**를 써야 두 화면의 숫자가 이어진다 —
 * 여기서 따로 계산하면 방문자가 본 문장이 계산기에서 조용히 달라진다.
 */
const buildLandingEstimate = (goal: LandingGoal): string | null => {
  const { annualReturnRate, dividendYield, taxRate, monthlyContributions } = LANDING_GOAL_ASSUMPTIONS;

  if (goal.kind === 'asset') {
    const monthly = monthlyContributions[Math.floor(monthlyContributions.length / 2)];
    const months = monthsToReachAmount({
      target: goal.amount,
      monthlyContribution: monthly,
      annualReturnRate
    });
    if (months === null) return null;

    return `일반 가정(월 ${Math.round(monthly / 10_000).toLocaleString('ko-KR')}만원·연 ${formatPercent(annualReturnRate)})으로는 ${formatMonths(months)}`;
  }

  const principal = principalForMonthlyDividend({
    monthlyDividend: goal.amount,
    dividendYield,
    taxRate
  });
  if (principal === null) return null;

  const eok = Math.round((principal / 100_000_000) * 10) / 10;
  return `일반 가정(배당률 ${formatPercent(dividendYield)})으로는 원금 약 ${Number.isInteger(eok) ? eok : eok.toFixed(1)}억 원이 필요합니다`;
};

const formatPercent = (rate: number): string => `${Math.round(rate * 1000) / 10}%`;
