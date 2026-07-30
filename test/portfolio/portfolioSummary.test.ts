// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import {
  computeMeasuredMonthlyDividend,
  computePortfolioSummary,
  DEFAULT_PORTFOLIO_TAX_RATE_PERCENT,
  normalizePortfolioQuantity,
  type PortfolioHolding
} from '@/shared/lib/portfolio';
import {
  FIXTURE_MONTHLY,
  FIXTURE_NO_SCHEDULE,
  FIXTURE_ODD_QUARTERLY,
  FIXTURE_QUARTERLY,
  fixtureResolver,
  localDate,
  scaledFixtureResolver
} from './portfolioFixtures';

/**
 * Portfolio 요약 계산(#1~#6) — PRD §4 의 식과 불변식을 봉인한다.
 *
 * ⚠ 부동소수 결합순서: 같은 값을 "월별 합산"과 "연 합산" 두 경로로 구하면 상대 ~1e-16 차이가 난다.
 * 불변식 단정은 전부 `toBeCloseTo` 계열을 쓴다(pitfalls [2026-07-27][engine]).
 */

const TODAY = localDate(2026, 7, 15);

const dps = (price: number, dividendYield: number): number => (price * dividendYield) / 100;

const summaryOf = (holdings: PortfolioHolding[], today: Date = TODAY, taxRatePercent?: number) =>
  computePortfolioSummary(holdings, { today, taxRatePercent, resolve: fixtureResolver });

/** 매월·분기(짝수달)·분기(홀수달)·지급월미상·수동입력이 섞인 현실적인 조합. */
const MIXED_HOLDINGS: PortfolioHolding[] = [
  { ticker: 'MONTHLY', quantity: 12.3456 },
  { ticker: 'QUARTERLY', quantity: 120 },
  { ticker: 'ODDQ', quantity: 3.5 },
  { ticker: 'NOSCHED', quantity: 10 },
  { ticker: 'ZZZZ', quantity: 5, manual: { price: 88.8, dividendYield: 4.5 } }
];

describe('computePortfolioSummary — #1~#5 기본 정의', () => {
  it('#1 자산가치 = Σ 수량 × 가격, #2 연배당 = Σ 수량 × DPS', () => {
    const summary = summaryOf([
      { ticker: 'MONTHLY', quantity: 10 },
      { ticker: 'QUARTERLY', quantity: 100 }
    ]);

    expect(summary.totalValueUsd).toBeCloseTo(10 * 55.13 + 100 * 33.29, 10);
    expect(summary.annualDividendUsd).toBeCloseTo(10 * dps(55.13, 7.24) + 100 * dps(33.29, 3.15), 10);
  });

  it('#3 월배당(세전)은 연배당 ÷ 12 (평균 정의)', () => {
    const summary = summaryOf([{ ticker: 'QUARTERLY', quantity: 120 }]);

    expect(summary.monthlyDividendUsd).toBe(summary.annualDividendUsd / 12);
  });

  it('#4 배당수익률 = 연배당 ÷ 자산가치 × 100 (가중평균)', () => {
    const summary = summaryOf(MIXED_HOLDINGS);

    expect(summary.weightedYieldPercent).toBeCloseTo((summary.annualDividendUsd / summary.totalValueUsd) * 100, 10);
  });

  it('#4 는 가격 단위(환율)를 바꿔도 그대로다 — 분자·분모에서 FX 가 소거된다', () => {
    const usd = summaryOf(MIXED_HOLDINGS);
    const asIfKrw = computePortfolioSummary(MIXED_HOLDINGS, {
      today: TODAY,
      resolve: scaledFixtureResolver(1_300)
    });

    expect(asIfKrw.totalValueUsd).toBeCloseTo(usd.totalValueUsd * 1_300, 6);
    expect(asIfKrw.annualDividendUsd).toBeCloseTo(usd.annualDividendUsd * 1_300, 6);
    expect(asIfKrw.weightedYieldPercent).toBeCloseTo(usd.weightedYieldPercent, 10);
  });

  it('보유가 없으면 모든 지표가 0 이고 수익률은 NaN 이 아니다 (0 나눗셈 방지)', () => {
    const summary = summaryOf([]);

    expect(summary.totalValueUsd).toBe(0);
    expect(summary.annualDividendUsd).toBe(0);
    expect(summary.monthlyDividendUsd).toBe(0);
    expect(summary.weightedYieldPercent).toBe(0);
    expect(summary.thisMonthDividendUsd).toBe(0);
    expect(summary.counts).toEqual({ total: 0, included: 0, scheduled: 0 });
  });
});

describe('세후(#5) — 세전 × (1 − t/100)', () => {
  it('세율 미지정이면 시뮬레이터와 같은 기본 15.4% 를 쓴다', () => {
    const summary = summaryOf(MIXED_HOLDINGS);

    expect(DEFAULT_PORTFOLIO_TAX_RATE_PERCENT).toBe(15.4);
    expect(summary.taxRatePercent).toBe(15.4);
    expect(summary.annualDividendAfterTaxUsd).toBeCloseTo(summary.annualDividendUsd * (1 - 15.4 / 100), 10);
    expect(summary.monthlyDividendAfterTaxUsd).toBeCloseTo(summary.annualDividendAfterTaxUsd / 12, 10);
  });

  it('커스텀 세율이 그대로 반영된다', () => {
    const summary = summaryOf(MIXED_HOLDINGS, TODAY, 22);

    expect(summary.taxRatePercent).toBe(22);
    expect(summary.annualDividendAfterTaxUsd).toBeCloseTo(summary.annualDividendUsd * 0.78, 10);
  });

  it('무효·범위 밖 세율은 기본값·0..100 으로 정규화된다', () => {
    expect(summaryOf([], TODAY, Number.NaN).taxRatePercent).toBe(15.4);
    expect(summaryOf([], TODAY, -5).taxRatePercent).toBe(0);
    expect(summaryOf([], TODAY, 150).taxRatePercent).toBe(100);
    expect(summaryOf([], TODAY, 0).taxRatePercent).toBe(0);
  });

  it('행별 세후 배당도 같은 세율로 계산된다', () => {
    const summary = summaryOf([{ ticker: 'QUARTERLY', quantity: 120 }], TODAY, 15.4);
    const [row] = summary.holdings;

    expect(row.annualDividendAfterTaxUsd).toBeCloseTo(row.annualDividendUsd * (1 - 0.154), 10);
  });
});

describe('#6 이번 달 예상 배당 — 연배당을 지급월에 균등 분배', () => {
  it('이번 달이 지급월인 종목만 더한다 (분기 종목의 비지급월은 0)', () => {
    // 7월: MONTHLY 만 지급(QUARTERLY=3/6/9/12, ODDQ=2/5/8/11).
    const july = summaryOf(MIXED_HOLDINGS, localDate(2026, 7, 15));
    expect(july.thisMonth).toEqual({ year: 2026, month: 7 });
    expect(july.thisMonthDividendUsd).toBeCloseTo((12.3456 * dps(55.13, 7.24)) / 12, 10);

    // 8월: MONTHLY + ODDQ.
    const august = summaryOf(MIXED_HOLDINGS, localDate(2026, 8, 1));
    expect(august.thisMonthDividendUsd).toBeCloseTo(
      (12.3456 * dps(55.13, 7.24)) / 12 + (3.5 * dps(128.4, 2.06)) / 4,
      10
    );

    // 9월: MONTHLY + QUARTERLY.
    const september = summaryOf(MIXED_HOLDINGS, localDate(2026, 9, 30));
    expect(september.thisMonthDividendUsd).toBeCloseTo(
      (12.3456 * dps(55.13, 7.24)) / 12 + (120 * dps(33.29, 3.15)) / 4,
      10
    );
  });

  it('월배당(#3)과 이번 달 예상 배당(#6)은 다른 값이다 — 분기 종목만 있으면 0 인 달이 있다', () => {
    const holdings: PortfolioHolding[] = [{ ticker: 'QUARTERLY', quantity: 120 }];

    expect(summaryOf(holdings, localDate(2026, 7, 15)).monthlyDividendUsd).toBeGreaterThan(0);
    expect(summaryOf(holdings, localDate(2026, 7, 15)).thisMonthDividendUsd).toBe(0);
    expect(summaryOf(holdings, localDate(2026, 9, 15)).thisMonthDividendUsd).toBeGreaterThan(0);
  });

  it('불변식: 12개월치 #6 의 합 = 지급월을 아는 종목들의 연배당 부분합', () => {
    const reference = summaryOf(MIXED_HOLDINGS);

    let twelveMonthSum = 0;
    for (let month = 1; month <= 12; month += 1) {
      twelveMonthSum += summaryOf(MIXED_HOLDINGS, localDate(2026, month, 15)).thisMonthDividendUsd;
    }

    expect(twelveMonthSum).toBeCloseTo(reference.scheduledAnnualDividendUsd, 10);

    // 전체 #2 와는 "제외된 종목의 연배당"만큼 차이가 난다 — 그 차이가 사유와 함께 반환된다.
    const excludedAnnual = reference.exclusions.reduce((sum, exclusion) => sum + exclusion.annualDividendUsd, 0);
    expect(excludedAnnual).toBeGreaterThan(0);
    expect(reference.annualDividendUsd - twelveMonthSum).toBeCloseTo(excludedAnnual, 10);
    expect(reference.annualDividendUsd).toBeGreaterThan(reference.scheduledAnnualDividendUsd);
  });

  it('지급월이 12개 미만인 종목도 12개월 합이 자기 연배당과 같다 (지급 주기 off-by-one 방지)', () => {
    const cases: { ticker: string; quantity: number; annual: number }[] = [
      { ticker: 'MONTHLY', quantity: 7.25, annual: 7.25 * dps(FIXTURE_MONTHLY.price, FIXTURE_MONTHLY.dividendYield) },
      {
        ticker: 'QUARTERLY',
        quantity: 31,
        annual: 31 * dps(FIXTURE_QUARTERLY.price, FIXTURE_QUARTERLY.dividendYield)
      },
      {
        ticker: 'ODDQ',
        quantity: 2.5,
        annual: 2.5 * dps(FIXTURE_ODD_QUARTERLY.price, FIXTURE_ODD_QUARTERLY.dividendYield)
      }
    ];

    cases.forEach(({ ticker, quantity, annual }) => {
      const holdings: PortfolioHolding[] = [{ ticker, quantity }];
      let sum = 0;
      for (let month = 1; month <= 12; month += 1) {
        sum += summaryOf(holdings, localDate(2027, month, 10)).thisMonthDividendUsd;
      }

      expect(sum).toBeCloseTo(annual, 10);
    });
  });
});

describe('제외 사유 — 무음 제외 금지', () => {
  it('수량 0·음수·NaN·Infinity 는 에러가 아니라 "미입력"으로 빠진다', () => {
    const holdings: PortfolioHolding[] = [
      { ticker: 'MONTHLY', quantity: 0 },
      { ticker: 'QUARTERLY', quantity: -5 },
      { ticker: 'ODDQ', quantity: Number.NaN },
      { ticker: 'NOSCHED', quantity: Number.POSITIVE_INFINITY }
    ];
    const summary = summaryOf(holdings);

    expect(summary.totalValueUsd).toBe(0);
    expect(summary.annualDividendUsd).toBe(0);
    expect(summary.counts).toEqual({ total: 4, included: 0, scheduled: 0 });
    expect(summary.exclusions.map((exclusion) => exclusion.reason)).toEqual([
      'no-quantity',
      'no-quantity',
      'no-quantity',
      'no-quantity'
    ]);
    // 수량이 없어도 시장 정보는 그대로 들고 있다(화면이 가격·배당률을 계속 보여줄 수 있게).
    expect(summary.holdings[0].market?.price).toBe(55.13);
    expect(summary.holdings[0].includedInTotals).toBe(false);
  });

  it('유니버스에도 없고 수동 입력도 없으면 no-market-data — 수량이 없어도 이쪽이 먼저 보고된다', () => {
    const summary = summaryOf([
      { ticker: 'UNKNOWN', quantity: 10 },
      { ticker: 'UNKNOWN2', quantity: 0 }
    ]);

    expect(summary.exclusions.map((exclusion) => exclusion.reason)).toEqual(['no-market-data', 'no-market-data']);
    expect(summary.holdings[0].market).toBeNull();
    // 사용자가 적은 수량은 데이터 해석 실패와 무관하게 그대로 남는다.
    expect(summary.holdings[0].quantity).toBe(10);
    expect(summary.counts.included).toBe(0);
  });

  it('지급월을 모르는 종목·수동 입력 종목은 #1~#5 에는 들어가고 #6·#7 에서만 빠진다', () => {
    const summary = summaryOf([
      { ticker: 'NOSCHED', quantity: 10 },
      { ticker: 'ZZZZ', quantity: 5, manual: { price: 88.8, dividendYield: 4.5 } }
    ]);

    expect(summary.totalValueUsd).toBeCloseTo(10 * 212.77 + 5 * 88.8, 10);
    expect(summary.annualDividendUsd).toBeGreaterThan(0);
    expect(summary.scheduledAnnualDividendUsd).toBe(0);
    expect(summary.thisMonthDividendUsd).toBe(0);
    expect(summary.counts).toEqual({ total: 2, included: 2, scheduled: 0 });

    expect(summary.exclusions).toEqual([
      {
        ticker: 'NOSCHED',
        reason: 'no-payout-months',
        annualDividendUsd: 10 * dps(FIXTURE_NO_SCHEDULE.price, FIXTURE_NO_SCHEDULE.dividendYield)
      },
      { ticker: 'ZZZZ', reason: 'no-payout-months', annualDividendUsd: 5 * dps(88.8, 4.5) }
    ]);
    expect(summary.holdings.map((row) => row.market?.freshness)).toEqual(['preset', 'manual']);
  });

  it('무배당(배당률 0) 종목은 자산가치에만 들어간다', () => {
    const summary = summaryOf([{ ticker: 'ZEROYIELD', quantity: 3 }]);

    expect(summary.totalValueUsd).toBeCloseTo(3 * 173.99, 10);
    expect(summary.annualDividendUsd).toBe(0);
    expect(summary.weightedYieldPercent).toBe(0);
    expect(summary.exclusions).toEqual([{ ticker: 'ZEROYIELD', reason: 'no-payout-months', annualDividendUsd: 0 }]);
  });

  it('행 순서는 입력 순서를 그대로 지킨다 (화면 행과 계산 행이 어긋나지 않게)', () => {
    const summary = summaryOf(MIXED_HOLDINGS);

    expect(summary.holdings.map((row) => row.ticker)).toEqual(['MONTHLY', 'QUARTERLY', 'ODDQ', 'NOSCHED', 'ZZZZ']);
  });
});

describe('수량 정규화 — 소수 4자리', () => {
  it('소수 4자리는 그대로 살고, 5자리부터는 반올림된다', () => {
    expect(normalizePortfolioQuantity(0.0001)).toBe(0.0001);
    expect(normalizePortfolioQuantity(1.23456)).toBe(1.2346);
    expect(normalizePortfolioQuantity(120)).toBe(120);
  });

  it('0·음수·NaN·Infinity·반올림하면 0 이 되는 값은 "미입력"(null)', () => {
    expect(normalizePortfolioQuantity(0)).toBeNull();
    expect(normalizePortfolioQuantity(-1)).toBeNull();
    expect(normalizePortfolioQuantity(Number.NaN)).toBeNull();
    expect(normalizePortfolioQuantity(Number.POSITIVE_INFINITY)).toBeNull();
    expect(normalizePortfolioQuantity(Number.NEGATIVE_INFINITY)).toBeNull();
    expect(normalizePortfolioQuantity(1e-9)).toBeNull();
  });

  it('합계는 반올림된 수량을 쓴다 (화면 수량과 합계 근거가 같아야 한다)', () => {
    const summary = summaryOf([{ ticker: 'QUARTERLY', quantity: 1.23456 }]);

    expect(summary.holdings[0].quantity).toBe(1.2346);
    expect(summary.totalValueUsd).toBeCloseTo(1.2346 * 33.29, 10);
  });

  it('티커는 트림·대문자로 정규화된다', () => {
    const summary = summaryOf([{ ticker: '  quarterly  ', quantity: 10 }]);

    expect(summary.holdings[0].ticker).toBe('QUARTERLY');
    expect(summary.holdings[0].includedInTotals).toBe(true);
  });
});

describe('computeMeasuredMonthlyDividend — Goal 실측 교체용 공유 계층', () => {
  it('요약의 세후 월배당과 정확히 같은 값이다 (합산 경로가 하나)', () => {
    const summary = summaryOf(MIXED_HOLDINGS, TODAY, 15.4);

    expect(computeMeasuredMonthlyDividend(MIXED_HOLDINGS, 15.4, { resolve: fixtureResolver })).toBe(
      summary.monthlyDividendAfterTaxUsd
    );
  });

  it('세율을 생략하면 기본 15.4% 를 쓰고, 오늘 날짜에 의존하지 않는다', () => {
    const measured = computeMeasuredMonthlyDividend(MIXED_HOLDINGS, undefined, { resolve: fixtureResolver });
    const january = summaryOf(MIXED_HOLDINGS, localDate(2026, 1, 1));
    const december = summaryOf(MIXED_HOLDINGS, localDate(2026, 12, 31));

    expect(measured).toBe(january.monthlyDividendAfterTaxUsd);
    expect(measured).toBe(december.monthlyDividendAfterTaxUsd);
  });

  it('보유가 없으면 0 이다', () => {
    expect(computeMeasuredMonthlyDividend([], 15.4, { resolve: fixtureResolver })).toBe(0);
  });
});
