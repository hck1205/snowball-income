import type { MarketDataSnapshotEntry } from '@/shared/constants/marketData';

/**
 * A ticker whose `payoutMonthsSource` no longer needs today's quota spent on it: either a real
 * payment-date history is already recorded (`'pay'`), or the provider has already confirmed there
 * is none to find (`'none'`). Both are equally "settled" for scheduling purposes — the difference
 * between them only matters to `buildPayDatePatch`, not to the queue.
 */
const isSettled = (entry: MarketDataSnapshotEntry | undefined): boolean => {
  const source = entry?.payoutMonthsSource;
  return source === 'pay' || source === 'none';
};

/**
 * Whether `ticker` has any snapshot entry at all. A ticker named via `--only` that the price refresh
 * has never seen (typo, or a genuinely new symbol) must never reach the pay-date provider: an empty
 * response for it would produce a lone `{ payoutMonthsSource: 'none' }` (or an equally partial
 * `'updated'` patch) missing the required price/frequency fields, and writing that breaks
 * `parseMarketDataSnapshot` for the *whole* snapshot on the next read. The caller (`payDatesCli`)
 * checks this before spending a request, not after.
 */
export const isKnownTicker = (entries: Record<string, MarketDataSnapshotEntry>, ticker: string): boolean =>
  entries[ticker] !== undefined;

/** Rotates `list` left by `offset` positions (wraps around). `offset` is reduced mod length first. */
const rotate = <T>(list: readonly T[], offset: number): T[] => {
  if (list.length === 0) return [];
  const normalized = ((offset % list.length) + list.length) % list.length;
  return [...list.slice(normalized), ...list.slice(0, normalized)];
};

/** UTC calendar day as an integer key (days since the Unix epoch). Stateless — no file, no counter. */
export const rotationDayOf = (date: Date): number => Math.floor(date.getTime() / 86_400_000);

/**
 * Tickers worth spending quota on today, in the order to spend it.
 *
 * Two groups, unsettled first: entries with no pay-sourced (or confirmed-none) months come before
 * ones that are already settled. Within **each** group the 25-per-day window rotates by
 * `rotationDay` (an arbitrary increasing integer — the CLI passes the UTC calendar day so no state
 * needs to be persisted). Without rotation, once a group exceeds 25 entries the tail past the
 * budget would never be reached again — the front of the alphabet keeps winning every run forever.
 * Rotating slides the window by one entry a day, so *while a group's membership and order stay
 * put*, every ticker in it is queried at least once within `group.length` days. Membership does
 * not stay put, though — a ticker settling (or a new one appearing) reshuffles the group and can
 * make the window jump. That is fine: no ticker starves permanently, but "within N days" is a
 * property of a stable group, not a hard guarantee across runs.
 *
 * `only` (an explicit, short, user-picked list) skips rotation on purpose: a human who named a
 * handful of tickers wants them queried in the order given, not shuffled by the calendar date.
 * The unsettled-first grouping still applies so an explicit list also spends its budget wisely.
 */
export const prioritize = (
  entries: Record<string, MarketDataSnapshotEntry>,
  only: string[] | null,
  rotationDay = 0
): string[] => {
  const all = only ?? Object.keys(entries).sort();
  const unsettled = all.filter((ticker) => !isSettled(entries[ticker]));
  const settled = all.filter((ticker) => isSettled(entries[ticker]));

  if (only !== null) return [...unsettled, ...settled];

  return [...rotate(unsettled, rotationDay), ...rotate(settled, rotationDay)];
};
