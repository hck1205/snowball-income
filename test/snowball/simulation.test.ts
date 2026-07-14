import type { YieldFormValues } from '@/shared/types';
import { computeCapitalGains, defaultYieldFormValues, runSimulation, toSimulationInput } from '@/shared/lib/snowball';
import { CAPITAL_GAINS_ANNUAL_DEDUCTION } from '@/shared/constants';
import { buildSimulation, buildSimulationBundle } from '@/pages/Main/utils/simulation';
import type { TickerProfile } from '@/shared/types/snowball';

const buildValues = (overrides: Partial<YieldFormValues> = {}): YieldFormValues => ({
  ...defaultYieldFormValues,
  ...overrides
});

describe('runSimulation calibration options', () => {
  it('reflects initial investment in total contribution and ending value', () => {
    const values = buildValues({
      initialInvestment: 12_000_000,
      monthlyContribution: 0,
      durationYears: 1,
      dividendYield: 0,
      dividendGrowth: 0,
      expectedTotalReturn: 0,
      taxRate: 0
    });

    const result = runSimulation(toSimulationInput(values));

    expect(result.summary.totalContribution).toBe(12_000_000);
    expect(result.summary.finalAssetValue).toBeCloseTo(12_000_000, 2);
    expect(result.quickEstimate.endValue).toBeCloseTo(12_000_000, 2);
  });

  it('applies the full investment duration to ending value growth', () => {
    // 정합 모델: 성장은 dividendGrowth 가 만든다 (priceGrowth === dividendGrowth).
    // 배당이 0인 종목이므로 총수익률 12% = 성장 12% 다.
    const values = buildValues({
      initialPrice: 100,
      dividendYield: 0,
      dividendGrowth: 12,
      expectedTotalReturn: 12,
      initialInvestment: 1_200,
      monthlyContribution: 0,
      durationYears: 1,
      taxRate: 0,
      investmentStartDate: '2026-01-01'
    });

    const result = runSimulation(toSimulationInput(values));

    expect(result.summary.finalAssetValue).toBeCloseTo(1_344, 6);
    expect(result.summary.finalAssetValue).toBeCloseTo(result.quickEstimate.endValue, 6);
  });

  it('matches quick estimate for contribution-only growth when dividends are zero', () => {
    const values = buildValues({
      initialPrice: 100,
      dividendYield: 0,
      dividendGrowth: 12,
      expectedTotalReturn: 12,
      initialInvestment: 0,
      monthlyContribution: 100,
      durationYears: 1,
      taxRate: 0,
      investmentStartDate: '2026-01-01'
    });

    const result = runSimulation(toSimulationInput(values));

    expect(result.summary.finalAssetValue).toBeCloseTo(result.quickEstimate.endValue, 6);
  });

  it('increases projected results when initial investment is larger', () => {
    const base = buildValues({
      monthlyContribution: 1_000_000,
      durationYears: 10,
      dividendYield: 3.5,
      dividendGrowth: 5,
      expectedTotalReturn: 7.5
    });

    const lowInitial = runSimulation(toSimulationInput({ ...base, initialInvestment: 0 }));
    const highInitial = runSimulation(toSimulationInput({ ...base, initialInvestment: 20_000_000 }));

    expect(highInitial.summary.totalContribution).toBeGreaterThan(lowInitial.summary.totalContribution);
    expect(highInitial.summary.finalAssetValue).toBeGreaterThan(lowInitial.summary.finalAssetValue);
    expect(highInitial.quickEstimate.endValue).toBeGreaterThan(lowInitial.quickEstimate.endValue);
  });

  it('reinvest on produces larger ending value than reinvest off in a stable monthly case', () => {
    const base = {
      dividendYield: 3.5,
      dividendGrowth: 0,
      expectedTotalReturn: 3.5,
      taxRate: 0,
      monthlyContribution: 1_000_000,
      durationYears: 1,
      frequency: 'monthly' as const
    };

    const off = runSimulation(toSimulationInput(buildValues({ ...base, reinvestDividends: false })));
    const on = runSimulation(toSimulationInput(buildValues({ ...base, reinvestDividends: true })));

    expect(on.summary.finalAssetValue).toBeGreaterThan(off.summary.finalAssetValue);
    expect(on.summary.totalNetDividend).toBeGreaterThanOrEqual(off.summary.totalNetDividend);
  });

  it('sameMonth reinvest timing is equal or higher than nextMonth timing', () => {
    const base = buildValues({
      reinvestDividends: true,
      frequency: 'monthly',
      durationYears: 10,
      taxRate: 15.4
    });

    const sameMonth = runSimulation(toSimulationInput({ ...base, reinvestTiming: 'sameMonth' }));
    const nextMonth = runSimulation(toSimulationInput({ ...base, reinvestTiming: 'nextMonth' }));

    expect(sameMonth.summary.finalAssetValue).toBeGreaterThanOrEqual(nextMonth.summary.finalAssetValue);
    expect(sameMonth.summary.totalNetDividend).toBeGreaterThanOrEqual(nextMonth.summary.totalNetDividend);
  });

  it('monthlySmooth DPS mode differs from annualStep and trends slightly higher with positive growth', () => {
    const base = buildValues({
      durationYears: 20,
      dividendGrowth: 6,
      expectedTotalReturn: 8.5,
      reinvestDividends: true
    });

    const annualStep = runSimulation(toSimulationInput({ ...base, dpsGrowthMode: 'annualStep' }));
    const monthlySmooth = runSimulation(toSimulationInput({ ...base, dpsGrowthMode: 'monthlySmooth' }));

    expect(monthlySmooth.summary.finalAnnualDividend).not.toBe(annualStep.summary.finalAnnualDividend);
    expect(monthlySmooth.summary.finalAnnualDividend).toBeGreaterThan(annualStep.summary.finalAnnualDividend);
  });

  it('applies initial investment in multi-ticker portfolio aggregation', () => {
    const values = buildValues({
      initialInvestment: 24_000_000,
      monthlyContribution: 1_000_000,
      durationYears: 1,
      dividendYield: 0,
      dividendGrowth: 0,
      expectedTotalReturn: 0,
      taxRate: 0
    });

    const includedProfiles: TickerProfile[] = [
      {
        id: 'a',
        ticker: 'AAA',
        name: '',
        initialPrice: 100_000,
        dividendYield: 0,
        dividendGrowth: 0,
        expectedTotalReturn: 0,
        frequency: 'quarterly'
      },
      {
        id: 'b',
        ticker: 'BBB',
        name: '',
        initialPrice: 100_000,
        dividendYield: 0,
        dividendGrowth: 0,
        expectedTotalReturn: 0,
        frequency: 'quarterly'
      }
    ];

    const simulation = buildSimulation({
      isValid: true,
      includedProfiles,
      normalizedAllocation: [
        { profile: includedProfiles[0], weight: 0.25 },
        { profile: includedProfiles[1], weight: 0.75 }
      ],
      values
    });

    expect(simulation).not.toBeNull();
    expect(simulation?.summary.totalContribution).toBe(36_000_000);
    expect(simulation?.summary.finalAssetValue).toBeCloseTo(36_000_000, 2);
    expect(simulation?.quickEstimate.endValue).toBeCloseTo(36_000_000, 2);
  });

  it('starts yearly x-axis labels from investment start year', () => {
    const values = buildValues({
      investmentStartDate: '2026-06-15',
      durationYears: 2
    });

    const result = runSimulation(toSimulationInput(values));

    expect(result.yearly[0]?.year).toBe(2026);
    expect(result.yearly[1]?.year).toBe(2027);
  });

  it('keeps price growth continuous across calendar year boundaries', () => {
    const values = buildValues({
      initialPrice: 100,
      dividendYield: 0,
      dividendGrowth: 12,
      expectedTotalReturn: 12,
      monthlyContribution: 0,
      initialInvestment: 1_200,
      taxRate: 0,
      investmentStartDate: '2026-02-19',
      durationYears: 2
    });

    const result = runSimulation(toSimulationInput(values));
    const december2026 = result.monthly.find((row) => row.year === 2026 && row.month === 12);
    const january2027 = result.monthly.find((row) => row.year === 2027 && row.month === 1);

    expect(december2026).toBeDefined();
    expect(january2027).toBeDefined();
    expect(january2027!.price).toBeGreaterThan(december2026!.price);
    expect(result.summary.finalAssetValue).toBeGreaterThan(1_300);
  });

  it('keeps monthly calendar labels sequential for month-end start dates', () => {
    const values = buildValues({
      initialPrice: 100,
      dividendYield: 0,
      dividendGrowth: 0,
      expectedTotalReturn: 0,
      initialInvestment: 0,
      monthlyContribution: 100,
      durationYears: 1,
      taxRate: 0,
      investmentStartDate: '2026-01-31'
    });

    const result = runSimulation(toSimulationInput(values));

    expect(result.monthly.slice(0, 4).map((row) => `${row.year}-${String(row.month).padStart(2, '0')}`)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04'
    ]);
  });

  it('투자 종료 후 projection 이 자산과 배당을 같은 비율로 굴린다 (배당 이중 계산 제거)', () => {
    // 예전에는 자산을 expectedTotalReturn 으로, 배당을 dividendGrowth 로 따로 굴렸다.
    // 배당을 인출하는 가정이므로 자산은 주가 성장률로만 자라야 하고, 정합 모델에서 그 값은 배당 성장률과 같다.
    const values = buildValues({
      initialInvestment: 10_000_000,
      monthlyContribution: 0,
      durationYears: 10,
      dividendYield: 3.34,
      dividendGrowth: 6.66,
      expectedTotalReturn: 10,
      frequency: 'quarterly',
      taxRate: 15.4
    });

    const profile: TickerProfile = {
      id: 'a',
      ticker: 'SCHD',
      name: '',
      initialPrice: 31.61,
      dividendYield: 3.34,
      dividendGrowth: 6.66,
      expectedTotalReturn: 10,
      frequency: 'quarterly'
    };

    const { postInvestmentDividendProjectionRows: rows } = buildSimulationBundle({
      isValid: true,
      includedProfiles: [profile],
      normalizedAllocation: [{ profile, weight: 1 }],
      values
    });

    expect(rows.length).toBeGreaterThan(1);

    for (let index = 1; index < rows.length; index += 1) {
      // 두 계열 모두 정확히 (1 + dividendGrowth) 배로 자란다.
      expect(rows[index].assetValue / rows[index - 1].assetValue).toBeCloseTo(1.0666, 9);
      expect(rows[index].annualDividend / rows[index - 1].annualDividend).toBeCloseTo(1.0666, 9);
      // 따라서 배당수익률(배당/자산)이 투자 종료 후에도 일정하게 유지된다.
      expect(rows[index].annualDividend / rows[index].assetValue).toBeCloseTo(
        rows[0].annualDividend / rows[0].assetValue,
        9
      );
    }
  });

  it('포트폴리오 합산 행이 오염되지 않는다 (shares * price === portfolioValue)', () => {
    // 예전에는 `...row` 스프레드 때문에 0번 티커의 price/dividendPerShare/shares 가 합산 행에 그대로
    // 새어 들어와 shares * price !== portfolioValue 였다. 지금은 가치가중 평균가로 채운다.
    const values = buildValues({
      initialInvestment: 10_000_000,
      monthlyContribution: 500_000,
      durationYears: 5,
      taxRate: 15.4,
      reinvestDividends: true,
      reinvestDividendPercent: 100
    });

    const includedProfiles: TickerProfile[] = [
      {
        id: 'a',
        ticker: 'SCHD',
        name: '',
        initialPrice: 31.61,
        dividendYield: 3.34,
        dividendGrowth: 6.66,
        expectedTotalReturn: 10,
        frequency: 'quarterly'
      },
      {
        id: 'b',
        ticker: 'QYLD',
        name: '',
        initialPrice: 18,
        dividendYield: 10,
        dividendGrowth: -3,
        expectedTotalReturn: 7,
        frequency: 'monthly'
      }
    ];

    const simulation = buildSimulation({
      isValid: true,
      includedProfiles,
      normalizedAllocation: [
        { profile: includedProfiles[0], weight: 0.6 },
        { profile: includedProfiles[1], weight: 0.4 }
      ],
      values
    });

    expect(simulation).not.toBeNull();
    for (const row of simulation!.monthly) {
      expect(row.shares * row.price).toBeCloseTo(row.portfolioValue, 6);
      expect(row.price).toBeGreaterThan(0);
      expect(row.dividendPerShare).toBeGreaterThan(0);
    }
  });

  it('weights portfolio quick-estimate yield by ending asset value', () => {
    const values = buildValues({
      initialInvestment: 1_000,
      monthlyContribution: 0,
      durationYears: 1,
      dividendYield: 0,
      dividendGrowth: 0,
      expectedTotalReturn: 0,
      taxRate: 0
    });

    const includedProfiles: TickerProfile[] = [
      {
        id: 'a',
        ticker: 'AAA',
        name: '',
        initialPrice: 100,
        dividendYield: 10,
        dividendGrowth: 0,
        expectedTotalReturn: 10,
        frequency: 'quarterly'
      },
      {
        id: 'b',
        ticker: 'BBB',
        name: '',
        initialPrice: 100,
        dividendYield: 0,
        dividendGrowth: 0,
        expectedTotalReturn: 0,
        frequency: 'quarterly'
      }
    ];

    const simulation = buildSimulation({
      isValid: true,
      includedProfiles,
      normalizedAllocation: [
        { profile: includedProfiles[0], weight: 0.75 },
        { profile: includedProfiles[1], weight: 0.25 }
      ],
      values
    });
    const childOutputs = includedProfiles.map((profile, index) =>
      runSimulation({
        ticker: profile,
        settings: {
          ...toSimulationInput(values).settings,
          initialInvestment: values.initialInvestment * [0.75, 0.25][index],
          monthlyContribution: 0
        }
      })
    );
    const weightedYield =
      childOutputs.reduce((sum, output) => sum + (output.quickEstimate.endValue * output.quickEstimate.yieldOnPriceAtEnd), 0) /
      childOutputs.reduce((sum, output) => sum + output.quickEstimate.endValue, 0);

    expect(simulation).not.toBeNull();
    expect(simulation?.quickEstimate.yieldOnPriceAtEnd).toBeCloseTo(weightedYield, 6);
    expect(simulation?.quickEstimate.yieldOnPriceAtEnd).not.toBeCloseTo(0.05, 6);
  });
});

describe('cost basis and capital gains', () => {
  it('counts only principal in the cost basis when dividends are not reinvested', () => {
    const values = buildValues({
      initialInvestment: 10_000_000,
      monthlyContribution: 1_000_000,
      durationYears: 1,
      reinvestDividends: false,
      dividendYield: 4,
      dividendGrowth: 0,
      expectedTotalReturn: 4,
      taxRate: 15.4
    });

    const { summary } = runSimulation(toSimulationInput(values));

    // 재투자를 안 했으므로 취득원가 === 납입원금.
    expect(summary.totalCostBasis).toBe(summary.totalContribution);
    expect(summary.totalCostBasis).toBe(10_000_000 + (1_000_000 * 12));
  });

  it('adds reinvested (after-tax) dividends to the cost basis', () => {
    const values = buildValues({
      initialInvestment: 10_000_000,
      monthlyContribution: 0,
      durationYears: 3,
      reinvestDividends: true,
      reinvestDividendPercent: 100,
      reinvestTiming: 'sameMonth',
      dividendYield: 5,
      dividendGrowth: 0,
      expectedTotalReturn: 5,
      taxRate: 15.4
    });

    const { summary } = runSimulation(toSimulationInput(values));

    // 100% 당월 재투자이므로 누적 순배당이 전부 주식이 된다 → 원가 = 원금 + 누적 순배당.
    expect(summary.totalCostBasis).toBeCloseTo(summary.totalContribution + summary.totalNetDividend, 6);
    expect(summary.totalCostBasis).toBeGreaterThan(summary.totalContribution);
  });

  it('excludes carried-over cash that never bought shares (nextMonth timing at the last month)', () => {
    // 마지막 달(12개월째)이 지급월인 annual 종목 + 익월 재투자 → 마지막 배당은 끝내 주식이 되지 못한다.
    // 그 현금은 평가금액에도 안 잡히므로 취득원가에도 들어가면 안 된다.
    const values = buildValues({
      initialInvestment: 10_000_000,
      monthlyContribution: 0,
      durationYears: 1,
      frequency: 'annual',
      reinvestDividends: true,
      reinvestDividendPercent: 100,
      reinvestTiming: 'nextMonth',
      dividendYield: 5,
      dividendGrowth: 0,
      expectedTotalReturn: 5,
      taxRate: 15.4
    });

    const { summary } = runSimulation(toSimulationInput(values));

    expect(summary.totalNetDividend).toBeGreaterThan(0);
    // 재투자가 한 번도 체결되지 않았으므로 원가는 원금 그대로다.
    expect(summary.totalCostBasis).toBe(summary.totalContribution);
    expect(summary.unrealizedGain).toBeCloseTo(summary.finalAssetValue - summary.totalCostBasis, 6);
  });

  it('reports a loss (and zero tax) when the asset value falls below the cost basis', () => {
    const values = buildValues({
      initialInvestment: 10_000_000,
      monthlyContribution: 0,
      durationYears: 5,
      dividendYield: 0,
      dividendGrowth: -10,
      expectedTotalReturn: -10,
      reinvestDividends: false
    });

    const { summary } = runSimulation(toSimulationInput(values));

    expect(summary.finalAssetValue).toBeLessThan(summary.totalCostBasis);
    expect(summary.unrealizedGain).toBeLessThan(0);
    expect(summary.estimatedCapitalGainsTax).toBe(0);
    expect(summary.afterCapitalGainsTaxValue).toBe(summary.finalAssetValue);
  });

  it('applies the annual deduction once per portfolio, not once per ticker', () => {
    const values = buildValues({
      initialInvestment: 20_000_000,
      monthlyContribution: 0,
      durationYears: 5,
      dividendYield: 0,
      dividendGrowth: 8,
      expectedTotalReturn: 8,
      reinvestDividends: false
    });

    const includedProfiles: TickerProfile[] = [
      {
        id: 'a',
        ticker: 'AAA',
        name: '',
        initialPrice: 100_000,
        dividendYield: 0,
        dividendGrowth: 8,
        expectedTotalReturn: 8,
        frequency: 'quarterly'
      },
      {
        id: 'b',
        ticker: 'BBB',
        name: '',
        initialPrice: 100_000,
        dividendYield: 0,
        dividendGrowth: 8,
        expectedTotalReturn: 8,
        frequency: 'quarterly'
      }
    ];

    const simulation = buildSimulation({
      isValid: true,
      includedProfiles,
      normalizedAllocation: [
        { profile: includedProfiles[0], weight: 0.5 },
        { profile: includedProfiles[1], weight: 0.5 }
      ],
      values
    });

    expect(simulation).not.toBeNull();
    const summary = simulation!.summary;

    // 합산 원가/평가금액으로 공제를 1회만 적용해야 한다.
    const expected = computeCapitalGains({
      finalAssetValue: summary.finalAssetValue,
      totalCostBasis: summary.totalCostBasis
    });
    expect(summary.estimatedCapitalGainsTax).toBeCloseTo(expected.estimatedCapitalGainsTax, 6);

    // 종목별로 각각 공제했다면 공제가 2번 들어가 세금이 더 적게 나온다 — 그 값이 아니어야 한다.
    const perTickerDeducted = computeCapitalGains({
      finalAssetValue: summary.finalAssetValue,
      totalCostBasis: summary.totalCostBasis,
      annualDeduction: CAPITAL_GAINS_ANNUAL_DEDUCTION * 2
    }).estimatedCapitalGainsTax;
    expect(summary.estimatedCapitalGainsTax).toBeGreaterThan(perTickerDeducted);
    expect(summary.totalCostBasis).toBeCloseTo(20_000_000, 6);
  });

  it('flags the year the pre-tax annual dividend crosses the financial-income threshold', () => {
    // 첫 해부터 세전 배당이 기준을 훌쩍 넘는 시나리오.
    const values = buildValues({
      initialInvestment: 1_000_000_000,
      monthlyContribution: 0,
      durationYears: 2,
      dividendYield: 5,
      dividendGrowth: 0,
      expectedTotalReturn: 5,
      reinvestDividends: false,
      taxRate: 15.4
    });

    const { summary } = runSimulation(toSimulationInput(values));

    expect(summary.financialIncomeThresholdYear).toBe(1);
  });

  it('does not flag scenarios that stay under the threshold', () => {
    const values = buildValues({
      initialInvestment: 10_000_000,
      monthlyContribution: 0,
      durationYears: 2,
      dividendYield: 3,
      dividendGrowth: 0,
      expectedTotalReturn: 3,
      reinvestDividends: false
    });

    const { summary } = runSimulation(toSimulationInput(values));

    expect(summary.financialIncomeThresholdYear).toBeUndefined();
  });
});
