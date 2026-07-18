import { UNUSABLE_RATE_FAIL_THRESHOLD } from './refresh';
import type { CagrReview, RefreshResult, TickerOutcome } from './refresh';

const TOP_CHANGES = 5;
const TOP_DIVERGENCES = 5;

/** Below this gap (percentage points) the curated assumption and the market agree closely enough. */
const DIVERGENCE_REPORT_THRESHOLD = 2;

export type RefreshVerdict = 'ok' | 'warn' | 'fail';

type UpdatedOutcome = Extract<TickerOutcome, { status: 'updated' }>;

const updatedOutcomes = (result: RefreshResult): UpdatedOutcome[] =>
  result.outcomes.filter((outcome): outcome is UpdatedOutcome => outcome.status === 'updated');

/**
 * `ok`   - everything usable.
 * `warn` - some tickers were rejected/failed but their old values still stand (exit 0).
 * `fail` - too much of the run was unusable to trust it (exit 1).
 *
 * Soft warnings (e.g. a yield that overruns the curated total return) do NOT move the verdict: the
 * data is still good, it is the human's *assumption* that may need revisiting, and that must not
 * break CI.
 */
export const verdictOf = (result: RefreshResult): RefreshVerdict => {
  if (result.attempted > 0 && result.unusableRate > UNUSABLE_RATE_FAIL_THRESHOLD) return 'fail';
  if (result.rejected > 0 || result.failed > 0) return 'warn';
  return 'ok';
};

const formatChange = (outcome: UpdatedOutcome): string => {
  const parts = outcome.changes.map((change) => {
    const delta =
      change.changePercent === null ? '' : ` (${change.changePercent >= 0 ? '+' : ''}${change.changePercent.toFixed(1)}%)`;
    return `${change.field} ${change.before} -> ${change.after}${delta}`;
  });
  return parts.join(', ');
};

/** Ranks updated tickers by their largest relative move. Pure. */
export const topChanges = (result: RefreshResult, limit: number = TOP_CHANGES): UpdatedOutcome[] =>
  updatedOutcomes(result)
    .filter((outcome) => outcome.changes.length > 0)
    .sort((left, right) => right.magnitude - left.magnitude)
    .slice(0, limit);

/**
 * Ranks tickers by how far the curated `expectedTotalReturn` sits from what the market's own dividend
 * history implies. Pure.
 *
 * This is the pipeline's only channel for feeding observations back into the human assumptions: the
 * refresh will never touch `expectedTotalReturn` itself, so a big divergence here is a prompt for a
 * curator, not an error.
 */
export const topCagrDivergences = (
  result: RefreshResult,
  limit: number = TOP_DIVERGENCES,
  threshold: number = DIVERGENCE_REPORT_THRESHOLD
): CagrReview[] =>
  updatedOutcomes(result)
    .map((outcome) => outcome.review)
    .filter((review): review is CagrReview => review !== null)
    .filter((review) => Math.abs(review.divergence) >= threshold)
    .sort((left, right) => Math.abs(right.divergence) - Math.abs(left.divergence))
    .slice(0, limit);

const signed = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;

/**
 * One review line, showing both framings of the same number:
 *   curated  etr = dy + dg(derived)
 *   observed etr = dy + observed CAGR
 */
const formatReview = (review: CagrReview): string => {
  const impliedTotalReturn = review.dividendYield + review.observedDividendCagr;

  return [
    `${review.ticker}: curated etr ${review.expectedTotalReturn.toFixed(2)}%`,
    `= dy ${review.dividendYield.toFixed(2)}% + dg ${review.derivedDividendGrowth.toFixed(2)}% (derived)`,
    `| observed CAGR ${review.observedDividendCagr.toFixed(2)}% => implied etr ${impliedTotalReturn.toFixed(2)}%`,
    `(${signed(review.divergence)}%p)`
  ].join(' ');
};

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
  lines.push('fields    : initialPrice, dividendYield, frequency (dividendGrowth is derived from the curated expectedTotalReturn)');

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

  const softWarnings = updatedOutcomes(result).filter((outcome) => outcome.warnings.length > 0);
  if (softWarnings.length > 0) {
    lines.push('');
    lines.push('WARN derived dividendGrowth is negative (written anyway - check the asset class):');
    for (const outcome of softWarnings) {
      for (const warning of outcome.warnings) lines.push(`  - ${outcome.ticker}: ${warning}`);
    }
  }

  const biggest = topChanges(result);
  if (biggest.length > 0) {
    lines.push('');
    lines.push(`Top ${biggest.length} changes:`);
    for (const outcome of biggest) lines.push(`  - ${outcome.ticker}: ${formatChange(outcome)}`);
  }

  const divergences = topCagrDivergences(result);
  if (divergences.length > 0) {
    lines.push('');
    lines.push(`REVIEW curated expectedTotalReturn vs observed dividend CAGR - top ${divergences.length} (>= ${DIVERGENCE_REPORT_THRESHOLD}%p):`);
    for (const review of divergences) lines.push(`  - ${formatReview(review)}`);
    lines.push('  (expectedTotalReturn is never auto-updated. Edit shared/constants/presets/* if a gap is real.)');
  }

  if (verdict === 'fail') {
    lines.push('');
    lines.push(
      `FAIL unusable rate ${(result.unusableRate * 100).toFixed(1)}% exceeds ${UNUSABLE_RATE_FAIL_THRESHOLD * 100}% - refusing to trust this run.`
    );
  }

  return lines.join('\n');
};
