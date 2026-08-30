import type { TickerProfile, YieldFormValues } from '@/shared/types';
import type { LandingGoal } from '@/shared/constants/landingGoals';
import { findAssetTargetYear, findTargetYear, solveRequiredMonthlyContribution } from '@/shared/lib/snowball';
import type { NormalizedAllocationItem } from './portfolio';
import { runGoalScenarioSimulation } from './simulation';

/**
 * **목표를 달성하는 월 적립금**을 푼다 — 첫 화면의 목표 버튼이 "완성된 계획"을 여는 마지막 조각.
 *
 * ## 왜 월 적립금인가 (2026-08-31 사용자 결정)
 * 목표를 정하면 남는 자유도는 기간·적립금 둘인데, **적립금이 사용자가 직접 정하는 유일한 축**이다.
 * 배당률은 종목이 정하고 기간은 인생이 정한다 — 답을 들어도 할 수 있는 일이 없다. 적립금은 답이
 * 곧 행동이 된다(`SnowballGoalSolver` 머리말이 같은 근거로 같은 선택을 했다).
 *
 * ## 🔴 화면과 **같은 함수**로 판정한다
 * `runGoalScenarioSimulation` 은 결과 화면이 쓰는 바로 그 경로다. 여기에 비슷하지만 다른 식을 넣으면
 * "앱이 알려준 금액을 넣었는데 미도달"이 된다 — 이 기능의 유일한 치명적 실패 모드이고, 솔버가
 * 판정을 **주입받게** 설계된 이유다.
 *
 * ## 두 목표의 판정선이 다르다
 *  · 배당 목표 → 세후 **월 배당**이 목표에 닿는가(`findTargetYear`).
 *  · 자산 목표 → **자산**이 목표에 닿는가(`findAssetTargetYear`).
 * 🔴 자산 목표를 배당으로 환산하지 않는다. 1억을 배당률 4% 로 바꾸면 "월 28만 원"이 되는데 실제
 *   구성의 배당률은 4% 가 아니라서, 그 시점의 자산은 1억이 아니다.
 *
 * ## 단조성 (이분탐색의 정당성)
 * 월 적립금이 늘면 매달 사는 주식수가 늘고, 그러면 모든 달의 자산도 세후 배당도 줄지 않는다.
 * 그래서 "도달했다"가 뒤집히지 않는다 — 두 판정선 모두에서 성립한다.
 */
export type GoalPlanSolveParams = {
  goal: LandingGoal;
  /** 목표가 지목한 프리셋의 종목들(이미 유니버스에 매핑된 상태). */
  includedProfiles: TickerProfile[];
  /** 그 프리셋의 정규화된 비중(`buildNormalizedAllocation` 의 결과 그대로). */
  normalizedAllocation: NormalizedAllocationItem[];
  /** 기간·초기금·세율 등 나머지 조건. 이 함수는 `monthlyContribution` 만 바꿔 가며 판정한다. */
  values: YieldFormValues;
};

/**
 * @returns 목표에 닿는 **최소 월 적립금**(원). 어떤 금액으로도 닿지 못하면 `null`
 *   — 무배당·마이너스 성장 구성처럼 실제로 불가능한 경우가 있고, 그때는 숫자를 지어내지 않는다.
 */
export const solveGoalMonthlyContribution = ({
  goal,
  includedProfiles,
  normalizedAllocation,
  values
}: GoalPlanSolveParams): number | null => {
  if (includedProfiles.length === 0) return null;

  const reachesTarget = (monthlyContribution: number): boolean => {
    const run = runGoalScenarioSimulation({
      includedProfiles,
      normalizedAllocation,
      values: { ...values, monthlyContribution },
      reinvestPercentByTickerId: {},
      reinvestTargetByTickerId: {}
    });
    if (run === null) return false;

    const rows = run.simulation.yearly;
    return goal.kind === 'asset'
      ? findAssetTargetYear(rows, goal.amount) !== undefined
      : findTargetYear(rows, goal.amount) !== undefined;
  };

  /*
   * 탐색 시작 눈금. 정답의 자릿수에 가까울수록 판정 호출이 줄어든다.
   * ⚠ 자산 목표는 **기간으로 나눈 값**이 좋은 출발점이다(수익 0 이라고 보면 딱 그만큼 필요하다).
   *   배당 목표는 목표 월배당 자체가 대개 비슷한 자릿수라 그대로 쓴다.
   */
  const months = Math.max(1, values.durationYears * 12);
  const probeStart = goal.kind === 'asset' ? goal.amount / months : goal.amount;

  return solveRequiredMonthlyContribution({ reachesTarget, probeStart });
};
