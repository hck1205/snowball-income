import { UNUSABLE_RATE_FAIL_THRESHOLD } from './refresh';
import type { RefreshResult, TickerOutcome } from './refresh';

const TOP_CHANGES = 5;

export type RefreshVerdict = 'ok' | 'warn' | 'fail';

/**
 * `ok`   - everything usable.
 * `warn` - some tickers were rejected/failed but their old values still stand (exit 0).
 * `fail` - too much of the run was unusable to trust it (exit 1).
 */
export const verdictOf = (result: RefreshResult): RefreshVerdict => {
  if (result.attempted > 0 && result.unusableRate > UNUSABLE_RATE_FAIL_THRESHOLD) return 'fail';
  if (result.rejected > 0 || result.failed > 0) return 'warn';
  return 'ok';
};

const formatChange = (outcome: Extract<TickerOutcome, { status: 'updated' }>): string => {
  const parts = outcome.changes.map((change) => {
    const delta =
      change.changePercent === null ? '' : ` (${change.changePercent >= 0 ? '+' : ''}${change.changePercent.toFixed(1)}%)`;
    return `${change.field} ${change.before} -> ${change.after}${delta}`;
  });
  return parts.join(', ');
};

/** Ranks updated tickers by their largest relative move. Pure. */
export const topChanges = (
  result: RefreshResult,
  limit: number = TOP_CHANGES
): Extract<TickerOutcome, { status: 'updated' }>[] =>
  result.outcomes
    .filter((outcome): outcome is Extract<TickerOutcome, { status: 'updated' }> => outcome.status === 'updated')
    .filter((outcome) => outcome.changes.length > 0)
    .sort((left, right) => right.magnitude - left.magnitude)
    .slice(0, limit);

/** Renders the human-readable run summary. Pure — the CLI just prints the string. */
export const formatRefreshReport = (result: RefreshResult, options: { dryRun: boolean }): string => {
  const verdict = verdictOf(result);
  const lines: string[] = [];

  lines.push('--- ticker:refresh ---');
  lines.push(`mode      : ${options.dryRun ? 'DRY RUN (no files written)' : 'WRITE'}`);
  lines.push(`asOf      : ${result.snapshot.asOf ?? 'n/a'}`);
  lines.push(`source    : ${result.snapshot.source}`);
  lines.push(
    `result    : ${result.updated} updated / ${result.rejected} rejected / ${result.failed} failed (of ${result.attempted})`
  );
  lines.push(`unusable  : ${(result.unusableRate * 100).toFixed(1)}%`);

  const rejected = result.outcomes.filter(
    (outcome): outcome is Extract<TickerOutcome, { status: 'rejected' }> => outcome.status === 'rejected'
  );
  if (rejected.length > 0) {
    lines.push('');
    lines.push('WARN rejected (previous values kept):');
    for (const outcome of rejected) lines.push(`  - ${outcome.ticker}: ${outcome.reason}`);
  }

  const failed = result.outcomes.filter(
    (outcome): outcome is Extract<TickerOutcome, { status: 'failed' }> => outcome.status === 'failed'
  );
  if (failed.length > 0) {
    lines.push('');
    lines.push('WARN failed (previous values kept):');
    for (const outcome of failed) lines.push(`  - ${outcome.ticker}: ${outcome.reason}`);
  }

  const biggest = topChanges(result);
  if (biggest.length > 0) {
    lines.push('');
    lines.push(`Top ${biggest.length} changes:`);
    for (const outcome of biggest) lines.push(`  - ${outcome.ticker}: ${formatChange(outcome)}`);
  }

  if (verdict === 'fail') {
    lines.push('');
    lines.push(
      `FAIL unusable rate ${(result.unusableRate * 100).toFixed(1)}% exceeds ${UNUSABLE_RATE_FAIL_THRESHOLD * 100}% - refusing to trust this run.`
    );
  }

  return lines.join('\n');
};
