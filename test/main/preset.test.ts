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
    // UPDATED (was: 70). This test used to freeze the defect: weights were read by the *filtered*
    // index, so dropping NOPE shifted its 70 onto JEPI. Weights are now carried with the allocation
    // they came from, and the survivors are renormalized to 100% — JEPI is the only holding, so it
    // gets the whole portfolio rather than inheriting a neighbour's number.
    expect(next?.weightByTickerId['preset-sample-preset-jepi-2']).toBe(100);
  });

  it('renormalizes the surviving weights proportionally', () => {
    const next = buildPresetPortfolio({
      preset: {
        ...preset,
        allocations: [
          { ticker: 'NOPE', weight: 50 },
          { ticker: 'SCHD', weight: 30 },
          { ticker: 'JEPI', weight: 20 }
        ]
      },
      universe
    });

    // 30:20 of the surviving 50% becomes 60:40 of 100%.
    expect(next?.weightByTickerId).toEqual({
      'preset-sample-preset-schd-2': 60,
      'preset-sample-preset-jepi-3': 40
    });
  });

  it('keeps weights untouched when the preset already sums to 100', () => {
    const next = buildPresetPortfolio({ preset, universe });

    expect(next?.weightByTickerId).toEqual({
      'preset-sample-preset-schd-1': 60,
      'preset-sample-preset-jepi-2': 40
    });
  });

  it('reads each weight from its own ticker, not from the filtered position', () => {
    // The surviving ticker must never inherit a dropped ticker's weight.
    const next = buildPresetPortfolio({
      preset: { ...preset, allocations: [{ ticker: 'NOPE', weight: 90 }, { ticker: 'SCHD', weight: 5 }, { ticker: 'JEPI', weight: 5 }] },
      universe
    });

    expect(next?.weightByTickerId['preset-sample-preset-schd-2']).toBe(50);
    expect(next?.weightByTickerId['preset-sample-preset-jepi-3']).toBe(50);
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
