import { z } from 'zod';

/** The four dividend frequencies the app understands. Mirrors `Frequency` in `@/shared/types`. */
export const FREQUENCY_VALUES = ['monthly', 'quarterly', 'semiannual', 'annual'] as const;

/** Plausible bounds for automatically refreshed values. Anything outside is treated as bad data. */
export const MARKET_DATA_BOUNDS = {
  dividendYield: { min: 0, max: 30 },
  /** Bounds for the reference-only observed dividend CAGR. Wide, because it never reaches the engine. */
  observedDividendCagr: { min: -50, max: 50 },
  /** Reject a price that moved more than this ratio vs the previous known price (split / bad data). */
  maxPriceChangeRatio: 0.5
} as const;

/**
 * A snapshot entry. `dividendGrowth` is deliberately absent: it is an assumption derived from the
 * curated `expectedTotalReturn`, not something the pipeline may observe and write.
 *
 * Unknown keys are stripped by zod, so a snapshot that somehow carried `expectedTotalReturn` or a
 * stale `dividendGrowth` can never smuggle them into the universe.
 */
export const marketDataSnapshotEntrySchema = z.object({
  initialPrice: z.number().finite().positive(),
  dividendYield: z.number().finite().min(MARKET_DATA_BOUNDS.dividendYield.min).max(MARKET_DATA_BOUNDS.dividendYield.max),
  frequency: z.enum(FREQUENCY_VALUES),
  observedDividendCagr: z
    .number()
    .finite()
    .min(MARKET_DATA_BOUNDS.observedDividendCagr.min)
    .max(MARKET_DATA_BOUNDS.observedDividendCagr.max)
    .optional()
});

export const marketDataSnapshotSchema = z.object({
  asOf: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'asOf must be an ISO date (YYYY-MM-DD)')
    .nullable(),
  source: z.string(),
  entries: z.record(z.string(), marketDataSnapshotEntrySchema)
});
