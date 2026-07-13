import { describe, expect, it } from 'vitest';
import { applyMarketData, EMPTY_MARKET_DATA_SNAPSHOT, parseMarketDataSnapshot } from '@/shared/constants/marketData';
import type { MarketDataSnapshot } from '@/shared/constants/marketData';
import { CURATED_DIVIDEND_UNIVERSE, DIVIDEND_UNIVERSE } from '@/shared/constants/presets';

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

  it('overlays only the four market fields', () => {
    const overlaid = applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({
        SCHD: { initialPrice: 32.1, dividendYield: 3.41, dividendGrowth: 7.2, frequency: 'monthly' }
      })
    );

    expect(overlaid.SCHD.initialPrice).toBe(32.1);
    expect(overlaid.SCHD.dividendYield).toBe(3.41);
    expect(overlaid.SCHD.dividendGrowth).toBe(7.2);
    expect(overlaid.SCHD.frequency).toBe('monthly');
  });

  it('never overwrites curated values (name / expectedTotalReturn / ticker)', () => {
    const overlaid = applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({
        SCHD: { initialPrice: 32.1, dividendYield: 3.41, dividendGrowth: 7.2, frequency: 'quarterly' }
      })
    );

    expect(overlaid.SCHD.name).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.name);
    expect(overlaid.SCHD.expectedTotalReturn).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.expectedTotalReturn);
    expect(overlaid.SCHD.ticker).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.ticker);
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
          dividendGrowth: 7.2,
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
      snapshotWith({
        SCHD: { initialPrice: 32.1, dividendYield: 3.41, dividendGrowth: 7.2, frequency: 'quarterly' }
      })
    );

    expect(overlaid.VOO).toEqual(CURATED_DIVIDEND_UNIVERSE.VOO);
    expect(overlaid.JEPI).toEqual(CURATED_DIVIDEND_UNIVERSE.JEPI);
  });

  it('ignores snapshot entries for tickers that are not in the universe', () => {
    const overlaid = applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({
        NOT_A_PRESET: { initialPrice: 1, dividendYield: 1, dividendGrowth: 1, frequency: 'annual' }
      })
    );

    expect(Object.keys(overlaid)).toEqual(Object.keys(CURATED_DIVIDEND_UNIVERSE));
    expect(overlaid).toEqual(CURATED_DIVIDEND_UNIVERSE);
  });

  it('does not mutate the input universe', () => {
    const before = structuredClone(CURATED_DIVIDEND_UNIVERSE);
    applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({
        SCHD: { initialPrice: 99, dividendYield: 1, dividendGrowth: 1, frequency: 'annual' }
      })
    );
    expect(CURATED_DIVIDEND_UNIVERSE).toEqual(before);
  });

  it('preserves every preset ticker key', () => {
    const overlaid = applyMarketData(CURATED_DIVIDEND_UNIVERSE, EMPTY_MARKET_DATA_SNAPSHOT);
    expect(Object.keys(overlaid).sort()).toEqual(Object.keys(CURATED_DIVIDEND_UNIVERSE).sort());
  });
});

describe('parseMarketDataSnapshot', () => {
  it('parses a valid snapshot', () => {
    const snapshot = snapshotWith({
      SCHD: { initialPrice: 32.1, dividendYield: 3.41, dividendGrowth: 7.2, frequency: 'quarterly' }
    });
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
    const bad = snapshotWith({
      SCHD: { initialPrice: 32.1, dividendYield: 999, dividendGrowth: 7.2, frequency: 'quarterly' }
    });
    expect(parseMarketDataSnapshot(bad)).toEqual(EMPTY_MARKET_DATA_SNAPSHOT);
  });
});
