// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { computeHoldingMonthlyDividend, runSimulation } from '@/shared/lib/snowball';
import { KOREAN_DIVIDEND_TAX_RATE, US_LISTED_DIVIDEND_TAX_RATE } from '@/shared/constants/tax';

describe('computeHoldingMonthlyDividend', () => {
  it('세전 연배당을 12로 나누고 세율을 뗀다', () => {
    // 100주 × 10,000원 × 4% = 연 40,000원 → 월 3,333.33원 → 세율 0% 이면 그대로.
    expect(
      computeHoldingMonthlyDividend({ ticker: 'SCHD', shares: 100, price: 10_000, dividendYield: 4, taxRate: 0 })
    ).toBeCloseTo(40_000 / 12, 8);
  });

  it('세율 미입력이면 상장지에서 파생한다 — 국내 상장은 15.4%다', () => {
    const gross = (100 * 10_000 * 4) / 100 / 12;

    const usListed = computeHoldingMonthlyDividend({ ticker: 'SCHD', shares: 100, price: 10_000, dividendYield: 4 });
    const koreaListed = computeHoldingMonthlyDividend({
      ticker: 'TIGER.KS',
      shares: 100,
      price: 10_000,
      dividendYield: 4
    });

    expect(usListed).toBeCloseTo(gross * (1 - US_LISTED_DIVIDEND_TAX_RATE / 100), 8);
    expect(koreaListed).toBeCloseTo(gross * (1 - KOREAN_DIVIDEND_TAX_RATE / 100), 8);
    expect(koreaListed).toBeLessThan(usListed);
  });

  it('사용자가 넣은 0%는 미입력이 아니다', () => {
    const explicitZero = computeHoldingMonthlyDividend({
      ticker: 'SCHD',
      shares: 100,
      price: 10_000,
      dividendYield: 4,
      taxRate: 0
    });
    const derived = computeHoldingMonthlyDividend({ ticker: 'SCHD', shares: 100, price: 10_000, dividendYield: 4 });

    expect(explicitZero).toBeGreaterThan(derived);
  });

  it('ISA 는 지급 시점에 떼지 않는다 (정산세는 이 값에 없다)', () => {
    const isa = computeHoldingMonthlyDividend({
      ticker: 'TIGER.KS',
      shares: 100,
      price: 10_000,
      dividendYield: 4,
      accountType: 'isa'
    });

    expect(isa).toBeCloseTo((100 * 10_000 * 4) / 100 / 12, 8);
  });

  it('주식 수·주가·배당률 중 하나라도 0이면 0이다', () => {
    expect(computeHoldingMonthlyDividend({ ticker: 'SCHD', shares: 0, price: 10_000, dividendYield: 4 })).toBe(0);
    expect(computeHoldingMonthlyDividend({ ticker: 'SCHD', shares: 100, price: 0, dividendYield: 4 })).toBe(0);
    expect(computeHoldingMonthlyDividend({ ticker: 'SCHD', shares: 100, price: 10_000, dividendYield: 0 })).toBe(0);
  });

  it('음수·비유한 입력을 0으로 접는다', () => {
    expect(computeHoldingMonthlyDividend({ ticker: 'SCHD', shares: -100, price: 10_000, dividendYield: 4 })).toBe(0);
    expect(
      computeHoldingMonthlyDividend({ ticker: 'SCHD', shares: Number.NaN, price: 10_000, dividendYield: 4 })
    ).toBe(0);
  });

  /**
   * 🔴 엔진과의 검산. 성장 0·적립 0·재투자 없음이면 주식 수와 주가가 시작 그대로 유지되므로,
   * 엔진이 종료 시점에 내는 `finalRunRateMonthlyDividend` 와 이 함수의 t=0 값이 **같아야 한다.**
   * 두 값이 갈리면 같은 화면에서 배당률이 어긋나 보인다.
   */
  it('성장이 없으면 엔진의 종료 시점 월배당과 일치한다', () => {
    const initialInvestment = 10_000_000;
    const initialPrice = 100_000;
    const dividendYield = 4;

    const output = runSimulation({
      ticker: {
        ticker: 'SCHD',
        initialPrice,
        dividendYield,
        dividendGrowth: 0,
        expectedTotalReturn: dividendYield,
        frequency: 'quarterly'
      },
      settings: {
        initialInvestment,
        monthlyContribution: 0,
        targetMonthlyDividend: 0,
        investmentStartDate: '2026-01-01',
        durationYears: 3,
        reinvestDividends: false,
        reinvestDividendPercent: 100,
        taxRate: undefined,
        reinvestTiming: 'sameMonth',
        dpsGrowthMode: 'monthlySmooth'
      }
    });

    const atStart = computeHoldingMonthlyDividend({
      ticker: 'SCHD',
      shares: initialInvestment / initialPrice,
      price: initialPrice,
      dividendYield
    });

    expect(atStart).toBeCloseTo(output.summary.finalRunRateMonthlyDividend, 6);
  });
});
