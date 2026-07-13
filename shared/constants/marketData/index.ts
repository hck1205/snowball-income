import rawMarketData from './marketData.generated.json';
import { marketDataSnapshotSchema } from './marketData.schema';
import { EMPTY_MARKET_DATA_SNAPSHOT } from './applyMarketData';
import type { MarketDataSnapshot } from './marketData.types';

export * from './applyMarketData';
export * from './marketData.schema';
export type * from './marketData.types';

/**
 * Parses the generated snapshot defensively: a malformed or partially written file must never
 * break the app, it just falls back to the curated preset values.
 */
export const parseMarketDataSnapshot = (raw: unknown): MarketDataSnapshot => {
  const parsed = marketDataSnapshotSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn('[marketData] Ignoring invalid marketData.generated.json; falling back to preset values.');
    return EMPTY_MARKET_DATA_SNAPSHOT;
  }
  return parsed.data;
};

/** The market data snapshot currently baked into the build. */
export const MARKET_DATA: MarketDataSnapshot = parseMarketDataSnapshot(rawMarketData);

/** Reference date of the market data, or `null` when running purely on curated presets. */
export const MARKET_DATA_AS_OF: string | null = MARKET_DATA.asOf;
