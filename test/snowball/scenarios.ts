import type { YieldFormValues } from '@/shared/types';

/**
 * 특성화(characterization) 테스트용 시나리오.
 *
 * 주의: defaultYieldFormValues 는 investmentStartDate 를 모듈 로드 시각(new Date())으로 잡기 때문에
 * 결정적이지 않다. 여기서는 모든 필드를 명시해 시뮬레이션 결과를 완전히 결정적으로 만든다.
 */
const BASE: YieldFormValues = {
  ticker: 'TEST',
  initialPrice: 100_000,
  dividendYield: 3.5,
  dividendGrowth: 6,
  expectedTotalReturn: 8.5,
  frequency: 'quarterly',
  initialInvestment: 0,
  monthlyContribution: 1_000_000,
  targetMonthlyDividend: 2_000_000,
  investmentStartDate: '2026-03-15',
  durationYears: 3,
  reinvestDividends: false,
  reinvestDividendPercent: 100,
  taxRate: 15.4,
  reinvestTiming: 'sameMonth',
  dpsGrowthMode: 'monthlySmooth'
};

const withBase = (overrides: Partial<YieldFormValues>): YieldFormValues => ({ ...BASE, ...overrides });

export type SnowballScenario = {
  name: string;
  values: YieldFormValues;
};

export const SNOWBALL_SCENARIOS: SnowballScenario[] = [
  {
    name: 'monthly-reinvest-sameMonth-full-tax154',
    values: withBase({
      frequency: 'monthly',
      reinvestDividends: true,
      reinvestTiming: 'sameMonth',
      reinvestDividendPercent: 100,
      dpsGrowthMode: 'monthlySmooth',
      taxRate: 15.4,
      initialInvestment: 12_000_000,
      targetMonthlyDividend: 100_000,
      investmentStartDate: '2026-01-15'
    })
  },
  {
    name: 'quarterly-reinvest-nextMonth-half-annualStep',
    values: withBase({
      frequency: 'quarterly',
      reinvestDividends: true,
      reinvestTiming: 'nextMonth',
      reinvestDividendPercent: 50,
      dpsGrowthMode: 'annualStep',
      taxRate: 15.4
    })
  },
  {
    name: 'semiannual-no-reinvest-tax-undefined',
    values: withBase({
      frequency: 'semiannual',
      reinvestDividends: false,
      taxRate: undefined,
      durationYears: 2,
      investmentStartDate: '2026-03-15'
    })
  },
  {
    name: 'annual-reinvest-nextMonth-full-annualStep',
    values: withBase({
      frequency: 'annual',
      reinvestDividends: true,
      reinvestTiming: 'nextMonth',
      reinvestDividendPercent: 100,
      dpsGrowthMode: 'annualStep',
      taxRate: 22,
      initialInvestment: 50_000_000,
      monthlyContribution: 0
    })
  },
  {
    name: 'month-end-start-date-clamp',
    values: withBase({
      frequency: 'monthly',
      investmentStartDate: '2026-01-31',
      durationYears: 1,
      initialPrice: 100,
      monthlyContribution: 100,
      initialInvestment: 0
    })
  },
  {
    name: 'zero-yield-zero-growth',
    values: withBase({
      dividendYield: 0,
      dividendGrowth: 0,
      expectedTotalReturn: 0,
      taxRate: 0,
      durationYears: 2,
      initialInvestment: 1_000_000
    })
  },
  {
    name: 'negative-price-growth-clamped',
    values: withBase({
      dividendYield: 100,
      dividendGrowth: 0,
      expectedTotalReturn: -100,
      durationYears: 2,
      reinvestDividends: true
    })
  },
  {
    name: 'reinvest-percent-above-100-clamped',
    values: withBase({
      frequency: 'monthly',
      reinvestDividends: true,
      reinvestDividendPercent: 150,
      durationYears: 2
    })
  },
  {
    name: 'reinvest-percent-negative-clamped',
    values: withBase({
      frequency: 'monthly',
      reinvestDividends: true,
      reinvestDividendPercent: -50,
      durationYears: 2
    })
  }
];
