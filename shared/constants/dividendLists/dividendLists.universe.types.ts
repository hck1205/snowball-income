import type { DividendListSectorId } from './dividendLists.types';

/**
 * **후보 유니버스** — 배당 연속증배 ETF 네 종의 보유내역을 합친 종목 풀과, 그 종목의 실측 지표.
 *
 * ## 왜 `DividendList` 와 따로인가
 * `DividendList`(배당킹·배당귀족·배당챔피언)는 **사람이 확정한 목록**이고 "이 종목이 이 목록에 있다"는
 * 사실만 담는다. 이 파일이 다루는 것은 그 앞 단계다 — 아직 큐레이션되지 않은 **후보 풀**이고,
 * 사람이 목록을 고를 때 볼 **근거 숫자**(가격·선행 배당률·5년 성장률)를 함께 싣는다.
 * 두 개념을 한 타입에 섞으면 "확정된 목록"과 "아직 검토 전 후보"를 화면이 구분할 수 없다.
 *
 * ## 🔴 여기 숫자는 전부 **기준일이 붙은 실측치**다
 * `measuredAt` 없이 숫자만 남기지 않는다. 가격·배당률은 매일 움직이므로 기준일이 없으면 "지금 값"으로
 * 읽히고, 그건 화면이 하는 거짓말 중 가장 흔한 형태다.
 *
 * ⚠ 종목별 **연속 증배 연수는 여전히 담지 않는다**(원리적으로 계산 불가 — 근거는
 * `dividendLists.types.ts` 머리말). 대신 어느 ETF 에서 왔는지로부터 **하한**만 싣는다.
 */

/**
 * 후보를 공급한 ETF. 각 ETF 가 추종하는 지수의 연속 증배 요건이 곧 그 종목의 연수 **하한**이다.
 *
 * | ETF | 지수 요건 | 하한 |
 * |---|---|---|
 * | NOBL | S&P 500 배당귀족 | 25년 |
 * | SDY  | S&P High Yield Dividend Aristocrats | 20년 |
 * | REGL | S&P MidCap 400 배당귀족 | 15년 |
 * | SMDV | Russell 2000 배당증가 | 10년 |
 */
export const DIVIDEND_UNIVERSE_SOURCE_ETFS = ['NOBL', 'SDY', 'REGL', 'SMDV'] as const;
export type DividendUniverseSourceEtf = (typeof DIVIDEND_UNIVERSE_SOURCE_ETFS)[number];

/** ETF → 연속 증배 연수 하한. 🔴 교차검증 가드가 이 값과 실측 배당이력의 모순을 잡는다. */
export const DIVIDEND_UNIVERSE_STREAK_FLOOR: Record<DividendUniverseSourceEtf, number> = {
  NOBL: 25,
  SDY: 20,
  REGL: 15,
  SMDV: 10
};

/** 야후 chart 한 번에서 뽑은 실측 지표. 하나라도 신뢰할 수 없으면 이 객체 전체가 `null` 이 된다. */
export type DividendUniverseMetrics = {
  /** 정규장 가격. */
  price: number;
  currency: string | null;
  /** 최신 1회 지급액. */
  latestDividend: number;
  /** 최신 지급의 UTC 날짜(`YYYY-MM-DD`). */
  latestDividendDate: string;
  /** 연 지급횟수(최근 완결 연도들의 최빈값). */
  paymentsPerYear: number;
  /** 선행 연 배당 = `latestDividend × paymentsPerYear`. */
  forwardAnnualDividend: number;
  /**
   * 🔴 **선행** 배당률(%) = `forwardAnnualDividend ÷ price`.
   * 독립 소스 26종 대조에서 평균오차 0.014pp(25/26이 0.1pp 이내)로 가장 정확했던 방식이다.
   * "최근 365일 배당합"(평균 0.053pp)이나 "작년+올해 누적"(평균 1.466pp, 최대 +3.442pp)으로 바꾸지 마라.
   */
  forwardYieldPercent: number;
  /**
   * 최근 5년 배당 연평균 성장률(%). 완결 6개 연도가 없으면 `null` — 화면은 "—"로 그린다.
   *
   * 🔴 비교 대상은 연간 **합계**가 아니라 그 해의 **규칙 배당**이다. 합계로 계산하면 특별배당
   * 한 건이 5년 CAGR 전체를 뒤집는다 — 262종 실측에서 12종이 마이너스 성장으로 잘못 나왔고
   * 그중 COST 는 −16.88%(실제 규칙 배당 성장 +13.18%)였다. 근거는
   * `scripts/dividendLists/sources/yahooQuoteMetrics.ts` 의 `fiveYearDividendGrowthPercent` 주석.
   */
  fiveYearGrowthPercent: number | null;
  /** 최근 구간에서 감지한 배당 삭감. 없으면 `null`. */
  recentCut: DividendUniverseRateCut | null;
  /** 야후 이력상 첫 배당 연도. 이력이 어디서 잘렸는지 사람이 볼 근거. */
  firstDividendYear: number;
  /** 이 지표를 실제로 받은 날짜(ISO). */
  measuredAt: string;
};

/**
 * 삭감 신고 한 건. 🔴 비교 대상은 연간 **합계**가 아니라 그 해의 **규칙 배당 수준**(= 최소 지급액)이다.
 *
 * 합계로 비교하면 지급일이 연말·연초를 넘나든 해가 그대로 오탐이 된다 — 후보 25종 실측에서
 * 4종(ACN·APD·AMCR·ANDE)이 그렇게 잘못 신고됐고 넷 다 1회 지급액은 한 번도 줄지 않았다.
 * 근거와 다른 후보(중앙값)를 왜 버렸는지는
 * `scripts/dividendLists/sources/yahooQuoteMetrics.ts` 의 `toAnnualPaymentRates` 주석에 있다.
 */
export type DividendUniverseRateCut = {
  fromYear: number;
  toYear: number;
  /** `fromYear` 의 최소 1회 지급액. */
  fromRate: number;
  toRate: number;
};

export type DividendUniverseEntry = {
  ticker: string;
  name: string;
  /** 정규화된 섹터. 어느 소스에도 그 종목이 없으면 `null` — 지어내지 않고 비워 둔다. */
  sector: DividendListSectorId | null;
  /** 소스가 실제로 적어 준 섹터 문자열. 대응표가 틀렸을 때 되짚을 근거. */
  sourceSectorLabel: string | null;
  /** 이 종목을 담고 있는 ETF(중복 가능). 비어 있을 수 없다 — 그게 후보인 이유다. */
  sourceEtfs: DividendUniverseSourceEtf[];
  /** `sourceEtfs` 하한 중 **최댓값**. 예: NOBL+SDY 둘 다면 25년. */
  minimumStreakYears: number;
  /** 실측 지표. 교차검증에 걸린 종목은 `null`(반쯤 맞는 숫자를 싣지 않는다). */
  metrics: DividendUniverseMetrics | null;
};

/**
 * 수집기가 스스로를 검산해 남긴 줄. **판정자가 아니라 신고자**다 — 사람이 읽고 처리한다.
 *
 * `blocking: true` 인 종목은 `metrics` 가 비어 있다. 그 종목을 유니버스에서 빼지는 않는다:
 * "이 ETF 가 들고 있다"는 **편입 사실**은 여전히 참이고, 못 믿을 것은 우리가 계산한 숫자뿐이다.
 */
export type DividendUniverseIssue = {
  ticker: string;
  kind: DividendUniverseIssueKind;
  detail: string;
  blocking: boolean;
};

export type DividendUniverseIssueKind =
  /** 야후 조회 자체가 실패했다. */
  | 'fetchFailed'
  /** 현재가·배당이력·지급주기가 없어 지표를 못 만든다. */
  | 'metricsUnavailable'
  /** 최신 지급액이 이상치다(특별배당·지급주기 변경) — ② 방식 배당률이 크게 틀어진다. */
  | 'abnormalLatestPayment'
  /** 최신 지급이 너무 오래됐다(배당 중단 의심). */
  | 'staleDividend'
  /** 배당률이 비상식 범위(0% 이하 또는 20% 초과)다. */
  | 'implausibleYield'
  /** 🔴 편입 ETF 가 보장하는 연수 **하한과 모순**된다(예: NOBL 종목인데 최근 삭감). */
  | 'streakContradiction'
  /** 완결 6개 연도가 없어 5년 성장률을 못 냈다(화면은 "—"). */
  | 'growthUnavailable'
  /** 어느 섹터 소스에도 그 종목이 없다(사람이 채워야 한다). */
  | 'sectorMissing';

export type DividendUniverseSnapshot = {
  /** 수집을 돌린 날짜(ISO). */
  asOf: string;
  /** 후보를 공급한 소스 파일의 기준일. 우리가 돌린 날짜와 다를 수 있다(파일이 어제자일 수 있다). */
  sourceAsOf: { proShares: string | null; sdy: string | null };
  /** ETF 별 편입 종목 수. 파싱이 조용히 반쯤 깨지는 것을 이 숫자가 잡는다. */
  memberCountByEtf: Record<DividendUniverseSourceEtf, number>;
  entries: DividendUniverseEntry[];
  issues: DividendUniverseIssue[];
  /** 커버리지. "몇 종에서 무엇을 실제로 채웠는가"를 화면·리뷰가 말할 근거. */
  coverage: {
    total: number;
    withMetrics: number;
    withSector: number;
    withGrowth: number;
  };
};
