import {
  computeCapitalGains,
  findFinancialIncomeThresholdYear,
  sumGrossDividendByYearIndex
} from '@/shared/lib/snowball';
import {
  CAPITAL_GAINS_ANNUAL_DEDUCTION,
  FINANCIAL_INCOME_TAX_THRESHOLD,
  OVERSEAS_CAPITAL_GAINS_TAX_RATE
} from '@/shared/constants';
import type { MonthlySnapshot } from '@/shared/types';

const buildSnapshot = (overrides: Partial<MonthlySnapshot> & { monthIndex: number }): MonthlySnapshot => ({
  year: 2026,
  month: 1,
  shares: 0,
  price: 0,
  dividendPerShare: 0,
  dividendPaid: 0,
  contributionPaid: 0,
  taxPaid: 0,
  portfolioValue: 0,
  cumulativeDividend: 0,
  ...overrides
});

describe('computeCapitalGains', () => {
  it('taxes only the gain above the annual deduction', () => {
    // 평가이익 1,250만 - 공제 250만 = 과세표준 1,000만 → 22% = 220만
    const result = computeCapitalGains({ finalAssetValue: 22_500_000, totalCostBasis: 10_000_000 });

    expect(result.unrealizedGain).toBe(12_500_000);
    expect(result.estimatedCapitalGainsTax).toBe(2_200_000);
    expect(result.afterCapitalGainsTaxValue).toBe(20_300_000);
  });

  it('charges no tax when the gain is exactly at the deduction (boundary)', () => {
    const result = computeCapitalGains({
      finalAssetValue: 10_000_000 + CAPITAL_GAINS_ANNUAL_DEDUCTION,
      totalCostBasis: 10_000_000
    });

    expect(result.unrealizedGain).toBe(CAPITAL_GAINS_ANNUAL_DEDUCTION);
    expect(result.estimatedCapitalGainsTax).toBe(0);
    // 세금이 0이므로 자산이 그대로 남는다.
    expect(result.afterCapitalGainsTaxValue).toBe(10_000_000 + CAPITAL_GAINS_ANNUAL_DEDUCTION);
  });

  it('taxes one won above the deduction (boundary+1)', () => {
    const result = computeCapitalGains({
      finalAssetValue: 10_000_000 + CAPITAL_GAINS_ANNUAL_DEDUCTION + 1,
      totalCostBasis: 10_000_000
    });

    expect(result.estimatedCapitalGainsTax).toBeCloseTo(OVERSEAS_CAPITAL_GAINS_TAX_RATE / 100, 10);
  });

  it('charges no tax when the gain is below the deduction', () => {
    const result = computeCapitalGains({ finalAssetValue: 11_000_000, totalCostBasis: 10_000_000 });

    expect(result.unrealizedGain).toBe(1_000_000);
    expect(result.estimatedCapitalGainsTax).toBe(0);
    expect(result.afterCapitalGainsTaxValue).toBe(11_000_000);
  });

  it('charges no tax on a loss and keeps the gain negative', () => {
    const result = computeCapitalGains({ finalAssetValue: 7_000_000, totalCostBasis: 10_000_000 });

    expect(result.unrealizedGain).toBe(-3_000_000);
    expect(result.estimatedCapitalGainsTax).toBe(0);
    // 손실이어도 자산을 깎지 않는다 (환급도 없다).
    expect(result.afterCapitalGainsTaxValue).toBe(7_000_000);
  });

  it('honours custom rate and deduction', () => {
    const result = computeCapitalGains({
      finalAssetValue: 20_000_000,
      totalCostBasis: 10_000_000,
      taxRatePercent: 10,
      annualDeduction: 0
    });

    expect(result.estimatedCapitalGainsTax).toBe(1_000_000);
    expect(result.afterCapitalGainsTaxValue).toBe(19_000_000);
  });

  it('keeps the identity afterTax = finalAssetValue - tax', () => {
    const result = computeCapitalGains({ finalAssetValue: 1_137_786_866, totalCostBasis: 480_712_891 });

    expect(result.afterCapitalGainsTaxValue).toBeCloseTo(1_137_786_866 - result.estimatedCapitalGainsTax, 6);
    expect(result.unrealizedGain).toBe(1_137_786_866 - 480_712_891);
  });
});

describe('sumGrossDividendByYearIndex', () => {
  it('groups by simulation year (12-month blocks) and adds withheld tax back', () => {
    const monthly = [
      buildSnapshot({ monthIndex: 1, dividendPaid: 800, taxPaid: 200 }),
      buildSnapshot({ monthIndex: 12, dividendPaid: 800, taxPaid: 200 }),
      buildSnapshot({ monthIndex: 13, dividendPaid: 900, taxPaid: 100 })
    ];

    const byYear = sumGrossDividendByYearIndex(monthly);

    // 1..12개월 = 1년차, 13개월 = 2년차
    expect(byYear.get(1)).toBe(2_000);
    expect(byYear.get(2)).toBe(1_000);
  });
});

describe('findFinancialIncomeThresholdYear', () => {
  const yearOfMonths = (yearIndex: number, grossPerMonth: number): MonthlySnapshot[] =>
    Array.from({ length: 12 }, (_v, index) =>
      buildSnapshot({
        monthIndex: (yearIndex - 1) * 12 + index + 1,
        dividendPaid: grossPerMonth * 0.846,
        taxPaid: grossPerMonth * 0.154
      })
    );

  it('returns undefined when gross dividends never exceed the threshold', () => {
    expect(findFinancialIncomeThresholdYear(yearOfMonths(1, 1_000_000))).toBeUndefined();
  });

  it('returns the first simulation year whose gross dividend exceeds the threshold', () => {
    const monthly = [
      ...yearOfMonths(1, 1_000_000), // 세전 1,200만 — 미달
      ...yearOfMonths(2, 2_000_000), // 세전 2,400만 — 초과
      ...yearOfMonths(3, 3_000_000)
    ];

    expect(findFinancialIncomeThresholdYear(monthly)).toBe(2);
  });

  it('judges on gross (pre-withholding) dividends, not the net amount shown on screen', () => {
    // 세후로 보면 1,800만원이라 미달처럼 보이지만, 세전은 2,127만원이라 실제로는 초과다.
    const netAnnual = 18_000_000;
    const taxRate = 0.154;
    const grossAnnual = netAnnual / (1 - taxRate);
    const monthly = Array.from({ length: 12 }, (_v, index) =>
      buildSnapshot({
        monthIndex: index + 1,
        dividendPaid: netAnnual / 12,
        taxPaid: (grossAnnual - netAnnual) / 12
      })
    );

    expect(grossAnnual).toBeGreaterThan(FINANCIAL_INCOME_TAX_THRESHOLD);
    expect(findFinancialIncomeThresholdYear(monthly)).toBe(1);
  });

  it('does not fire exactly at the threshold (strictly greater)', () => {
    const monthly = Array.from({ length: 12 }, (_v, index) =>
      buildSnapshot({ monthIndex: index + 1, dividendPaid: FINANCIAL_INCOME_TAX_THRESHOLD / 12, taxPaid: 0 })
    );

    expect(findFinancialIncomeThresholdYear(monthly)).toBeUndefined();
  });

  it('accepts a custom threshold', () => {
    const monthly = [buildSnapshot({ monthIndex: 1, dividendPaid: 100, taxPaid: 0 })];

    expect(findFinancialIncomeThresholdYear(monthly, 99)).toBe(1);
    expect(findFinancialIncomeThresholdYear(monthly, 100)).toBeUndefined();
  });
});
