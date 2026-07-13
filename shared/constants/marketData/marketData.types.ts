import type { Frequency } from '@/shared/types';

/**
 * The only fields the automated refresh pipeline is allowed to overwrite.
 *
 * Curated fields (`name`, `expectedTotalReturn`, `ticker`) are human assumptions and are
 * NEVER part of this type, so they can never be clobbered by generated data.
 */
export type MarketDataEntry = {
  initialPrice: number;
  dividendYield: number;
  dividendGrowth: number;
  frequency: Frequency;
};

/** A dated snapshot of market data, produced by `scripts/tickerRefresh`. */
export type MarketDataSnapshot = {
  /** ISO date (YYYY-MM-DD) the snapshot was taken. `null` when no data has been fetched yet. */
  asOf: string | null;
  /** Provider the snapshot came from (e.g. `fmp`), or `none` when empty. */
  source: string;
  /** Market data keyed by ticker. Tickers absent here keep their curated preset values. */
  entries: Record<string, MarketDataEntry>;
};

/**
 * The universe type after overlaying market data: curated fields keep their literal types,
 * while the four overlaid fields widen to their runtime types.
 */
export type MarketDataOverlaid<T extends Record<string, MarketDataEntry>> = {
  [K in keyof T]: Omit<T[K], keyof MarketDataEntry> & MarketDataEntry;
};
