import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { applyMarketData, EMPTY_MARKET_DATA_SNAPSHOT, parseMarketDataSnapshot } from '@/shared/constants/marketData';
import type { MarketDataEntry, MarketDataSnapshot } from '@/shared/constants/marketData';
import { CURATED_DIVIDEND_UNIVERSE } from '@/shared/constants/presets';

import { parseCliArgs, serializeSnapshot } from './cliOptions';
import { createFmpProvider, createYahooProvider } from './provider';
import type { TickerDataProvider } from './provider';
import { refreshTickers } from './refresh';
import { formatRefreshReport, verdictOf } from './report';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = path.resolve(__dirname, '../../shared/constants/marketData/marketData.generated.json');

const readSnapshot = async (): Promise<MarketDataSnapshot> => {
  try {
    const raw = await readFile(SNAPSHOT_PATH, 'utf8');
    return parseMarketDataSnapshot(JSON.parse(raw));
  } catch {
    console.warn(`[ticker:refresh] No readable snapshot at ${SNAPSHOT_PATH}; starting from presets.`);
    return EMPTY_MARKET_DATA_SNAPSHOT;
  }
};

const today = (): string => new Date().toISOString().slice(0, 10);

const main = async (): Promise<number> => {
  const parsed = parseCliArgs(process.argv.slice(2));
  if (!parsed.ok) {
    console.error(`[ticker:refresh] ${parsed.error}`);
    console.error('Usage: npm run ticker:refresh -- [--write] [--only=SCHD,JEPI] [--provider=yahoo|fmp] [--variant=stable|legacy] [--cagr-years=5] [--delay=200] [--as-of=YYYY-MM-DD]');
    return 1;
  }
  const options = parsed.value;

  // Yahoo's chart API is free and keyless, and (unlike FMP's free tier) actually serves this
  // app's tickers - see provider/yahooProvider.ts. FMP stays available for anyone with a paid key.
  let provider: TickerDataProvider;
  if (options.provider === 'fmp') {
    const apiKey = process.env.FMP_API_KEY;
    if (apiKey === undefined || apiKey.trim().length === 0) {
      console.error('[ticker:refresh] FMP_API_KEY is not set (required for --provider=fmp).');
      console.error('  - Get a key at https://site.financialmodelingprep.com/developer/docs');
      console.error('  - Local:  set FMP_API_KEY=... (PowerShell: $env:FMP_API_KEY="...")');
      console.error('  - CI:     add it as the repository secret FMP_API_KEY');
      console.error('  - Or drop --provider=fmp entirely to use the free, keyless Yahoo provider.');
      return 1;
    }
    provider = createFmpProvider({ apiKey, variant: options.variant });
  } else {
    provider = createYahooProvider();
  }

  const previousSnapshot = await readSnapshot();
  const previousByTicker: Record<string, MarketDataEntry> = applyMarketData(
    CURATED_DIVIDEND_UNIVERSE,
    previousSnapshot
  );

  // Read-only input to the pipeline: it decides what the refreshed yield *implies* for growth, and
  // which tickers a curator should look at. It is never written back into the snapshot.
  const expectedTotalReturnByTicker: Record<string, number> = Object.fromEntries(
    Object.entries(CURATED_DIVIDEND_UNIVERSE).map(([ticker, preset]) => [ticker, preset.expectedTotalReturn])
  );

  const knownTickers = Object.keys(previousByTicker);
  const unknown = options.only?.filter((ticker) => !knownTickers.includes(ticker)) ?? [];
  if (unknown.length > 0) {
    console.error(`[ticker:refresh] Unknown ticker(s) in --only: ${unknown.join(', ')}`);
    return 1;
  }

  const tickers = options.only ?? knownTickers;
  const asOf = options.asOf ?? today();

  console.log(`[ticker:refresh] Refreshing ${tickers.length} ticker(s) via ${provider.name}...`);

  const result = await refreshTickers({
    tickers,
    previousByTicker,
    previousSnapshot,
    expectedTotalReturnByTicker,
    provider,
    asOf,
    cagrYears: options.cagrYears,
    delayMs: options.delayMs
  });

  console.log(formatRefreshReport(result, { dryRun: options.dryRun }));

  const verdict = verdictOf(result);
  if (verdict === 'fail') return 1;

  if (options.dryRun) {
    console.log('\n[ticker:refresh] Dry run - nothing written. Re-run with --write to persist.');
    return 0;
  }

  await writeFile(SNAPSHOT_PATH, serializeSnapshot(result.snapshot), 'utf8');
  console.log(`\n[ticker:refresh] Wrote ${SNAPSHOT_PATH}`);
  return 0;
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error('[ticker:refresh] Unexpected failure:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
