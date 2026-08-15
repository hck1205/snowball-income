import type { SimulationOutput, SimulationSummary } from '@/shared/types';

/**
 * 결과 카드 3형제(`ResultSummaryCard` / `SaleTaxCard` / `FinancialIncomeNotice`)가 공유하는 픽스처.
 *
 * 값은 실제 시나리오에서 뽑은 자릿수라 "포맷이 깨지면 눈에 띄는" 크기다. 세 카드가 각자 픽스처를
 * 복제하면 한 곳만 갱신돼 서로 다른 세계를 그리게 된다 — 그래서 한 곳에 둔다.
 */
export const buildSummary = (overrides: Partial<SimulationSummary> = {}): SimulationSummary => ({
  finalAssetValue: 1_137_786_866,
  finalAnnualDividend: 30_769_261,
  finalMonthlyAverageDividend: 2_564_105,
  finalPayoutMonthDividend: 8_000_000,
  finalRunRateMonthlyDividend: 2_700_000,
  isaSettlementTax: 0,
  totalContribution: 190_000_000,
  totalNetDividend: 290_712_891,
  totalTaxPaid: 52_919_368,
  targetMonthDividendReachedYear: 2050,
  totalCostBasis: 480_712_891,
  unrealizedGain: 657_073_975,
  estimatedCapitalGainsTax: 144_006_274,
  afterCapitalGainsTaxValue: 993_780_591,
  ...overrides
});

/** 목표 타일의 "투자 N년차" hint 는 `simulation.yearly` 의 **연도만** 읽는다. */
export const buildYearly = (years: number[]): SimulationOutput['yearly'] =>
  years.map((year) => ({ year }) as SimulationOutput['yearly'][number]);

export const buildSimulation = (
  summary: SimulationSummary,
  yearly: SimulationOutput['yearly'] = []
): SimulationOutput => ({
  monthly: [],
  yearly,
  summary,
  quickEstimate: {
    endValue: 1_100_000_000,
    monthlyDividendApprox: 2_500_000,
    annualDividendApprox: 30_000_000,
    yieldOnPriceAtEnd: 0.0334
  }
});
