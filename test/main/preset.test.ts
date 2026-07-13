import { describe, expect, it } from 'vitest';
import { buildPresetPortfolio, parseApproxManwonLowerBound, type PortfolioPresetDefinition } from '@/pages/Main/utils';
import type { TickerDraft } from '@/shared/types/snowball';

const universe: Record<string, TickerDraft> = {
  SCHD: {
    ticker: 'SCHD',
    name: 'Schwab US Dividend Equity ETF',
    initialPrice: 27,
    dividendYield: 3.6,
    dividendGrowth: 8,
    expectedTotalReturn: 10,
    frequency: 'quarterly'
  },
  JEPI: {
    ticker: 'JEPI',
    name: 'JPMorgan Equity Premium Income ETF',
    initialPrice: 56,
    dividendYield: 7.5,
    dividendGrowth: 1,
    expectedTotalReturn: 8,
    frequency: 'monthly'
  }
};

const preset: PortfolioPresetDefinition = {
  id: 'sample-preset',
  title: '샘플 포트폴리오',
  allocations: [
    { ticker: 'SCHD', weight: 60 },
    { ticker: 'JEPI', weight: 40 }
  ],
  expectedMonthlyDividend: '약 40~50만원',
  monthlyContributionValue: 1_000_000,
  durationYearsValue: 13,
  targetMonthlyDividendValue: 450_000
};

describe('parseApproxManwonLowerBound', () => {
  it('reads the lower bound of a range label', () => {
    expect(parseApproxManwonLowerBound('약 40~50만원', 450_000)).toBe(400_000);
  });

  it('reads a single-value label', () => {
    expect(parseApproxManwonLowerBound('약 120만원', 1_200_000)).toBe(1_200_000);
  });

  it('ignores thousand separators', () => {
    expect(parseApproxManwonLowerBound('약 1,300만원', 1)).toBe(13_000_000);
  });

  it('supports decimals and floors the result', () => {
    expect(parseApproxManwonLowerBound('약 12.34만원', 1)).toBe(123_400);
  });

  it('falls back when the label has no number', () => {
    expect(parseApproxManwonLowerBound('미정', 777)).toBe(777);
    expect(parseApproxManwonLowerBound('', 777)).toBe(777);
  });
});

describe('buildPresetPortfolio', () => {
  it('maps allocations to profiles, weights, and the form patch', () => {
    const next = buildPresetPortfolio({ preset, universe });

    expect(next).not.toBeNull();
    if (!next) return;

    expect(next.profiles.map((profile) => profile.id)).toEqual([
      'preset-sample-preset-schd-1',
      'preset-sample-preset-jepi-2'
    ]);
    expect(next.profiles.map((profile) => profile.ticker)).toEqual(['SCHD', 'JEPI']);
    // Preset profiles intentionally drop the display name so the chip shows the raw ticker.
    expect(next.profiles.every((profile) => profile.name === '')).toBe(true);

    expect(next.includedIds).toEqual(['preset-sample-preset-schd-1', 'preset-sample-preset-jepi-2']);
    expect(next.selectedTickerId).toBe('preset-sample-preset-schd-1');
    expect(next.weightByTickerId).toEqual({
      'preset-sample-preset-schd-1': 60,
      'preset-sample-preset-jepi-2': 40
    });
    expect(next.fixedByTickerId).toEqual({
      'preset-sample-preset-schd-1': false,
      'preset-sample-preset-jepi-2': false
    });
    expect(next.scenarioName).toBe('샘플 포트폴리오');
  });

  it('builds the form patch from the first profile and the preset plan', () => {
    const next = buildPresetPortfolio({ preset, universe });

    expect(next?.formPatch).toEqual({
      ticker: 'SCHD',
      initialPrice: 27,
      dividendYield: 3.6,
      dividendGrowth: 8,
      expectedTotalReturn: 10,
      frequency: 'quarterly',
      initialInvestment: 0,
      monthlyContribution: 1_000_000,
      targetMonthlyDividend: 400_000,
      durationYears: 13
    });
  });

  it('skips tickers that are missing from the universe', () => {
    const next = buildPresetPortfolio({
      preset: { ...preset, allocations: [{ ticker: 'NOPE', weight: 70 }, { ticker: 'JEPI', weight: 30 }] },
      universe
    });

    expect(next?.profiles.map((profile) => profile.ticker)).toEqual(['JEPI']);
    // The id suffix keeps the *allocation* index, so the surviving ticker stays at position 2.
    expect(next?.includedIds).toEqual(['preset-sample-preset-jepi-2']);
    // KNOWN DEFECT (characterized, not fixed): weights are read by the *filtered* index, so a missing
    // universe ticker shifts every later weight left. JEPI should get 30 but inherits NOPE's 70.
    expect(next?.weightByTickerId['preset-sample-preset-jepi-2']).toBe(70);
  });

  it('returns null when no preset ticker exists in the universe', () => {
    const next = buildPresetPortfolio({
      preset: { ...preset, allocations: [{ ticker: 'NOPE', weight: 100 }] },
      universe
    });

    expect(next).toBeNull();
  });

  it('clamps negative weights to 0', () => {
    const next = buildPresetPortfolio({
      preset: { ...preset, allocations: [{ ticker: 'SCHD', weight: -10 }, { ticker: 'JEPI', weight: 40 }] },
      universe
    });

    expect(next?.weightByTickerId['preset-sample-preset-schd-1']).toBe(0);
  });
});
