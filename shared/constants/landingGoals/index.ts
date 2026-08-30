/**
 * 랜딩 첫 화면의 목표 여섯 — **데이터 정본**.
 * 역산 계산은 `shared/lib/goalPlan` 이 한다(그쪽은 목표를 모르고, 여기는 계산을 모른다).
 */
export {
  LANDING_ASSET_GOALS,
  LANDING_DIVIDEND_GOALS,
  LANDING_GOALS,
  LANDING_GOAL_ASSUMPTIONS,
  LANDING_GOAL_PRESET_ID,
  findLandingGoal,
  landingGoalPath,
  resolveLandingGoalFromSearch,
  type LandingGoal,
  type LandingGoalKind
} from './landingGoals';
