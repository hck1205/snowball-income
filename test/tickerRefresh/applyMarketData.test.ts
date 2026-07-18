import { describe, expect, it } from 'vitest';
import { applyMarketData, EMPTY_MARKET_DATA_SNAPSHOT, parseMarketDataSnapshot } from '@/shared/constants/marketData';
import type { MarketDataSnapshot } from '@/shared/constants/marketData';
import { buildDividendUniverse, CURATED_DIVIDEND_UNIVERSE, DIVIDEND_UNIVERSE } from '@/shared/constants/presets';

const snapshotWith = (entries: MarketDataSnapshot['entries']): MarketDataSnapshot => ({
  asOf: '2026-07-14',
  source: 'test',
  entries
});

describe('applyMarketData', () => {
  it('is a no-op for an empty snapshot (the safety net: no data => current behaviour)', () => {
    expect(applyMarketData(CURATED_DIVIDEND_UNIVERSE, EMPTY_MARKET_DATA_SNAPSHOT)).toEqual(
      CURATED_DIVIDEND_UNIVERSE
    );
  });

  it('keeps DIVIDEND_UNIVERSE identical to the curated presets while no data is generated', () => {
    // Guards the shipped default: an empty marketData.generated.json must not change the app.
    expect(DIVIDEND_UNIVERSE).toEqual(CURATED_DIVIDEND_UNIVERSE);
  });

  it('overlays only the three observable market fields', () => {
    const overlaid = applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({ SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'monthly' } })
    );

    expect(overlaid.SCHD.initialPrice).toBe(32.1);
    expect(overlaid.SCHD.dividendYield).toBe(3.41);
    expect(overlaid.SCHD.frequency).toBe('monthly');
  });

  it('never overwrites curated values (name / expectedTotalReturn / ticker)', () => {
    const overlaid = applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({ SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'quarterly' } })
    );

    expect(overlaid.SCHD.name).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.name);
    expect(overlaid.SCHD.expectedTotalReturn).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.expectedTotalReturn);
    expect(overlaid.SCHD.ticker).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.ticker);
  });

  it('does not let a snapshot write dividendGrowth (it is an assumption, not an observation)', () => {
    // Even if a stale or hand-edited snapshot carried a historical dividend CAGR under the old key,
    // the schema strips it, so it can never become the price growth rate.
    const stale: unknown = {
      asOf: '2026-07-14',
      source: 'test',
      entries: {
        SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'quarterly', dividendGrowth: 11 }
      }
    };

    const parsed = parseMarketDataSnapshot(stale);
    expect(parsed.entries.SCHD).not.toHaveProperty('dividendGrowth');

    const overlaid = applyMarketData(CURATED_DIVIDEND_UNIVERSE, parsed);
    expect(overlaid.SCHD.dividendGrowth).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.dividendGrowth);
  });

  it('keeps the reference-only observedDividendCagr out of the universe', () => {
    const overlaid = applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({
        SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'quarterly', observedDividendCagr: 11 }
      })
    );

    // It lives in the snapshot for a human to read; it must never reach the engine.
    expect(overlaid.SCHD).not.toHaveProperty('observedDividendCagr');
  });

  it('strips curated-looking fields smuggled into a snapshot entry', () => {
    // Defence in depth: even if a generated file somehow carried `name`/`expectedTotalReturn`,
    // the schema strips them, so they can never reach the universe.
    const hostile: unknown = {
      asOf: '2026-07-14',
      source: 'test',
      entries: {
        SCHD: {
          initialPrice: 32.1,
          dividendYield: 3.41,
          frequency: 'quarterly',
          name: 'HACKED',
          expectedTotalReturn: 999
        }
      }
    };

    const parsed = parseMarketDataSnapshot(hostile);
    expect(parsed.entries.SCHD).not.toHaveProperty('name');

    const overlaid = applyMarketData(CURATED_DIVIDEND_UNIVERSE, parsed);
    expect(overlaid.SCHD.name).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.name);
    expect(overlaid.SCHD.expectedTotalReturn).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.expectedTotalReturn);
  });

  it('leaves tickers that are absent from the snapshot untouched', () => {
    const overlaid = applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({ SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'quarterly' } })
    );

    expect(overlaid.VOO).toEqual(CURATED_DIVIDEND_UNIVERSE.VOO);
    expect(overlaid.JEPI).toEqual(CURATED_DIVIDEND_UNIVERSE.JEPI);
  });

  it('ignores snapshot entries for tickers that are not in the universe', () => {
    const overlaid = applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({ NOT_A_PRESET: { initialPrice: 1, dividendYield: 1, frequency: 'annual' } })
    );

    expect(Object.keys(overlaid)).toEqual(Object.keys(CURATED_DIVIDEND_UNIVERSE));
    expect(overlaid).toEqual(CURATED_DIVIDEND_UNIVERSE);
  });

  it('does not mutate the input universe', () => {
    const before = structuredClone(CURATED_DIVIDEND_UNIVERSE);
    applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({ SCHD: { initialPrice: 99, dividendYield: 1, frequency: 'annual' } })
    );
    expect(CURATED_DIVIDEND_UNIVERSE).toEqual(before);
  });

  it('preserves every preset ticker key', () => {
    const overlaid = applyMarketData(CURATED_DIVIDEND_UNIVERSE, EMPTY_MARKET_DATA_SNAPSHOT);
    expect(Object.keys(overlaid).sort()).toEqual(Object.keys(CURATED_DIVIDEND_UNIVERSE).sort());
  });
});

/**
 * The heart of the coherent model: `dividendYield` is refreshed from the market, `expectedTotalReturn`
 * is a curated assumption, and `dividendGrowth` is whatever falls out of the two. If the derivation
 * ran *before* the overlay, `dividendGrowth` would still be based on the stale preset yield and the
 * invariant would break silently, corrupting every total-return assumption in the app.
 */
describe('buildDividendUniverse (overlay -> derive order)', () => {
  it('holds dy + dg === etr after a snapshot moves dividendYield', () => {
    const universe = buildDividendUniverse(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({
        // Yield up (3.34 -> 4.5): growth must fall by exactly the same amount, etr must not move.
        SCHD: { initialPrice: 28, dividendYield: 4.5, frequency: 'quarterly', observedDividendCagr: 11 },
        // Yield down (8.0 -> 6): growth must rise by the same amount (0 -> 2).
        JEPI: { initialPrice: 60, dividendYield: 6, frequency: 'monthly' }
      })
    );

    expect(universe.SCHD.dividendYield).toBe(4.5);
    expect(universe.SCHD.expectedTotalReturn).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.expectedTotalReturn);
    expect(universe.SCHD.dividendGrowth).toBeCloseTo(CURATED_DIVIDEND_UNIVERSE.SCHD.expectedTotalReturn - 4.5, 9);

    expect(universe.JEPI.dividendGrowth).toBeCloseTo(CURATED_DIVIDEND_UNIVERSE.JEPI.expectedTotalReturn - 6, 9);

    for (const preset of Object.values(universe)) {
      expect(preset.dividendYield + preset.dividendGrowth).toBeCloseTo(preset.expectedTotalReturn, 9);
    }
  });

  it('does not let the observed dividend CAGR become the growth rate', () => {
    // The regression this whole change exists to prevent: SCHD's historical payout CAGR is ~11%.
    // If that were overlaid onto `dividendGrowth`, the total return would silently become
    // 3.4 + 11 = 14.4%, betraying the curated 10%.
    const universe = buildDividendUniverse(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({
        SCHD: { initialPrice: 32.1, dividendYield: 3.4, frequency: 'quarterly', observedDividendCagr: 11 }
      })
    );

    expect(universe.SCHD.dividendGrowth).not.toBeCloseTo(11, 6);
    expect(universe.SCHD.dividendGrowth).toBeCloseTo(CURATED_DIVIDEND_UNIVERSE.SCHD.expectedTotalReturn - 3.4, 9);
    expect(universe.SCHD.dividendYield + universe.SCHD.dividendGrowth).toBeCloseTo(
      CURATED_DIVIDEND_UNIVERSE.SCHD.expectedTotalReturn,
      9
    );
  });

  it('lets the derived growth go negative when a refreshed yield overruns the curated etr', () => {
    // Legitimate for a covered-call fund (its NAV really does erode). The pipeline warns; the model
    // stays coherent either way.
    const universe = buildDividendUniverse(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({ QYLD: { initialPrice: 17, dividendYield: 12, frequency: 'monthly' } })
    );

    expect(universe.QYLD.dividendGrowth).toBeCloseTo(CURATED_DIVIDEND_UNIVERSE.QYLD.expectedTotalReturn - 12, 9);
    expect(universe.QYLD.dividendGrowth).toBeLessThan(0);
    expect(universe.QYLD.dividendYield + universe.QYLD.dividendGrowth).toBeCloseTo(
      CURATED_DIVIDEND_UNIVERSE.QYLD.expectedTotalReturn,
      9
    );
  });

  it('is a no-op for an empty snapshot', () => {
    expect(buildDividendUniverse(CURATED_DIVIDEND_UNIVERSE, EMPTY_MARKET_DATA_SNAPSHOT)).toEqual(
      CURATED_DIVIDEND_UNIVERSE
    );
  });
});

describe('parseMarketDataSnapshot', () => {
  it('parses a valid snapshot', () => {
    const snapshot = snapshotWith({
      SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'quarterly', observedDividendCagr: 8.2 }
    });
    expect(parseMarketDataSnapshot(snapshot)).toEqual(snapshot);
  });

  it('parses an entry without the optional observedDividendCagr', () => {
    const snapshot = snapshotWith({ SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'quarterly' } });
    expect(parseMarketDataSnapshot(snapshot)).toEqual(snapshot);
  });

  it('falls back to an empty snapshot when the file is malformed (app must never break)', () => {
    expect(parseMarketDataSnapshot({ asOf: 'yesterday', source: 'fmp', entries: {} })).toEqual(
      EMPTY_MARKET_DATA_SNAPSHOT
    );
    expect(parseMarketDataSnapshot('garbage')).toEqual(EMPTY_MARKET_DATA_SNAPSHOT);
    expect(parseMarketDataSnapshot(null)).toEqual(EMPTY_MARKET_DATA_SNAPSHOT);
  });

  it('rejects a snapshot carrying an out-of-range entry', () => {
    const bad = snapshotWith({ SCHD: { initialPrice: 32.1, dividendYield: 999, frequency: 'quarterly' } });
    expect(parseMarketDataSnapshot(bad)).toEqual(EMPTY_MARKET_DATA_SNAPSHOT);
  });

  it('rejects a snapshot carrying an absurd observedDividendCagr', () => {
    const bad = snapshotWith({
      SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'quarterly', observedDividendCagr: 900 }
    });
    expect(parseMarketDataSnapshot(bad)).toEqual(EMPTY_MARKET_DATA_SNAPSHOT);
  });
});
