import { GOAL_QUERY_PARAM, SIMULATOR_PATH } from '@/shared/constants/routes';

/**
 * 랜딩 첫 화면의 **목표 여섯**.
 *
 * ## 왜 프리셋이 아니라 목표인가 (2026-08-27 사용자 결정)
 * 프리셋 13지선다는 "무엇을 살까"를 묻는데, 13개 중 자기 것이 없으면 **시작 전에 막힌다**.
 * 목표는 그렇지 않다 — 1억·3억·5억 중 하나는 반드시 자기 얘기고, 월 50·100·200도 마찬가지다.
 * GA4 도 같은 방향을 가리켰다: `targetMonthlyDividend` 는 178건이나 만져지는데
 * `preset_applied` 는 1인당 1회뿐이다. 사람들은 "어떤 ETF"보다 **"얼마"** 에 반응한다.
 *
 * ⚠ 그래도 여섯 중 자기 것이 없을 수 있다. 그래서 이 목록 아래에는 **반드시 출구**가 있어야 한다
 *   (`/about` — 천천히 둘러보기). 목록만 두면 프리셋 택일과 같은 막다른 길이 된다.
 *
 * 🔴 **숫자를 늘리지 마라.** 여섯은 "한눈에 훑고 하나 고르는" 크기다. 아홉이 되는 순간
 *   고르는 일이 일이 되고, 그러면 목표로 바꾼 이유가 사라진다.
 */

export type LandingGoalKind = 'asset' | 'dividend';

export type LandingGoal = {
  readonly id: string;
  readonly kind: LandingGoalKind;
  /** 버튼에 보이는 말. 짧을수록 좋다 — 스캔하는 눈이 읽는다. */
  readonly label: string;
  /**
   * 목표값(원).
   *  · `asset`    → 만들려는 자산
   *  · `dividend` → 받으려는 **세후 월 배당**
   */
  readonly amount: number;
  /** 버튼 아래 한 줄. 목표를 사람 말로 되짚는다. */
  readonly caption: string;
};

/**
 * 목표를 누르면 담기는 **구성**(`shared/constants/portfolioPresets` 의 프리셋 id).
 *
 * 🔴 **종류별로 하나씩만 둔다**(2026-08-31 사용자 결정). 목표 여섯에 프리셋 여섯을 붙이면 "왜 1억은
 * 이건데 3억은 저건가"를 화면이 매번 설명해야 하고, 그건 우리가 목표 크기에 따라 전략을 권하는
 * 것처럼 읽힌다(투자 권유 금지). 지금 갈리는 축은 **무엇을 원하는가** 하나다 — 자산이냐 배당이냐.
 *
 * ⚠ 고른 뒤에도 바꿀 수 있다: 계산기 결과 아래 프리셋 보드에서 교체하면 된다. 여기 값은
 *   "고르는 일을 대신해 준 기본값"이지 정답이 아니다.
 */
export const LANDING_GOAL_PRESET_ID: Readonly<Record<LandingGoalKind, string>> = {
  /*
   * 자산 목표 — 목적이 **불리는 것**이라 배당성장 ETF 중심으로 둔다(SCHD·DGRO·DGRW·NOBL).
   * 커버드콜처럼 분배금이 크고 원금이 깎이는 구성은 자산 목표와 방향이 반대다.
   */
  asset: 'stable-dividend-growth',
  /*
   * 배당 목표 — 목적이 **매달 들어오는 현금**이다.
   * 🔴 '당장 현금흐름'(JEPI·JEPQ·QYLD 중심)을 쓰지 않았다. 커버드콜이 65% 라 목표 원금은 가장 낮게
   *   나오지만, 그 구성을 **기본값으로 미는 것**은 다른 문제다 — 분배금이 크고 원금(NAV)이 깎이는
   *   성격을 모르는 사람에게 앱이 먼저 권한 모양이 된다. '은퇴 준비형'은 인컴(JEPI·O)과
   *   성장(SCHD·DGRO·VYM)이 섞여 있어 어느 쪽으로도 치우치지 않는다.
   */
  dividend: 'retirement-prep'
};

/** 자산을 불리는 목표. 배당이 아직 목적이 아닌 사람들. */
export const LANDING_ASSET_GOALS: readonly LandingGoal[] = [
  { id: 'asset-100m', kind: 'asset', label: '1억 만들기', amount: 100_000_000, caption: '첫 목돈' },
  { id: 'asset-300m', kind: 'asset', label: '3억 만들기', amount: 300_000_000, caption: '자산의 기초' },
  { id: 'asset-500m', kind: 'asset', label: '5억 만들기', amount: 500_000_000, caption: '은퇴 준비의 시작' }
] as const;

/** 배당으로 현금흐름을 만드는 목표. 이 앱의 본령이다. */
export const LANDING_DIVIDEND_GOALS: readonly LandingGoal[] = [
  { id: 'dividend-50', kind: 'dividend', label: '월 50만원', amount: 500_000, caption: '통신비·관리비' },
  { id: 'dividend-100', kind: 'dividend', label: '월 100만원', amount: 1_000_000, caption: '생활비의 절반' },
  { id: 'dividend-200', kind: 'dividend', label: '월 200만원', amount: 2_000_000, caption: '한 사람 생활비' }
] as const;

export const LANDING_GOALS: readonly LandingGoal[] = [...LANDING_ASSET_GOALS, ...LANDING_DIVIDEND_GOALS];

export const findLandingGoal = (id: string): LandingGoal | undefined =>
  LANDING_GOALS.find((goal) => goal.id === id);

/**
 * 계산에 쓰는 **기본 가정**.
 *
 * 🔴 이 값들이 화면의 모든 숫자를 좌우한다. 그래서 화면은 반드시 이 가정을 **함께 보여 줘야 한다** —
 * 근거 없는 숫자는 투자 권유로 읽힌다(카피 규율).
 * ⚠ 사용자가 바꿀 수 있는 값이 아니다. 바꾸고 싶으면 계산기로 가면 된다 — 그게 이 버튼들의 목적지다.
 */
export const LANDING_GOAL_ASSUMPTIONS = {
  /** 연 기대수익률. 지수 장기 평균을 보수적으로 잡은 값이다. */
  annualReturnRate: 0.07,
  /** 배당률. 배당성장형 ETF 대의 값. */
  dividendYield: 0.04,
  /** 배당소득세. 건보료는 넣지 않았다 — 금융소득 2천만 원 초과에서만 붙어 모두에게 참이 아니다. */
  taxRate: 0.154,
  /** 미리 보여 줄 월 적립금 세 단계. */
  monthlyContributions: [500_000, 1_000_000, 2_000_000]
} as const;

/**
 * 목표를 고르면 가는 곳. 계산기가 그 목표를 받아 이어서 계산한다.
 *
 * ⚠ 자산·배당을 **같은 파라미터**로 보낸다. 종류는 id 안에 이미 있고(`asset-100m`·`dividend-100`),
 *   받는 쪽이 `findLandingGoal` 로 되찾으면 `kind` 까지 함께 온다 — 주소에 두 번 적을 이유가 없다.
 */
export const landingGoalPath = (goal: LandingGoal): string => `${SIMULATOR_PATH}?${GOAL_QUERY_PARAM}=${goal.id}`;

/**
 * 주소의 쿼리 문자열에서 목표를 되찾는다 — **순수 함수**(`window` 를 보지 않는다).
 *
 * 🔴 계산기 쪽에서 **두 곳**이 이것을 부른다: 폼을 채우는 훅(`useGoalQueryApply`)과 답을 보여 주는
 * 배너(`GoalBanner`). 둘이 각자 파싱하면 한쪽만 고쳐지는 사고가 나므로 여기 한 곳에 둔다.
 * ⚠ 모르는 id·빈 값·깨진 쿼리는 전부 `null` 이다. 호출부는 그때 **아무 일도 하지 않아야** 한다 —
 *   오타 난 링크로 들어온 방문자에게 에러 화면을 띄울 일이 아니다.
 */
export const resolveLandingGoalFromSearch = (search: string): LandingGoal | undefined => {
  try {
    const id = new URLSearchParams(search).get(GOAL_QUERY_PARAM);
    return id === null || id === '' ? undefined : findLandingGoal(id);
  } catch {
    return undefined;
  }
};
