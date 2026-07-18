/** Number of weekday buckets (Mon-Fri) the universe is split across for the daily refresh cron. */
export const BUCKET_COUNT = 5;

/**
 * Deterministically splits `tickers` into `bucketCount` buckets: sorts first (so the result is
 * independent of the input's iteration order - e.g. `Object.keys` insertion order, which is not a
 * property anyone should rely on), then assigns `sorted[i]` to `bucket[i % bucketCount]`.
 *
 * Every ticker lands in exactly one bucket (the buckets partition the input - no duplicates, no
 * omissions), and bucket sizes differ by at most 1.
 *
 * Pure - no I/O, no clock - so which tickers a given weekday touches is reproducible and
 * unit-tested without a network. The day-of-week -> bucket index mapping itself lives in the
 * workflow (`.github/workflows/refresh-tickers.yml`), not here, so this stays a plain,
 * clock-independent function.
 */
export const partitionTickers = (
  tickers: readonly string[],
  bucketCount: number = BUCKET_COUNT
): string[][] => {
  const buckets: string[][] = Array.from({ length: bucketCount }, () => []);
  const sorted = [...tickers].sort();

  sorted.forEach((ticker, index) => {
    buckets[index % bucketCount].push(ticker);
  });

  return buckets;
};

/** Convenience: just the one bucket a CLI run needs. A `bucketIndex` outside range yields `[]`. */
export const tickersInBucket = (
  tickers: readonly string[],
  bucketIndex: number,
  bucketCount: number = BUCKET_COUNT
): string[] => partitionTickers(tickers, bucketCount)[bucketIndex] ?? [];
