import type { PortfolioMarketInfo, PortfolioMarketInfoResolver } from '@/shared/lib/portfolio';

/**
 * Portfolio 계산 테스트용 **결정적 픽스처**.
 *
 * 실제 스냅샷(`marketData.generated.json`)은 월간 크론으로 값이 바뀌므로 금액을 단정하는 테스트의
 * 근거로 쓸 수 없다 — 계산 규칙은 주입 픽스처로 고정하고, 실데이터는 별도 파일에서 *구조* 불변식만
 * 검증한다(`portfolioMarketInfo.test.ts`).
 *
 * 값은 일부러 딱 떨어지지 않게 잡았다(33.29 × 3.15% 등) — 반올림으로 우연히 맞는 단정을 피한다.
 */

/** 매월 지급 + 예상 지급일까지 아는 종목(가장 정보가 많은 등급). */
export const FIXTURE_MONTHLY: PortfolioMarketInfo = {
  price: 55.13,
  dividendYield: 7.24,
  frequency: 'monthly',
  payoutMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  payoutMonthsSource: 'pay',
  estimatedPayDayByMonth: {
    '1': 7,
    '2': 28,
    '3': 5,
    '4': 6,
    '5': 5,
    '6': 5,
    '7': 7,
    '8': 5,
    '9': 4,
    '10': 6,
    '11': 5,
    '12': 5
  },
  freshness: 'snapshot',
  asOf: '2026-07-25'
};

/** 분기 지급, 지급'월'만 아는 종목(배당락 추정 소스). */
export const FIXTURE_QUARTERLY: PortfolioMarketInfo = {
  price: 33.29,
  dividendYield: 3.15,
  frequency: 'quarterly',
  payoutMonths: [3, 6, 9, 12],
  payoutMonthsSource: 'ex',
  freshness: 'snapshot',
  asOf: '2026-07-25'
};

/** 지급월이 홀수 달에 몰린 분기 지급 종목 — 지급월 판정의 off-by-one 을 잡는다. */
export const FIXTURE_ODD_QUARTERLY: PortfolioMarketInfo = {
  price: 128.4,
  dividendYield: 2.06,
  frequency: 'quarterly',
  payoutMonths: [2, 5, 8, 11],
  payoutMonthsSource: 'pay',
  estimatedPayDayByMonth: { '2': 28, '5': 31, '8': 14, '11': 14 },
  freshness: 'snapshot',
  asOf: '2026-07-25'
};

/** 배당은 주는데 **지급월을 모르는** 종목(스냅샷 밖 유니버스 종목 등) → #6·#7 제외 대상. */
export const FIXTURE_NO_SCHEDULE: PortfolioMarketInfo = {
  price: 212.77,
  dividendYield: 1.42,
  frequency: 'quarterly',
  freshness: 'preset',
  asOf: null
};

/** 무배당 종목(배당률 0). 값(#1)에는 들어가지만 배당은 0 이다. */
export const FIXTURE_ZERO_YIELD: PortfolioMarketInfo = {
  price: 173.99,
  dividendYield: 0,
  frequency: 'quarterly',
  payoutMonthsSource: 'none',
  freshness: 'snapshot',
  asOf: '2026-07-25'
};

export const FIXTURE_MARKET_BY_TICKER: Record<string, PortfolioMarketInfo> = {
  MONTHLY: FIXTURE_MONTHLY,
  QUARTERLY: FIXTURE_QUARTERLY,
  ODDQ: FIXTURE_ODD_QUARTERLY,
  NOSCHED: FIXTURE_NO_SCHEDULE,
  ZEROYIELD: FIXTURE_ZERO_YIELD
};

/**
 * 실제 유니버스 대신 위 픽스처를 쓰는 해석기. 픽스처에 없는 티커는 수동 입력이 있으면 수동으로,
 * 없으면 `null`(= `no-market-data`)로 떨어진다 — 프로덕션 해석기와 같은 3단 구조다.
 */
export const fixtureResolver: PortfolioMarketInfoResolver = (holding) => {
  const symbol = typeof holding.ticker === 'string' ? holding.ticker.trim().toUpperCase() : '';
  const found = FIXTURE_MARKET_BY_TICKER[symbol];
  if (found) return found;

  const manual = holding.manual;
  if (!manual || !Number.isFinite(manual.price) || manual.price <= 0) return null;

  return { price: manual.price, dividendYield: manual.dividendYield, freshness: 'manual', asOf: null };
};

/**
 * 가격만 배율로 키운 해석기 — "가격 단위(통화)를 바꿔도 배당수익률은 그대로"를 보이는 데 쓴다.
 * 배당률(%)은 단위가 없으므로 그대로 둔다.
 */
export const scaledFixtureResolver =
  (factor: number): PortfolioMarketInfoResolver =>
  (holding) => {
    const info = fixtureResolver(holding);

    return info ? { ...info, price: info.price * factor } : null;
  };

/** 로컬 시간대 기준 날짜(UTC 게터 금지 — KST 에서 하루 밀린다). */
export const localDate = (year: number, month: number, day: number): Date => new Date(year, month - 1, day);
