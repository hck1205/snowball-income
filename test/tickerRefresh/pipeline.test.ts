// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import {
  formatRefreshReport,
  ProviderError,
  refreshTickers,
  topCagrDivergences,
  topChanges,
  verdictOf
} from '@/scripts/tickerRefresh';
import type { MarketDataSnapshotEntry } from '@/shared/constants/marketData';
import { applyMarketData, EMPTY_MARKET_DATA_SNAPSHOT } from '@/shared/constants/marketData';
import { buildDividendUniverse, CURATED_DIVIDEND_UNIVERSE } from '@/shared/constants/presets';
import {
  createFixtureProvider,
  JEPI_DIVIDENDS,
  noSleep,
  quarterlyHistory,
  QYLD_DIVIDENDS,
  SCHD_DIVIDENDS,
  SCHD_FAST_GROWTH_DIVIDENDS,
  VTI_DIVIDENDS
} from './fixtures';

const AS_OF = '2026-07-14';

const previousByTicker: Record<string, MarketDataSnapshotEntry> = CURATED_DIVIDEND_UNIVERSE;

/** The curated total-return assumptions, exactly as `cli.ts` feeds them in. */
const expectedTotalReturnByTicker: Record<string, number> = Object.fromEntries(
  Object.entries(CURATED_DIVIDEND_UNIVERSE).map(([ticker, preset]) => [ticker, preset.expectedTotalReturn])
);

const run = (
  tickers: readonly string[],
  provider: ReturnType<typeof createFixtureProvider>,
  previousSnapshot = EMPTY_MARKET_DATA_SNAPSHOT
) =>
  refreshTickers({
    tickers,
    previousByTicker,
    previousSnapshot,
    expectedTotalReturnByTicker,
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
    expect(entry.frequency).toBe('quarterly');
    expect(verdictOf(result)).toBe('ok');
  });

  it('writes the historical dividend CAGR as a reference field, never as an engine input', async () => {
    const provider = createFixtureProvider({
      quotes: { SCHD: 32.1 },
      dividends: { SCHD: SCHD_DIVIDENDS }
    });

    const result = await run(['SCHD'], provider);
    const entry = result.snapshot.entries.SCHD;

    // The observation is kept — a curator needs it to re-examine `expectedTotalReturn`...
    expect(entry.observedDividendCagr).toBeCloseTo(((1.06 / 0.72) ** (1 / 5) - 1) * 100, 1);
    // ...but the snapshot must never carry a growth rate.
    expect(entry).not.toHaveProperty('dividendGrowth');
  });

  it('preserves the curated total-return assumption once the snapshot is overlaid', async () => {
    // The whole point of the change: a refreshed yield moves `dividendGrowth`, not the total return.
    const provider = createFixtureProvider({
      quotes: { SCHD: 32.1 },
      dividends: { SCHD: SCHD_FAST_GROWTH_DIVIDENDS }
    });

    const result = await run(['SCHD'], provider);
    const universe = buildDividendUniverse(CURATED_DIVIDEND_UNIVERSE, result.snapshot);
    const { SCHD } = universe;

    // The observed payout CAGR is ~10.9%. Under the old pipeline that became `dividendGrowth`, so the
    // total return silently became 3.8 + 10.9 = ~14.8% instead of the curated 10%.
    expect(result.snapshot.entries.SCHD.observedDividendCagr).toBeGreaterThan(10);
    expect(SCHD.expectedTotalReturn).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.expectedTotalReturn);
    expect(SCHD.dividendYield + SCHD.dividendGrowth).toBeCloseTo(SCHD.expectedTotalReturn, 9);
    expect(SCHD.dividendGrowth).toBeCloseTo(SCHD.expectedTotalReturn - SCHD.dividendYield, 9);
  });

  it('holds dy + dg === etr across the whole universe after a multi-ticker refresh', async () => {
    const provider = createFixtureProvider({
      quotes: { SCHD: 32.1, JEPI: 56.2, VTI: 250 },
      dividends: { SCHD: SCHD_DIVIDENDS, JEPI: JEPI_DIVIDENDS, VTI: VTI_DIVIDENDS }
    });

    const result = await run(['SCHD', 'JEPI', 'VTI'], provider);
    const universe = buildDividendUniverse(CURATED_DIVIDEND_UNIVERSE, result.snapshot);

    for (const preset of Object.values(universe)) {
      expect(preset.dividendYield + preset.dividendGrowth).toBeCloseTo(preset.expectedTotalReturn, 9);
    }

    // And the refreshed tickers really did move, so this is not vacuously true.
    expect(universe.SCHD.dividendYield).not.toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.dividendYield);
    expect(universe.SCHD.dividendGrowth).not.toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.dividendGrowth);
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
    const lastGood: MarketDataSnapshotEntry = {
      initialPrice: 31.9,
      dividendYield: 3.3,
      frequency: 'quarterly',
      observedDividendCagr: 7.1
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
    // No dividend history: price still refreshes, yield/frequency stay at preset values.
    const provider = createFixtureProvider({
      quotes: { SCHD: 32.1 },
      dividends: { SCHD: [] }
    });

    const result = await run(['SCHD'], provider);

    expect(result.updated).toBe(1);
    const entry = result.snapshot.entries.SCHD;
    expect(entry.initialPrice).toBe(32.1);
    expect(entry.dividendYield).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.dividendYield);
    expect(entry.frequency).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.frequency);
    expect(entry.observedDividendCagr).toBeUndefined();
  });

  it('carries over the last known observedDividendCagr when the history is too thin to recompute', async () => {
    const previousSnapshot = {
      asOf: '2026-07-07',
      source: 'fixture',
      entries: {
        SCHD: {
          initialPrice: 31.9,
          dividendYield: 3.3,
          frequency: 'quarterly' as const,
          observedDividendCagr: 7.1
        }
      }
    };

    const provider = createFixtureProvider({ quotes: { SCHD: 32.1 }, dividends: { SCHD: [] } });
    const result = await run(['SCHD'], provider, previousSnapshot);

    expect(result.snapshot.entries.SCHD.observedDividendCagr).toBe(7.1);
  });

  it('carries over entries for tickers outside the run (so --only is safe)', async () => {
    const untouched: MarketDataSnapshotEntry = {
      initialPrice: 55,
      dividendYield: 7.5,
      frequency: 'monthly',
      observedDividendCagr: 1
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

/**
 * 예상 지급일이 스냅샷까지 실제로 실리는지 — 파생 함수 단위 테스트만으로는 배선 실수를 못 잡는다.
 * 전제(실제 지급일 기준 월 + 실측 lag)가 하나라도 빠지면 필드를 **만들지 않는 것**이 정답이다.
 */
describe('estimatedPayDayByMonth (스냅샷 배선)', () => {
  const snapshotWith = (entry: MarketDataSnapshotEntry) => ({
    asOf: '2026-07-01',
    source: 'fixture',
    entries: { SCHD: entry }
  });

  const paySourced: MarketDataSnapshotEntry = {
    initialPrice: 32,
    dividendYield: 3.4,
    frequency: 'quarterly',
    payoutMonths: [3, 6, 9, 12],
    payoutMonthsSource: 'pay',
    exToPayLagDays: 5
  };

  const provider = () =>
    createFixtureProvider({ quotes: { SCHD: 32.1 }, dividends: { SCHD: SCHD_DIVIDENDS } });

  it('실제 지급일 기준 월 + 실측 lag 가 있으면 일자를 채운다', async () => {
    const result = await run(['SCHD'], provider(), snapshotWith(paySourced));

    // SCHD_DIVIDENDS 는 3·6·9·12월 20일 배당락 → +5일.
    expect(result.snapshot.entries.SCHD.estimatedPayDayByMonth).toEqual({
      '3': 25,
      '6': 25,
      '9': 25,
      '12': 25
    });
  });

  /**
   * `ticker:paydates` 가 실지급일에서 **직접** 계산해 넣은 값은 여기서 다시 추정하지 않는다.
   * 매일 도는 가격 갱신이 ex + 중앙값 lag 추정으로 더 정확한 관측값을 덮으면, paydates 가 하루 25건씩
   * 쌓아 올린 커버리지가 다음 날 아침마다 되감긴다.
   */
  it('실지급일에서 직접 계산된 일자가 이미 있으면 그대로 이월한다 (추정으로 덮지 않는다)', async () => {
    const observed = { '3': 31, '6': 30, '9': 30, '12': 16 };
    const result = await run(
      ['SCHD'],
      provider(),
      snapshotWith({ ...paySourced, estimatedPayDayByMonth: observed })
    );

    expect(result.snapshot.entries.SCHD.estimatedPayDayByMonth).toEqual(observed);
  });

  it('지급월이 ex 기준으로 되돌아가면 이월하지 않는다 (월 키 기준이 어긋난 낡은 일자는 없느니만 못하다)', async () => {
    const result = await run(
      ['SCHD'],
      provider(),
      snapshotWith({
        ...paySourced,
        payoutMonthsSource: 'ex',
        estimatedPayDayByMonth: { '3': 31, '6': 30, '9': 30, '12': 16 }
      })
    );

    expect(result.snapshot.entries.SCHD).not.toHaveProperty('estimatedPayDayByMonth');
  });

  it('lag 가 없으면 만들지 않는다 (추정 근거 부족 — 캘린더가 "날짜 미정"으로 처리)', async () => {
    const result = await run(['SCHD'], provider(), snapshotWith({ ...paySourced, exToPayLagDays: undefined }));

    expect(result.snapshot.entries.SCHD).not.toHaveProperty('estimatedPayDayByMonth');
  });

  it('지급월이 배당락 기준(ex)이면 만들지 않는다 — 월 키 기준이 어긋난다', async () => {
    const result = await run(['SCHD'], provider(), snapshotWith({ ...paySourced, payoutMonthsSource: 'ex' }));

    expect(result.snapshot.entries.SCHD).not.toHaveProperty('estimatedPayDayByMonth');
  });

  it('엔진에 넘어가는 값에는 섞이지 않는다 (관측 전용)', async () => {
    const result = await run(['SCHD'], provider(), snapshotWith(paySourced));
    const universe = applyMarketData(CURATED_DIVIDEND_UNIVERSE, result.snapshot);

    expect(universe.SCHD).not.toHaveProperty('estimatedPayDayByMonth');
  });
});

/**
 * `payoutMonthsSource` 는 `ticker:paydates`(월 1회, 쿼터 25건)가 소유하고 매일 도는 가격 갱신은
 * **보존만** 한다. 매일 돌면서 마커를 지우면 다음 paydates 실행이 같은 무배당 종목을 영원히 다시
 * 확인하느라 쿼터를 태운다 — 이 describe 가 그 회귀를 막는다.
 */
describe('payoutMonthsSource 이월 (매일 가격 갱신)', () => {
  const snapshotWith = (entries: Record<string, MarketDataSnapshotEntry>) => ({
    asOf: '2026-07-01',
    source: 'fixture',
    entries
  });

  /** ANET 은 큐레이션 프리셋에 있는 무배당 종목이라, 빈 배당 이력이 현실적인 픽스처가 된다. */
  const noneMarked: MarketDataSnapshotEntry = {
    initialPrice: 290,
    dividendYield: 0,
    frequency: 'quarterly',
    payoutMonthsSource: 'none'
  };

  it("배당이 여전히 없으면 'none' 마커가 살아남는다 (가격은 갱신된다)", async () => {
    const providerWithNoDividends = createFixtureProvider({ quotes: { ANET: 300 }, dividends: { ANET: [] } });

    const result = await run(['ANET'], providerWithNoDividends, snapshotWith({ ANET: noneMarked }));
    const entry = result.snapshot.entries.ANET;

    expect(result.updated).toBe(1);
    expect(entry.payoutMonthsSource).toBe('none');
    expect(entry).not.toHaveProperty('payoutMonths');
    expect(entry.initialPrice).toBe(300);
  });

  it("배당을 시작해 지급월이 추론되면 'ex' 로 자연 해제된다 (마커가 영구 고착되지 않는다)", async () => {
    const providerWithDividends = createFixtureProvider({
      quotes: { ANET: 300 },
      dividends: { ANET: SCHD_DIVIDENDS }
    });

    const result = await run(['ANET'], providerWithDividends, snapshotWith({ ANET: noneMarked }));
    const entry = result.snapshot.entries.ANET;

    expect(entry.payoutMonthsSource).toBe('ex');
    expect(entry.payoutMonths).toEqual([3, 6, 9, 12]);
  });

  it('마커가 없던 무배당 엔트리는 여전히 출처 없이 남는다 (가격 갱신이 마커를 만들지 않는다)', async () => {
    const providerWithNoDividends = createFixtureProvider({ quotes: { ANET: 300 }, dividends: { ANET: [] } });

    const result = await run(
      ['ANET'],
      providerWithNoDividends,
      snapshotWith({ ANET: { initialPrice: 290, dividendYield: 0, frequency: 'quarterly' } })
    );

    expect(result.snapshot.entries.ANET).not.toHaveProperty('payoutMonthsSource');
  });

  it('pay 기준 지급월은 ex 추론으로 강등되지 않는다 (기존 이월 규칙 무회귀)', async () => {
    const providerForSchd = createFixtureProvider({ quotes: { SCHD: 32.1 }, dividends: { SCHD: SCHD_DIVIDENDS } });

    // 실측 지급월(2/5/8/11)은 배당락 기준 추론(3/6/9/12)과 일부러 다르게 잡았다.
    const result = await run(
      ['SCHD'],
      providerForSchd,
      snapshotWith({
        SCHD: {
          initialPrice: 32,
          dividendYield: 3.4,
          frequency: 'quarterly',
          payoutMonths: [2, 5, 8, 11],
          payoutMonthsSource: 'pay'
        }
      })
    );
    const entry = result.snapshot.entries.SCHD;

    expect(entry.payoutMonths).toEqual([2, 5, 8, 11]);
    expect(entry.payoutMonthsSource).toBe('pay');
  });
});

describe('derived-growth warning (soft guard)', () => {
  it('warns when a refreshed yield overruns the curated expectedTotalReturn', async () => {
    // QYLD: curated etr 7%. An 11%+ TTM yield forces the derived growth negative.
    const provider = createFixtureProvider({
      quotes: { QYLD: 17 },
      dividends: { QYLD: QYLD_DIVIDENDS }
    });

    const result = await run(['QYLD'], provider);
    const outcome = result.outcomes[0];

    expect(outcome.status).toBe('updated');
    expect(outcome.status === 'updated' && outcome.warnings).toHaveLength(1);
    expect(outcome.status === 'updated' && outcome.warnings[0]).toContain('expectedTotalReturn');

    // The value is still written, and the model stays coherent — a covered-call fund really does shrink.
    const universe = buildDividendUniverse(CURATED_DIVIDEND_UNIVERSE, result.snapshot);
    expect(universe.QYLD.dividendGrowth).toBeLessThan(0);
    expect(universe.QYLD.dividendYield + universe.QYLD.dividendGrowth).toBeCloseTo(
      CURATED_DIVIDEND_UNIVERSE.QYLD.expectedTotalReturn,
      9
    );

    // A soft warning must not break CI: the data itself is fine.
    expect(verdictOf(result)).toBe('ok');
    expect(formatRefreshReport(result, { dryRun: true })).toContain('WARN derived dividendGrowth is negative');
  });

  it('stays silent for a healthy dividend-growth ETF', async () => {
    const provider = createFixtureProvider({
      quotes: { SCHD: 32.1 },
      dividends: { SCHD: SCHD_DIVIDENDS }
    });

    const result = await run(['SCHD'], provider);
    const outcome = result.outcomes[0];

    expect(outcome.status === 'updated' && outcome.warnings).toEqual([]);
  });
});

describe('topCagrDivergences (curated etr vs observed CAGR)', () => {
  it('surfaces a ticker whose observed CAGR has outgrown the curated assumption', async () => {
    const provider = createFixtureProvider({
      quotes: { SCHD: 32.1 },
      dividends: { SCHD: SCHD_FAST_GROWTH_DIVIDENDS }
    });

    const result = await run(['SCHD'], provider);
    const [top] = topCagrDivergences(result);

    expect(top.ticker).toBe('SCHD');
    expect(top.expectedTotalReturn).toBe(10);
    expect(top.derivedDividendGrowth).toBeCloseTo(10 - top.dividendYield, 9);
    expect(top.observedDividendCagr).toBeGreaterThan(10);
    // The gap the curator is being asked to look at.
    expect(top.divergence).toBeCloseTo(top.observedDividendCagr - top.derivedDividendGrowth, 2);
    // Same number, read the other way: what the market's own history implies for the total return.
    expect(top.divergence).toBeCloseTo(
      top.dividendYield + top.observedDividendCagr - top.expectedTotalReturn,
      2
    );
  });

  it('stays quiet when the curated assumption and the observed CAGR agree', async () => {
    // A history whose CAGR lands close to SCHD's derived growth (etr 10 - dy ~3.4 = ~6.6).
    const agreeable = quarterlyHistory({
      2020: 0.79,
      2021: 0.84,
      2022: 0.9,
      2023: 0.96,
      2024: 1.02,
      2025: 1.09
    });
    const provider = createFixtureProvider({ quotes: { SCHD: 32.1 }, dividends: { SCHD: agreeable } });

    const result = await run(['SCHD'], provider);

    expect(topCagrDivergences(result)).toEqual([]);
    expect(formatRefreshReport(result, { dryRun: true })).not.toContain('REVIEW curated');
  });

  it('ranks by absolute divergence and honours the limit', async () => {
    const provider = createFixtureProvider({
      quotes: { SCHD: 32.1, JEPI: 56.2, VTI: 250 },
      dividends: { SCHD: SCHD_FAST_GROWTH_DIVIDENDS, JEPI: JEPI_DIVIDENDS, VTI: VTI_DIVIDENDS }
    });

    const result = await run(['SCHD', 'JEPI', 'VTI'], provider);
    const ranked = topCagrDivergences(result, 2, 0);

    expect(ranked.length).toBeLessThanOrEqual(2);
    for (let index = 1; index < ranked.length; index += 1) {
      expect(Math.abs(ranked[index - 1].divergence)).toBeGreaterThanOrEqual(Math.abs(ranked[index].divergence));
    }
  });

  it('has no review for a ticker with no observable CAGR', async () => {
    const provider = createFixtureProvider({ quotes: { SCHD: 32.1 }, dividends: { SCHD: [] } });
    const result = await run(['SCHD'], provider);

    expect(result.outcomes[0].status === 'updated' && result.outcomes[0].review).toBeNull();
    expect(topCagrDivergences(result)).toEqual([]);
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

  it('states which fields it is allowed to refresh', async () => {
    const provider = createFixtureProvider({ quotes: { SCHD: 32.1 }, dividends: { SCHD: SCHD_DIVIDENDS } });
    const report = formatRefreshReport(await run(['SCHD'], provider), { dryRun: true });

    expect(report).toContain('initialPrice, dividendYield, frequency');
    expect(report).toContain('dividendGrowth is derived');
  });

  it('prints the curated-etr review section for a diverging ticker', async () => {
    const provider = createFixtureProvider({
      quotes: { SCHD: 32.1 },
      dividends: { SCHD: SCHD_FAST_GROWTH_DIVIDENDS }
    });

    const report = formatRefreshReport(await run(['SCHD'], provider), { dryRun: true });

    expect(report).toContain('REVIEW curated expectedTotalReturn vs observed dividend CAGR');
    expect(report).toContain('SCHD: curated etr 10.00%');
    expect(report).toContain('observed CAGR');
    expect(report).toContain('implied etr');
    expect(report).toContain('%p)');
  });
});
