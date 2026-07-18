import { describe, expect, it } from 'vitest';
import { BUCKET_COUNT, partitionTickers, tickersInBucket } from '@/scripts/tickerRefresh';
import { CURATED_DIVIDEND_UNIVERSE } from '@/shared/constants/presets';

const UNIVERSE_TICKERS = Object.keys(CURATED_DIVIDEND_UNIVERSE);

describe('partitionTickers', () => {
  it('covers the whole universe with no duplicates and no omissions', () => {
    const buckets = partitionTickers(UNIVERSE_TICKERS);
    const flattened = buckets.flat();

    expect(buckets).toHaveLength(BUCKET_COUNT);
    expect(new Set(flattened).size).toBe(flattened.length); // no duplicates
    expect(flattened).toHaveLength(UNIVERSE_TICKERS.length); // no omissions
    expect(new Set(flattened)).toEqual(new Set(UNIVERSE_TICKERS));
  });

  it('balances bucket sizes to within 1 of each other', () => {
    const buckets = partitionTickers(UNIVERSE_TICKERS);
    const sizes = buckets.map((bucket) => bucket.length);

    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it('is deterministic regardless of the input order (sorts before partitioning)', () => {
    const shuffled = [...UNIVERSE_TICKERS].reverse();

    expect(partitionTickers(UNIVERSE_TICKERS)).toEqual(partitionTickers(shuffled));
  });

  it('is deterministic across repeated calls with the same input', () => {
    expect(partitionTickers(UNIVERSE_TICKERS)).toEqual(partitionTickers(UNIVERSE_TICKERS));
  });

  it('partitions a small, exact example predictably', () => {
    const buckets = partitionTickers(['E', 'C', 'A', 'D', 'B'], 5);
    // Sorted: A, B, C, D, E -> index i -> bucket i (bucketCount 5, 5 tickers).
    expect(buckets).toEqual([['A'], ['B'], ['C'], ['D'], ['E']]);
  });

  it('wraps around when there are more tickers than buckets', () => {
    // Sorted: A..G (7 tickers) into 5 buckets -> A,F in bucket0; B,G in bucket1; C/D/E alone.
    const buckets = partitionTickers(['G', 'F', 'E', 'D', 'C', 'B', 'A'], 5);
    expect(buckets).toEqual([['A', 'F'], ['B', 'G'], ['C'], ['D'], ['E']]);
  });

  it('supports a bucket count other than the default', () => {
    const buckets = partitionTickers(['A', 'B', 'C', 'D'], 2);
    expect(buckets).toEqual([
      ['A', 'C'],
      ['B', 'D']
    ]);
  });

  it('returns bucketCount empty arrays for an empty universe', () => {
    expect(partitionTickers([])).toEqual([[], [], [], [], []]);
  });
});

describe('tickersInBucket', () => {
  it('matches the corresponding entry from partitionTickers', () => {
    const buckets = partitionTickers(UNIVERSE_TICKERS);

    for (let index = 0; index < BUCKET_COUNT; index += 1) {
      expect(tickersInBucket(UNIVERSE_TICKERS, index)).toEqual(buckets[index]);
    }
  });

  it('returns an empty array for a bucket index outside range', () => {
    expect(tickersInBucket(UNIVERSE_TICKERS, 5)).toEqual([]);
    expect(tickersInBucket(UNIVERSE_TICKERS, -1)).toEqual([]);
  });
});
