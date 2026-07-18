import type { MarketDataEntry, MarketDataSnapshot, MarketDataSnapshotEntry } from '@/shared/constants/marketData';
import { toDerivedDividendGrowthPercent } from '@/shared/lib/snowball';
import { computeDividendCagr, computeTtmYield, inferFrequency, roundTo } from './derive';
import { checkDerivedDividendGrowth, validateEntry } from './guards';
import type { TickerDataProvider } from './provider';

export type FieldChange = {
  field: keyof MarketDataSnapshotEntry;
  before: number | string;
  after: number | string;
  changePercent: number | null;
};

/**
 * What the refreshed yield implies for the curated total-return assumption.
 *
 * The engine growth rate is `derivedDividendGrowth = expectedTotalReturn - dividendYield`, while the
 * market's *observed* payout CAGR is an independent number. When the two disagree by a lot, the
 * curated `expectedTotalReturn` is the thing worth re-examining — which is a human's call, so we
 * only report it.
 */
export type CagrReview = {
  ticker: string;
  /** Curated assumption. Never auto-updated. */
  expectedTotalReturn: number;
  /** Refreshed TTM yield. */
  dividendYield: number;
  /** What the engine will actually use: `expectedTotalReturn - dividendYield`. */
  derivedDividendGrowth: number;
  /** Historical payout CAGR observed from the dividend history. Reference only. */
  observedDividendCagr: number;
  /**
   * `observedDividendCagr - derivedDividendGrowth`, in percentage points.
   *
   * Identically equal to `(dividendYield + observedDividendCagr) - expectedTotalReturn`, i.e. the gap
   * between the total return the market's own history implies and the one the curator assumed.
   */
  divergence: number;
};

export type TickerOutcome =
  | {
      ticker: string;
      status: 'updated';
      value: MarketDataSnapshotEntry;
      changes: FieldChange[];
      /** Absolute magnitude of the largest relative move, used to rank "biggest movers". */
      magnitude: number;
      /** Soft guard hits. The value was still written; a human should look. */
      warnings: string[];
      /** `null` when the ticker has no curated `expectedTotalReturn` or no observable CAGR. */
      review: CagrReview | null;
    }
  | { ticker: string; status: 'rejected'; reason: string }
  | { ticker: string; status: 'failed'; reason: string };

export type RefreshResult = {
  snapshot: MarketDataSnapshot;
  outcomes: TickerOutcome[];
  attempted: number;
  updated: number;
  rejected: number;
  failed: number;
  /**
   * Share of attempted tickers that produced no usable data (rejected by a guard, or the provider
   * errored). Above `UNUSABLE_RATE_FAIL_THRESHOLD` the run is treated as broken rather than noisy.
   */
  unusableRate: number;
};

export type RefreshOptions = {
  tickers: readonly string[];
  /** Values currently in effect (curated presets with the previous snapshot already overlaid). */
  previousByTicker: Readonly<Record<string, MarketDataEntry>>;
  /** The snapshot on disk. Entries for tickers we skip or reject are carried over untouched. */
  previousSnapshot: MarketDataSnapshot;
  /**
   * Curated total-return assumptions, keyed by ticker. Never written to the snapshot — used only to
   * derive what the refreshed yield implies for growth, and to flag the cases a human should review.
   */
  expectedTotalReturnByTicker?: Readonly<Record<string, number>>;
  provider: TickerDataProvider;
  /** ISO date the run is anchored to. Injected so the pipeline is deterministic in tests. */
  asOf: string;
  cagrYears?: number;
  delayMs?: number;
  sleep?: (ms: number) => Promise<void>;
};

/** Above this share of unusable tickers, the refresh is considered a failure (CI should stop). */
export const UNUSABLE_RATE_FAIL_THRESHOLD = 0.3;

const DEFAULT_CAGR_YEARS = 5;
const DEFAULT_DELAY_MS = 200;

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const percentChange = (before: number, after: number): number | null => {
  if (!Number.isFinite(before) || before === 0) return null;
  return ((after - before) / Math.abs(before)) * 100;
};

/** Diffs a candidate against the values currently in effect. */
const diffEntry = (previous: MarketDataEntry, next: MarketDataSnapshotEntry): FieldChange[] => {
  const changes: FieldChange[] = [];

  const numericFields = ['initialPrice', 'dividendYield'] as const;
  for (const field of numericFields) {
    if (previous[field] !== next[field]) {
      changes.push({
        field,
        before: previous[field],
        after: next[field],
        changePercent: percentChange(previous[field], next[field])
      });
    }
  }

  if (previous.frequency !== next.frequency) {
    changes.push({
      field: 'frequency',
      before: previous.frequency,
      after: next.frequency,
      changePercent: null
    });
  }

  return changes;
};

const magnitudeOf = (changes: readonly FieldChange[]): number =>
  changes.reduce(
    (max, change) => (change.changePercent === null ? max : Math.max(max, Math.abs(change.changePercent))),
    0
  );

const reviewOf = (
  ticker: string,
  entry: MarketDataSnapshotEntry,
  expectedTotalReturn: number | undefined
): CagrReview | null => {
  if (expectedTotalReturn === undefined || entry.observedDividendCagr === undefined) return null;

  const derivedDividendGrowth = toDerivedDividendGrowthPercent(expectedTotalReturn, entry.dividendYield);

  return {
    ticker,
    expectedTotalReturn,
    dividendYield: entry.dividendYield,
    derivedDividendGrowth,
    observedDividendCagr: entry.observedDividendCagr,
    divergence: roundTo(entry.observedDividendCagr - derivedDividendGrowth, 2)
  };
};

/**
 * Fetches, derives, validates and merges market data for the given tickers.
 *
 * Only observable facts are written: `initialPrice`, `dividendYield` and `frequency`. The historical
 * dividend CAGR is still computed, but lands in `observedDividendCagr` as a **reference field** — it
 * is not an engine input, because under the coherent model `dividendGrowth` *is* the price growth
 * rate and therefore an assumption the curator owns via `expectedTotalReturn`.
 *
 * Everything except `provider` is pure, so the whole pipeline is exercised offline in tests by
 * injecting a fixture provider. Rejected and failed tickers keep whatever value they had, which
 * means a bad upstream response degrades to "no change" rather than to corrupted data.
 */
export const refreshTickers = async ({
  tickers,
  previousByTicker,
  previousSnapshot,
  expectedTotalReturnByTicker = {},
  provider,
  asOf,
  cagrYears = DEFAULT_CAGR_YEARS,
  delayMs = DEFAULT_DELAY_MS,
  sleep = defaultSleep
}: RefreshOptions): Promise<RefreshResult> => {
  const entries: Record<string, MarketDataSnapshotEntry> = { ...previousSnapshot.entries };
  const outcomes: TickerOutcome[] = [];

  for (const [index, ticker] of tickers.entries()) {
    if (index > 0 && delayMs > 0) await sleep(delayMs);

    const previous = previousByTicker[ticker] ?? null;
    const previousObservedCagr = previousSnapshot.entries[ticker]?.observedDividendCagr;

    try {
      const price = await provider.fetchQuote(ticker);
      const dividends = await provider.fetchDividends(ticker);

      const ttmYield = computeTtmYield(dividends, price, asOf);
      const cagr = computeDividendCagr(dividends, cagrYears);
      const frequency = inferFrequency(dividends);

      const observedDividendCagr = cagr === null ? previousObservedCagr : roundTo(cagr, 2);

      // A field we cannot derive is left at its previous value rather than guessed, so a ticker
      // with a thin dividend history still gets its price refreshed.
      const candidate = {
        initialPrice: roundTo(price, 2),
        dividendYield: ttmYield === null ? previous?.dividendYield : roundTo(ttmYield, 2),
        frequency: frequency ?? previous?.frequency,
        // Omitted (not `undefined`) when unknown, so the generated JSON stays clean.
        ...(observedDividendCagr === undefined ? {} : { observedDividendCagr })
      };

      const validation = validateEntry(candidate, previous);

      if (!validation.ok) {
        outcomes.push({ ticker, status: 'rejected', reason: validation.reason });
        continue;
      }

      entries[ticker] = validation.value;

      const expectedTotalReturn = expectedTotalReturnByTicker[ticker];
      const derivedGrowthWarning =
        expectedTotalReturn === undefined
          ? null
          : checkDerivedDividendGrowth({
              dividendYield: validation.value.dividendYield,
              expectedTotalReturn
            });

      const changes = previous === null ? [] : diffEntry(previous, validation.value);
      outcomes.push({
        ticker,
        status: 'updated',
        value: validation.value,
        changes,
        magnitude: magnitudeOf(changes),
        warnings: derivedGrowthWarning === null ? [] : [derivedGrowthWarning],
        review: reviewOf(ticker, validation.value, expectedTotalReturn)
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      outcomes.push({ ticker, status: 'failed', reason });
    }
  }

  const updated = outcomes.filter((outcome) => outcome.status === 'updated').length;
  const rejected = outcomes.filter((outcome) => outcome.status === 'rejected').length;
  const failed = outcomes.filter((outcome) => outcome.status === 'failed').length;
  const attempted = outcomes.length;

  return {
    snapshot: {
      asOf,
      source: provider.name,
      entries
    },
    outcomes,
    attempted,
    updated,
    rejected,
    failed,
    unusableRate: attempted === 0 ? 0 : (rejected + failed) / attempted
  };
};
