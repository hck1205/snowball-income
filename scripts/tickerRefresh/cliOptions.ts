import type { FmpApiVariant } from './provider';

export type CliOptions = {
  /** Default. Nothing is written to disk; the report still shows exactly what would change. */
  dryRun: boolean;
  /** Restrict the run to these tickers. `null` means "the whole universe". */
  only: string[] | null;
  variant: FmpApiVariant;
  cagrYears: number;
  delayMs: number;
  /** Overridable so runs are reproducible in tests. */
  asOf: string | null;
};

export type ParsedCliOptions = { ok: true; value: CliOptions } | { ok: false; error: string };

export const DEFAULT_CLI_OPTIONS: CliOptions = {
  dryRun: true,
  only: null,
  variant: 'stable',
  cagrYears: 5,
  delayMs: 200,
  asOf: null
};

const parsePositiveInt = (raw: string): number | null => {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return null;
  return value;
};

/**
 * Parses CLI flags. Pure, so the flag surface is unit-tested without spawning a process.
 *
 * Writing is opt-in (`--write`): an accidental invocation can never rewrite the snapshot.
 */
export const parseCliArgs = (argv: readonly string[]): ParsedCliOptions => {
  const options: CliOptions = { ...DEFAULT_CLI_OPTIONS };

  for (const arg of argv) {
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--write') {
      options.dryRun = false;
      continue;
    }

    if (arg.startsWith('--only=')) {
      const tickers = arg
        .slice('--only='.length)
        .split(',')
        .map((ticker) => ticker.trim().toUpperCase())
        .filter((ticker) => ticker.length > 0);

      if (tickers.length === 0) return { ok: false, error: '--only needs at least one ticker' };
      options.only = tickers;
      continue;
    }

    if (arg.startsWith('--variant=')) {
      const variant = arg.slice('--variant='.length);
      if (variant !== 'stable' && variant !== 'legacy') {
        return { ok: false, error: `--variant must be "stable" or "legacy" (got "${variant}")` };
      }
      options.variant = variant;
      continue;
    }

    if (arg.startsWith('--cagr-years=')) {
      const years = parsePositiveInt(arg.slice('--cagr-years='.length));
      if (years === null || years < 1) return { ok: false, error: '--cagr-years must be a positive integer' };
      options.cagrYears = years;
      continue;
    }

    if (arg.startsWith('--delay=')) {
      const delay = parsePositiveInt(arg.slice('--delay='.length));
      if (delay === null) return { ok: false, error: '--delay must be a non-negative integer (ms)' };
      options.delayMs = delay;
      continue;
    }

    if (arg.startsWith('--as-of=')) {
      const asOf = arg.slice('--as-of='.length);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) return { ok: false, error: '--as-of must be YYYY-MM-DD' };
      options.asOf = asOf;
      continue;
    }

    return { ok: false, error: `Unknown argument: ${arg}` };
  }

  return { ok: true, value: options };
};

/** Serializes a snapshot with sorted tickers so generated diffs stay small and reviewable. */
export const serializeSnapshot = (snapshot: {
  asOf: string | null;
  source: string;
  entries: Record<string, unknown>;
}): string => {
  const sortedEntries = Object.keys(snapshot.entries)
    .sort()
    .reduce<Record<string, unknown>>((acc, ticker) => {
      acc[ticker] = snapshot.entries[ticker];
      return acc;
    }, {});

  return `${JSON.stringify({ asOf: snapshot.asOf, source: snapshot.source, entries: sortedEntries }, null, 2)}\n`;
};
