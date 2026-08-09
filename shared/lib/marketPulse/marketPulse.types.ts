/**
 * 시장 상황 계기판의 **표현 모델**.
 *
 * 🔴 이 화면은 이 레포에서 **투자권유 금지선에 가장 가까이 가는 물건**이다. 그래서 모델 자체가
 *    선을 긋는다 — 지표는 `observation`(관측값)과 `zone`(역사적 위치)만 갖고, "사라/팔라"에
 *    해당하는 필드가 **타입에 존재하지 않는다**. 문구를 조심하는 것보다 필드를 안 만드는 쪽이
 *    오래 간다.
 *
 * 🔴 `asOf` 는 **선택이 아니다**. 이 화면의 값들은 갱신 주기가 제각각이다(매일·월·분기·연).
 *    기준일 없이 나란히 놓으면 **석 달 전 숫자가 오늘 값처럼 읽힌다** — 오류로 드러나지 않고
 *    그냥 틀린 것이 그럴듯하게 보이는 종류다.
 */

/** 지표가 속한 축. 화면의 묶음이자 "무엇을 재는가"의 분류다. */
export type PulseAxis = 'valuation' | 'sentiment' | 'volatility' | 'breadth' | 'credit' | 'macro';

/**
 * 갱신 주기. 화면이 기준일을 얼마나 강하게 알려야 하는지를 정한다.
 *
 * ⚠ `quarterly`·`annual` 은 **오늘 값이 아니다**. 화면은 이들을 매일 갱신되는 값과 같은 크기로
 *   나란히 두지 않는다(같이 두면 하나의 스냅샷처럼 읽힌다).
 */
export type PulseCadence = 'daily' | 'monthly' | 'quarterly' | 'annual';

/**
 * 값이 커질 때 무엇을 뜻하는가.
 *
 * 🔴 "좋다/나쁘다"가 아니라 **긴장/이완**이다. VIX 가 높으면 시장이 불안한 것이지 나쁜 것이
 *    아니고(싸게 사는 사람에겐 기회다), 밸류에이션이 높으면 비싼 것이지 틀린 것이 아니다.
 *    이 낱말 선택이 화면 전체의 어조를 정한다.
 */
export type PulseDirection =
  | 'higher-is-tense'
  | 'lower-is-tense'
  /**
   * 🔴 **양끝이 다 긴장이다.** 공포탐욕지수가 그렇다 — 극단적 공포도, 극단적 탐욕도 눈에 띄는
   *    상태이고 가운데가 평시다. 한쪽 방향으로만 모델링하면 "탐욕 100"이 가장 좋은 값으로
   *    그려진다(색도 초록이 된다). 그건 이 화면이 절대 하면 안 되는 말이다.
   */
  | 'extremes-are-tense';

/**
 * 역사적 위치. 색과 문구가 여기서 나온다.
 *
 * 🔴 `context` 는 **긴장도를 매기지 않는 값**이다. 10년물 금리·지수 수준이 그렇다 — 금리가
 *    10년 분포 상단에 있다는 것은 사실이지만 그게 "시장이 긴장했다"는 뜻은 아니다(할인율이
 *    높아진 것이지 스트레스가 아니다). 백분위를 기계적으로 긴장도로 번역하면 화면이 근거 없는
 *    판정을 내린다 — 실제로 첫 실행에서 10년물이 `stressed` 로 찍혔다(2026-08-09).
 *    판정할 근거가 없으면 **판정하지 않는 것**이 답이다.
 * ⚠ `unknown` 과 다르다. `unknown` 은 "값을 못 받아 못 정했다"이고 `context` 는
 *   "받았지만 이 지표에 긴장도라는 개념을 붙이지 않는다"이다.
 */
export type PulseZone = 'calm' | 'normal' | 'elevated' | 'stressed' | 'context' | 'unknown';

/** 한 지표의 한 시점 값. */
export type PulseObservation = {
  value: number;
  /** ISO 날짜(YYYY-MM-DD). **원자료가 말한 날짜**이지 우리가 받은 날짜가 아니다. */
  asOf: string;
};

export type PulseSeriesPoint = {
  date: string;
  value: number;
};

/**
 * 화면에 그려지는 지표 하나.
 *
 * ⚠ `value` 가 `null` 인 상태는 **정상**이다 — 원자료가 아직 안 올라왔거나 상류가 흔들릴 때다.
 *   그때 화면은 빈칸을 추정치로 메우지 않고 "받지 못했다"를 말한다(지어낸 숫자 0).
 */
export type PulseIndicator = {
  id: string;
  axis: PulseAxis;
  /** 화면에 쓰는 이름. */
  label: string;
  /** 이 숫자가 무엇을 재는지 한 줄. 판단이 아니라 정의다. */
  meaning: string;
  cadence: PulseCadence;
  direction: PulseDirection;
  /** 단위 접미사(`%`·`배`…). 없으면 빈 문자열. */
  unit: string;
  /** 소수점 자릿수. */
  precision: number;
  /** 원자료 출처 표기 — 화면에 그대로 보인다. 출처 없는 숫자는 두지 않는다. */
  source: string;
  observation: PulseObservation | null;
  zone: PulseZone;
  /** 최근 시계열(그래프용). 없으면 빈 배열 — 카드는 숫자만 그린다. */
  series: PulseSeriesPoint[];
  /**
   * 같은 지표의 **과거 시점 값들**(전일·1주 전·1개월 전…). 출처가 함께 주는 경우에만 채운다.
   *
   * 🔴 우리가 시계열에서 계산하지 않는다. 출처가 준 값만 싣는다 — 예를 들어 공포탐욕지수는
   *    구성 요소가 매일 재계산돼서, 우리가 시계열에서 뽑은 "1개월 전"이 CNN 이 말하는 값과
   *    다를 수 있다. 같은 이름의 두 숫자가 갈리면 어느 쪽도 못 믿는다.
   */
  comparisons?: { label: string; value: number }[];
  /**
   * 값 옆에 붙는 **사실 한 줄**(예: "200일 이동평균 위"). 판단이 아니라 관측이다.
   * ⚠ 여기에 전망이나 권유를 쓰지 마라 — 이 필드가 그런 문장이 흘러드는 가장 쉬운 구멍이다.
   */
  note?: string;
  /** 값을 못 받았을 때의 사유. 화면이 침묵하지 않게 한다. */
  unavailableReason?: string;
};

/** 계기판 전체. */
export type MarketPulseSnapshot = {
  /** 이 응답을 만든 시각(ISO). 각 지표의 `asOf` 와 **다르다** — 혼동하지 말 것. */
  fetchedAt: string;
  indicators: PulseIndicator[];
};
