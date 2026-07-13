import { MARKET_DATA_BOUNDS, marketDataEntrySchema } from '@/shared/constants/marketData';
import type { MarketDataEntry } from '@/shared/constants/marketData';

export type ValidationResult =
  | { ok: true; value: MarketDataEntry }
  | { ok: false; reason: string };

/** Formats a zod issue as `field: message`, e.g. `dividendYield: too big`. */
const formatIssue = (path: readonly (string | number | symbol)[], message: string): string => {
  const field = path.map(String).join('.');
  return field.length > 0 ? `${field}: ${message}` : message;
};

/**
 * Validates a freshly derived entry before it is allowed into the snapshot. Pure.
 *
 * Rejects on:
 * - missing / NaN / infinite fields
 * - `dividendYield` outside 0..30 %
 * - `dividendGrowth` outside -50..50 %
 * - `initialPrice` <= 0
 * - `initialPrice` moving more than +/-50% vs the previous known price (split or bad data —
 *   a human should confirm)
 * - `frequency` not one of the four known literals
 *
 * A rejected entry is never written: the caller keeps the previous (curated or last-good) value.
 */
export const validateEntry = (next: unknown, previous: MarketDataEntry | null): ValidationResult => {
  const parsed = marketDataEntrySchema.safeParse(next);

  if (!parsed.success) {
    const reason = parsed.error.issues
      .map((issue) => formatIssue(issue.path, issue.message))
      .join('; ');
    return { ok: false, reason };
  }

  const value = parsed.data;

  if (previous !== null && Number.isFinite(previous.initialPrice) && previous.initialPrice > 0) {
    const changeRatio = Math.abs(value.initialPrice / previous.initialPrice - 1);
    if (changeRatio > MARKET_DATA_BOUNDS.maxPriceChangeRatio) {
      const changePercent = (value.initialPrice / previous.initialPrice - 1) * 100;
      return {
        ok: false,
        reason: `initialPrice moved ${changePercent.toFixed(1)}% (${previous.initialPrice} -> ${value.initialPrice}), beyond the +/-${MARKET_DATA_BOUNDS.maxPriceChangeRatio * 100}% guard; possible split or bad data`
      };
    }
  }

  return { ok: true, value };
};
