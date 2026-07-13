import { describe, expect, it } from 'vitest';
import { validateEntry } from '@/scripts/tickerRefresh';
import type { MarketDataEntry } from '@/shared/constants/marketData';

const PREVIOUS: MarketDataEntry = {
  initialPrice: 31.61,
  dividendYield: 3.34,
  dividendGrowth: 7,
  frequency: 'quarterly'
};

const valid: MarketDataEntry = {
  initialPrice: 32.1,
  dividendYield: 3.41,
  dividendGrowth: 7.2,
  frequency: 'quarterly'
};

describe('validateEntry', () => {
  it('accepts a plausible entry', () => {
    const result = validateEntry(valid, PREVIOUS);
    expect(result).toEqual({ ok: true, value: valid });
  });

  it('accepts an entry with no previous value to compare against', () => {
    expect(validateEntry(valid, null).ok).toBe(true);
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

  describe('dividendGrowth bounds (-50..50)', () => {
    it.each([-50, 0, 50])('accepts %s%%', (dividendGrowth) => {
      expect(validateEntry({ ...valid, dividendGrowth }, PREVIOUS).ok).toBe(true);
    });

    it.each([-50.1, 50.1, 900])('rejects %s%%', (dividendGrowth) => {
      const result = validateEntry({ ...valid, dividendGrowth }, PREVIOUS);
      expect(result.ok).toBe(false);
      expect(result.ok === false && result.reason).toContain('dividendGrowth');
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
    it.each(['initialPrice', 'dividendYield', 'dividendGrowth', 'frequency'] as const)(
      'rejects a missing %s',
      (field) => {
        const partial: Record<string, unknown> = { ...valid };
        delete partial[field];
        const result = validateEntry(partial, PREVIOUS);
        expect(result.ok).toBe(false);
        expect(result.ok === false && result.reason).toContain(field);
      }
    );

    it.each(['initialPrice', 'dividendYield', 'dividendGrowth'] as const)('rejects a NaN %s', (field) => {
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
