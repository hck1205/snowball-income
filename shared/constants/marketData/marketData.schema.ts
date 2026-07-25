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
    .optional(),
  /**
   * 관측된 지급월(1-12). 오름차순·중복 없음·최대 12개까지만 통과시킨다 — 손으로 고친 스냅샷이나
   * 공급자 이상치가 캘린더에 "13월"이나 중복 월을 흘리지 못하게 형태를 여기서 못 박는다.
   */
  payoutMonths: z
    .array(z.number().int().min(1).max(12))
    .max(12)
    .refine(
      (months) => months.every((month, index) => index === 0 || months[index - 1] < month),
      '지급월은 중복 없이 오름차순이어야 한다'
    )
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
