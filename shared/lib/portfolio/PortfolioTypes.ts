import type { Frequency } from '@/shared/types';

/**
 * **Portfolio(현재 상태) 도메인의 입출력 타입.**
 *
 * 이 계층은 전부 **USD 기준**이다. 환율(원화 환산)은 표시 계층 소관이고, 이 폴더는 환율을 입력으로
 * 받지 않는다 — 저장은 통화 중립(수량만), 환산은 조회 시점에 표시 계층에서(PRD §6-④).
 * 배당수익률(#4)은 분자·분모에서 FX 가 소거되므로 정의상 환율과 무관하다.
 */

/** 보유 1행. "티커 + 수량"이 최소 입력이고, 나머지는 전부 계산으로 채운다. */
export type PortfolioHolding = {
  ticker: string;
  /** 주 수. 소수 `PORTFOLIO_QUANTITY_DECIMALS` 자리까지 유효. */
  quantity: number;
  /** 유니버스 밖 티커의 **수동 폴백**. 스냅샷·프리셋에 둘 다 없을 때만 쓰인다. */
  manual?: PortfolioManualMarketInput;
};

/** 수동 폴백 입력. 가격은 **USD** 다(유니버스가 전부 미국 상장이라 단위를 섞지 않는다). */
export type PortfolioManualMarketInput = {
  /** USD */
  price: number;
  /** 연 배당률 (%) */
  dividendYield: number;
};

/**
 * 이 행의 시장 데이터가 **어디서 왔는가**. 화면은 이 값을 그대로 사용자에게 알린다.
 *
 * - `snapshot`: 월간 크론 시세 스냅샷(`asOf` 있음) — 가장 신선하다.
 * - `preset`: 스냅샷에 아직 없는 유니버스 종목의 **큐레이션 값**(갱신일 없음, 낡았을 수 있다).
 * - `manual`: 사용자가 직접 넣은 값 — #6·#7 계산에서 빠진다.
 */
export type PortfolioDataFreshness = 'snapshot' | 'preset' | 'manual';

/** 지급월의 근거. `marketData` 스냅샷의 `payoutMonthsSource` 를 그대로 옮긴 것. */
export type PortfolioPayoutMonthsSource = 'pay' | 'ex' | 'none';

/**
 * 한 종목의 해석된 시장 정보(USD).
 *
 * `payoutMonths` 는 **있을 때만** 존재한다 — 없는 종목의 지급월을 `frequency` 로 지어내지 않는다
 * (`frequency` 는 "몇 번"만 알지 "언제"를 모른다).
 */
export type PortfolioMarketInfo = {
  /** USD */
  price: number;
  /** 연 배당률 (%) */
  dividendYield: number;
  frequency?: Frequency;
  /** 1-12 오름차순, 중복 없음. 비어 있으면 필드 자체가 없다. */
  payoutMonths?: number[];
  payoutMonthsSource?: PortfolioPayoutMonthsSource;
  /** 키 = 지급월('1'..'12'), 값 = 그 달의 예상 지급일(1-31). `payoutMonthsSource === 'pay'` 에만 존재. */
  estimatedPayDayByMonth?: Record<string, number>;
  freshness: PortfolioDataFreshness;
  /** 시세 기준일(YYYY-MM-DD). 스냅샷이 아닌 출처는 `null`. */
  asOf: string | null;
};

/** 시장 정보 해석기. 테스트·다른 유니버스 주입을 위해 계산 함수가 옵션으로 받는다. */
export type PortfolioMarketInfoResolver = (holding: PortfolioHolding) => PortfolioMarketInfo | null;

/**
 * 다음 배당 지급일(#7). **날짜를 지어내지 않는다** — 근거 등급이 3단이다.
 *
 * - `estimated-day`: 지급월 + 예상 일자(추정). 화면은 "N월 D일쯤(추정)".
 * - `month-only`: 지급월만 안다. 화면은 "N월 중(추정)".
 * - `none`: 지급월 정보가 없다(무배당·미갱신·수동 입력 종목).
 *
 * ⚠ `year` 는 **그 지급이 실제로 속한 달력 연도**다(추정이 아니라 탐색 결과 그 자체 —
 * `findNextPayout` 이 오늘의 로컬 연·월에서 몇 달 뒤인지로 정한다). `month` 만으로는 연도를
 * 복원할 수 없다: 연 1회 지급 종목의 3월 지급일이 지나면 다음 지급은 **내년 3월**이라
 * `month === 오늘 달` 이 "이번 달"과 "내년 같은 달" 두 뜻을 갖는다. 소비 측에서 `month` 만으로
 * 연도를 추론하거나 두 지급의 동일 여부를 판정하지 말 것(2026-08 과 2027-08 이 같아진다).
 */
export type PortfolioNextPayout =
  | { kind: 'estimated-day'; year: number; month: number; day: number }
  | { kind: 'month-only'; year: number; month: number }
  | { kind: 'none' };

/**
 * 합계에서 빠진 이유. **무음 제외 금지** — 화면이 이 사유를 표시한다.
 *
 * - `no-quantity`: 수량 미입력(0·빈값·NaN·Infinity·음수). 에러가 아니라 "아직 안 적었다".
 * - `no-market-data`: 티커를 유니버스에서 못 찾았고 수동 입력도 없다(또는 수동 값이 무효).
 * - `no-payout-months`: 값(#1~#5)에는 들어가지만 **지급월을 몰라** #6·#7에서만 빠진다.
 */
export type PortfolioExclusionReason = 'no-quantity' | 'no-market-data' | 'no-payout-months';

export type PortfolioExclusion = {
  ticker: string;
  reason: PortfolioExclusionReason;
  /**
   * 이 제외 때문에 **#6(이번 달)의 12개월 합에서 빠지는** 연배당(USD).
   * `no-payout-months` 만 0 이 아닐 수 있다(수량·시장데이터가 없으면 애초에 금액을 모른다).
   */
  annualDividendUsd: number;
};

/** 보유별 계산 결과 1행. */
export type PortfolioHoldingBreakdown = {
  /** 대문자·트림된 심볼. */
  ticker: string;
  /** 정규화된 수량(미입력이면 0). */
  quantity: number;
  /** 해석된 시장 정보. `no-market-data` 면 `null`. */
  market: PortfolioMarketInfo | null;
  /** #1 자산 가치 */
  valueUsd: number;
  /** #2 연배당(세전) */
  annualDividendUsd: number;
  /** #5 연배당(세후) */
  annualDividendAfterTaxUsd: number;
  /** #6 이번 달 예상 배당(세전). 지급월이 아니거나 제외된 행은 0. */
  thisMonthDividendUsd: number;
  /** #7 다음 지급일. 수량과 무관하게 시장 정보만으로 정한다. */
  nextPayout: PortfolioNextPayout;
  /** #1~#5 합계에 들어갔는가. */
  includedInTotals: boolean;
  /** #6 합계에 들어갔는가(= 지급월을 아는가). */
  includedInSchedule: boolean;
  /** 제외 사유. 없으면 `null`. */
  exclusion: PortfolioExclusionReason | null;
};

export type PortfolioSummaryCounts = {
  /** 입력된 보유 행 수. */
  total: number;
  /** #1~#5 에 반영된 행 수. */
  included: number;
  /** #6·#7 에 반영된 행 수(지급월을 아는 행). */
  scheduled: number;
};

/** §4 의 7개 지표 — 전부 USD. */
export type PortfolioSummary = {
  /** #1 현재 자산 가치 */
  totalValueUsd: number;
  /** #2 연배당(세전) */
  annualDividendUsd: number;
  /** #3 월배당(세전) = #2 ÷ 12 (**평균**이지 "매달 이만큼"이 아니다 — 실입금은 #6) */
  monthlyDividendUsd: number;
  /** #4 가중평균 배당률(%). 자산가치 0 이면 0. */
  weightedYieldPercent: number;
  /** #5 연배당(세후) */
  annualDividendAfterTaxUsd: number;
  /** #5 월배당(세후) = 세후 연배당 ÷ 12 */
  monthlyDividendAfterTaxUsd: number;
  /** #6 이번 달 예상 배당(세전) */
  thisMonthDividendUsd: number;
  /** #6 이 기준으로 삼은 달(주입된 `today` 의 로컬 연·월). */
  thisMonth: { year: number; month: number };
  /**
   * #6 의 12개월 합과 일치하는 연배당(= 지급월을 아는 행들의 #2 부분합).
   * `annualDividendUsd` 와의 차이가 곧 `exclusions` 의 `annualDividendUsd` 합이다.
   */
  scheduledAnnualDividendUsd: number;
  /** 적용된 세율(%). 정규화 후 값. */
  taxRatePercent: number;
  /** 시세 기준일 — 스냅샷 행이 하나라도 있을 때만 값이 있다. */
  asOf: string | null;
  holdings: PortfolioHoldingBreakdown[];
  exclusions: PortfolioExclusion[];
  counts: PortfolioSummaryCounts;
};
