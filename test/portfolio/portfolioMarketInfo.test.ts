// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { MARKET_DATA } from '@/shared/constants/marketData';
import { DIVIDEND_UNIVERSE } from '@/shared/constants/presets';
import { runSimulation } from '@/shared/lib/snowball';
import { portfolioAnnualDpsUsd, resolvePortfolioMarketInfo, type PortfolioMarketInfo } from '@/shared/lib/portfolio';

/**
 * 시장 정보 3단 해석(스냅샷 → 프리셋 → 수동)과 **실데이터 구조 불변식**.
 *
 * ⚠ 실제 스냅샷은 월간 크론으로 값이 바뀐다 — 여기서는 금액을 단정하지 않고 "구조"만 본다
 * (금액 규칙은 `portfolioSummary.test.ts` 가 주입 픽스처로 고정한다).
 */

const UNIVERSE_TICKERS = Object.keys(DIVIDEND_UNIVERSE);
const SNAPSHOT_TICKERS = Object.keys(MARKET_DATA.entries);

/** 스냅샷에 아직 없는 유니버스 종목(있으면). 크론이 전 종목을 덮으면 없을 수도 있다. */
const PRESET_ONLY_TICKER = UNIVERSE_TICKERS.find((ticker) => !SNAPSHOT_TICKERS.includes(ticker));

const resolve = (ticker: string, manual?: { price: number; dividendYield: number }): PortfolioMarketInfo | null =>
  resolvePortfolioMarketInfo(manual ? { ticker, quantity: 1, manual } : { ticker, quantity: 1 });

describe('resolvePortfolioMarketInfo — 3단 해석', () => {
  it('스냅샷에 있는 종목은 snapshot 신선도 + 기준일을 갖는다', () => {
    const info = resolve('SCHD');

    expect(info).not.toBeNull();
    expect(info?.freshness).toBe('snapshot');
    expect(info?.asOf).toBe(MARKET_DATA.asOf);
    expect(info?.price).toBeGreaterThan(0);
    expect(info?.payoutMonths?.length ?? 0).toBeGreaterThan(0);
  });

  it('티커는 공백·소문자를 흡수한다', () => {
    expect(resolve('  schd ')).toEqual(resolve('SCHD'));
  });

  it.skipIf(!PRESET_ONLY_TICKER)('스냅샷에 없는 유니버스 종목은 preset 신선도 + 기준일 없음', () => {
    const info = resolve(PRESET_ONLY_TICKER ?? '');

    expect(info?.freshness).toBe('preset');
    expect(info?.asOf).toBeNull();
    expect(info?.price).toBeGreaterThan(0);
    // 지급월은 스냅샷에만 있으므로 프리셋 전용 종목은 #6·#7 에서 빠진다.
    expect(info?.payoutMonths).toBeUndefined();
  });

  it('유니버스 밖 티커는 수동 입력으로만 해석된다', () => {
    expect(resolve('ZZZZ')).toBeNull();
    expect(resolve('ZZZZ', { price: 120.5, dividendYield: 2.5 })).toEqual({
      price: 120.5,
      dividendYield: 2.5,
      freshness: 'manual',
      asOf: null
    });
  });

  it('수동 입력이 무효(가격 0·음수·NaN)면 해석 실패로 남긴다 — 0 으로 계산하지 않는다', () => {
    expect(resolve('ZZZZ', { price: 0, dividendYield: 3 })).toBeNull();
    expect(resolve('ZZZZ', { price: -10, dividendYield: 3 })).toBeNull();
    expect(resolve('ZZZZ', { price: Number.NaN, dividendYield: 3 })).toBeNull();
    expect(resolve('ZZZZ', { price: 10, dividendYield: Number.NaN })).toBeNull();
  });

  it('유니버스에 있는 티커는 수동 입력보다 우선한다 (사용자 값이 실데이터를 덮지 않는다)', () => {
    const info = resolve('SCHD', { price: 1, dividendYield: 99 });

    expect(info?.freshness).toBe('snapshot');
    expect(info?.dividendYield).not.toBe(99);
  });

  it('빈 티커는 수동 입력이 있어도 티커 매칭 없이 수동으로만 해석된다', () => {
    expect(resolve('')).toBeNull();
    expect(resolve('   ', { price: 10, dividendYield: 1 })?.freshness).toBe('manual');
  });
});

describe('실데이터 구조 불변식 (크론 갱신에도 깨지면 안 되는 것)', () => {
  it('유니버스 전 종목이 해석되고 가격·배당률이 계산 가능한 값이다', () => {
    UNIVERSE_TICKERS.forEach((ticker) => {
      const info = resolve(ticker);

      expect(info, ticker).not.toBeNull();
      expect(Number.isFinite(info?.price ?? Number.NaN), ticker).toBe(true);
      expect(info?.price ?? 0, ticker).toBeGreaterThan(0);
      expect(info?.dividendYield ?? -1, ticker).toBeGreaterThanOrEqual(0);
      expect(info?.freshness, ticker).toBe(SNAPSHOT_TICKERS.includes(ticker) ? 'snapshot' : 'preset');
    });
  });

  it('지급월은 1-12 정수·중복 없음·오름차순이다', () => {
    UNIVERSE_TICKERS.forEach((ticker) => {
      const months = resolve(ticker)?.payoutMonths;
      if (!months) return;

      expect(months.length, ticker).toBeGreaterThan(0);
      expect([...new Set(months)], ticker).toEqual(months);
      expect([...months].sort((left, right) => left - right), ticker).toEqual(months);
      months.forEach((month) => {
        expect(Number.isInteger(month) && month >= 1 && month <= 12, `${ticker} ${month}`).toBe(true);
      });
    });
  });

  it("예상 지급일은 'pay' 소스에만, 지급월에만, 2월은 28 이하로만 존재한다", () => {
    UNIVERSE_TICKERS.forEach((ticker) => {
      const info = resolve(ticker);
      const days = info?.estimatedPayDayByMonth;
      if (!days) return;

      expect(info?.payoutMonthsSource, ticker).toBe('pay');
      Object.entries(days).forEach(([month, day]) => {
        expect(info?.payoutMonths?.includes(Number(month)), `${ticker} ${month}`).toBe(true);
        expect(Number.isInteger(day) && day >= 1 && day <= 31, `${ticker} ${month}`).toBe(true);
        if (month === '2') expect(day, ticker).toBeLessThanOrEqual(28);
      });
    });
  });

  it("payoutMonthsSource 'none' 인 종목은 지급월이 없다 (출처를 거짓말하지 않는다)", () => {
    UNIVERSE_TICKERS.forEach((ticker) => {
      const info = resolve(ticker);
      if (info?.payoutMonthsSource !== 'none') return;

      expect(info?.payoutMonths, ticker).toBeUndefined();
    });
  });
});

describe('DPS 정의는 시뮬레이션 엔진과 같다', () => {
  it('portfolioAnnualDpsUsd = 가격 × 배당률/100 = 엔진의 dps0', () => {
    const info = resolve('SCHD');
    expect(info).not.toBeNull();

    const price = info?.price ?? 0;
    const dividendYield = info?.dividendYield ?? 0;

    // 성장률 0 이면 엔진의 1개월차 DPS 가 곧 dps0 다.
    const output = runSimulation({
      ticker: {
        ticker: 'SCHD',
        initialPrice: price,
        dividendYield,
        dividendGrowth: 0,
        expectedTotalReturn: dividendYield,
        frequency: 'quarterly'
      },
      settings: {
        initialInvestment: 1_000,
        monthlyContribution: 0,
        targetMonthlyDividend: 0,
        investmentStartDate: '2026-01-01',
        durationYears: 1,
        reinvestDividends: false,
        reinvestDividendPercent: 0,
        taxRate: 0,
        reinvestTiming: 'sameMonth',
        dpsGrowthMode: 'monthlySmooth'
      }
    });

    expect(portfolioAnnualDpsUsd(info as PortfolioMarketInfo)).toBeCloseTo(output.monthly[0].dividendPerShare, 12);
  });
});
