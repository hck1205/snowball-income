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
