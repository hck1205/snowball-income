import type { YieldFormValues } from '@/shared/types';
import { defaultYieldFormValues, runSimulation, toSimulationInput } from '@/shared/lib/snowball';
import { buildSimulation } from '@/pages/Main/utils/simulation';
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
    const values = buildValues({
      initialPrice: 100,
      dividendYield: 0,
      dividendGrowth: 0,
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
      dividendGrowth: 0,
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
      dividendGrowth: 0,
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
