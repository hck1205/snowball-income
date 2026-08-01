// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { buildNextPayoutTile, buildPortfolioViewModel } from '@/pages/Portfolio/PortfolioPage';
import type { PortfolioViewModelInput } from '@/pages/Portfolio/PortfolioPage';
import type { PortfolioHoldingRow } from '@/pages/Portfolio/hooks';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';
import { computePortfolioSummary } from '@/shared/lib/portfolio';
import type { PortfolioMarketInfo, PortfolioMarketInfoResolver } from '@/shared/lib/portfolio';
import { FIXTURE_MONTHLY, FIXTURE_ODD_QUARTERLY, FIXTURE_QUARTERLY, localDate } from './portfolioFixtures';

/**
 * 다음 예상 지급일 타일(#7)의 **묶기 규칙**과 제외 안내(AC3-3·AC3-4).
 *
 * `portfolioViewModel.test.ts` 가 3분기(일자 있음 / 월만 / 없음)를 각각 확인한다면, 여기서는
 * 여러 종목이 섞였을 때다: 같은 날 지급하는 종목을 "외 n종"으로 묶고, **근거 등급이 다르면 묶지 않으며**
 * (한쪽은 날짜를 알고 한쪽은 모르는데 한 줄로 합치면 모르는 쪽에 날짜가 생긴 것처럼 읽힌다),
 * 계산에 들어가지 않은 행은 타일에서 빠진다.
 */

const copy = PORTFOLIO_COPY;
const TODAY = localDate(2026, 7, 27);

const resolverOf = (byTicker: Record<string, PortfolioMarketInfo>): PortfolioMarketInfoResolver => (holding) => {
  const symbol = typeof holding.ticker === 'string' ? holding.ticker.trim().toUpperCase() : '';

  return byTicker[symbol] ?? null;
};

const summaryOf = (
  quantities: Record<string, number>,
  byTicker: Record<string, PortfolioMarketInfo>,
  today: Date = TODAY
) =>
  computePortfolioSummary(
    Object.entries(quantities).map(([ticker, quantity]) => ({ ticker, quantity })),
    { today, taxRatePercent: 15.4, resolve: resolverOf(byTicker) }
  );

describe('다음 예상 지급일 — 같은 날 지급하는 종목 묶기 (AC3-3)', () => {
  it('같은 달·같은 날이면 한 줄로 묶어 "외 n종"으로 센다', () => {
    // 둘 다 8월 5일 예상(FIXTURE_MONTHLY 의 지급일 맵).
    const summary = summaryOf({ AAA: 10, BBB: 20 }, { AAA: FIXTURE_MONTHLY, BBB: FIXTURE_MONTHLY });
    const tile = buildNextPayoutTile(summary);

    expect(tile.value).toBe(copy.summary.tiles.nextPayoutDay(8, 5));
    expect(tile.hint).toBe(copy.summary.tiles.tickerSummary('AAA', 2));
    expect(tile.hint).toBe('AAA 외 1종');
  });

  it('같은 달이어도 근거 등급이 다르면 묶지 않는다 (모르는 쪽에 날짜를 붙이지 않는다)', () => {
    /*
     * ODDQ 는 8월 14일(일자까지 앎), MONTHLY 는 8월 5일(일자까지 앎)이라 등급이 같아 날짜로 갈린다.
     * 여기서는 8월에 월만 아는 종목(QUARTERLY 는 9월이라 대신 payoutMonths 를 8월로 둔 변형)을 쓴다.
     */
    const monthOnlyAugust: PortfolioMarketInfo = { ...FIXTURE_QUARTERLY, payoutMonths: [2, 5, 8, 11] };
    const summary = summaryOf({ DATED: 10, VAGUE: 10 }, { DATED: FIXTURE_MONTHLY, VAGUE: monthOnlyAugust });
    const tile = buildNextPayoutTile(summary);

    // 날짜를 아는 쪽이 먼저 온다(같은 달이면 근거가 강한 쪽).
    expect(tile.value).toBe(copy.summary.tiles.nextPayoutDay(8, 5));
    // 힌트에는 그 한 종목만 — 월만 아는 종목이 같은 날짜로 딸려 들어가지 않는다.
    expect(tile.hint).toBe('DATED');
  });

  it('월만 아는 종목끼리는 "날짜 미정"과 함께 묶는다', () => {
    const summary = summaryOf({ AAA: 10, BBB: 10 }, { AAA: FIXTURE_QUARTERLY, BBB: FIXTURE_QUARTERLY });
    const tile = buildNextPayoutTile(summary);

    expect(tile.value).toBe(copy.summary.tiles.nextPayoutMonthOnly(9));
    expect(tile.hint).toBe(copy.summary.tiles.nextPayoutMonthOnlyHint('AAA 외 1종'));
  });

  it('가장 가까운 지급을 고른다 (다른 달이면 이른 달)', () => {
    const summary = summaryOf({ LATER: 10, SOONER: 10 }, { LATER: FIXTURE_QUARTERLY, SOONER: FIXTURE_ODD_QUARTERLY });

    // QUARTERLY 는 9월, ODDQ 는 8월 14일 — 8월이 먼저다.
    expect(buildNextPayoutTile(summary).value).toBe(copy.summary.tiles.nextPayoutDay(8, 14));
  });

  /**
   * **연도가 다르면 같은 달·같은 날이어도 다른 지급이다.**
   *
   * 엔진은 지급 연도를 `nextPayout.year` 로 준다(연 1회 종목의 당월 지급일이 지나면 다음 차례는
   * 내년 같은 달이다). 화면이 연도를 무시하면 2026-08 과 2027-08 이 한 줄로 묶여, 내년에 들어올 돈이
   * 이번 달 지급 줄의 "외 n종"으로 세어진다. 두 지급을 엔진으로 동시에 만들 수 없으므로
   * (같은 (월,일)이면 탐색 결과의 연도도 같다) 여기서는 **뷰 모델의 계약**을 직접 겨눈다.
   */
  const withPayoutYear = (summary: ReturnType<typeof summaryOf>, index: number, year: number) => ({
    ...summary,
    holdings: summary.holdings.map((row, rowIndex) =>
      rowIndex === index && row.nextPayout.kind !== 'none'
        ? { ...row, nextPayout: { ...row.nextPayout, year } }
        : row
    )
  });

  it('연도가 다르면 같은 달·같은 날이어도 묶지 않는다', () => {
    // 둘 다 8월 5일이지만 BBB 만 내년 지급이다.
    const summary = summaryOf({ AAA: 10, BBB: 20 }, { AAA: FIXTURE_MONTHLY, BBB: FIXTURE_MONTHLY });
    const tile = buildNextPayoutTile(withPayoutYear(summary, 1, 2027));

    expect(tile.value).toBe(copy.summary.tiles.nextPayoutDay(8, 5));
    // "외 1종"이 되면 내년 지급이 이번 달 입금으로 세어진 것이다.
    expect(tile.hint).toBe('AAA');
  });

  it('올해가 아닌 지급에는 연도를 병기한다 (같은 해에는 붙이지 않는다)', () => {
    const thisYear = summaryOf({ AAA: 10 }, { AAA: FIXTURE_MONTHLY });
    expect(buildNextPayoutTile(thisYear).value).toBe(copy.summary.tiles.nextPayoutDay(8, 5));

    const nextYear = buildNextPayoutTile(withPayoutYear(thisYear, 0, 2027));
    expect(nextYear.value).toBe(copy.summary.tiles.nextPayoutDayWithYear(2027, 8, 5));
    expect(nextYear.value).toBe('2027년 8월 5일 예상');
  });

  it('월만 아는 지급도 올해가 아니면 연도를 병기한다', () => {
    const summary = summaryOf({ AAA: 10 }, { AAA: FIXTURE_QUARTERLY });
    const tile = buildNextPayoutTile(withPayoutYear(summary, 0, 2027));

    expect(tile.value).toBe(copy.summary.tiles.nextPayoutMonthOnlyWithYear(2027, 9));
  });

  it('내년 지급보다 올해 지급을 먼저 고른다 (달 숫자만 보고 정렬하지 않는다)', () => {
    /*
     * ODDQ 는 8월 14일, MONTHLY 는 8월 5일 — 달·일만 보면 MONTHLY 가 먼저다.
     * MONTHLY 를 내년으로 옮기면 정렬 결과가 뒤집혀야 한다(연도를 세지 않으면 그대로 남는다).
     */
    const summary = summaryOf({ SOON: 10, LATER: 10 }, { SOON: FIXTURE_ODD_QUARTERLY, LATER: FIXTURE_MONTHLY });
    const tile = buildNextPayoutTile(withPayoutYear(summary, 1, 2027));

    expect(tile.value).toBe(copy.summary.tiles.nextPayoutDay(8, 14));
    expect(tile.hint).toBe('SOON');
  });

  it('수량을 넣지 않은 행은 지급일 타일에서 빠진다 (합계에 없는 행이 일정만 말하지 않게)', () => {
    const summary = summaryOf({ AAA: 0 }, { AAA: FIXTURE_MONTHLY });
    const tile = buildNextPayoutTile(summary);

    // 행 자체는 다음 지급일을 알고 있지만(수량과 무관한 사실), 요약 타일은 계산에 든 행만 말한다.
    expect(summary.holdings[0].nextPayout.kind).toBe('estimated-day');
    expect(tile.value).toBe(copy.summary.tiles.nextPayoutNone);
    expect(tile.hint).toBe(copy.summary.tiles.nextPayoutNoneHint);
  });
});

describe('제외 안내는 사유별로 각각 말한다 (AC3-4)', () => {
  const row = (ticker: string, quantityInput: string, manual?: { price: number; dividendYield: number }): PortfolioHoldingRow => ({
    ticker,
    quantity: quantityInput === '' ? null : Number(quantityInput),
    quantityInput,
    ...(manual ? { manual } : {})
  });

  const modelOf = (items: PortfolioHoldingRow[], overrides: Partial<PortfolioViewModelInput> = {}) => {
    const byTicker: Record<string, PortfolioMarketInfo> = {
      PAYS: FIXTURE_MONTHLY,
      NOSCHED: { ...FIXTURE_QUARTERLY, payoutMonths: undefined, payoutMonthsSource: undefined }
    };
    const summary = computePortfolioSummary(
      items.map((item) => ({
        ticker: item.ticker,
        quantity: item.quantity ?? 0,
        ...(item.manual ? { manual: item.manual } : {})
      })),
      {
        today: TODAY,
        taxRatePercent: 15.4,
        resolve: (holding) => {
          const symbol = typeof holding.ticker === 'string' ? holding.ticker.trim().toUpperCase() : '';
          const found = byTicker[symbol];
          if (found) return found;

          const manual = holding.manual;

          return manual ? { price: manual.price, dividendYield: manual.dividendYield, freshness: 'manual', asOf: null } : null;
        }
      }
    );

    return buildPortfolioViewModel({
      status: 'ready',
      items,
      summary,
      fx: { status: 'success', rate: 1381, asOf: '2026-07-27T00:00:00+09:00' },
      writeError: null,
      formatUsdAmount: (usd: number) => `USD:${usd.toFixed(2)}`,
      today: TODAY,
      canSimulate: true,
      simulationExcludedCount: 0,
      calendarTickerCount: items.length,
      calendarExcludedCount: 0,
      pendingUndo: null,
      ...overrides
    });
  };

  it('직접 추가한 종목과 지급월을 모르는 종목이 섞이면 두 사유를 각각 센다', () => {
    const model = modelOf([
      row('PAYS', '10'),
      row('NOSCHED', '10'),
      row('CUSTOM', '10', { price: 50, dividendYield: 4 })
    ]);

    expect(model.summaryNotes).toContain(copy.summary.manualExcludedNote(1));
    expect(model.summaryNotes).toContain(copy.summary.missingScheduleNote(1));
    // 사유가 다르면 문장도 다르다 — 한 줄로 합쳐 "2종 제외"라고 말하지 않는다.
    expect(model.summaryNotes).not.toContain(copy.summary.missingScheduleNote(2));
  });

  it('제외가 없으면 안내도 없다 (경고가 상시 노출로 굳지 않게)', () => {
    const model = modelOf([row('PAYS', '10')]);

    expect(model.summaryNotes).toEqual([]);
    expect(model.rows[0].note).toBeNull();
  });
});
