import { describe, expect, it } from 'vitest';
import { checkDerivedDividendGrowth, validateEntry } from '@/scripts/tickerRefresh';
import type { MarketDataEntry, MarketDataSnapshotEntry } from '@/shared/constants/marketData';

const PREVIOUS: MarketDataEntry = {
  initialPrice: 31.61,
  dividendYield: 3.34,
  frequency: 'quarterly'
};

const valid: MarketDataSnapshotEntry = {
  initialPrice: 32.1,
  dividendYield: 3.41,
  frequency: 'quarterly',
  observedDividendCagr: 8.2
};

describe('validateEntry', () => {
  it('accepts a plausible entry', () => {
    const result = validateEntry(valid, PREVIOUS);
    expect(result).toEqual({ ok: true, value: valid });
  });

  it('accepts an entry with no previous value to compare against', () => {
    expect(validateEntry(valid, null).ok).toBe(true);
  });

  it('accepts an entry without the optional observedDividendCagr', () => {
    const { observedDividendCagr: _omitted, ...withoutCagr } = valid;
    expect(validateEntry(withoutCagr, PREVIOUS).ok).toBe(true);
  });

  it('strips a dividendGrowth smuggled into a candidate (the pipeline may not write it)', () => {
    const result = validateEntry({ ...valid, dividendGrowth: 11 }, PREVIOUS);
    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value).not.toHaveProperty('dividendGrowth');
  });

  describe('dividendYield bounds (0..30)', () => {
    it.each([0, 15, 30])('accepts %s%%', (dividendYield) => {
      expect(validateEntry({ ...valid, dividendYield }, PREVIOUS).ok).toBe(true);
    });

    it.each([-0.1, 30.1, 120])('rejects %s%%', (dividendYield) => {
      const result = validateEntry({ ...valid, dividendYield }, PREVIOUS);
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toContain('dividendYield');
    });
  });

  describe('observedDividendCagr bounds (-50..50, reference only)', () => {
    it.each([-50, 0, 50])('accepts %s%%', (observedDividendCagr) => {
      expect(validateEntry({ ...valid, observedDividendCagr }, PREVIOUS).ok).toBe(true);
    });

    it.each([-50.1, 50.1, 900])('rejects %s%%', (observedDividendCagr) => {
      const result = validateEntry({ ...valid, observedDividendCagr }, PREVIOUS);
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toContain('observedDividendCagr');
    });

    it('rejects a NaN observedDividendCagr', () => {
      expect(validateEntry({ ...valid, observedDividendCagr: Number.NaN }, PREVIOUS).ok).toBe(false);
    });
  });

  describe('initialPrice', () => {
    it.each([0, -1])('rejects a non-positive price (%s)', (initialPrice) => {
      const result = validateEntry({ ...valid, initialPrice }, PREVIOUS);
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toContain('initialPrice');
    });

    it('accepts a move just inside +/-50%', () => {
      expect(validateEntry({ ...valid, initialPrice: 31.61 * 1.49 }, PREVIOUS).ok).toBe(true);
      expect(validateEntry({ ...valid, initialPrice: 31.61 * 0.51 }, PREVIOUS).ok).toBe(true);
    });

    it('rejects a suspicious jump (likely a split or bad data)', () => {
      const result = validateEntry({ ...valid, initialPrice: 31.61 * 2 }, PREVIOUS);
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toContain('possible split or bad data');
    });

    it('rejects a suspicious crash', () => {
      const result = validateEntry({ ...valid, initialPrice: 31.61 * 0.4 }, PREVIOUS);
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toContain('possible split or bad data');
    });

    it('allows any price when there is no previous price to compare with', () => {
      expect(validateEntry({ ...valid, initialPrice: 9999 }, null).ok).toBe(true);
    });
  });

  describe('frequency', () => {
    it.each(['monthly', 'quarterly', 'semiannual', 'annual'])('accepts %s', (frequency) => {
      expect(validateEntry({ ...valid, frequency }, PREVIOUS).ok).toBe(true);
    });

    it.each(['weekly', 'QUARTERLY', '', null])('rejects %s', (frequency) => {
      const result = validateEntry({ ...valid, frequency }, PREVIOUS);
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toContain('frequency');
    });
  });

  describe('missing / NaN fields', () => {
    it.each(['initialPrice', 'dividendYield', 'frequency'] as const)('rejects a missing %s', (field) => {
      const partial: Record<string, unknown> = { ...valid };
      delete partial[field];
      const result = validateEntry(partial, PREVIOUS);
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toContain(field);
    });

    it.each(['initialPrice', 'dividendYield'] as const)('rejects a NaN %s', (field) => {
      const result = validateEntry({ ...valid, [field]: Number.NaN }, PREVIOUS);
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toContain(field);
    });

    it('rejects an infinite price', () => {
      expect(validateEntry({ ...valid, initialPrice: Number.POSITIVE_INFINITY }, PREVIOUS).ok).toBe(false);
    });

    it.each([null, undefined, 'nope', 42])('rejects a non-object entry (%s)', (entry) => {
      expect(validateEntry(entry, PREVIOUS).ok).toBe(false);
    });
  });
});

/**
 * The soft guard that replaces the old `dividendGrowth` bounds check. The pipeline no longer produces
 * a growth rate, so the thing worth checking is the *consequence* of the refreshed yield: growth is
 * `expectedTotalReturn - dividendYield`, and a yield that overruns the curated total return turns the
 * asset into a shrinking one.
 */
describe('checkDerivedDividendGrowth', () => {
  it('is silent when the refreshed yield leaves room for positive growth', () => {
    expect(checkDerivedDividendGrowth({ dividendYield: 3.41, expectedTotalReturn: 10 })).toBeNull();
  });

  it('is silent at exactly zero derived growth (an 8% yield on an 8% total-return assumption)', () => {
    expect(checkDerivedDividendGrowth({ dividendYield: 8, expectedTotalReturn: 8 })).toBeNull();
  });

  it('warns when the refreshed yield exceeds the curated expectedTotalReturn', () => {
    const warning = checkDerivedDividendGrowth({ dividendYield: 12, expectedTotalReturn: 7 });

    expect(warning).not.toBeNull();
    expect(warning).toContain('-5.00%');
    expect(warning).toContain('expectedTotalReturn');
  });

  it('warns on the SCHD-style data error: a bad yield silently making a growth ETF shrink', () => {
    // 14% TTM yield on SCHD would be a special dividend counted as recurring, not a real yield.
    const warning = checkDerivedDividendGrowth({ dividendYield: 14, expectedTotalReturn: 10 });
    expect(warning).toContain('-4.00%');
  });
});
