import { readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { EMPTY_MARKET_DATA_SNAPSHOT, parseMarketDataSnapshot } from '@/shared/constants/marketData';
import type { MarketDataSnapshot, MarketDataSnapshotEntry } from '@/shared/constants/marketData';

import { serializeSnapshot } from './cliOptions';
import { buildPayDatePatch } from './payDates';
import type { PayDateOutcome } from './payDates';
import { ALPHA_VANTAGE_FREE_DAILY_LIMIT, createAlphaVantageProvider, ProviderError } from './provider';

/**
 * `ticker:paydates` — fills in **payment dates**, which the daily price refresh cannot see.
 *
 * Separate from `ticker:refresh` on purpose. Prices change every day and Yahoo is unmetered; pay
 * dates barely change and Alpha Vantage allows **25 requests per key per day**. Merging them would
 * either waste the quota on data that did not move, or throttle the price refresh to this budget.
 *
 * Safety rules, all of them about not losing good data:
 *   - writing is opt-in (`--write`), like the sibling CLI;
 *   - a ticker that errors or returns nothing keeps whatever it already had;
 *   - the run stops at the first quota error instead of burning through the remaining tickers,
 *     and reports what was left undone so the next run can pick it up.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = path.resolve(__dirname, '../../shared/constants/marketData/marketData.generated.json');

const LOG_PREFIX = '[ticker:paydates]';

/** Politeness gap between calls. The daily cap, not rate, is the real constraint. */
const DELAY_MS = 400;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const readSnapshot = async (): Promise<MarketDataSnapshot> => {
  try {
    return parseMarketDataSnapshot(JSON.parse(await readFile(SNAPSHOT_PATH, 'utf8')));
  } catch {
    console.warn(`${LOG_PREFIX} No readable snapshot at ${SNAPSHOT_PATH}.`);
    return EMPTY_MARKET_DATA_SNAPSHOT;
  }
};

type Options = {
  write: boolean;
  only: string[] | null;
  limit: number | null;
};

const parseOptions = (argv: readonly string[]): { ok: true; options: Options } | { ok: false; error: string } => {
  const options: Options = { write: false, only: null, limit: null };

  for (const arg of argv) {
    if (arg === '--' || arg.length === 0) continue;
    if (arg === '--write') {
      options.write = true;
      continue;
    }
    if (arg.startsWith('--only=')) {
      const tickers = arg
        .slice('--only='.length)
        .split(',')
        .map((value) => value.trim().toUpperCase())
        .filter((value) => value.length > 0);
      if (tickers.length === 0) return { ok: false, error: '--only needs at least one ticker' };
      options.only = tickers;
      continue;
    }
    if (arg.startsWith('--limit=')) {
      const limit = Number(arg.slice('--limit='.length));
      if (!Number.isInteger(limit) || limit < 1) return { ok: false, error: '--limit must be a positive integer' };
      options.limit = limit;
      continue;
    }
    return { ok: false, error: `unknown argument "${arg}"` };
  }

  return { ok: true, options };
};

/**
 * `.env` fallback. `vite-node` does not put non-`VITE_` variables on `process.env`, and this key
 * must never carry a `VITE_` prefix (that would ship it to the browser bundle). Parsed here rather
 * than pulling in `dotenv` — the same zero-dependency rule the other tooling follows.
 */
const readEnvFile = (): Record<string, string> => {
  const values: Record<string, string> = {};
  try {
    const raw = readFileSync(path.resolve(__dirname, '../../.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed.startsWith('#')) continue;
      const separator = trimmed.indexOf('=');
      if (separator <= 0) continue;
      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if (value.length >= 2 && value[0] === value[value.length - 1] && (value[0] === '"' || value[0] === "'")) {
        value = value.slice(1, -1);
      }
      if (key.length > 0) values[key] = value;
    }
  } catch {
    // No .env is fine — CI injects real environment variables instead.
  }
  return values;
};

/** Keys are numbered (`ALPHAVANTAGE_API_KEY_1`, `_2`, ...) so quota can be pooled across them. */
const readApiKeys = (): string[] => {
  const fromFile = readEnvFile();
  // A real environment variable wins over the file, so CI can override without editing anything.
  const lookup = (name: string): string | undefined => process.env[name] || fromFile[name];

  const keys: string[] = [];
  const single = lookup('ALPHAVANTAGE_API_KEY');
  if (single) keys.push(single);
  for (let index = 1; index <= 10; index += 1) {
    const key = lookup(`ALPHAVANTAGE_API_KEY_${index}`);
    if (key) keys.push(key);
  }
  return keys;
};

/**
 * Tickers worth spending quota on, **least recently upgraded first**: entries with no pay-sourced
 * months come before those that already have them. With a 25/key/day cap the universe cannot be
 * covered in one run, so the order decides how fast coverage grows.
 */
const prioritize = (entries: Record<string, MarketDataSnapshotEntry>, only: string[] | null): string[] => {
  const all = only ?? Object.keys(entries).sort();
  const needsUpgrade = all.filter((ticker) => entries[ticker]?.payoutMonthsSource !== 'pay');
  const rest = all.filter((ticker) => entries[ticker]?.payoutMonthsSource === 'pay');
  return [...needsUpgrade, ...rest];
};

const describe = (outcome: PayDateOutcome): string => {
  switch (outcome.status) {
    case 'updated': {
      const { patch, before } = outcome;
      const monthsChanged = JSON.stringify(before.payoutMonths) !== JSON.stringify(patch.payoutMonths);
      const months = monthsChanged
        ? `${JSON.stringify(before.payoutMonths ?? null)} -> ${JSON.stringify(patch.payoutMonths)}`
        : JSON.stringify(patch.payoutMonths);
      const lag = patch.exToPayLagDays === undefined ? '' : ` · ex→pay ${patch.exToPayLagDays}d`;
      return `${outcome.ticker}: ${months}${lag}${monthsChanged && before.payoutMonthsSource === 'ex' ? '  (ex 추정 -> 실제 지급일)' : ''}`;
    }
    case 'unchanged':
      return `${outcome.ticker}: 변화 없음`;
    case 'skipped':
      return `${outcome.ticker}: 건너뜀 — ${outcome.reason}`;
    case 'failed':
      return `${outcome.ticker}: 실패 — ${outcome.reason}`;
  }
};

const main = async (): Promise<number> => {
  const parsed = parseOptions(process.argv.slice(2));
  if (!parsed.ok) {
    console.error(`${LOG_PREFIX} ${parsed.error}`);
    console.error(`Usage: npm run ticker:paydates -- [--write] [--only=SCHD,JEPI] [--limit=25]`);
    return 1;
  }
  const { write, only, limit } = parsed.options;

  const apiKeys = readApiKeys();
  if (apiKeys.length === 0) {
    console.error(
      `${LOG_PREFIX} No API key. Set ALPHAVANTAGE_API_KEY (or ALPHAVANTAGE_API_KEY_1, _2, ...) in .env.`
    );
    return 1;
  }

  const snapshot = await readSnapshot();
  const provider = createAlphaVantageProvider({ apiKeys });

  // Never plan more calls than the pooled daily quota allows — going over just collects errors.
  const budget = limit ?? apiKeys.length * ALPHA_VANTAGE_FREE_DAILY_LIMIT;
  const queue = prioritize(snapshot.entries, only).slice(0, budget);

  console.log(
    `${LOG_PREFIX} ${queue.length}종목 조회 (키 ${apiKeys.length}개 · 일일 예산 ${budget}건)${write ? '' : ' — DRY RUN'}`
  );

  const entries: Record<string, MarketDataSnapshotEntry> = { ...snapshot.entries };
  const outcomes: PayDateOutcome[] = [];
  let quotaHit: string | null = null;

  for (const [index, ticker] of queue.entries()) {
    if (index > 0) await sleep(DELAY_MS);

    try {
      const records = await provider.fetchDividendSchedule(ticker);
      const outcome = buildPayDatePatch(ticker, records, snapshot.entries[ticker]);
      outcomes.push(outcome);
      if (outcome.status === 'updated') {
        entries[ticker] = { ...entries[ticker], ...outcome.patch };
      }
    } catch (error) {
      if (error instanceof ProviderError && error.code === 'rate_limit') {
        // Stop immediately: every further call would fail the same way and tell us nothing.
        quotaHit = error.message;
        break;
      }
      const reason = error instanceof Error ? error.message : String(error);
      outcomes.push({ ticker, status: 'failed', reason });
    }
  }

  const updated = outcomes.filter((outcome) => outcome.status === 'updated');
  const done = outcomes.length;
  const remaining = queue.length - done;

  console.log(`--- ${LOG_PREFIX} ---`);
  console.log(`처리    : ${done}종목 (갱신 ${updated.length} / 변화없음 ${outcomes.filter((o) => o.status === 'unchanged').length} / 건너뜀 ${outcomes.filter((o) => o.status === 'skipped').length} / 실패 ${outcomes.filter((o) => o.status === 'failed').length})`);
  for (const outcome of outcomes) {
    if (outcome.status !== 'unchanged') console.log(`  - ${describe(outcome)}`);
  }

  if (quotaHit !== null) {
    console.log('');
    console.log(`QUOTA   : 일일 한도 도달 — ${remaining}종목 미처리. 내일 다시 실행하면 이어서 간다.`);
    console.log(`          "${quotaHit}"`);
  }

  const paySourced = Object.values(entries).filter((entry) => entry.payoutMonthsSource === 'pay').length;
  console.log('');
  console.log(`커버리지: 실제 지급일 기준 ${paySourced}/${Object.keys(entries).length}종목`);

  if (!write) {
    console.log('');
    console.log(`${LOG_PREFIX} Dry run — nothing written. Re-run with --write to persist.`);
    return 0;
  }

  if (updated.length === 0) {
    console.log(`${LOG_PREFIX} 갱신할 내용이 없어 파일을 쓰지 않았다.`);
    return 0;
  }

  await writeFile(SNAPSHOT_PATH, serializeSnapshot({ ...snapshot, entries }), 'utf8');
  console.log(`${LOG_PREFIX} Wrote ${SNAPSHOT_PATH}`);
  return 0;
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(`${LOG_PREFIX} ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
