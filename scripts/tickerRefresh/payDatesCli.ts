import process from 'node:process';

import type { MarketDataSnapshotEntry } from '@/shared/constants/marketData';

import { buildPayDatePatch } from './payDates';
import type { PayDateOutcome } from './payDates';
import { isKnownTicker, prioritize, rotationDayOf } from './payDatesQueue';
import { ALPHA_VANTAGE_FREE_DAILY_LIMIT, createAlphaVantageProvider, ProviderError } from './provider';
import { readCliEnv, readSnapshotFile, SNAPSHOT_PATH, writeSnapshotFile } from './snapshotIo';

/**
 * `ticker:paydates` — fills in **payment dates**, which the daily price refresh cannot see.
 *
 * Separate from `ticker:refresh` on purpose. Prices change every day and Yahoo is unmetered; pay
 * dates barely change and Alpha Vantage allows **25 requests per key per day**. Merging them would
 * either waste the quota on data that did not move, or throttle the price refresh to this budget.
 *
 * Safety rules, all of them about not losing good data:
 *   - writing is opt-in (`--write`), like the sibling CLI;
 *   - a ticker that errors or returns nothing keeps whatever it already had — unless it has never
 *     had any months at all, in which case a confirmed-empty response is recorded once as
 *     `payoutMonthsSource: 'none'` so quota is not wasted re-asking about it forever
 *     (see `buildPayDatePatch`);
 *   - a `--only` ticker that has no snapshot entry at all (typo, or genuinely new) is skipped
 *     *before* the provider is called — writing any pay-date patch for it would create a lone,
 *     partial entry missing the required price/frequency fields and corrupt the whole snapshot on
 *     the next read (see `isKnownTicker` in `./payDatesQueue`); run `ticker:refresh` first;
 *   - the run stops at the first quota error instead of burning through the remaining tickers,
 *     and reports what was left undone so the next run can pick it up.
 *
 * Queue order (which tickers get today's ~25 requests) lives in `./payDatesQueue` — kept out of
 * this file because it is pure and needs to be importable by tests without triggering `main()`.
 */
const LOG_PREFIX = '[ticker:paydates]';

/** Politeness gap between calls. The daily cap, not rate, is the real constraint. */
const DELAY_MS = 400;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

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
      const tickers = [
        ...new Set(
          arg
            .slice('--only='.length)
            .split(',')
            .map((value) => value.trim().toUpperCase())
            .filter((value) => value.length > 0)
        )
      ];
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

const describe = (outcome: PayDateOutcome): string => {
  switch (outcome.status) {
    case 'updated': {
      const { patch, before } = outcome;
      const monthsChanged = JSON.stringify(before.payoutMonths) !== JSON.stringify(patch.payoutMonths);
      const months = monthsChanged
        ? `${JSON.stringify(before.payoutMonths ?? null)} -> ${JSON.stringify(patch.payoutMonths)}`
        : JSON.stringify(patch.payoutMonths);
      const lag = patch.exToPayLagDays === undefined ? '' : ` · ex→pay ${patch.exToPayLagDays}d`;
      const days =
        patch.estimatedPayDayByMonth === undefined
          ? ''
          : ` · 예상 지급일 ${Object.keys(patch.estimatedPayDayByMonth).length}개월`;
      return `${outcome.ticker}: ${months}${lag}${days}${monthsChanged && before.payoutMonthsSource === 'ex' ? '  (ex 추정 -> 실제 지급일)' : ''}`;
    }
    case 'unchanged':
      return `${outcome.ticker}: 변화 없음`;
    case 'marked-none':
      return `${outcome.ticker}: 지급 기록 없음으로 확인 — 앞으로는 회전 순서상 뒤로 밀린다`;
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

  // One key on purpose — the free-tier cap is per IP as well (measured; see provider constant).
  const apiKey = readCliEnv('ALPHAVANTAGE_API_KEY');
  if (apiKey === null) {
    console.error(`${LOG_PREFIX} No API key. Set ALPHAVANTAGE_API_KEY in .env.`);
    return 1;
  }

  const snapshot = await readSnapshotFile(LOG_PREFIX);
  const provider = createAlphaVantageProvider({ apiKey });

  // Never plan more calls than the daily quota allows — going over just collects errors.
  const budget = limit ?? ALPHA_VANTAGE_FREE_DAILY_LIMIT;
  const queue = prioritize(snapshot.entries, only, rotationDayOf(new Date())).slice(0, budget);

  console.log(`${LOG_PREFIX} ${queue.length}종목 조회 (일일 예산 ${budget}건)${write ? '' : ' — DRY RUN'}`);

  const entries: Record<string, MarketDataSnapshotEntry> = { ...snapshot.entries };
  const outcomes: PayDateOutcome[] = [];
  let quotaHit: string | null = null;
  let calls = 0;

  for (const ticker of queue) {
    // Skip before spending a request or a politeness sleep — see the module doc comment above.
    if (!isKnownTicker(snapshot.entries, ticker)) {
      outcomes.push({ ticker, status: 'skipped', reason: 'not in snapshot — run ticker:refresh first' });
      continue;
    }

    if (calls > 0) await sleep(DELAY_MS);
    calls += 1;

    try {
      const records = await provider.fetchDividendSchedule(ticker);
      const outcome = buildPayDatePatch(ticker, records, snapshot.entries[ticker]);
      outcomes.push(outcome);
      switch (outcome.status) {
        case 'updated':
        case 'marked-none':
          entries[ticker] = { ...entries[ticker], ...outcome.patch };
          break;
        default:
          break;
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
  const markedNone = outcomes.filter((outcome) => outcome.status === 'marked-none');
  // Both leave a real change in `entries`; only these two justify writing the snapshot.
  const changed = [...updated, ...markedNone];
  const done = outcomes.length;
  const remaining = queue.length - done;

  console.log(`--- ${LOG_PREFIX} ---`);
  console.log(`처리    : ${done}종목 (갱신 ${updated.length} / 지급기록없음 확인 ${markedNone.length} / 변화없음 ${outcomes.filter((o) => o.status === 'unchanged').length} / 건너뜀 ${outcomes.filter((o) => o.status === 'skipped').length} / 실패 ${outcomes.filter((o) => o.status === 'failed').length})`);
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

  if (changed.length === 0) {
    console.log(`${LOG_PREFIX} 갱신할 내용이 없어 파일을 쓰지 않았다.`);
    return 0;
  }

  await writeSnapshotFile({ ...snapshot, entries });
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
