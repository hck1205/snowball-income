import type { Frequency } from '@/shared/types';

/**
 * The only fields the automated refresh pipeline is allowed to overwrite: **observable market facts**.
 *
 * Notably absent: `dividendGrowth`. Under the coherent model it is no longer "how fast the payout grew
 * in the past" — it *is* the price growth rate (`priceGrowth === dividendGrowth`), so it is an
 * assumption, not an observation. It is derived from the curated `expectedTotalReturn`
 * (`dividendGrowth = expectedTotalReturn - dividendYield`) *after* this overlay is applied.
 *
 * Curated fields (`name`, `expectedTotalReturn`, `ticker`) are human assumptions and are NEVER part
 * of this type, so they can never be clobbered by generated data.
 */
export type MarketDataEntry = {
  initialPrice: number;
  dividendYield: number;
  frequency: Frequency;
};

/**
 * What actually lives in the generated snapshot: the overlaid facts, plus observations the engine
 * must never read.
 */
export type MarketDataSnapshotEntry = MarketDataEntry & {
  /**
   * Historical dividend CAGR (%) observed from the payment history. **Reference only** — it is never
   * fed to the engine, because a past payout CAGR is not a total-return assumption. It exists so a
   * curator can see when the market has drifted away from the curated `expectedTotalReturn`.
   */
  observedDividendCagr?: number;
};

/** A dated snapshot of market data, produced by `scripts/tickerRefresh`. */
export type MarketDataSnapshot = {
  /** ISO date (YYYY-MM-DD) the snapshot was taken. `null` when no data has been fetched yet. */
  asOf: string | null;
  /** Provider the snapshot came from (e.g. `fmp`), or `none` when empty. */
  source: string;
  /** Market data keyed by ticker. Tickers absent here keep their curated preset values. */
  entries: Record<string, MarketDataSnapshotEntry>;
};

/**
 * The universe type after overlaying market data: curated fields keep their literal types,
 * while the overlaid fields widen to their runtime types.
 */
export type MarketDataOverlaid<T extends Record<string, MarketDataEntry>> = {
  [K in keyof T]: Omit<T[K], keyof MarketDataEntry> & MarketDataEntry;
};
