import type {
  MarketDataEntry,
  MarketDataOverlaid,
  MarketDataSnapshot,
  MarketDataSnapshotEntry
} from './marketData.types';

/** A snapshot that overlays nothing. Using it leaves a universe byte-for-byte unchanged. */
export const EMPTY_MARKET_DATA_SNAPSHOT: MarketDataSnapshot = {
  asOf: null,
  source: 'none',
  entries: {}
};

/**
 * Narrows a snapshot entry to the fields that may reach the universe.
 *
 * Explicit, not a spread: reference-only observations (`observedDividendCagr`) exist to inform a
 * human curator, and must never end up as an engine input.
 */
const toOverlay = (entry: MarketDataSnapshotEntry): MarketDataEntry => ({
  initialPrice: entry.initialPrice,
  dividendYield: entry.dividendYield,
  frequency: entry.frequency
});

/**
 * Overlays refreshed market data on top of a curated universe. Pure.
 *
 * Guarantees:
 * - Only `initialPrice`, `dividendYield` and `frequency` are overwritten — the observable facts.
 * - Curated fields (`name`, `expectedTotalReturn`, ...) always survive.
 * - `dividendGrowth` is NOT overlaid. It is an assumption, re-derived from the curated
 *   `expectedTotalReturn` and the (possibly refreshed) `dividendYield` *after* this step — see
 *   `shared/constants/presets/index.ts`.
 * - Tickers missing from `snapshot.entries` keep their preset values untouched.
 * - An empty snapshot yields a universe deep-equal to the input.
 */
export const applyMarketData = <T extends Record<string, MarketDataEntry>>(
  universe: T,
  snapshot: MarketDataSnapshot
): MarketDataOverlaid<T> => {
  const overlaid = {} as MarketDataOverlaid<T>;

  for (const ticker of Object.keys(universe) as (keyof T)[]) {
    const preset = universe[ticker];
    const entry = snapshot.entries[String(ticker)];

    overlaid[ticker] = (entry ? { ...preset, ...toOverlay(entry) } : { ...preset }) as MarketDataOverlaid<T>[keyof T];
  }

  return overlaid;
};
