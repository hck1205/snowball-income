import type { PulseSeriesPoint, PulseZone } from './marketPulse.types';
import { percentileOf } from './parse';

/**
 * 값 → 구간 판정.
 *
 * ## 🔴 경계를 지어내지 않는다
 *
 * 이 파일에서 숫자 하나를 잘못 쓰면 화면이 **근거 없는 판정**을 내린다. 그래서 두 갈래로만 간다.
 *
 *  ① **관습적 경계가 실제로 존재하는 지표**만 고정 경계를 쓴다(VIX·공포탐욕지수·금리커브 부호).
 *     각 경계마다 왜 그 값인지 아래에 적었다.
 *  ② 나머지는 **자기 과거 분포의 백분위**로만 말한다. "지난 N년 중 상위 몇 %"는 지어낸 것이
 *     아니라 계산된 사실이다.
 *
 * ⚠ 여기서 나오는 것은 **긴장도**이지 좋고 나쁨이 아니다. 구간 이름이 `good`/`bad` 가 아니라
 *   `calm`/`stressed` 인 이유다 — 변동성이 낮은 것은 조용한 것이지 옳은 것이 아니다.
 */

/**
 * VIX. 옵션시장이 앞으로 30일 변동성을 얼마로 보는가.
 *
 * 경계의 근거: 20 은 VIX 의 **장기 평균 근처**이고(1990년 이후 대략 19~20), 30 은 Cboe 가
 * 자사 설명에서 "높은 변동성"으로 부르는 구간이며 주요 급락장마다 넘긴 선이다. 12 아래는
 * 역사적으로 드문 저변동 구간이다.
 */
export const vixZone = (value: number): PulseZone => {
  if (value < 12) return 'calm';
  if (value < 20) return 'normal';
  if (value < 30) return 'elevated';
  return 'stressed';
};

/**
 * VIX 기간구조 = VIX ÷ VIX3M.
 *
 * 평시에는 먼 만기가 더 비싸서(콘탱고) 이 비율이 **1보다 작다**. 1을 넘으면 백워데이션 —
 * 단기 불안이 장기보다 커진 상태이고, 급락 국면에서만 나타난다. 그래서 1이 경계다.
 * 0.85 아래는 콘탱고가 가파른 평온기다.
 */
export const termStructureZone = (ratio: number): PulseZone => {
  if (ratio < 0.85) return 'calm';
  if (ratio < 1) return 'normal';
  if (ratio < 1.1) return 'elevated';
  return 'stressed';
};

/**
 * CNN 공포탐욕지수 (0~100).
 *
 * 경계는 **CNN 자신의 구간**을 그대로 쓴다(극단적 공포 0~24 · 공포 25~44 · 중립 45~55 ·
 * 탐욕 56~75 · 극단적 탐욕 76~100). 우리가 다시 나눌 이유가 없고, 다시 나누면 같은 이름의
 * 지표가 출처와 다른 말을 하게 된다.
 *
 * 🔴 **양끝이 다 `stressed` 다.** 탐욕 95를 `calm` 으로 칠하면 화면이 "지금이 가장 좋다"고
 *    말하는 셈이다.
 */
export const fearGreedZone = (value: number): PulseZone => {
  if (value < 25 || value > 75) return 'stressed';
  if (value < 45 || value > 55) return 'elevated';
  return 'normal';
};

/**
 * 장단기 금리차(10Y-2Y / 10Y-3M), 퍼센트포인트.
 *
 * 경계는 **부호**다. 역전(음수)은 그 자체가 사건이고, 미국에서 역사적으로 경기침체에 앞섰다.
 * 다만 **앞섰다는 것이 원인이라는 뜻은 아니고**, 시차도 길고 들쭉날쭉했다 — 화면 문구가
 * 이 선을 넘지 않아야 한다.
 */
export const yieldCurveZone = (value: number): PulseZone => {
  if (value < 0) return 'stressed';
  if (value < 0.25) return 'elevated';
  if (value < 1.5) return 'normal';
  return 'calm';
};

/**
 * 고정 경계가 없는 지표용 — **자기 과거 분포**에서의 위치로만 구간을 정한다.
 *
 * 상·하위 5%를 `stressed`, 20%를 `elevated` 로 본다. 이 값들도 관습이지만, 적어도 **그 지표
 * 자신의 역사**에서 나온 것이라 다른 지표의 경계를 빌려 오는 것보다 낫다.
 *
 * @param history 비교 대상 분포(보통 최근 몇 년)
 */
export const percentileZone = (
  history: PulseSeriesPoint[],
  value: number,
  direction: 'higher-is-tense' | 'lower-is-tense'
): PulseZone => {
  const percentile = percentileOf(history, value);
  if (percentile === null) return 'unknown';

  /* 긴장이 낮은 쪽에 있는 지표는 백분위를 뒤집어 같은 잣대로 본다. */
  const tension = direction === 'higher-is-tense' ? percentile : 100 - percentile;

  if (tension >= 95) return 'stressed';
  if (tension >= 80) return 'elevated';
  if (tension <= 20) return 'calm';
  return 'normal';
};

/**
 * 구간 이름 — **한 방향으로 올라가는 4단 척도**다.
 *
 * ## 🔴 "조용함·평시"를 버린 이유 (2026-08-09 사용자 지적)
 *
 * 종전 이름(조용함·평시·높아짐·긴장)은 **좋은 신호인지 나쁜 신호인지를 말하지 않았다.**
 * "평시"는 안심해도 된다는 뜻인지 그냥 보통이라는 뜻인지 읽는 사람마다 갈렸다.
 *
 * 지금은 **안정 → 보통 → 주의 → 경계** 로, 오르는 방향이 하나다. 색도 같은 방향으로 간다.
 *
 * ⚠ 그래도 이것은 **시장의 긴장도**이지 "사라/팔라"가 아니다. 경계는 "시장이 불안하다"이지
 *   "팔아야 한다"가 아니고, 안정은 "조용하다"이지 "지금 사라"가 아니다. 이 구분이 무너지면
 *   이 화면은 투자권유가 된다 — 설명 아코디언의 '이 지표가 못 하는 것' 칸이 그 선을 지킨다.
 * ⚠ `context` 는 척도 밖이다(금리 수준·지수 수준). 긴장도라는 개념 자체를 붙이지 않는다.
 */
export const ZONE_LABEL: Record<PulseZone, string> = {
  calm: '안정',
  normal: '보통',
  elevated: '주의',
  stressed: '경계',
  context: '참고',
  unknown: '받지 못함'
};
