import { z } from 'zod';

/** The four dividend frequencies the app understands. Mirrors `Frequency` in `@/shared/types`. */
export const FREQUENCY_VALUES = ['monthly', 'quarterly', 'semiannual', 'annual'] as const;

/** Plausible bounds for automatically refreshed values. Anything outside is treated as bad data. */
export const MARKET_DATA_BOUNDS = {
  dividendYield: { min: 0, max: 30 },
  dividendGrowth: { min: -50, max: 50 },
  /** Reject a price that moved more than this ratio vs the previous known price (split / bad data). */
  maxPriceChangeRatio: 0.5
} as const;

export const marketDataEntrySchema = z.object({
  initialPrice: z.number().finite().positive(),
  dividendYield: z.number().finite().min(MARKET_DATA_BOUNDS.dividendYield.min).max(MARKET_DATA_BOUNDS.dividendYield.max),
  dividendGrowth: z
    .number()
    .finite()
    .min(MARKET_DATA_BOUNDS.dividendGrowth.min)
    .max(MARKET_DATA_BOUNDS.dividendGrowth.max),
  frequency: z.enum(FREQUENCY_VALUES)
});

export const marketDataSnapshotSchema = z.object({
  asOf: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'asOf must be an ISO date (YYYY-MM-DD)')
    .nullable(),
  source: z.string(),
  entries: z.record(z.string(), marketDataEntrySchema)
});
