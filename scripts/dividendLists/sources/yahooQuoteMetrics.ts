import { daysBetweenEpochSeconds, epochSecondsToUtcDate, epochSecondsToUtcYear } from './epochTime';
import type { YahooDividendChart, YahooDividendEvent } from './yahooDividendHistory';

/**
 * chart 응답 **한 건**에서 현재가·선행 배당률·5년 성장률·삭감 여부를 뽑는 **순수 계산부**.
 * 네트워크를 타지 않는다 — 입력은 `fetchYahooDividendChart` 의 결과 하나뿐이다.
 *
 * ## 🔴 배당률은 "선행 방식"이다 — 다른 방식은 실측으로 탈락했다
 * 독립 소스 26종과 대조한 결과(2026-08-04):
 * ```
 *   계산법                          평균오차    최대       0.1pp 이내
 *   ① 최근 365일 배당합            0.053pp   -0.271pp   23/26
 *   ② 최신 지급액 × 연 지급횟수    0.014pp   -0.109pp   25/26   ← 이 파일이 쓰는 방식
 *   ✗ 작년+올해 누적               1.466pp   +3.442pp    2/26   ← 최대 16개월치를 더한 버그
 * ```
 * 같은 조사에서 **가격은 26/26 완전 일치**했다(오차 0.000%). 즉 야후 원자료는 정확했고 위험은 전부
 * 우리 가공 방식에 있었다. 그래서 ①이나 누적 방식으로 되돌리지 마라.
 *
 * ## ② 방식이 성립하지 않는 형태와 그 처리
 * ② 는 "최신 1회 지급액 = 앞으로도 반복될 규칙 배당"이라고 가정한다. 262종 실측에서 그 가정이
 * 깨지는 종목이 셋 나왔고, 셋 다 **20% 상한 가드로는 안 걸리는 그럴듯한 숫자**를 만들었다.
 * ```
 *   RLI  규칙 0.16 위에 매년 특별배당 2.00 → 최신 2.18 × 4회 ÷ 61.29 = 14.2%  (실제 약 1.0%)
 *   STAG 월배당 0.124 → 분기배당 0.388 전환 → 0.388 × 12회 ÷ 38.57 = 12.1%   (실제 약 4.0%)
 *   FCPT 분기 0.367 → 월 0.122 전환      → 0.122 × 4회 ÷ 25.30  =  1.9%   (실제의 1/3)
 * ```
 * → 그래서 최신 지급액이 최근 지급들의 **중앙값 대비 위아래로 이상치**면 배당률을 계산하지 않고
 *   **문제로 올린다**. 지어낸 값을 쓰느니 비워 두고 사람이 채우는 편이 낫다
 *   (이 레포의 "모르면 지어내지 않는다" 규율).
 *
 * ## 파생 지표는 전부 "그 해의 규칙 배당"에서 나온다
 * 5년 성장률과 삭감 탐지는 연간 **합계**가 아니라 `toAnnualPaymentRates`(연도별 최빈 지급액)를 쓴다.
 * 합계로 하면 특별배당 한 건·지급일 한 번의 밀림이 그대로 거짓 신호가 된다 — 각 함수 주석에 실측표가 있다.
 */

/**
 * 최신 지급액이 최근 중앙값의 이 배를 넘거나(특별배당) 이 배만큼 밑돌면(지급주기 변경·삭감)
 * 이상치로 본다. 실측된 사례들은 전부 여유 있게 이 밖이다(RLI 13.6배 · STAG 3.1배 · FCPT 1/2.9배).
 */
const PAYMENT_OUTLIER_RATIO = 1.5;

/** 연 지급횟수를 세는 창(완결 연도 기준). 5년이면 주기 변경이 있어도 최빈값이 안정적이다. */
const FREQUENCY_LOOKBACK_YEARS = 5;

/** 5년 성장률의 기간. `(작년 ÷ 6년전)^(1/5) − 1` 이라 **완결 6개 연도**가 필요하다. */
const GROWTH_YEARS = 5;

/**
 * "최신 지급이 아직 유효한가"의 판정 여유. 지급 간격의 2배 + 60일.
 * 분기 배당이면 약 242일, 월 배당이면 약 121일. 배당을 끊은 종목의 옛 지급액으로 배당률을 만들어
 * 화면에 내보내는 사고를 막는다.
 */
const STALE_SLACK_DAYS = 60;

export type MetricsProblemKind =
  /** 응답에 현재가가 없다 — 배당률의 분모가 없다. */
  | 'noPrice'
  /** 배당 이벤트가 하나도 없다. */
  | 'noDividends'
  /** 완결 연도가 없어 연 지급횟수를 못 정한다. */
  | 'noFrequency'
  /** 최신 지급액이 이상치다(특별배당·지급주기 변경) — ② 방식을 그대로 쓰면 배당률이 크게 틀린다. */
  | 'abnormalLatestPayment'
  /** 최신 지급이 너무 오래됐다 — 배당을 끊었을 수 있다. */
  | 'staleDividend'
  /** 완결 6개 연도가 없어 5년 성장률을 못 낸다(막는 문제가 아니다 — 성장률만 null 로 둔다). */
  | 'growthUnavailable';

export type MetricsProblem = { kind: MetricsProblemKind; detail: string };

export type YahooTickerMetrics = {
  price: number;
  currency: string | null;
  /** 최신 1회 지급액. */
  latestDividend: number;
  /** 최신 지급의 UTC 날짜(`YYYY-MM-DD`). */
  latestDividendDate: string;
  /** 연 지급횟수(최근 완결 연도들의 최빈값). */
  paymentsPerYear: number;
  /** 선행 연 배당 = 최신 지급액 × 연 지급횟수. */
  forwardAnnualDividend: number;
  /** 선행 배당률(%). */
  forwardYieldPercent: number;
  /** 최근 5년 배당 연평균 성장률(%). 완결 6개 연도가 없으면 `null`. */
  fiveYearGrowthPercent: number | null;
  /** 최근 구간에서 감지한 삭감. 없으면 `null`. */
  recentCut: DividendRateCut | null;
  /** 야후 이력상 첫 배당 연도. "이력이 어디서 잘렸나"를 사람이 볼 근거다. */
  firstDividendYear: number;
};

export type TickerMetricsResult = {
  /** 막는 문제가 하나라도 있으면 `null`. 반쯤 맞는 숫자를 내보내지 않는다. */
  metrics: YahooTickerMetrics | null;
  problems: MetricsProblem[];
};

const BLOCKING_PROBLEM_KINDS: ReadonlySet<MetricsProblemKind> = new Set<MetricsProblemKind>([
  'noPrice',
  'noDividends',
  'noFrequency',
  'abnormalLatestPayment',
  'staleDividend'
]);

export const isBlockingMetricsProblem = (kind: MetricsProblemKind): boolean => BLOCKING_PROBLEM_KINDS.has(kind);

const median = (values: readonly number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

/**
 * 연 지급횟수 = 최근 완결 연도들의 지급 건수 **최빈값**.
 *
 * 왜 최빈값인가: 특별배당이 한 해에 한 번 섞여도(예: 4,4,5,4,4) 최빈값은 4로 버틴다. 평균을 쓰면
 * 그 한 해가 전체를 끌어올려 배당률이 25% 부풀려진다.
 * 동률이면 **가장 최근 연도의 값**을 쓴다 — 주기가 바뀐 종목은 최신 쪽이 맞다.
 */
export const annualPaymentFrequency = (
  events: readonly YahooDividendEvent[],
  currentYear: number
): number | null => {
  const countsByYear = new Map<number, number>();
  for (const event of events) {
    const year = epochSecondsToUtcYear(event.timestampSeconds);
    // 진행 중인 해는 지급이 아직 남아 있어 무조건 작다 — 세면 매년 1월에 전 종목의 주기가 1이 된다.
    if (year >= currentYear) continue;
    countsByYear.set(year, (countsByYear.get(year) ?? 0) + 1);
  }
  const recentYearsDescending = [...countsByYear.keys()]
    .filter((year) => year >= currentYear - FREQUENCY_LOOKBACK_YEARS)
    .sort((left, right) => right - left);
  if (recentYearsDescending.length === 0) return null;

  const tally = new Map<number, number>();
  for (const year of recentYearsDescending) {
    const count = countsByYear.get(year) ?? 0;
    tally.set(count, (tally.get(count) ?? 0) + 1);
  }
  let best: number | null = null;
  let bestTally = 0;
  // 최근 연도부터 훑으며 **strictly greater** 로만 교체한다 → 동률이면 더 최근 연도의 값이 남는다.
  for (const year of recentYearsDescending) {
    const count = countsByYear.get(year) ?? 0;
    const score = tally.get(count) ?? 0;
    if (score > bestTally) {
      bestTally = score;
      best = count;
    }
  }
  return best !== null && best > 0 ? best : null;
};

/**
 * 최신 지급액이 최근 지급들의 중앙값 대비 이상치인가. **양방향**으로 본다 —
 * ② 방식(최신 지급액 × 연 지급횟수)은 최신 1회가 평소 수준일 때만 성립하므로, 위든 아래든 튀면
 * 그 곱은 무의미하다.
 *
 * 2026-08-04 후보 262종 전수에서 걸린 셋이 정확히 이 세 형태다.
 * ```
 *   RLI  최신 2.18 vs 최근 중앙값 0.16   → 특별배당이 최신 회차에 얹혔다 (② 로 계산하면 14.2%)
 *   STAG 최신 0.388 vs 최근 중앙값 0.124 → 월배당 → 분기배당 전환 (② × 12회 = 12.1%)
 *   FCPT 최신 0.122 vs 최근 중앙값 0.355 → 분기배당 → 월배당 전환 (② × 4회 = 1.9%, 실제의 1/3)
 * ```
 * 셋 다 배당률 상한(20%) 가드로는 **안 걸린다** — 그럴듯한 숫자로 통과한다. 그래서 이 가드가 필요하다.
 */
export const isLatestPaymentOutlier = (
  events: readonly YahooDividendEvent[],
  paymentsPerYear: number
): boolean => {
  // 최근 2년치를 본다 — 1년치만 보면 매년 반복되는 특별배당이 중앙값을 밀어 올려 이상치가 감춰진다.
  const window = events.slice(-Math.max(paymentsPerYear * 2, 4));
  if (window.length < 3) return false;
  const middle = median(window.map((event) => event.amount));
  if (middle <= 0) return false;
  const latest = window[window.length - 1].amount;
  return latest > middle * PAYMENT_OUTLIER_RATIO || latest < middle / PAYMENT_OUTLIER_RATIO;
};

/**
 * 5년 배당 성장률(%) = `(작년 규칙 배당 ÷ 6년전 규칙 배당)^(1/5) − 1`.
 * 완결 6개 연도가 없거나 기준 연도 값이 0 이하면 `null`(0% 로 대체하지 않는다 — 뜻이 다르다).
 *
 * ## 🔴 연간 **합계**로 계산하지 마라 — 12종이 마이너스 성장으로 뒤집혔다
 * 2026-08-04 후보 262종 전수 실측. 합계 방식은 특별배당 한 건이나 지급 건수 한 번의 흔들림에
 * 5년 CAGR 전체가 끌려간다.
 * ```
 *   COST 2020: 0.65 0.70 0.70 0.70 [10.00 특별]  2025: 1.16 1.30 1.30 1.30
 *        합계 12.750 → 5.060 = −16.88%   ❌      규칙 0.70 → 1.30 = +13.18%   ✅
 *   GIC  2020: 1.14 0.14 0.14 0.14 [2.00 특별]   합계 −21.82% ❌ / 규칙 +13.18% ✅
 *   AMSF 2020: 0.27×3 [3.50 특별] 0.27           합계 −10.98% ❌ / 규칙  +7.63% ✅
 *   COR  2020: 지급 8회(0.42·1.22 두 계열)        합계 −19.34% ❌ / 규칙  +5.54% ✅
 *   CB   2025: 지급 2회만 기록(연말 밀림)          합계  −9.46% ❌ / 규칙  +3.13% ✅
 * ```
 * 다섯 종목 모두 규칙 배당은 5년 내내 **올랐다**. 합계 방식으로는 화면이 "배당이 줄고 있다"는
 * 정반대의 사실을 말하게 된다 — 지어낸 숫자를 안 쓰는 것과 같은 이유로 이 방식을 쓰지 않는다.
 */
export const fiveYearDividendGrowthPercent = (
  rates: readonly AnnualPaymentRate[],
  currentYear: number
): number | null => {
  const entryOf = (year: number): AnnualPaymentRate | null =>
    rates.find((entry) => entry.year === year) ?? null;
  const recent = entryOf(currentYear - 1);
  const base = entryOf(currentYear - 1 - GROWTH_YEARS);
  if (!recent || !base || base.rate <= 0 || recent.rate <= 0) return null;

  /*
   * 🔴 지급 빈도 체계가 바뀐 두 해는 **비교 대상이 아니다.** 1회 지급액끼리 비교하는 방식이라
   * 연 1회 → 분기 4회 같은 전환이 그대로 "삭감"으로 보인다. 2026-08-04 실측 두 건:
   *   CTAS 2020년 연 1회 0.8775 → 2025년 분기 0.45  (그대로 계산하면 −14.97%, 실제는 증배)
   *   TPL  2020년 연 2회 1.1111 → 2025년 분기 0.5333(그대로 계산하면 −13.65%, 실제는 증배)
   * 이건 기계가 원리적으로 못 푸는 기업행위다(`dividendLists.types.ts` 머리말에 CTAS 가 이미
   * 그 예로 적혀 있다). 그래서 **틀린 숫자 대신 null** 을 낸다 — 화면은 "—"로 그린다.
   *
   * 임계는 2배다. 지급일이 연말·연초를 넘나들어 생기는 3회/4회 흔들림(±1)은 통과시키고,
   * 체계 전환(1↔4 · 4↔12)만 걸러야 하기 때문이다.
   */
  const larger = Math.max(base.paymentCount, recent.paymentCount);
  const smaller = Math.min(base.paymentCount, recent.paymentCount);
  if (smaller <= 0 || larger >= smaller * 2) return null;

  return (Math.pow(recent.rate / base.rate, 1 / GROWTH_YEARS) - 1) * 100;
};

/**
 * 그 해의 **규칙 배당 수준** = 지급액의 **최빈값**(동률이면 더 작은 쪽).
 *
 * 규칙 배당은 같은 금액이 반복되고 비정기 지급은 한두 번 튄다 — 그래서 최빈값이 규칙 배당을 집어낸다.
 * 중앙값·최솟값을 먼저 시도했다가 둘 다 실측에서 깨졌다(2026-08-04, 후보 262종 전수):
 *
 * ```
 *  AFG (규칙 배당 위에 $14·$8·$4·$2.5 특별배당을 매년 뿌린다)
 *    2021: 0.5 0.5 14 0.5 2 4 0.56 4 2  → 최빈 0.50 ✅ / 중앙값 2.00 ❌(다음 해가 삭감으로 오탐)
 *  FULT (규칙 분기배당 밑에 작은 추가 지급이 매년 한 번 섞인다)
 *    2021: 0.14 0.14 0.14 0.08 0.14     → 최빈 0.14 ✅ / 최솟값 0.08 ❌
 *    2022: 0.15 0.15 0.15 0.06 0.15     → 최빈 0.15 ✅ / 최솟값 0.06 ❌(0.08→0.06 이 삭감으로 오탐)
 * ```
 * 최빈값 수열은 두 종목 모두 단조 증가한다(AFG 0.50→0.56→0.63→0.71→0.80→0.88, FULT 0.14→0.15→0.16→…).
 *
 * ⚠ 연중에 증배한 해는 최빈값이 **연초 수준**이다(그 금액이 더 여러 번 지급되므로). 다음 해 값은
 *   그보다 크거나 같아 비교가 단조롭다 — 증배를 한 해 늦게 반영할 뿐 삭감을 놓치지 않는다.
 * ⚠ 모든 지급액이 제각각이면(전부 1회) 동률이므로 **가장 작은 값**을 쓴다 — 보수적인 쪽이다.
 */
export type AnnualPaymentRate = { year: number; rate: number; paymentCount: number };

const modeOrSmallest = (amounts: readonly number[]): number => {
  const tally = new Map<number, number>();
  for (const amount of amounts) tally.set(amount, (tally.get(amount) ?? 0) + 1);
  let best = Number.POSITIVE_INFINITY;
  let bestCount = 0;
  for (const [amount, count] of tally) {
    if (count > bestCount || (count === bestCount && amount < best)) {
      best = amount;
      bestCount = count;
    }
  }
  return best;
};

export const toAnnualPaymentRates = (events: readonly YahooDividendEvent[]): AnnualPaymentRate[] => {
  const byYear = new Map<number, number[]>();
  for (const event of events) {
    const year = epochSecondsToUtcYear(event.timestampSeconds);
    const bucket = byYear.get(year);
    if (bucket) bucket.push(event.amount);
    else byYear.set(year, [event.amount]);
  }
  return [...byYear.entries()]
    .map(([year, amounts]) => ({ year, rate: modeOrSmallest(amounts), paymentCount: amounts.length }))
    .sort((left, right) => left.year - right.year);
};

export type DividendRateCut = { fromYear: number; toYear: number; fromRate: number; toRate: number };

/**
 * 삭감으로 볼 **1회 지급액** 하락 비율. 0.95 = 규칙 배당이 5% 넘게 줄어든 해만 신고한다.
 * 합계 방식(0.85)보다 임계를 좁혀도 되는 이유는 아래 ①②를 제거해 신호가 깨끗해졌기 때문이다.
 */
const RATE_CUT_RATIO = 0.95;

/** 최근 몇 개 연도를 보나. 20년 전의 삭감은 편입 자격 판정에 이미 반영돼 있다. */
const CUT_LOOKBACK_YEARS = 6;

/**
 * 최근 구간의 배당 **삭감**을 찾는다. 연간 **합계**가 아니라 위의 **규칙 배당 수준**을 비교한다.
 *
 * ## 🔴 왜 합계를 쓰지 않는가 — 실측으로 오탐률 16%가 나왔다
 * 후보 유니버스 앞 25종에 합계 방식(`findRecentDividendCut`, 전년 대비 15% 하락)을 돌린 결과
 * **4종이 삭감으로 신고됐고 4종 전부 오탐**이었다(2026-08-04 실측). 원인은 삭감이 아니라 **지급일이
 * 연말·연초를 넘나든 것**이다.
 * ```
 *   ACN  2024: 1.29 1.29 1.29 1.48 (4회, 합 5.350) → 2025: 1.48 1.48 1.48 (3회, 합 4.440)
 *   APD  2023: 1.75 ×4       (합 7.000) → 2024: 1.77 1.77 1.77 (3회, 합 5.310)  ← 4회차가 2025-01-02
 *   AMCR 2024: 0.625×3 0.64  (합 2.515) → 2025: 0.64 0.64      (2회, 합 1.280)
 *   ANDE 2023: 0.185×3 0.19  (합 0.745) → 2024: 0.19 ×3        (3회, 합 0.570)
 * ```
 * 네 종목 모두 **1회 지급액은 한 번도 줄지 않았다**. 합계는 "지급 건수 × 지급액"이라 건수가 흔들리면
 * 그대로 오탐이 된다.
 *
 * ## 덤으로 특별배당 오탐도 사라진다
 * 규칙 배당 수준(최솟값)은 특별배당이 몇 번 섞이든 흔들리지 않는다. 합계 방식이 2026-08-03 배당킹
 * 46종에서 낸 오탐 3건(RLI 2022년 4.015 → 2023년 1.535 등)이 여기서는 애초에 발생하지 않는다.
 *
 * ⚠ 그래서 **진행 중인 해도 본다**. 합계 방식은 진행 중인 해가 무조건 작아 제외해야 했지만,
 * 최솟값은 지급이 한 번이라도 있으면 그 해의 수준을 그대로 말한다 — 삭감을 1년 늦게 아는 대신
 * 오탐을 얻는 거래를 할 이유가 없다.
 */
export const findRecentRateCut = (
  rates: readonly AnnualPaymentRate[],
  currentYear: number
): DividendRateCut | null => {
  const window = rates.filter((entry) => entry.year > currentYear - CUT_LOOKBACK_YEARS);
  let latest: DividendRateCut | null = null;
  for (let index = 1; index < window.length; index += 1) {
    const previous = window[index - 1];
    const current = window[index];
    if (previous.rate <= 0) continue;
    if (current.rate < previous.rate * RATE_CUT_RATIO) {
      latest = {
        fromYear: previous.year,
        toYear: current.year,
        fromRate: previous.rate,
        toRate: current.rate
      };
    }
  }
  return latest;
};

export type MetricsOptions = {
  /** 진행 중인 해. 완결 연도만 세기 위해 필요하다. */
  currentYear: number;
  /** "지금". 최신 지급이 오래됐는지 재는 기준이다. 테스트가 고정값을 준다. */
  nowEpochSeconds: number;
};

/** 지급 간격의 2배 + 여유. 이보다 오래된 최신 지급은 "끊겼을 수 있다"로 본다. */
const staleThresholdDays = (paymentsPerYear: number): number =>
  Math.round((365 / paymentsPerYear) * 2) + STALE_SLACK_DAYS;

export const computeTickerMetrics = (
  chart: YahooDividendChart,
  options: MetricsOptions
): TickerMetricsResult => {
  const problems: MetricsProblem[] = [];
  const push = (kind: MetricsProblemKind, detail: string): void => {
    problems.push({ kind, detail });
  };

  const { price, events } = chart;
  if (price === null || price <= 0) push('noPrice', `현재가가 없다(${String(price)})`);
  if (events.length === 0) push('noDividends', '배당 이벤트가 하나도 없다');

  const frequency = annualPaymentFrequency(events, options.currentYear);
  if (events.length > 0 && frequency === null) {
    push('noFrequency', `최근 ${FREQUENCY_LOOKBACK_YEARS}년 안에 완결된 지급 연도가 없다`);
  }

  const latest = events[events.length - 1];
  if (latest && frequency !== null) {
    const ageDays = daysBetweenEpochSeconds(options.nowEpochSeconds, latest.timestampSeconds);
    const limit = staleThresholdDays(frequency);
    if (ageDays > limit) {
      push(
        'staleDividend',
        `최신 지급이 ${epochSecondsToUtcDate(latest.timestampSeconds)}(${ageDays}일 전)로 연 ${frequency}회 기준 한도 ${limit}일을 넘었다`
      );
    }
    if (isLatestPaymentOutlier(events, frequency)) {
      push(
        'abnormalLatestPayment',
        `최신 지급액 ${latest.amount}(${epochSecondsToUtcDate(latest.timestampSeconds)})가 최근 지급 대비 이상치다 ` +
          '(특별배당 또는 지급주기 변경) — 선행 배당률을 계산하지 않는다'
      );
    }
  }

  const rates = toAnnualPaymentRates(events);
  const growth = fiveYearDividendGrowthPercent(rates, options.currentYear);
  if (growth === null) {
    push(
      'growthUnavailable',
      `${options.currentYear - 1 - GROWTH_YEARS}년과 ${options.currentYear - 1}년을 비교할 수 없어 5년 성장률을 낼 수 없다` +
        '(완결 6개 연도가 없거나, 그 사이에 지급 빈도 체계가 바뀌었다)'
    );
  }

  if (problems.some((problem) => isBlockingMetricsProblem(problem.kind))) return { metrics: null, problems };

  /* 여기부터는 막는 문제가 없다 = price·latest·frequency 가 전부 있다. */
  const resolvedPrice = price as number;
  const resolvedLatest = latest;
  const resolvedFrequency = frequency as number;
  const cut = findRecentRateCut(rates, options.currentYear);
  const forwardAnnualDividend = resolvedLatest.amount * resolvedFrequency;

  return {
    metrics: {
      price: resolvedPrice,
      currency: chart.currency,
      latestDividend: resolvedLatest.amount,
      latestDividendDate: epochSecondsToUtcDate(resolvedLatest.timestampSeconds),
      paymentsPerYear: resolvedFrequency,
      forwardAnnualDividend,
      forwardYieldPercent: (forwardAnnualDividend / resolvedPrice) * 100,
      fiveYearGrowthPercent: growth,
      recentCut: cut,
      firstDividendYear: epochSecondsToUtcYear(events[0].timestampSeconds)
    },
    problems
  };
};
