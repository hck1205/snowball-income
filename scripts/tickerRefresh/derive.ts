import type { EstimatedPayDayByMonth } from '@/shared/constants/marketData';
import type { Frequency } from '@/shared/types';

/** A single dividend payment. `date` is an ISO date (YYYY-MM-DD), `amount` is per share. */
export type DividendPayment = {
  date: string;
  amount: number;
};

const MS_PER_DAY = 86_400_000;

/** Median interval (days) thresholds used to disambiguate a noisy payment count. */
const MONTHLY_MAX_GAP_DAYS = 45;

const toTime = (isoDate: string): number | null => {
  const time = Date.parse(isoDate);
  return Number.isNaN(time) ? null : time;
};

/** Keeps only payments that are usable: a parseable date and a finite, positive amount. */
const sanitize = (dividends: readonly DividendPayment[]): { time: number; amount: number }[] =>
  dividends
    .map((payment) => {
      const time = toTime(payment.date);
      if (time === null) return null;
      if (!Number.isFinite(payment.amount) || payment.amount <= 0) return null;
      return { time, amount: payment.amount };
    })
    .filter((payment): payment is { time: number; amount: number } => payment !== null)
    .sort((left, right) => left.time - right.time);

/** Subtracts whole years from an ISO date, in UTC. */
const minusYears = (time: number, years: number): number => {
  const date = new Date(time);
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date.getTime();
};

const median = (values: readonly number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

/**
 * Rounds to `digits` decimals.
 *
 * Shifts the exponent through the decimal string rather than multiplying by a power of ten:
 * `1.005 * 100` is `100.49999999999999` in binary floating point, which would round *down* to
 * `1.00`. Re-parsing `"1.005e2"` gives exactly `100.5`, so decimal ties round the way a human
 * reading a price expects.
 */
export const roundTo = (value: number, digits: number): number => {
  if (!Number.isFinite(value)) return value;

  const asString = value.toString();
  // Values already in exponential notation (1e-7) cannot take an appended exponent.
  if (asString.includes('e') || asString.includes('E')) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  const rounded = Math.round(Number(`${asString}e${digits}`));
  const result = Number(`${rounded}e-${digits}`);
  return Object.is(result, -0) ? 0 : result;
};

/**
 * Trailing-twelve-month dividend yield as a percentage: sum of dividends paid in the 12 months
 * ending at `asOf`, divided by the current price.
 *
 * Returns `null` when it cannot be computed (bad price, unparseable `asOf`, or no payments in
 * the window). `null` means "unknown" — callers keep the previous value rather than claiming 0%.
 */
export const computeTtmYield = (
  dividends: readonly DividendPayment[],
  price: number,
  asOf: string
): number | null => {
  if (!Number.isFinite(price) || price <= 0) return null;

  const asOfTime = toTime(asOf);
  if (asOfTime === null) return null;

  const windowStart = minusYears(asOfTime, 1);
  const payments = sanitize(dividends).filter(
    (payment) => payment.time > windowStart && payment.time <= asOfTime
  );

  if (payments.length === 0) return null;

  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return (total / price) * 100;
};

/**
 * Infers the payout frequency from the payment history.
 *
 * Primary signal is the number of payments in the trailing 12 months (from the most recent
 * payment, so stale data does not undercount). Because special dividends inflate that count and
 * skipped months deflate it, an ambiguous count (5-9) is disambiguated by the *median* interval
 * between payments, which is resistant to a single outlier.
 *
 * Returns `null` when there is no payment history at all.
 */
export const inferFrequency = (dividends: readonly DividendPayment[]): Frequency | null => {
  const payments = sanitize(dividends);
  if (payments.length === 0) return null;

  const latest = payments[payments.length - 1].time;
  const trailing = payments.filter((payment) => payment.time > minusYears(latest, 1));
  const count = trailing.length;

  if (count >= 10) return 'monthly';

  if (count >= 5) {
    const gaps = trailing
      .slice(1)
      .map((payment, index) => (payment.time - trailing[index].time) / MS_PER_DAY);
    const medianGap = median(gaps);
    if (medianGap !== null && medianGap <= MONTHLY_MAX_GAP_DAYS) return 'monthly';
    return 'quarterly';
  }

  if (count >= 3) return 'quarterly';
  if (count === 2) return 'semiannual';
  return 'annual';
};

/** Sums dividends per calendar (UTC) year. */
const sumByYear = (payments: readonly { time: number; amount: number }[]): Map<number, number> => {
  const byYear = new Map<number, number>();
  for (const payment of payments) {
    const year = new Date(payment.time).getUTCFullYear();
    byYear.set(year, (byYear.get(year) ?? 0) + payment.amount);
  }
  return byYear;
};

/** Counts payments per calendar (UTC) year. */
const countByYear = (payments: readonly { time: number; amount: number }[]): Map<number, number> => {
  const byYear = new Map<number, number>();
  for (const payment of payments) {
    const year = new Date(payment.time).getUTCFullYear();
    byYear.set(year, (byYear.get(year) ?? 0) + 1);
  }
  return byYear;
};

const EXPECTED_PAYMENTS_PER_YEAR: Record<Frequency, number> = {
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1
};

/**
 * Compound annual growth rate (%) of the annual dividend total, over `years` years.
 *
 * Uses calendar-year sums and drops the most recent year when it looks incomplete (fewer payments
 * than the inferred frequency implies), so a partially-elapsed year cannot fake a dividend cut.
 *
 * Returns `null` when there is not enough complete history, or when the base year is not positive.
 */
export const computeDividendCagr = (
  dividends: readonly DividendPayment[],
  years: number
): number | null => {
  if (!Number.isInteger(years) || years < 1) return null;

  const payments = sanitize(dividends);
  if (payments.length === 0) return null;

  const frequency = inferFrequency(dividends);
  if (frequency === null) return null;

  const totals = sumByYear(payments);
  const counts = countByYear(payments);
  const presentYears = [...totals.keys()].sort((left, right) => left - right);

  const latestYear = presentYears[presentYears.length - 1];
  const latestYearIsComplete =
    (counts.get(latestYear) ?? 0) >= EXPECTED_PAYMENTS_PER_YEAR[frequency];
  const endYear = latestYearIsComplete ? latestYear : latestYear - 1;
  const startYear = endYear - years;

  const endTotal = totals.get(endYear);
  const startTotal = totals.get(startYear);

  // Both endpoints must be real, complete years of data.
  if (endTotal === undefined || startTotal === undefined) return null;
  if (startTotal <= 0 || endTotal <= 0) return null;
  if ((counts.get(startYear) ?? 0) < EXPECTED_PAYMENTS_PER_YEAR[frequency]) return null;

  return ((endTotal / startTotal) ** (1 / years) - 1) * 100;
};

/** How many years of history the payout-month inference looks at. */
const PAYOUT_MONTH_YEARS = 3;

/** Payments expected per year for each frequency — the number of distinct months to keep. */
const PAYMENTS_PER_YEAR: Record<Frequency, number> = {
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1
};

/**
 * Infers **which calendar months** a ticker actually pays in (1-12, ascending).
 *
 * `inferFrequency` answers "how often", which is all the engine needs. A dividend calendar needs
 * "when": SCHD and JEPI are both "quarterly-ish" to the engine, but one pays in Mar/Jun/Sep/Dec and
 * the other every month. Without this, a calendar can only say "four times a year" — which is not
 * worth a screen.
 *
 * ## Why counting, not just "the last N payments"
 * Special dividends and the occasional shifted payment (a payout that slips from late March into
 * early April) would each add a phantom month. So this counts occurrences per month across
 * `PAYOUT_MONTH_YEARS` years and keeps the **most frequent** months, capped at the number the
 * frequency implies. A month that shows up every year outranks one that appeared once.
 *
 * Ties break toward the **earlier calendar month**, so the result is deterministic — the same
 * history must never produce two different calendars.
 *
 * Returns `null` when there is nothing usable to infer from; callers keep the previous value rather
 * than guessing (same rule as the other derived fields).
 */
export const inferPayoutMonths = (
  dividends: readonly DividendPayment[],
  frequency: Frequency
): number[] | null => {
  const payments = sanitize(dividends);
  if (payments.length === 0) return null;

  /*
   * Monthly is every month **by definition** — counting would only introduce error.
   *
   * Real case that forced this: JEPI's ex-dividend date is the first business day of the month, so
   * the January 2026 distribution is dated `2025-12-31`. Counting months gives December twice and
   * January zero, and the calendar would claim JEPI skips January. Any monthly fund whose payout
   * sits near a month boundary hits this, and the fix is not a smarter heuristic — it is refusing
   * to infer something the frequency already states.
   */
  if (frequency === 'monthly') return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const latest = payments[payments.length - 1].time;
  const windowStart = minusYears(latest, PAYOUT_MONTH_YEARS);
  const recent = payments.filter((payment) => payment.time >= windowStart);
  if (recent.length === 0) return null;

  const countByMonth = new Map<number, number>();
  for (const payment of recent) {
    const month = new Date(payment.time).getUTCMonth() + 1;
    countByMonth.set(month, (countByMonth.get(month) ?? 0) + 1);
  }

  const limit = PAYMENTS_PER_YEAR[frequency];
  return [...countByMonth.entries()]
    .sort(([leftMonth, leftCount], [rightMonth, rightCount]) => rightCount - leftCount || leftMonth - rightMonth)
    .slice(0, limit)
    .map(([month]) => month)
    .sort((left, right) => left - right);
};

/**
 * A dividend record that carries **both** dates.
 *
 * Yahoo's chart endpoint only gives the ex-date, which is what `DividendPayment` models. Alpha
 * Vantage also gives the payment date — the day cash actually lands — which is the one a calendar
 * has to show. They differ by days to weeks, and around a month boundary they differ by a *month*.
 */
export type DividendScheduleRecord = {
  /** ISO date (YYYY-MM-DD) the share went ex-dividend. */
  exDate: string;
  /** ISO date (YYYY-MM-DD) the cash was paid. */
  payDate: string;
  amount: number;
};

/** How many recent records the ex→pay lag is measured over. Older ones can reflect a retired policy. */
const LAG_SAMPLE_SIZE = 8;

/**
 * Median days between ex-date and payment date.
 *
 * Median, not mean: a single restated or mis-keyed record would drag an average by weeks, while the
 * median ignores it. Measured over the most recent records only, because a fund that changed its
 * payout calendar years ago should be described by what it does now.
 *
 * Negative or absurd gaps are dropped rather than clamped — a pay date *before* the ex-date is bad
 * data, and silently turning it into `0` would hide that.
 */
export const deriveExToPayLagDays = (records: readonly DividendScheduleRecord[]): number | null => {
  const gaps = records
    .map((record) => {
      const ex = toTime(record.exDate);
      const pay = toTime(record.payDate);
      if (ex === null || pay === null) return null;
      const days = Math.round((pay - ex) / MS_PER_DAY);
      return days >= 0 && days <= 120 ? days : null;
    })
    .filter((days): days is number => days !== null)
    .slice(0, LAG_SAMPLE_SIZE);

  const value = median(gaps);
  return value === null ? null : Math.round(value);
};

/** Payment dates as `DividendPayment[]`, so the existing month/frequency inference can run on them. */
export const toPaymentDatePayments = (records: readonly DividendScheduleRecord[]): DividendPayment[] =>
  records.map((record) => ({ date: record.payDate, amount: record.amount }));

/**
 * Month lengths for a **non-leap** year. The estimate is year-agnostic, so February is capped at 28:
 * a stored `29` would be an invalid date in three years out of four, while `28` is a valid day in
 * every year and at most one day early in a leap February.
 */
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

const lastDayOf = (month: number): number => DAYS_IN_MONTH[month - 1];

const clampDay = (month: number, day: number): number => Math.min(Math.max(day, 1), lastDayOf(month));

/** How close to a month edge an estimate must sit before it counts as a boundary artifact. */
const MONTH_BOUNDARY_DAYS = 3;

/**
 * A month bucket must recur at least this share of the busiest month's occurrences before it may be
 * shifted across a month boundary. A schedule that straddles the boundary does so most years; a
 * special dividend happens once.
 */
const MIN_SHIFT_SHARE = 0.5;

type MonthBucket = { month: number; count: number; day: number };

/**
 * Estimated **day of month** the cash lands, keyed by pay month (`'1'`..`'12'`).
 *
 * The daily refresh only ever sees **ex-dates** (that is all Yahoo's chart endpoint carries), while a
 * calendar has to show the day money actually arrives. `exToPayLagDays` — measured once from a
 * provider that reports both dates — bridges the two: shift every ex-date forward by the median lag
 * and read off the month and day of the result. Shifting *dates* rather than months is the whole
 * point: ABBV's lag is 30 days, so its January ex-date is a **February** payment, and any approach
 * that kept the ex-month key would be a month wrong for a quarter of the universe.
 *
 * ## Why a median day per month, and not the last payment's day
 * Payments move a few days for weekends and holidays, and a special dividend lands on an unrelated
 * day. The median of a month's occurrences over `PAYOUT_MONTH_YEARS` years ignores both. Ties (an
 * even number of samples) round **up**, because a calendar that promises money a day late is kinder
 * than one that promises it a day early.
 *
 * ## Reconciling with `payoutMonths`
 * `payMonths` is authoritative (it comes from real payment dates), the shifted ex-dates are an
 * estimate, so months are taken from `payMonths` and the estimate only supplies days:
 * - a bucket whose month is in `payMonths` supplies that month's day;
 * - a bucket whose month is **not** in `payMonths` but sits within `MONTH_BOUNDARY_DAYS` of the edge
 *   adjacent to a still-empty `payMonths` month is a rounding artifact of the median lag, and is
 *   moved onto that month at the boundary day (`1`, or the last day when moving backwards). Real
 *   case: KO's median lag of 17 days turns a March 14 ex-date into "March 31" when the cash actually
 *   lands April 1 — without this, April would silently have no date at all;
 * - anything else is dropped. Claiming a payment in a month the authoritative data says is empty is
 *   worse than showing no day.
 *
 * Returns `null` when nothing usable comes out; callers omit the field rather than invent a date.
 */
export const deriveEstimatedPayDays = ({
  dividends,
  exToPayLagDays,
  payMonths
}: {
  /** Ex-dividend history, as the daily refresh sees it. */
  dividends: readonly DividendPayment[];
  /** Median ex→pay lag in days. Without it there is no basis for an estimate. */
  exToPayLagDays: number;
  /** Authoritative pay months (`payoutMonths` with `payoutMonthsSource === 'pay'`). */
  payMonths: readonly number[];
}): EstimatedPayDayByMonth | null => {
  if (!Number.isFinite(exToPayLagDays) || exToPayLagDays < 0) return null;

  const allowed = new Set(payMonths.filter((month) => Number.isInteger(month) && month >= 1 && month <= 12));
  if (allowed.size === 0) return null;

  const payments = sanitize(dividends);
  if (payments.length === 0) return null;

  const latest = payments[payments.length - 1].time;
  const windowStart = minusYears(latest, PAYOUT_MONTH_YEARS);
  const recent = payments.filter((payment) => payment.time >= windowStart);
  if (recent.length === 0) return null;

  const daysByMonth = new Map<number, number[]>();
  for (const payment of recent) {
    const paid = new Date(payment.time + exToPayLagDays * MS_PER_DAY);
    const month = paid.getUTCMonth() + 1;
    const days = daysByMonth.get(month);
    if (days === undefined) daysByMonth.set(month, [paid.getUTCDate()]);
    else days.push(paid.getUTCDate());
  }

  // Busiest bucket first, then earliest month — so a collision resolves the same way every run.
  const buckets: MonthBucket[] = [...daysByMonth.entries()]
    .map(([month, days]) => ({ month, count: days.length, day: Math.round(median(days) ?? 0) }))
    .sort((left, right) => right.count - left.count || left.month - right.month);

  const dayByMonth = new Map<number, number>();
  for (const bucket of buckets) {
    if (allowed.has(bucket.month)) dayByMonth.set(bucket.month, clampDay(bucket.month, bucket.day));
  }

  const maxCount = buckets.reduce((max, bucket) => Math.max(max, bucket.count), 0);
  for (const bucket of buckets) {
    if (allowed.has(bucket.month)) continue;
    if (bucket.count < maxCount * MIN_SHIFT_SHARE) continue;

    const nextMonth = bucket.month === 12 ? 1 : bucket.month + 1;
    if (
      bucket.day > lastDayOf(bucket.month) - MONTH_BOUNDARY_DAYS &&
      allowed.has(nextMonth) &&
      !dayByMonth.has(nextMonth)
    ) {
      dayByMonth.set(nextMonth, 1);
      continue;
    }

    const previousMonth = bucket.month === 1 ? 12 : bucket.month - 1;
    if (bucket.day <= MONTH_BOUNDARY_DAYS && allowed.has(previousMonth) && !dayByMonth.has(previousMonth)) {
      dayByMonth.set(previousMonth, lastDayOf(previousMonth));
    }
  }

  if (dayByMonth.size === 0) return null;

  return Object.fromEntries(
    [...dayByMonth.entries()]
      .sort(([leftMonth], [rightMonth]) => leftMonth - rightMonth)
      .map(([month, day]) => [String(month), day])
  );
};

/**
 * Estimated **day of month** the cash lands, read straight off the **observed payment dates**.
 *
 * Same field, same contract as `deriveEstimatedPayDays` (keys `'1'`..`'12'`, a subset of
 * `payMonths`; values `1`..`31`, February clamped to 28) — but a different, strictly better basis.
 * `deriveEstimatedPayDays` exists because the daily refresh only ever sees ex-dates: it shifts each
 * ex-date by the *median* lag and reads the result. That estimate carries two errors this one does
 * not have:
 *   - the lag is a median, so every payment whose real lag differed lands a few days off;
 *   - near a month edge the shifted date crosses into the wrong month, which is why that function
 *     needs a whole boundary-shift rule to repair (KO's March 14 ex-date → "March 31" for cash that
 *     actually arrives April 1).
 * Here the payment date **is** the answer, so there is nothing to shift and no boundary rule: a
 * payment dated `2026-04-01` is April 1. That is why this pipeline's value outranks the other one.
 *
 * Median (not the latest payment) over `PAYOUT_MONTH_YEARS` years, for the same reason as
 * everywhere else: payments move a few days for weekends and holidays, and a special dividend lands
 * on an unrelated day. Ties (an even number of samples) round **up** — a calendar that promises
 * money a day late is kinder than one that promises it a day early.
 *
 * Months outside `payMonths` are dropped rather than added: `payMonths` is the authoritative set,
 * and a special dividend in an off month must not invent a payment month. Returns `null` when
 * nothing usable comes out; callers omit the field rather than invent a date.
 */
export const derivePayDaysByMonth = (
  records: readonly DividendScheduleRecord[],
  payMonths: readonly number[]
): EstimatedPayDayByMonth | null => {
  const allowed = new Set(payMonths.filter((month) => Number.isInteger(month) && month >= 1 && month <= 12));
  if (allowed.size === 0) return null;

  const payments = sanitize(toPaymentDatePayments(records));
  if (payments.length === 0) return null;

  const latest = payments[payments.length - 1].time;
  const windowStart = minusYears(latest, PAYOUT_MONTH_YEARS);

  const daysByMonth = new Map<number, number[]>();
  for (const payment of payments) {
    if (payment.time < windowStart) continue;
    const paid = new Date(payment.time);
    const month = paid.getUTCMonth() + 1;
    if (!allowed.has(month)) continue;
    const days = daysByMonth.get(month);
    if (days === undefined) daysByMonth.set(month, [paid.getUTCDate()]);
    else days.push(paid.getUTCDate());
  }

  if (daysByMonth.size === 0) return null;

  return Object.fromEntries(
    [...daysByMonth.entries()]
      .sort(([leftMonth], [rightMonth]) => leftMonth - rightMonth)
      // `Math.ceil`, not `Math.round`: a median of integers is either whole or `.5`, so the two agree
      // numerically — spelling it as a ceiling states the "tie goes to the later day" rule outright.
      .map(([month, days]) => [String(month), clampDay(month, Math.ceil(median(days) ?? 0))])
  );
};
