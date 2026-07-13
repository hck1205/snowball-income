import { describe, expect, it } from 'vitest';
import { computeDividendCagr, computeTtmYield, inferFrequency, roundTo } from '@/scripts/tickerRefresh';
import { JEPI_DIVIDENDS, monthlyHistory, quarterlyHistory, SCHD_DIVIDENDS } from './fixtures';

const AS_OF = '2026-07-14';

describe('computeTtmYield', () => {
  it('sums only the dividends paid in the 12 months ending at asOf', () => {
    // 2025-09-20 + 2025-12-20 (0.265 each) + 2026-03-20 + 2026-06-20 (0.28 each) = 1.09
    expect(computeTtmYield(SCHD_DIVIDENDS, 32.1, AS_OF)).toBeCloseTo((1.09 / 32.1) * 100, 6);
  });

  it('ignores dividends older than the window', () => {
    const dividends = [
      { date: '2020-01-01', amount: 100 },
      { date: '2026-01-15', amount: 1 }
    ];
    expect(computeTtmYield(dividends, 100, AS_OF)).toBeCloseTo(1, 6);
  });

  it('counts a special dividend inside the window', () => {
    const dividends = [
      { date: '2026-01-15', amount: 1 },
      { date: '2026-02-15', amount: 4 }
    ];
    expect(computeTtmYield(dividends, 100, AS_OF)).toBeCloseTo(5, 6);
  });

  it('returns null for an empty history', () => {
    expect(computeTtmYield([], 100, AS_OF)).toBeNull();
  });

  it('returns null when no dividend falls inside the window', () => {
    expect(computeTtmYield([{ date: '2020-01-01', amount: 1 }], 100, AS_OF)).toBeNull();
  });

  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])('returns null for an invalid price (%s)', (price) => {
    expect(computeTtmYield(SCHD_DIVIDENDS, price, AS_OF)).toBeNull();
  });

  it('returns null for an unparseable asOf', () => {
    expect(computeTtmYield(SCHD_DIVIDENDS, 32.1, 'not-a-date')).toBeNull();
  });

  it('skips malformed payments instead of poisoning the sum with NaN', () => {
    const dividends = [
      { date: '2026-01-15', amount: Number.NaN },
      { date: 'garbage', amount: 1 },
      { date: '2026-02-15', amount: -1 },
      { date: '2026-03-15', amount: 2 }
    ];
    expect(computeTtmYield(dividends, 100, AS_OF)).toBeCloseTo(2, 6);
  });
});

describe('inferFrequency', () => {
  it('detects quarterly', () => {
    expect(inferFrequency(SCHD_DIVIDENDS)).toBe('quarterly');
  });

  it('detects monthly', () => {
    expect(inferFrequency(JEPI_DIVIDENDS)).toBe('monthly');
  });

  it('detects semiannual', () => {
    expect(
      inferFrequency([
        { date: '2025-09-10', amount: 1 },
        { date: '2026-03-10', amount: 1 }
      ])
    ).toBe('semiannual');
  });

  it('detects annual', () => {
    expect(
      inferFrequency([
        { date: '2024-05-10', amount: 1 },
        { date: '2025-05-10', amount: 1 },
        { date: '2026-05-10', amount: 1 }
      ])
    ).toBe('annual');
  });

  it('stays quarterly when a special dividend adds a 5th payment', () => {
    const withSpecial = [...quarterlyHistory({ 2025: 4, 2026: 4 }), { date: '2026-05-02', amount: 3 }];
    expect(inferFrequency(withSpecial)).toBe('quarterly');
  });

  it('stays monthly when a couple of months are missing from the data', () => {
    const patchy = monthlyHistory({ 2026: 12 }).filter(
      (payment) => !payment.date.startsWith('2026-04') && !payment.date.startsWith('2026-08')
    );
    expect(inferFrequency(patchy)).toBe('monthly');
  });

  it('uses the latest payment (not today) as the window anchor, so stale data is not undercounted', () => {
    // Data stops in 2023, but the cadence is still clearly quarterly.
    expect(inferFrequency(quarterlyHistory({ 2022: 4, 2023: 4 }))).toBe('quarterly');
  });

  it('returns annual for a single payment', () => {
    expect(inferFrequency([{ date: '2026-01-05', amount: 1 }])).toBe('annual');
  });

  it('returns null for an empty history', () => {
    expect(inferFrequency([])).toBeNull();
  });

  it('returns null when every payment is malformed', () => {
    expect(inferFrequency([{ date: 'nope', amount: 1 }])).toBeNull();
  });
});

describe('computeDividendCagr', () => {
  it('computes CAGR from complete calendar years', () => {
    // 2025 total 1.06 vs 2020 total 0.72 over 5 years.
    const expected = ((1.06 / 0.72) ** (1 / 5) - 1) * 100;
    expect(computeDividendCagr(SCHD_DIVIDENDS, 5)).toBeCloseTo(expected, 6);
  });

  it('excludes the partially-paid current year, so a mid-year snapshot is not read as a cut', () => {
    // SCHD_DIVIDENDS has only 2 of 4 payments in 2026; including it would understate growth.
    const cagr = computeDividendCagr(SCHD_DIVIDENDS, 5);
    expect(cagr).not.toBeNull();
    expect(cagr as number).toBeGreaterThan(0);
  });

  it('uses the latest year when it is complete', () => {
    const complete = quarterlyHistory({ 2020: 1, 2021: 1.1, 2022: 1.2, 2023: 1.3, 2024: 1.4, 2025: 2 });
    const expected = ((2 / 1) ** (1 / 5) - 1) * 100;
    expect(computeDividendCagr(complete, 5)).toBeCloseTo(expected, 6);
  });

  it('handles a dividend cut (negative CAGR)', () => {
    const cut = quarterlyHistory({ 2023: 4, 2024: 3, 2025: 2 });
    const expected = ((2 / 4) ** (1 / 2) - 1) * 100;
    expect(computeDividendCagr(cut, 2)).toBeCloseTo(expected, 6);
    expect(computeDividendCagr(cut, 2) as number).toBeLessThan(0);
  });

  it('returns null when history is shorter than the requested window', () => {
    expect(computeDividendCagr(quarterlyHistory({ 2024: 1, 2025: 1.1 }), 5)).toBeNull();
  });

  it('returns null when the base year is incomplete (would fake explosive growth)', () => {
    const thinBaseYear = [
      { date: '2021-12-20', amount: 0.25 },
      ...quarterlyHistory({ 2022: 1, 2023: 1.1, 2024: 1.2, 2025: 1.3, 2026: 1.4 })
    ];
    expect(computeDividendCagr(thinBaseYear, 5)).toBeNull();
  });

  it('returns null for an empty history', () => {
    expect(computeDividendCagr([], 5)).toBeNull();
  });

  it('returns null for a single payment', () => {
    expect(computeDividendCagr([{ date: '2026-01-01', amount: 1 }], 5)).toBeNull();
  });

  it.each([0, -1, 1.5])('returns null for an invalid year window (%s)', (years) => {
    expect(computeDividendCagr(SCHD_DIVIDENDS, years)).toBeNull();
  });
});

describe('roundTo', () => {
  it('rounds to the requested precision', () => {
    expect(roundTo(3.14159, 2)).toBe(3.14);
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(-2.345, 1)).toBe(-2.3);
  });
});
