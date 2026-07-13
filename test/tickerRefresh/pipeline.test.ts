import { describe, expect, it } from 'vitest';
import {
  formatRefreshReport,
  ProviderError,
  refreshTickers,
  topChanges,
  verdictOf
} from '@/scripts/tickerRefresh';
import type { MarketDataEntry } from '@/shared/constants/marketData';
import { applyMarketData, EMPTY_MARKET_DATA_SNAPSHOT } from '@/shared/constants/marketData';
import { CURATED_DIVIDEND_UNIVERSE } from '@/shared/constants/presets';
import { createFixtureProvider, JEPI_DIVIDENDS, noSleep, SCHD_DIVIDENDS, VTI_DIVIDENDS } from './fixtures';

const AS_OF = '2026-07-14';

const previousByTicker: Record<string, MarketDataEntry> = CURATED_DIVIDEND_UNIVERSE;

const run = (
  tickers: readonly string[],
  provider: ReturnType<typeof createFixtureProvider>,
  previousSnapshot = EMPTY_MARKET_DATA_SNAPSHOT
) =>
  refreshTickers({
    tickers,
    previousByTicker,
    previousSnapshot,
    provider,
    asOf: AS_OF,
    sleep: noSleep,
    delayMs: 0
  });

describe('refreshTickers (end-to-end, no network)', () => {
  it('derives, validates and merges a healthy ticker', async () => {
    const provider = createFixtureProvider({
      quotes: { SCHD: 32.1 },
      dividends: { SCHD: SCHD_DIVIDENDS }
    });

    const result = await run(['SCHD'], provider);

    expect(result.updated).toBe(1);
    expect(result.rejected).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.snapshot.asOf).toBe(AS_OF);
    expect(result.snapshot.source).toBe('fixture');

    const entry = result.snapshot.entries.SCHD;
    expect(entry.initialPrice).toBe(32.1);
    expect(entry.dividendYield).toBeCloseTo(3.4, 1); // 1.09 TTM / 32.10
    expect(entry.dividendGrowth).toBeCloseTo(((1.06 / 0.72) ** (1 / 5) - 1) * 100, 1);
    expect(entry.frequency).toBe('quarterly');
    expect(verdictOf(result)).toBe('ok');
  });

  it('produces a snapshot that preserves curated fields once overlaid', async () => {
    const provider = createFixtureProvider({
      quotes: { SCHD: 32.1 },
      dividends: { SCHD: SCHD_DIVIDENDS }
    });

    const result = await run(['SCHD'], provider);
    const universe = applyMarketData(CURATED_DIVIDEND_UNIVERSE, result.snapshot);

    expect(universe.SCHD.name).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.name);
    expect(universe.SCHD.expectedTotalReturn).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.expectedTotalReturn);
    expect(universe.SCHD.initialPrice).toBe(32.1);
    // Untouched tickers keep every curated value.
    expect(universe.VOO).toEqual(CURATED_DIVIDEND_UNIVERSE.VOO);
  });

  it('rejects an implausible price move and keeps the previous value', async () => {
    // A 2:1 split (31.61 -> ~15) that the dividend history does not reflect. Every other field
    // still looks plausible, so the price guard is the only thing standing between this and a
    // silently halved portfolio.
    const provider = createFixtureProvider({
      quotes: { SCHD: 15 },
      dividends: { SCHD: SCHD_DIVIDENDS }
    });

    const result = await run(['SCHD'], provider);

    expect(result.rejected).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.snapshot.entries.SCHD).toBeUndefined(); // nothing written => preset stands

    const universe = applyMarketData(CURATED_DIVIDEND_UNIVERSE, result.snapshot);
    expect(universe.SCHD.initialPrice).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.initialPrice);

    const outcome = result.outcomes[0];
    expect(outcome.status).toBe('rejected');
    expect(outcome.status === 'rejected' && outcome.reason).toContain('possible split or bad data');
  });

  it('keeps the last-good snapshot value when a refresh is rejected', async () => {
    const lastGood: MarketDataEntry = {
      initialPrice: 31.9,
      dividendYield: 3.3,
      dividendGrowth: 7.1,
      frequency: 'quarterly'
    };
    const previousSnapshot = {
      asOf: '2026-07-07',
      source: 'fixture',
      entries: { SCHD: lastGood }
    };

    const provider = createFixtureProvider({
      quotes: { SCHD: 1000 },
      dividends: { SCHD: SCHD_DIVIDENDS }
    });

    const result = await run(['SCHD'], provider, previousSnapshot);

    expect(result.rejected).toBe(1);
    expect(result.snapshot.entries.SCHD).toEqual(lastGood);
  });

  it('records a provider failure without losing data', async () => {
    const provider = createFixtureProvider({
      quotes: { SCHD: new ProviderError('rate_limit', 'Rate limited by FMP (429)', 'SCHD') },
      dividends: { SCHD: SCHD_DIVIDENDS }
    });

    const result = await run(['SCHD'], provider);

    expect(result.failed).toBe(1);
    expect(result.snapshot.entries.SCHD).toBeUndefined();
    const outcome = result.outcomes[0];
    expect(outcome.status === 'failed' && outcome.reason).toContain('429');
  });

  it('falls back to the previous value for fields it cannot derive', async () => {
    // No dividend history: price still refreshes, yield/growth/frequency stay at preset values.
    const provider = createFixtureProvider({
      quotes: { SCHD: 32.1 },
      dividends: { SCHD: [] }
    });

    const result = await run(['SCHD'], provider);

    expect(result.updated).toBe(1);
    const entry = result.snapshot.entries.SCHD;
    expect(entry.initialPrice).toBe(32.1);
    expect(entry.dividendYield).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.dividendYield);
    expect(entry.dividendGrowth).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.dividendGrowth);
    expect(entry.frequency).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.frequency);
  });

  it('carries over entries for tickers outside the run (so --only is safe)', async () => {
    const untouched: MarketDataEntry = {
      initialPrice: 55,
      dividendYield: 7.5,
      dividendGrowth: 1,
      frequency: 'monthly'
    };
    const previousSnapshot = {
      asOf: '2026-07-07',
      source: 'fixture',
      entries: { JEPI: untouched }
    };

    const provider = createFixtureProvider({
      quotes: { SCHD: 32.1 },
      dividends: { SCHD: SCHD_DIVIDENDS }
    });

    const result = await run(['SCHD'], provider, previousSnapshot);

    expect(result.snapshot.entries.JEPI).toEqual(untouched);
    expect(result.snapshot.entries.SCHD).toBeDefined();
  });

  it('warns (but still succeeds) when a minority of tickers is unusable', async () => {
    const provider = createFixtureProvider({
      quotes: {
        SCHD: 32.1,
        JEPI: 56.2,
        VTI: 250,
        VOO: new ProviderError('http', 'FMP returned HTTP 500', 'VOO')
      },
      dividends: { SCHD: SCHD_DIVIDENDS, JEPI: JEPI_DIVIDENDS, VTI: VTI_DIVIDENDS, VOO: [] }
    });

    const result = await run(['SCHD', 'JEPI', 'VTI', 'VOO'], provider);

    expect(result.updated).toBe(3);
    expect(result.failed).toBe(1);
    expect(result.snapshot.entries.JEPI.frequency).toBe('monthly');
    // 1 of 4 unusable = 25%, under the 30% threshold: the good data still lands.
    expect(result.unusableRate).toBeCloseTo(0.25, 6);
    expect(verdictOf(result)).toBe('warn');
  });

  it('fails the run when too much of it is unusable', async () => {
    const provider = createFixtureProvider({
      quotes: {
        SCHD: 32.1,
        JEPI: new ProviderError('http', 'boom', 'JEPI'),
        VOO: new ProviderError('http', 'boom', 'VOO')
      },
      dividends: { SCHD: SCHD_DIVIDENDS, JEPI: JEPI_DIVIDENDS, VOO: [] }
    });

    const result = await run(['SCHD', 'JEPI', 'VOO'], provider);

    expect(result.unusableRate).toBeCloseTo(2 / 3, 6);
    expect(verdictOf(result)).toBe('fail');
    expect(formatRefreshReport(result, { dryRun: true })).toContain('FAIL');
  });

  it('is ok when nothing is rejected or failed', async () => {
    const provider = createFixtureProvider({
      quotes: { SCHD: 32.1 },
      dividends: { SCHD: SCHD_DIVIDENDS }
    });
    expect(verdictOf(await run(['SCHD'], provider))).toBe('ok');
  });

  it('paces requests through the injected sleep', async () => {
    const delays: number[] = [];
    const provider = createFixtureProvider({
      quotes: { SCHD: 32.1, JEPI: 56.2 },
      dividends: { SCHD: SCHD_DIVIDENDS, JEPI: JEPI_DIVIDENDS }
    });

    await refreshTickers({
      tickers: ['SCHD', 'JEPI'],
      previousByTicker,
      previousSnapshot: EMPTY_MARKET_DATA_SNAPSHOT,
      provider,
      asOf: AS_OF,
      delayMs: 200,
      sleep: async (ms) => {
        delays.push(ms);
      }
    });

    // One delay between the two tickers, none before the first.
    expect(delays).toEqual([200]);
  });

  it('ranks the biggest movers first', async () => {
    const provider = createFixtureProvider({
      quotes: { SCHD: 32.1, JEPI: 56.2 },
      dividends: { SCHD: SCHD_DIVIDENDS, JEPI: JEPI_DIVIDENDS }
    });

    const result = await run(['SCHD', 'JEPI'], provider);
    const ranked = topChanges(result, 5);

    expect(ranked.length).toBeGreaterThan(0);
    for (let index = 1; index < ranked.length; index += 1) {
      expect(ranked[index - 1].magnitude).toBeGreaterThanOrEqual(ranked[index].magnitude);
    }
  });

  it('reports an empty run as ok', async () => {
    const provider = createFixtureProvider({ quotes: {}, dividends: {} });
    const result = await run([], provider);

    expect(result.attempted).toBe(0);
    expect(result.unusableRate).toBe(0);
    expect(verdictOf(result)).toBe('ok');
  });
});

describe('formatRefreshReport', () => {
  it('summarises updates, rejections and failures', async () => {
    const provider = createFixtureProvider({
      quotes: { SCHD: 32.1, JEPI: 1, VOO: new ProviderError('http', 'boom', 'VOO') },
      dividends: { SCHD: SCHD_DIVIDENDS, JEPI: JEPI_DIVIDENDS, VOO: [] }
    });

    const result = await run(['SCHD', 'JEPI', 'VOO'], provider);
    const report = formatRefreshReport(result, { dryRun: true });

    expect(report).toContain('DRY RUN');
    expect(report).toContain('2026-07-14');
    expect(report).toContain('rejected');
    expect(report).toContain('WARN failed');
    expect(report).toContain('VOO');
  });
});
