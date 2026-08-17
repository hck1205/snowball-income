import type { MarketDataEntry, MarketDataSnapshot, MarketDataSnapshotEntry } from '@/shared/constants/marketData';
import { toDerivedDividendGrowthPercent } from '@/shared/lib/snowball';
import {
  computeDividendCagr,
  computeTtmYield,
  deriveEstimatedPayDays,
  hasStalePayoutSchedule,
  inferFrequency,
  inferPayoutMonths,
  roundTo
} from './derive';
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
    const previousPayoutMonths = previousSnapshot.entries[ticker]?.payoutMonths;
    const previousPayoutMonthsSource = previousSnapshot.entries[ticker]?.payoutMonthsSource;
    const previousExToPayLagDays = previousSnapshot.entries[ticker]?.exToPayLagDays;
    const previousEstimatedPayDays = previousSnapshot.entries[ticker]?.estimatedPayDayByMonth;

    try {
      const price = await provider.fetchQuote(ticker);
      const dividends = await provider.fetchDividends(ticker);

      const ttmYield = computeTtmYield(dividends, price, asOf);
      const cagr = computeDividendCagr(dividends, cagrYears);
      const frequency = inferFrequency(dividends);

      const observedDividendCagr = cagr === null ? previousObservedCagr : roundTo(cagr, 2);

      // Payout months need a frequency to know how many months to keep, so they are derived from
      // the *effective* frequency (freshly inferred, or the previous one when inference failed).
      // Like every other derived field: unknown → keep the previous value rather than guess.
      const effectiveFrequency = frequency ?? previous?.frequency;
      const inferredMonths =
        effectiveFrequency === undefined
          ? previousPayoutMonths
          : (inferPayoutMonths(dividends, effectiveFrequency) ?? previousPayoutMonths);

      /*
       * 🔴 지급이 오래 끊긴 종목은 **일정을 주장하지 않는다** — 새로 추론하지도, 이전 값을 이어받지도
       * 않는다(`payoutMonths`·`payoutMonthsSource` 를 통째로 비운다).
       *
       * `inferPayoutMonths` 는 마지막 지급일 기준 3년 창을 보므로, 배당을 중단한 종목도 중단 이전
       * 이력으로 지급월을 계속 만든다(인텔: 마지막 지급 2024-08-07 인데 2026년에도 `[2,5,8,11]`).
       * 배당 캘린더는 지급월이 있으면 그것을 무배당 판정보다 **먼저** 믿기 때문에, 그대로 두면 2년째
       * 한 푼도 안 주는 종목이 분기 배당 종목으로 화면에 뜬다.
       *
       * 이건 "모르면 이전 값을 지킨다"의 예외가 아니다 — `hasStalePayoutSchedule` 은 **이력이 실재하고
       * 그 마지막이 오래됐을 때만** true 라, 지우는 근거가 추측이 아니라 관측이다. 공급자가 빈 이력을
       * 준 경우(이상치)는 false 라 이전 값이 그대로 남는다.
       *
       * 실측 지급일(`'pay'`)도 함께 비운다. 출처가 좋아도 **끊긴 일정**인 것은 마찬가지다.
       */
      const scheduleIsStale = hasStalePayoutSchedule(dividends, asOf);

      // ⚠ Months already derived from real **payment dates** (`ticker:paydates`) outrank anything
      // inferred here from ex-dates — this source cannot see the pay date at all. Without this
      // guard the daily price refresh would quietly downgrade the better data every morning.
      const keepsPaySourced =
        !scheduleIsStale && previousPayoutMonthsSource === 'pay' && previousPayoutMonths !== undefined;
      const payoutMonths = scheduleIsStale ? undefined : keepsPaySourced ? previousPayoutMonths : inferredMonths;
      // ⚠ `payoutMonthsSource: 'none'` ("ticker:paydates confirmed no dividend history") is this
      // pipeline's to preserve, not to produce — it never fetches a payment-date schedule itself.
      // When months are still undefined (this refresh could not infer any either) the marker must
      // survive untouched, or the daily price refresh would silently erase it and the next
      // `ticker:paydates` run would spend quota re-confirming the same ticker forever. The moment
      // Yahoo *does* infer months (a dividend was initiated), the `'ex'` branch below wins instead —
      // that is the natural, correct way for the marker to lift.
      const payoutMonthsSource = keepsPaySourced
        ? previousPayoutMonthsSource
        : payoutMonths === undefined
          ? previousPayoutMonthsSource === 'none'
            ? ('none' as const)
            : undefined
          : ('ex' as const);

      // The day of month cash lands. Needs both a measured ex→pay lag and *pay*-sourced months —
      // ex-sourced months are a different basis and mixing the two would put a day on the wrong
      // month. Either gap means no estimate rather than a guess.
      //
      // ⚠ `ticker:paydates` now derives this field **directly from the observed payment dates**
      // (`derivePayDaysByMonth`) and writes it alongside the pay-sourced months. A direct reading
      // beats the estimate below, which shifts ex-dates by a *median* lag and therefore misses by a
      // few days whenever the real lag moved — and by a whole month near a month edge, which is why
      // it needs a boundary-repair rule at all. So when the entry already carries a value and its
      // months are still pay-sourced (i.e. the two describe the same months), it is carried over
      // untouched rather than recomputed. Without this the daily price refresh would overwrite the
      // better data every morning, exactly as it would have done to `payoutMonths` above.
      //
      // The estimate is still the fallback for pay-sourced entries that have no day yet (upgraded by
      // a paydates run from before that function existed) — a rough day beats "date unknown".
      // It is deliberately **not** carried over when the months are no longer pay-sourced: a stale
      // day that disagrees with today's `payoutMonths` is worse than no day.
      const estimatedPayDayByMonth =
        keepsPaySourced && previousEstimatedPayDays !== undefined
          ? previousEstimatedPayDays
          : previousExToPayLagDays === undefined || payoutMonthsSource !== 'pay' || payoutMonths === undefined
            ? undefined
            : (deriveEstimatedPayDays({
                dividends,
                exToPayLagDays: previousExToPayLagDays,
                payMonths: payoutMonths
              }) ?? undefined);

      // A field we cannot derive is left at its previous value rather than guessed, so a ticker
      // with a thin dividend history still gets its price refreshed.
      const candidate = {
        initialPrice: roundTo(price, 2),
        dividendYield: ttmYield === null ? previous?.dividendYield : roundTo(ttmYield, 2),
        frequency: frequency ?? previous?.frequency,
        // Omitted (not `undefined`) when unknown, so the generated JSON stays clean.
        ...(observedDividendCagr === undefined ? {} : { observedDividendCagr }),
        ...(payoutMonths === undefined ? {} : { payoutMonths }),
        ...(payoutMonthsSource === undefined ? {} : { payoutMonthsSource }),
        // Owned by `ticker:paydates`; carried through untouched so a price refresh never drops it.
        ...(previousExToPayLagDays === undefined ? {} : { exToPayLagDays: previousExToPayLagDays }),
        ...(estimatedPayDayByMonth === undefined ? {} : { estimatedPayDayByMonth })
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
