import type { YieldFormValues } from '@/shared/types';
import { defaultYieldFormValues, runSimulation, toSimulationInput } from '@/features/YieldArchitect/feature.utils';

const buildValues = (overrides: Partial<YieldFormValues> = {}): YieldFormValues => ({
  ...defaultYieldFormValues,
  ...overrides
});

describe('runSimulation calibration options', () => {
  it('reinvest on produces larger ending value than reinvest off in a stable monthly case', () => {
    const base = {
      dividendYield: 3.5,
      dividendGrowth: 0,
      priceGrowth: 0,
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
      priceGrowth: 5,
      reinvestDividends: true
    });

    const annualStep = runSimulation(toSimulationInput({ ...base, dpsGrowthMode: 'annualStep' }));
    const monthlySmooth = runSimulation(toSimulationInput({ ...base, dpsGrowthMode: 'monthlySmooth' }));

    expect(monthlySmooth.summary.finalAnnualDividend).not.toBe(annualStep.summary.finalAnnualDividend);
    expect(monthlySmooth.summary.finalAnnualDividend).toBeGreaterThan(annualStep.summary.finalAnnualDividend);
  });
});
