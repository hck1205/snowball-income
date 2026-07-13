import type { MarketDataEntry, MarketDataOverlaid, MarketDataSnapshot } from './marketData.types';

/** A snapshot that overlays nothing. Using it leaves a universe byte-for-byte unchanged. */
export const EMPTY_MARKET_DATA_SNAPSHOT: MarketDataSnapshot = {
  asOf: null,
  source: 'none',
  entries: {}
};

/**
 * Overlays refreshed market data on top of a curated universe. Pure.
 *
 * Guarantees:
 * - Only `initialPrice`, `dividendYield`, `dividendGrowth` and `frequency` are overwritten.
 * - Curated fields (`name`, `expectedTotalReturn`, ...) always survive.
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

    // `entry` only carries the four refreshable fields, so curated fields cannot be overwritten.
    overlaid[ticker] = (entry ? { ...preset, ...entry } : { ...preset }) as MarketDataOverlaid<T>[keyof T];
  }

  return overlaid;
};
