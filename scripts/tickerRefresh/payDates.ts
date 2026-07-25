import type { EstimatedPayDayByMonth, MarketDataSnapshotEntry } from '@/shared/constants/marketData';
import {
  deriveExToPayLagDays,
  derivePayDaysByMonth,
  inferPayoutMonths,
  toPaymentDatePayments
} from './derive';
import type { DividendScheduleRecord } from './derive';

/** What one ticker's pay-date refresh produced. Pure — the CLI decides what to do with it. */
export type PayDateOutcome =
  | { ticker: string; status: 'updated'; patch: PayDatePatch; before: PayDateFields }
  | { ticker: string; status: 'unchanged' }
  | { ticker: string; status: 'skipped'; reason: string }
  | { ticker: string; status: 'failed'; reason: string };

/** The subset of a snapshot entry this pipeline owns. Nothing else may be written from here. */
export type PayDateFields = Pick<
  MarketDataSnapshotEntry,
  'payoutMonths' | 'exToPayLagDays' | 'payoutMonthsSource' | 'estimatedPayDayByMonth'
>;

export type PayDatePatch = Required<Pick<PayDateFields, 'payoutMonths' | 'payoutMonthsSource'>> &
  Pick<PayDateFields, 'exToPayLagDays' | 'estimatedPayDayByMonth'>;

const sameMonths = (left: readonly number[] | undefined, right: readonly number[]): boolean =>
  left !== undefined && left.length === right.length && left.every((month, index) => month === right[index]);

/** Key-for-key equality. Both sides are small (≤12 integer entries) keyed by month string. */
const samePayDays = (
  left: EstimatedPayDayByMonth | undefined,
  right: EstimatedPayDayByMonth | undefined
): boolean => {
  if (left === undefined || right === undefined) return left === right;
  const leftKeys = Object.keys(left);
  if (leftKeys.length !== Object.keys(right).length) return false;
  return leftKeys.every((month) => left[month] === right[month]);
};

/**
 * Turns a ticker's dividend schedule into the pay-date fields of its snapshot entry.
 *
 * The months come from **payment dates**, not ex-dates. That is the whole point of this pipeline:
 * the daily refresh can only see ex-dates, and near a month boundary the two disagree by a month
 * (a fund whose ex-date is the 30th pays in the following month). Months derived here are therefore
 * marked `payoutMonthsSource: 'pay'` and outrank anything the daily refresh inferred.
 *
 * Returns `skipped` rather than an empty patch when the schedule yields nothing usable — an empty
 * result must never overwrite a good one.
 */
export const buildPayDatePatch = (
  ticker: string,
  records: readonly DividendScheduleRecord[],
  previous: PayDateFields | undefined
): PayDateOutcome => {
  if (records.length === 0) {
    return { ticker, status: 'skipped', reason: 'no dividend records' };
  }

  // The frequency the entry already believes is the right cap: this pipeline observes *when*, not
  // *how often*, and re-deriving frequency from a different source would let the two disagree.
  const frequency = previousFrequencyOf(previous);
  const payments = toPaymentDatePayments(records);
  const months = inferPayoutMonths(payments, frequency);

  if (months === null || months.length === 0) {
    return { ticker, status: 'skipped', reason: 'could not infer payout months from payment dates' };
  }

  const exToPayLagDays = deriveExToPayLagDays(records) ?? undefined;

  // The day of month, taken from the same payment dates that produced `months` — no lag arithmetic
  // in between. The daily refresh can only *estimate* this by shifting ex-dates forward by the
  // median lag; a direct reading is exact, so this pipeline owns the field whenever it can compute
  // it (see the carry-over note in refresh.ts). Keyed by month, so it stays a subset of `months`.
  const estimatedPayDayByMonth = derivePayDaysByMonth(records, months) ?? undefined;

  if (
    previous?.payoutMonthsSource === 'pay' &&
    sameMonths(previous.payoutMonths, months) &&
    previous.exToPayLagDays === exToPayLagDays &&
    samePayDays(previous.estimatedPayDayByMonth, estimatedPayDayByMonth)
  ) {
    return { ticker, status: 'unchanged' };
  }

  return {
    ticker,
    status: 'updated',
    before: {
      payoutMonths: previous?.payoutMonths,
      exToPayLagDays: previous?.exToPayLagDays,
      payoutMonthsSource: previous?.payoutMonthsSource,
      estimatedPayDayByMonth: previous?.estimatedPayDayByMonth
    },
    patch: {
      payoutMonths: months,
      payoutMonthsSource: 'pay',
      ...(exToPayLagDays === undefined ? {} : { exToPayLagDays }),
      ...(estimatedPayDayByMonth === undefined ? {} : { estimatedPayDayByMonth })
    }
  };
};

/**
 * The cap for how many distinct months to keep. Read off the existing entry's month count when the
 * daily refresh already inferred one, because that count came from the inferred frequency.
 *
 * Falls back to `monthly`, which keeps every month rather than dropping real ones — over-reporting
 * a month is visible and fixable, silently deleting one is not.
 */
const previousFrequencyOf = (previous: PayDateFields | undefined): 'monthly' | 'quarterly' | 'semiannual' | 'annual' => {
  const count = previous?.payoutMonths?.length;
  if (count === undefined) return 'monthly';
  if (count >= 12) return 'monthly';
  if (count >= 4) return 'quarterly';
  if (count >= 2) return 'semiannual';
  return 'annual';
};
