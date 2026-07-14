import { MARKET_DATA_BOUNDS, marketDataSnapshotEntrySchema } from '@/shared/constants/marketData';
import type { MarketDataEntry, MarketDataSnapshotEntry } from '@/shared/constants/marketData';
import { toDerivedDividendGrowthPercent } from '@/shared/lib/snowball';

export type ValidationResult =
  | { ok: true; value: MarketDataSnapshotEntry }
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
 * - `observedDividendCagr` (reference-only) outside -50..50 %
 * - `initialPrice` <= 0
 * - `initialPrice` moving more than +/-50% vs the previous known price (split or bad data —
 *   a human should confirm)
 * - `frequency` not one of the four known literals
 *
 * There is deliberately no `dividendGrowth` check: the pipeline no longer produces one. Growth is
 * derived from the curated `expectedTotalReturn` downstream — see `checkDerivedDividendGrowth`.
 *
 * A rejected entry is never written: the caller keeps the previous (curated or last-good) value.
 */
export const validateEntry = (next: unknown, previous: MarketDataEntry | null): ValidationResult => {
  const parsed = marketDataSnapshotEntrySchema.safeParse(next);

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

/**
 * A soft guard on the *consequence* of a refresh, not on the refreshed value itself. Pure.
 *
 * The engine's growth rate is derived as `expectedTotalReturn - dividendYield`. So a refreshed yield
 * that exceeds the curated total-return assumption silently turns the asset into a shrinking one
 * (negative price growth). For a covered-call fund that is a legitimate model — its NAV really does
 * erode. For a dividend-growth ETF it means either bad data (a special dividend counted as
 * recurring, a stale price) or a curated `expectedTotalReturn` that reality has outgrown.
 *
 * Either way it is a judgement call, so this warns rather than rejects: the number is still written,
 * and the report surfaces it for a human.
 */
export const checkDerivedDividendGrowth = ({
  dividendYield,
  expectedTotalReturn
}: {
  dividendYield: number;
  expectedTotalReturn: number;
}): string | null => {
  const derived = toDerivedDividendGrowthPercent(expectedTotalReturn, dividendYield);
  if (derived >= 0) return null;

  return `dividendYield ${dividendYield.toFixed(2)}% exceeds the curated expectedTotalReturn ${expectedTotalReturn.toFixed(2)}%, so the derived dividendGrowth is ${derived.toFixed(2)}% (negative price growth). Expected for a covered-call fund; a data or curation error for a dividend-growth fund.`;
};
