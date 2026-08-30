import type { LandingGoal } from '@/shared/constants/landingGoals';

/** 목표가 이 시뮬레이션에서 어떻게 됐는가. */
export type GoalStatus =
  /** 기간 안에 닿는다. */
  | 'reached'
  /** 기간 안에 못 닿는다. */
  | 'missed'
  /** 아직 판정할 수 없다(계산 결과가 없다 — 종목 미선택·입력 오류). */
  | 'unknown';

export type GoalOutcome = {
  goal: LandingGoal;
  status: GoalStatus;
  /** 배너의 답 한 줄. 상태마다 문장이 다르다. */
  answer: string;
  /**
   * 몇 년째인가(1-based). `reached` 일 때만 값이 있다.
   * ⚠ 달력 연도가 아니라 **사용자 기준 N년차**다 — "2032년"보다 "7년째"가 읽힌다.
   */
  reachedInYears: number | null;
  /** 첫 화면 카드가 말했던 값. 지금 조건의 답과 나란히 놓으면 차이가 보인다. */
  landingEstimate: string | null;
};

export type GoalBannerProps = {
  outcome: GoalOutcome;
};
