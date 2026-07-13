import type { MarketDataEntry, MarketDataSnapshot } from '@/shared/constants/marketData';
import { computeDividendCagr, computeTtmYield, inferFrequency, roundTo } from './derive';
import { validateEntry } from './guards';
import type { TickerDataProvider } from './provider';

export type FieldChange = {
  field: keyof MarketDataEntry;
  before: number | string;
  after: number | string;
  changePercent: number | null;
};

export type TickerOutcome =
  | {
      ticker: string;
      status: 'updated';
      value: MarketDataEntry;
      changes: FieldChange[];
      /** Absolute magnitude of the largest relative move, used to rank "biggest movers". */
      magnitude: number;
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
const diffEntry = (previous: MarketDataEntry, next: MarketDataEntry): FieldChange[] => {
  const changes: FieldChange[] = [];

  const numericFields = ['initialPrice', 'dividendYield', 'dividendGrowth'] as const;
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

/**
 * Fetches, derives, validates and merges market data for the given tickers.
 *
 * Everything except `provider` is pure, so the whole pipeline is exercised offline in tests by
 * injecting a fixture provider. Rejected and failed tickers keep whatever value they had, which
 * means a bad upstream response degrades to "no change" rather than to corrupted data.
 */
export const refreshTickers = async ({
  tickers,
  previousByTicker,
  previousSnapshot,
  provider,
  asOf,
  cagrYears = DEFAULT_CAGR_YEARS,
  delayMs = DEFAULT_DELAY_MS,
  sleep = defaultSleep
}: RefreshOptions): Promise<RefreshResult> => {
  const entries: Record<string, MarketDataEntry> = { ...previousSnapshot.entries };
  const outcomes: TickerOutcome[] = [];

  for (const [index, ticker] of tickers.entries()) {
    if (index > 0 && delayMs > 0) await sleep(delayMs);

    const previous = previousByTicker[ticker] ?? null;

    try {
      const price = await provider.fetchQuote(ticker);
      const dividends = await provider.fetchDividends(ticker);

      const ttmYield = computeTtmYield(dividends, price, asOf);
      const cagr = computeDividendCagr(dividends, cagrYears);
      const frequency = inferFrequency(dividends);

      // A field we cannot derive is left at its previous value rather than guessed, so a ticker
      // with a thin dividend history still gets its price refreshed.
      const candidate = {
        initialPrice: roundTo(price, 2),
        dividendYield: ttmYield === null ? previous?.dividendYield : roundTo(ttmYield, 2),
        dividendGrowth: cagr === null ? previous?.dividendGrowth : roundTo(cagr, 2),
        frequency: frequency ?? previous?.frequency
      };

      const validation = validateEntry(candidate, previous);

      if (!validation.ok) {
        outcomes.push({ ticker, status: 'rejected', reason: validation.reason });
        continue;
      }

      entries[ticker] = validation.value;

      const changes = previous === null ? [] : diffEntry(previous, validation.value);
      outcomes.push({
        ticker,
        status: 'updated',
        value: validation.value,
        changes,
        magnitude: magnitudeOf(changes)
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
