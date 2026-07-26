import { describe, expect, it } from 'vitest';
import {
  applyMarketData,
  EMPTY_MARKET_DATA_SNAPSHOT,
  MARKET_DATA,
  parseMarketDataSnapshot
} from '@/shared/constants/marketData';
import type { MarketDataSnapshot } from '@/shared/constants/marketData';
import { buildDividendUniverse, CURATED_DIVIDEND_UNIVERSE, DIVIDEND_UNIVERSE } from '@/shared/constants/presets';

const snapshotWith = (entries: MarketDataSnapshot['entries']): MarketDataSnapshot => ({
  asOf: '2026-07-14',
  source: 'test',
  entries
});

describe('applyMarketData', () => {
  it('is a no-op for an empty snapshot (the safety net: no data => current behaviour)', () => {
    expect(applyMarketData(CURATED_DIVIDEND_UNIVERSE, EMPTY_MARKET_DATA_SNAPSHOT)).toEqual(
      CURATED_DIVIDEND_UNIVERSE
    );
  });

  it('overlays the shipped marketData.generated.json without moving tickers or curated assumptions', () => {
    // The live universe MAY carry refreshed market data (initialPrice / dividendYield / frequency)
    // once a refresh PR lands, so it must NOT be asserted equal to the raw curated presets — that
    // would break both in the refresh workflow's post-write test gate and, permanently, in the repo
    // the moment the first refresh merges. What the overlay guarantees regardless of the snapshot:
    //   - it never adds or removes a ticker,
    //   - it never touches curated fields (ticker / name / expectedTotalReturn),
    //   - the coherent-model invariant survives (dividendYield + dividendGrowth === expectedTotalReturn).
    expect(Object.keys(DIVIDEND_UNIVERSE).sort()).toEqual(Object.keys(CURATED_DIVIDEND_UNIVERSE).sort());

    for (const [ticker, curated] of Object.entries(CURATED_DIVIDEND_UNIVERSE)) {
      const live = DIVIDEND_UNIVERSE[ticker as keyof typeof DIVIDEND_UNIVERSE];
      expect(live.ticker).toBe(curated.ticker);
      expect(live.name).toBe(curated.name);
      expect(live.expectedTotalReturn).toBe(curated.expectedTotalReturn);
      expect(live.dividendYield + live.dividendGrowth).toBeCloseTo(live.expectedTotalReturn, 9);
    }
  });

  it('overlays only the three observable market fields', () => {
    const overlaid = applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({ SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'monthly' } })
    );

    expect(overlaid.SCHD.initialPrice).toBe(32.1);
    expect(overlaid.SCHD.dividendYield).toBe(3.41);
    expect(overlaid.SCHD.frequency).toBe('monthly');
  });

  it('never overwrites curated values (name / expectedTotalReturn / ticker)', () => {
    const overlaid = applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({ SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'quarterly' } })
    );

    expect(overlaid.SCHD.name).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.name);
    expect(overlaid.SCHD.expectedTotalReturn).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.expectedTotalReturn);
    expect(overlaid.SCHD.ticker).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.ticker);
  });

  it('does not let a snapshot write dividendGrowth (it is an assumption, not an observation)', () => {
    // Even if a stale or hand-edited snapshot carried a historical dividend CAGR under the old key,
    // the schema strips it, so it can never become the price growth rate.
    const stale: unknown = {
      asOf: '2026-07-14',
      source: 'test',
      entries: {
        SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'quarterly', dividendGrowth: 11 }
      }
    };

    const parsed = parseMarketDataSnapshot(stale);
    expect(parsed.entries.SCHD).not.toHaveProperty('dividendGrowth');

    const overlaid = applyMarketData(CURATED_DIVIDEND_UNIVERSE, parsed);
    expect(overlaid.SCHD.dividendGrowth).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.dividendGrowth);
  });

  it('keeps the reference-only observedDividendCagr out of the universe', () => {
    const overlaid = applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({
        SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'quarterly', observedDividendCagr: 11 }
      })
    );

    // It lives in the snapshot for a human to read; it must never reach the engine.
    expect(overlaid.SCHD).not.toHaveProperty('observedDividendCagr');
  });

  it('strips curated-looking fields smuggled into a snapshot entry', () => {
    // Defence in depth: even if a generated file somehow carried `name`/`expectedTotalReturn`,
    // the schema strips them, so they can never reach the universe.
    const hostile: unknown = {
      asOf: '2026-07-14',
      source: 'test',
      entries: {
        SCHD: {
          initialPrice: 32.1,
          dividendYield: 3.41,
          frequency: 'quarterly',
          name: 'HACKED',
          expectedTotalReturn: 999
        }
      }
    };

    const parsed = parseMarketDataSnapshot(hostile);
    expect(parsed.entries.SCHD).not.toHaveProperty('name');

    const overlaid = applyMarketData(CURATED_DIVIDEND_UNIVERSE, parsed);
    expect(overlaid.SCHD.name).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.name);
    expect(overlaid.SCHD.expectedTotalReturn).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.expectedTotalReturn);
  });

  it('leaves tickers that are absent from the snapshot untouched', () => {
    const overlaid = applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({ SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'quarterly' } })
    );

    expect(overlaid.VOO).toEqual(CURATED_DIVIDEND_UNIVERSE.VOO);
    expect(overlaid.JEPI).toEqual(CURATED_DIVIDEND_UNIVERSE.JEPI);
  });

  it('ignores snapshot entries for tickers that are not in the universe', () => {
    const overlaid = applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({ NOT_A_PRESET: { initialPrice: 1, dividendYield: 1, frequency: 'annual' } })
    );

    expect(Object.keys(overlaid)).toEqual(Object.keys(CURATED_DIVIDEND_UNIVERSE));
    expect(overlaid).toEqual(CURATED_DIVIDEND_UNIVERSE);
  });

  it('does not mutate the input universe', () => {
    const before = structuredClone(CURATED_DIVIDEND_UNIVERSE);
    applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({ SCHD: { initialPrice: 99, dividendYield: 1, frequency: 'annual' } })
    );
    expect(CURATED_DIVIDEND_UNIVERSE).toEqual(before);
  });

  it('preserves every preset ticker key', () => {
    const overlaid = applyMarketData(CURATED_DIVIDEND_UNIVERSE, EMPTY_MARKET_DATA_SNAPSHOT);
    expect(Object.keys(overlaid).sort()).toEqual(Object.keys(CURATED_DIVIDEND_UNIVERSE).sort());
  });
});

/**
 * The heart of the coherent model: `dividendYield` is refreshed from the market, `expectedTotalReturn`
 * is a curated assumption, and `dividendGrowth` is whatever falls out of the two. If the derivation
 * ran *before* the overlay, `dividendGrowth` would still be based on the stale preset yield and the
 * invariant would break silently, corrupting every total-return assumption in the app.
 */
describe('buildDividendUniverse (overlay -> derive order)', () => {
  it('holds dy + dg === etr after a snapshot moves dividendYield', () => {
    const universe = buildDividendUniverse(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({
        // Yield up (3.34 -> 4.5): growth must fall by exactly the same amount, etr must not move.
        SCHD: { initialPrice: 28, dividendYield: 4.5, frequency: 'quarterly', observedDividendCagr: 11 },
        // Yield down (8.0 -> 6): growth must rise by the same amount (0 -> 2).
        JEPI: { initialPrice: 60, dividendYield: 6, frequency: 'monthly' }
      })
    );

    expect(universe.SCHD.dividendYield).toBe(4.5);
    expect(universe.SCHD.expectedTotalReturn).toBe(CURATED_DIVIDEND_UNIVERSE.SCHD.expectedTotalReturn);
    expect(universe.SCHD.dividendGrowth).toBeCloseTo(CURATED_DIVIDEND_UNIVERSE.SCHD.expectedTotalReturn - 4.5, 9);

    expect(universe.JEPI.dividendGrowth).toBeCloseTo(CURATED_DIVIDEND_UNIVERSE.JEPI.expectedTotalReturn - 6, 9);

    for (const preset of Object.values(universe)) {
      expect(preset.dividendYield + preset.dividendGrowth).toBeCloseTo(preset.expectedTotalReturn, 9);
    }
  });

  it('does not let the observed dividend CAGR become the growth rate', () => {
    // The regression this whole change exists to prevent: SCHD's historical payout CAGR is ~11%.
    // If that were overlaid onto `dividendGrowth`, the total return would silently become
    // 3.4 + 11 = 14.4%, betraying the curated 10%.
    const universe = buildDividendUniverse(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({
        SCHD: { initialPrice: 32.1, dividendYield: 3.4, frequency: 'quarterly', observedDividendCagr: 11 }
      })
    );

    expect(universe.SCHD.dividendGrowth).not.toBeCloseTo(11, 6);
    expect(universe.SCHD.dividendGrowth).toBeCloseTo(CURATED_DIVIDEND_UNIVERSE.SCHD.expectedTotalReturn - 3.4, 9);
    expect(universe.SCHD.dividendYield + universe.SCHD.dividendGrowth).toBeCloseTo(
      CURATED_DIVIDEND_UNIVERSE.SCHD.expectedTotalReturn,
      9
    );
  });

  it('lets the derived growth go negative when a refreshed yield overruns the curated etr', () => {
    // Legitimate for a covered-call fund (its NAV really does erode). The pipeline warns; the model
    // stays coherent either way.
    const universe = buildDividendUniverse(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({ QYLD: { initialPrice: 17, dividendYield: 12, frequency: 'monthly' } })
    );

    expect(universe.QYLD.dividendGrowth).toBeCloseTo(CURATED_DIVIDEND_UNIVERSE.QYLD.expectedTotalReturn - 12, 9);
    expect(universe.QYLD.dividendGrowth).toBeLessThan(0);
    expect(universe.QYLD.dividendYield + universe.QYLD.dividendGrowth).toBeCloseTo(
      CURATED_DIVIDEND_UNIVERSE.QYLD.expectedTotalReturn,
      9
    );
  });

  it('is a no-op for an empty snapshot', () => {
    expect(buildDividendUniverse(CURATED_DIVIDEND_UNIVERSE, EMPTY_MARKET_DATA_SNAPSHOT)).toEqual(
      CURATED_DIVIDEND_UNIVERSE
    );
  });
});

describe('parseMarketDataSnapshot', () => {
  it('parses a valid snapshot', () => {
    const snapshot = snapshotWith({
      SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'quarterly', observedDividendCagr: 8.2 }
    });
    expect(parseMarketDataSnapshot(snapshot)).toEqual(snapshot);
  });

  it('parses an entry without the optional observedDividendCagr', () => {
    const snapshot = snapshotWith({ SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'quarterly' } });
    expect(parseMarketDataSnapshot(snapshot)).toEqual(snapshot);
  });

  it('falls back to an empty snapshot when the file is malformed (app must never break)', () => {
    expect(parseMarketDataSnapshot({ asOf: 'yesterday', source: 'fmp', entries: {} })).toEqual(
      EMPTY_MARKET_DATA_SNAPSHOT
    );
    expect(parseMarketDataSnapshot('garbage')).toEqual(EMPTY_MARKET_DATA_SNAPSHOT);
    expect(parseMarketDataSnapshot(null)).toEqual(EMPTY_MARKET_DATA_SNAPSHOT);
  });

  it('rejects a snapshot carrying an out-of-range entry', () => {
    const bad = snapshotWith({ SCHD: { initialPrice: 32.1, dividendYield: 999, frequency: 'quarterly' } });
    expect(parseMarketDataSnapshot(bad)).toEqual(EMPTY_MARKET_DATA_SNAPSHOT);
  });

  it('rejects a snapshot carrying an absurd observedDividendCagr', () => {
    const bad = snapshotWith({
      SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'quarterly', observedDividendCagr: 900 }
    });
    expect(parseMarketDataSnapshot(bad)).toEqual(EMPTY_MARKET_DATA_SNAPSHOT);
  });
});

/**
 * `payoutMonthsSource: 'none'`("지급 기록 없음으로 확인") 은 나중에 추가된 값이다. 스키마가
 * 이 값 하나를 못 받으면 **스냅샷 전체**가 폴백돼 전 종목 시세가 큐레이션 값으로 되돌아간다 —
 * 하위 호환 양방향(신규 값 통과 / 구 엔트리 통과)을 여기서 못 박는다.
 */
describe("parseMarketDataSnapshot — payoutMonthsSource 'none' 하위 호환", () => {
  it("'none' 마커가 붙은 엔트리를 그대로 통과시킨다", () => {
    const snapshot = snapshotWith({
      ANET: { initialPrice: 290, dividendYield: 0, frequency: 'quarterly', payoutMonthsSource: 'none' }
    });

    expect(parseMarketDataSnapshot(snapshot)).toEqual(snapshot);
  });

  it("기존 'ex'·'pay' 엔트리도 그대로 통과한다", () => {
    const snapshot = snapshotWith({
      SCHD: {
        initialPrice: 32.1,
        dividendYield: 3.41,
        frequency: 'quarterly',
        payoutMonths: [3, 6, 9, 12],
        payoutMonthsSource: 'pay'
      },
      KO: {
        initialPrice: 62,
        dividendYield: 3.1,
        frequency: 'quarterly',
        payoutMonths: [4, 7, 10, 12],
        payoutMonthsSource: 'ex'
      }
    });

    expect(parseMarketDataSnapshot(snapshot)).toEqual(snapshot);
  });

  it('출처가 아예 없는 구 엔트리도 통과한다 (마이그레이션 없이 열려야 한다)', () => {
    const legacy = snapshotWith({
      SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'quarterly', payoutMonths: [3, 6, 9, 12] }
    });

    expect(parseMarketDataSnapshot(legacy)).toEqual(legacy);
  });

  it('알 수 없는 출처 값은 여전히 막는다 (열거형이 느슨해지지 않았다)', () => {
    const bad = {
      asOf: '2026-07-14',
      source: 'test',
      entries: {
        SCHD: { initialPrice: 32.1, dividendYield: 3.41, frequency: 'quarterly', payoutMonthsSource: 'guess' }
      }
    };

    expect(parseMarketDataSnapshot(bad)).toEqual(EMPTY_MARKET_DATA_SNAPSHOT);
  });

  it("'none' 은 엔진 입력으로 새지 않는다 (오버레이는 관측 3필드만 옮긴다)", () => {
    const overlaid = applyMarketData(
      CURATED_DIVIDEND_UNIVERSE,
      snapshotWith({
        ANET: { initialPrice: 300, dividendYield: 0, frequency: 'quarterly', payoutMonthsSource: 'none' }
      })
    );

    expect(overlaid.ANET.initialPrice).toBe(300);
    expect(overlaid.ANET).not.toHaveProperty('payoutMonthsSource');
  });

  /** 불변식: `'none'` 은 지급월이 없는 엔트리에만 붙는다 — 실제 배포 스냅샷에서 검사한다. */
  it("배포된 스냅샷의 'none' 엔트리에는 지급월이 없다", () => {
    for (const [ticker, entry] of Object.entries(MARKET_DATA.entries)) {
      if (entry.payoutMonthsSource !== 'none') continue;
      expect(entry.payoutMonths, `${ticker} 는 'none' 인데 지급월을 갖고 있다`).toBeUndefined();
    }
  });
});
