import type { Frequency, MonthlySnapshot, SimulationResult, YieldFormValues } from '@/shared/types';
import {
  addMonths,
  buildMonthContext,
  buildSummary,
  buildYearlyRow,
  clamp01,
  computeMonthlyPayout,
  defaultYieldFormValues,
  dpsAtMonth,
  findLastPayoutMonth,
  findTargetYear,
  getDaysInMonth,
  isPayoutMonth,
  paymentsPerYearMap,
  planReinvestment,
  priceAtMonth,
  runQuickEstimate,
  runSimulation,
  sumDividendPaid,
  toDerivedPriceGrowth,
  toMonthlyGrowthRate,
  toReinvestRatio,
  toSimulationInput,
  toStartDate,
  toTaxRate
} from '@/shared/lib/snowball';

const buildValues = (overrides: Partial<YieldFormValues> = {}): YieldFormValues => ({
  ...defaultYieldFormValues,
  investmentStartDate: '2026-01-15',
  ...overrides
});

const buildSnapshot = (overrides: Partial<MonthlySnapshot> = {}): MonthlySnapshot => ({
  monthIndex: 1,
  year: 2026,
  month: 1,
  shares: 0,
  price: 100,
  dividendPerShare: 0,
  dividendPaid: 0,
  contributionPaid: 0,
  taxPaid: 0,
  portfolioValue: 0,
  cumulativeDividend: 0,
  ...overrides
});

const buildYear = (overrides: Partial<SimulationResult> = {}): SimulationResult => ({
  year: 2026,
  totalContribution: 0,
  assetValue: 0,
  annualDividend: 0,
  cumulativeDividend: 0,
  monthlyDividend: 0,
  ...overrides
});

describe('isPayoutMonth', () => {
  // simulationMonth 는 달력월이 아니라 "투자 시작 후 N개월째"(1..12)다.
  const PAYOUT_TABLE: Array<{ frequency: Frequency; payoutMonths: number[] }> = [
    { frequency: 'monthly', payoutMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    { frequency: 'quarterly', payoutMonths: [3, 6, 9, 12] },
    { frequency: 'semiannual', payoutMonths: [6, 12] },
    { frequency: 'annual', payoutMonths: [12] }
  ];

  it.each(PAYOUT_TABLE)('$frequency pays exactly on months $payoutMonths', ({ frequency, payoutMonths }) => {
    const actual = Array.from({ length: 12 }, (_value, index) => index + 1).filter((simulationMonth) =>
      isPayoutMonth(frequency, simulationMonth)
    );

    expect(actual).toEqual(payoutMonths);
  });

  it('counts months since investment start, not calendar months', () => {
    // 3월에 시작한 semiannual 은 시작 후 6개월째(= 달력상 8월)에 지급한다.
    const values = buildValues({
      frequency: 'semiannual',
      investmentStartDate: '2026-03-15',
      durationYears: 1,
      dividendYield: 5,
      reinvestDividends: false
    });

    const payoutMonths = runSimulation(toSimulationInput(values))
      .monthly.filter((row) => row.dividendPaid > 0)
      .map((row) => row.month);

    expect(payoutMonths).toEqual([8, 2]);
  });
});

describe('paymentsPerYearMap', () => {
  it('maps each frequency to its payment count', () => {
    expect(paymentsPerYearMap).toEqual({ monthly: 12, quarterly: 4, semiannual: 2, annual: 1 });
  });
});

describe('rate conversions', () => {
  it('toMonthlyGrowthRate compounds back to the annual rate over 12 months', () => {
    const monthly = toMonthlyGrowthRate(0.12);

    expect(Math.pow(1 + monthly, 12) - 1).toBeCloseTo(0.12, 12);
    expect(toMonthlyGrowthRate(0)).toBe(0);
  });

  it.each([
    { taxRatePercent: undefined, expected: 0 },
    { taxRatePercent: 0, expected: 0 },
    { taxRatePercent: 15.4, expected: 0.154 }
  ])('toTaxRate($taxRatePercent) is $expected', ({ taxRatePercent, expected }) => {
    expect(toTaxRate(taxRatePercent)).toBeCloseTo(expected, 12);
  });

  it.each([
    { percent: 0, expected: 0 },
    { percent: 50, expected: 0.5 },
    { percent: 100, expected: 1 },
    { percent: -50, expected: 0 },
    { percent: 150, expected: 1 }
  ])('toReinvestRatio($percent) clamps to $expected', ({ percent, expected }) => {
    expect(toReinvestRatio(percent)).toBe(expected);
  });

  it('clamp01 bounds values to [0, 1]', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0.25)).toBe(0.25);
    expect(clamp01(2)).toBe(1);
  });

  it('toDerivedPriceGrowth subtracts dividend yield from expected total return', () => {
    expect(toDerivedPriceGrowth({ expectedTotalReturnPercent: 8.5, dividendYieldPercent: 3.5 })).toBeCloseTo(0.05, 12);
  });

  it('toDerivedPriceGrowth floors at -99%', () => {
    expect(toDerivedPriceGrowth({ expectedTotalReturnPercent: -100, dividendYieldPercent: 100 })).toBe(-0.99);
  });
});

describe('priceAtMonth', () => {
  it('returns the initial price at month zero', () => {
    expect(priceAtMonth(100, 0.12, 0)).toBe(100);
  });

  it('applies the full annual growth after one year', () => {
    expect(priceAtMonth(100, 0.12, 1)).toBeCloseTo(112, 12);
  });

  it('grows continuously within a year', () => {
    expect(priceAtMonth(100, 0.12, 6 / 12)).toBeCloseTo(100 * Math.sqrt(1.12), 12);
  });
});

describe('dpsAtMonth', () => {
  const dps0 = 1000;
  const dividendGrowth = 0.1;

  it('monthlySmooth grows every month', () => {
    const month1 = dpsAtMonth({ dps0, dividendGrowth, mode: 'monthlySmooth', elapsedYearFraction: 1 / 12, completedYears: 0 });
    const month2 = dpsAtMonth({ dps0, dividendGrowth, mode: 'monthlySmooth', elapsedYearFraction: 2 / 12, completedYears: 0 });

    expect(month1).toBeGreaterThan(dps0);
    expect(month2).toBeGreaterThan(month1);
    expect(dpsAtMonth({ dps0, dividendGrowth, mode: 'monthlySmooth', elapsedYearFraction: 1, completedYears: 1 })).toBeCloseTo(1100, 9);
  });

  it('annualStep stays flat for 11 months and steps up on the 12th', () => {
    const dpsFor = (monthIndex: number) => {
      const context = buildMonthContext(new Date(2026, 0, 15), monthIndex);
      return dpsAtMonth({
        dps0,
        dividendGrowth,
        mode: 'annualStep',
        elapsedYearFraction: context.elapsedYearFraction,
        completedYears: context.completedYears
      });
    };

    for (let monthIndex = 1; monthIndex <= 11; monthIndex += 1) {
      expect(dpsFor(monthIndex)).toBe(dps0);
    }

    // 12개월째부터 계단 상승, 그리고 다음 계단(24개월째)까지 유지된다.
    expect(dpsFor(12)).toBeCloseTo(1100, 9);
    expect(dpsFor(23)).toBeCloseTo(1100, 9);
    expect(dpsFor(24)).toBeCloseTo(1210, 9);
  });

  it('annualStep and monthlySmooth agree exactly on whole-year boundaries', () => {
    const step = dpsAtMonth({ dps0, dividendGrowth, mode: 'annualStep', elapsedYearFraction: 1, completedYears: 1 });
    const smooth = dpsAtMonth({ dps0, dividendGrowth, mode: 'monthlySmooth', elapsedYearFraction: 1, completedYears: 1 });

    expect(step).toBe(smooth);
  });
});

describe('computeMonthlyPayout', () => {
  it('splits the annual DPS across the payments per year', () => {
    const payout = computeMonthlyPayout({ shares: 100, annualDps: 4000, paymentsPerYear: 4, taxRate: 0 });

    expect(payout.gross).toBeCloseTo(100_000, 9);
    expect(payout.tax).toBe(0);
    expect(payout.net).toBe(payout.gross);
  });

  it('withholds tax from the gross dividend', () => {
    const payout = computeMonthlyPayout({ shares: 100, annualDps: 4000, paymentsPerYear: 4, taxRate: 0.154 });

    expect(payout.gross).toBeCloseTo(100_000, 9);
    expect(payout.tax).toBeCloseTo(15_400, 9);
    expect(payout.net).toBeCloseTo(84_600, 9);
    expect(payout.gross - payout.tax).toBe(payout.net);
  });

  it('pays 12x more per payment for annual than for monthly at the same DPS', () => {
    const monthly = computeMonthlyPayout({ shares: 10, annualDps: 1200, paymentsPerYear: 12, taxRate: 0 });
    const annual = computeMonthlyPayout({ shares: 10, annualDps: 1200, paymentsPerYear: 1, taxRate: 0 });

    expect(monthly.gross).toBeCloseTo(1_000, 9);
    expect(annual.gross).toBeCloseTo(12_000, 9);
  });

  it('pays nothing when there are no shares', () => {
    expect(computeMonthlyPayout({ shares: 0, annualDps: 4000, paymentsPerYear: 4, taxRate: 0.154 })).toEqual({
      gross: 0,
      tax: 0,
      net: 0
    });
  });
});

describe('planReinvestment', () => {
  const base = { netDividend: 1000, price: 100, timing: 'sameMonth' as const, ratio: 1, enabled: true };

  it('does nothing when reinvestment is disabled', () => {
    expect(planReinvestment({ ...base, enabled: false })).toEqual({ sharesToBuyNow: 0, cashToCarry: 0 });
    expect(planReinvestment({ ...base, enabled: false, timing: 'nextMonth' })).toEqual({
      sharesToBuyNow: 0,
      cashToCarry: 0
    });
  });

  it('buys shares immediately with sameMonth timing', () => {
    expect(planReinvestment(base)).toEqual({ sharesToBuyNow: 10, cashToCarry: 0 });
  });

  it('carries cash forward with nextMonth timing', () => {
    expect(planReinvestment({ ...base, timing: 'nextMonth' })).toEqual({ sharesToBuyNow: 0, cashToCarry: 1000 });
  });

  it.each([
    { ratio: 0, sharesToBuyNow: 0 },
    { ratio: 0.5, sharesToBuyNow: 5 },
    { ratio: 1, sharesToBuyNow: 10 },
    { ratio: -0.5, sharesToBuyNow: 0 },
    { ratio: 1.5, sharesToBuyNow: 10 }
  ])('clamps ratio $ratio to buy $sharesToBuyNow shares', ({ ratio, sharesToBuyNow }) => {
    expect(planReinvestment({ ...base, ratio })).toEqual({ sharesToBuyNow, cashToCarry: 0 });
  });

  it('clamps out-of-range ratios for carried cash too', () => {
    expect(planReinvestment({ ...base, timing: 'nextMonth', ratio: 1.5 })).toEqual({
      sharesToBuyNow: 0,
      cashToCarry: 1000
    });
    expect(planReinvestment({ ...base, timing: 'nextMonth', ratio: -0.5 })).toEqual({
      sharesToBuyNow: 0,
      cashToCarry: 0
    });
  });
});

describe('reinvest percent clamping end to end', () => {
  const run = (reinvestDividendPercent: number) =>
    runSimulation(
      toSimulationInput(
        buildValues({
          frequency: 'monthly',
          reinvestDividends: true,
          reinvestDividendPercent,
          durationYears: 2
        })
      )
    ).summary.finalAssetValue;

  it('treats above-100% as 100% and negative as 0%', () => {
    expect(run(150)).toBe(run(100));
    expect(run(-50)).toBe(run(0));
    expect(run(100)).toBeGreaterThan(run(0));
    expect(run(50)).toBeGreaterThan(run(0));
    expect(run(50)).toBeLessThan(run(100));
  });
});

describe('calendar', () => {
  it('getDaysInMonth handles leap years', () => {
    expect(getDaysInMonth(2026, 0)).toBe(31);
    expect(getDaysInMonth(2026, 1)).toBe(28);
    expect(getDaysInMonth(2024, 1)).toBe(29);
  });

  it('addMonths clamps month-end dates instead of overflowing', () => {
    const jan31 = new Date(2026, 0, 31);

    expect(addMonths(jan31, 1)).toEqual(new Date(2026, 1, 28));
    expect(addMonths(new Date(2024, 0, 31), 1)).toEqual(new Date(2024, 1, 29));
  });

  it('addMonths anchors on the original day rather than compounding the clamp', () => {
    const jan31 = new Date(2026, 0, 31);

    // 1/31 → 2/28 로 클램프되지만, 2개월 뒤는 3/28 이 아니라 3/31 이다.
    expect(addMonths(jan31, 2)).toEqual(new Date(2026, 2, 31));
  });

  it('addMonths crosses year boundaries', () => {
    expect(addMonths(new Date(2026, 11, 15), 1)).toEqual(new Date(2027, 0, 15));
    expect(addMonths(new Date(2026, 0, 15), 0)).toEqual(new Date(2026, 0, 15));
    expect(addMonths(new Date(2026, 0, 15), 13)).toEqual(new Date(2027, 1, 15));
  });

  it('toStartDate parses a YYYY-MM-DD string in local time', () => {
    const date = toStartDate('2026-03-15');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(15);
  });

  it('toStartDate falls back to the current date on invalid input (known issue)', () => {
    // 문서화 목적: 파싱 실패 시 조용히 "오늘"로 폴백한다. 고치지 않고 현재 동작만 고정한다.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2030, 5, 7, 12, 0, 0));

    try {
      expect(toStartDate('not-a-date')).toEqual(new Date(2030, 5, 7, 12, 0, 0));
      expect(toStartDate('2026-02-31')).toEqual(new Date(2030, 5, 7, 12, 0, 0));
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('buildMonthContext', () => {
  const startDate = new Date(2026, 2, 15); // 2026-03-15

  it('describes the first simulation month', () => {
    expect(buildMonthContext(startDate, 1)).toEqual({
      monthIndex: 1,
      elapsedMonths: 0,
      elapsedYears: 0,
      simulationMonth: 1,
      simulationYearLabel: 2026,
      calendarYear: 2026,
      calendarMonth: 3,
      completedYears: 0,
      elapsedYearFraction: 1 / 12
    });
  });

  it('keeps the simulation month decoupled from the calendar month', () => {
    const twelfth = buildMonthContext(startDate, 12);

    expect(twelfth.simulationMonth).toBe(12);
    expect(twelfth.calendarMonth).toBe(2); // 시작 후 12개월째 = 달력상 다음 해 2월
    expect(twelfth.calendarYear).toBe(2027);
    expect(twelfth.simulationYearLabel).toBe(2026);
    expect(twelfth.completedYears).toBe(1);
    expect(twelfth.elapsedYearFraction).toBe(1);
  });

  it('rolls over to the next simulation year on month 13', () => {
    const thirteenth = buildMonthContext(startDate, 13);

    expect(thirteenth.simulationMonth).toBe(1);
    expect(thirteenth.simulationYearLabel).toBe(2027);
    expect(thirteenth.calendarMonth).toBe(3);
    expect(thirteenth.calendarYear).toBe(2027);
    expect(thirteenth.completedYears).toBe(1);
  });

  it('clamps month-end start dates', () => {
    const context = buildMonthContext(new Date(2026, 0, 31), 2);

    expect(context.calendarYear).toBe(2026);
    expect(context.calendarMonth).toBe(2);
  });
});

describe('summary builders', () => {
  it('sumDividendPaid adds up dividends', () => {
    expect(sumDividendPaid([buildSnapshot({ dividendPaid: 10 }), buildSnapshot({ dividendPaid: 5 })])).toBe(15);
    expect(sumDividendPaid([])).toBe(0);
  });

  it('findLastPayoutMonth ignores trailing zero-dividend months', () => {
    const monthly = [
      buildSnapshot({ monthIndex: 1, dividendPaid: 10 }),
      buildSnapshot({ monthIndex: 2, dividendPaid: 20 }),
      buildSnapshot({ monthIndex: 3, dividendPaid: 0 })
    ];

    expect(findLastPayoutMonth(monthly)?.monthIndex).toBe(2);
    expect(findLastPayoutMonth([buildSnapshot({ dividendPaid: 0 })])).toBeUndefined();
  });

  it('findLastPayoutMonth does not mutate its input', () => {
    const monthly = [buildSnapshot({ monthIndex: 1 }), buildSnapshot({ monthIndex: 2, dividendPaid: 5 })];

    findLastPayoutMonth(monthly);

    expect(monthly.map((row) => row.monthIndex)).toEqual([1, 2]);
  });

  it('findTargetYear returns the first year that reaches the target', () => {
    const yearly = [
      buildYear({ year: 2026, monthlyDividend: 100 }),
      buildYear({ year: 2027, monthlyDividend: 200 }),
      buildYear({ year: 2028, monthlyDividend: 300 })
    ];

    expect(findTargetYear(yearly, 200)).toBe(2027);
    expect(findTargetYear(yearly, 1000)).toBeUndefined();
    expect(findTargetYear([], 1)).toBeUndefined();
  });

  it('buildYearlyRow totals contributions and averages the trailing 12 months', () => {
    const recentMonths = Array.from({ length: 12 }, (_value, index) =>
      buildSnapshot({ monthIndex: index + 1, dividendPaid: 100 })
    );

    expect(
      buildYearlyRow({
        year: 2026,
        monthIndex: 12,
        initialInvestment: 1_000,
        monthlyContribution: 100,
        assetValue: 5_000,
        cumulativeDividend: 1_200,
        recentMonths
      })
    ).toEqual({
      year: 2026,
      totalContribution: 2_200,
      assetValue: 5_000,
      annualDividend: 1_200,
      cumulativeDividend: 1_200,
      monthlyDividend: 100
    });
  });

  it('buildSummary reads the final year and the last month that actually paid', () => {
    const monthly = [
      buildSnapshot({ monthIndex: 1, dividendPaid: 10 }),
      buildSnapshot({ monthIndex: 2, dividendPaid: 40 }),
      buildSnapshot({ monthIndex: 3, dividendPaid: 0 })
    ];
    const yearly = [
      buildYear({ year: 2026, monthlyDividend: 50, assetValue: 100, annualDividend: 600 }),
      buildYear({
        year: 2027,
        monthlyDividend: 150,
        assetValue: 300,
        annualDividend: 1_800,
        cumulativeDividend: 2_400,
        totalContribution: 900
      })
    ];

    expect(buildSummary({ monthly, yearly, totalTaxPaid: 77, targetMonthlyDividend: 100 })).toEqual({
      finalAssetValue: 300,
      finalAnnualDividend: 1_800,
      finalMonthlyDividend: 150,
      finalMonthlyAverageDividend: 150,
      finalPayoutMonthDividend: 40,
      totalContribution: 900,
      totalNetDividend: 2_400,
      totalTaxPaid: 77,
      targetMonthDividendReachedYear: 2027
    });
  });

  it('buildSummary returns zeros for an empty simulation', () => {
    expect(buildSummary({ monthly: [], yearly: [], totalTaxPaid: 0, targetMonthlyDividend: 1 })).toEqual({
      finalAssetValue: 0,
      finalAnnualDividend: 0,
      finalMonthlyDividend: 0,
      finalMonthlyAverageDividend: 0,
      finalPayoutMonthDividend: 0,
      totalContribution: 0,
      totalNetDividend: 0,
      totalTaxPaid: 0,
      targetMonthDividendReachedYear: undefined
    });
  });
});

describe('runQuickEstimate', () => {
  it('ignores every reinvestment setting (known model gap)', () => {
    // quickEstimate 는 재투자 설정을 전혀 반영하지 않는다. 월별 루프와 다른 모델이라는 사실을 고정한다.
    const off = runQuickEstimate(
      toSimulationInput(buildValues({ reinvestDividends: false, reinvestDividendPercent: 0, reinvestTiming: 'sameMonth' }))
    );
    const on = runQuickEstimate(
      toSimulationInput(buildValues({ reinvestDividends: true, reinvestDividendPercent: 100, reinvestTiming: 'nextMonth' }))
    );

    expect(on).toEqual(off);
  });

  it('ignores payout frequency and DPS growth mode', () => {
    const monthly = runQuickEstimate(toSimulationInput(buildValues({ frequency: 'monthly', dpsGrowthMode: 'monthlySmooth' })));
    const annual = runQuickEstimate(toSimulationInput(buildValues({ frequency: 'annual', dpsGrowthMode: 'annualStep' })));

    expect(annual).toEqual(monthly);
  });

  it('sums plain contributions when the net return is zero', () => {
    const estimate = runQuickEstimate(
      toSimulationInput(
        buildValues({
          dividendYield: 0,
          dividendGrowth: 0,
          expectedTotalReturn: 0,
          taxRate: 0,
          initialInvestment: 0,
          monthlyContribution: 100,
          durationYears: 2
        })
      )
    );

    expect(estimate.endValue).toBe(2_400);
    expect(estimate.annualDividendApprox).toBe(0);
    expect(estimate.monthlyDividendApprox).toBe(0);
    expect(estimate.yieldOnPriceAtEnd).toBe(0);
  });

  it('keeps monthlyDividendApprox as one twelfth of the annual approximation', () => {
    const estimate = runQuickEstimate(toSimulationInput(buildValues({ durationYears: 10 })));

    expect(estimate.monthlyDividendApprox).toBeCloseTo(estimate.annualDividendApprox / 12, 9);
  });
});
