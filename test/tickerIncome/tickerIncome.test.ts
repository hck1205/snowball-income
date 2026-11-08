// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import { DIVIDEND_UNIVERSE } from '@/shared/constants/presets';
import { monthlyDividendForPrincipal, principalForMonthlyDividend } from '@/shared/lib/goalPlan';
import {
  TICKER_INCOME_HEADLINE_PRINCIPAL,
  TICKER_INCOME_PRINCIPALS,
  buildTickerIncomeAnswer,
  formatIncomeWon
} from '@/shared/lib/tickerIncome';

/**
 * 티커 페이지 "N 원을 넣으면 매달 얼마?"(2026-11-09).
 *
 * 잠그는 것: ① `/dividend/how-much` 의 원금 식과 **같은 답**(역함수 왕복) ② 엔진과 같은 답
 * ③ 배당 없는 종목은 답을 만들지 않는다 ④ 결과가 원금에 선형이다(주가·환율이 섞이지 않는다).
 */
describe('monthlyDividendForPrincipal — 원금 식의 역함수', () => {
  it('🔴 principalForMonthlyDividend 와 왕복하면 원래 값이 나온다', () => {
    for (const [dividendYield, taxRate] of [[0.03, 0.15], [0.0755, 0.15], [0.12, 0.154]] as const) {
      const monthly = monthlyDividendForPrincipal({ principal: 100_000_000, dividendYield, taxRate })!;
      const principal = principalForMonthlyDividend({ monthlyDividend: monthly, dividendYield, taxRate })!;
      expect(principal).toBeCloseTo(100_000_000, 4);
    }
  });

  it('1억 · 배당률 3% · 세율 15% 면 세후 월 212,500원', () => {
    expect(monthlyDividendForPrincipal({ principal: 100_000_000, dividendYield: 0.03, taxRate: 0.15 })).toBeCloseTo(
      212_500,
      6
    );
  });

  it('성립하지 않는 입력은 null', () => {
    expect(monthlyDividendForPrincipal({ principal: 0, dividendYield: 0.03, taxRate: 0.15 })).toBeNull();
    expect(monthlyDividendForPrincipal({ principal: 1e8, dividendYield: 0, taxRate: 0.15 })).toBeNull();
    expect(monthlyDividendForPrincipal({ principal: 1e8, dividendYield: 0.03, taxRate: 1 })).toBeNull();
  });
});

describe('buildTickerIncomeAnswer', () => {
  it('🔴 지금 받는 월 배당은 프리셋 배당률 · 상장지 세율로 계산한다', () => {
    const answer = buildTickerIncomeAnswer('SCHD')!;
    const preset = DIVIDEND_UNIVERSE.SCHD;

    expect(answer.taxRatePercent).toBe(15);
    expect(answer.headline.principal).toBe(TICKER_INCOME_HEADLINE_PRINCIPAL);
    expect(answer.headline.monthlyAfterTax).toBeCloseTo((1e8 * (preset.dividendYield / 100) * 0.85) / 12, 6);
    expect(answer.headline.annualAfterTax).toBeCloseTo(answer.headline.monthlyAfterTax * 12, 6);
  });

  it('원금 구간을 전부 같은 순서로 낸다', () => {
    expect(buildTickerIncomeAnswer('SCHD')!.rows.map((row) => row.principal)).toEqual([...TICKER_INCOME_PRINCIPALS]);
  });

  it('🔴 결과는 원금에 선형이다 — 주가(USD)는 주식 수만 정하고 답에 섞이지 않는다', () => {
    const { rows } = buildTickerIncomeAnswer('JEPI')!;
    const [small, , headline] = rows;
    const ratio = headline!.principal / small!.principal;

    expect(headline!.monthlyAfterTax / small!.monthlyAfterTax).toBeCloseTo(ratio, 9);
    expect(headline!.monthlyAfterReinvest / small!.monthlyAfterReinvest).toBeCloseTo(ratio, 6);
  });

  it('배당을 재투자하면 성장률이 음수가 아닌 한 10년 뒤 월 배당이 지금보다 크다', () => {
    const answer = buildTickerIncomeAnswer('SCHD')!;
    expect(answer.headline.monthlyAfterReinvest).toBeGreaterThan(answer.headline.monthlyAfterTax);
  });

  it('🔴 배당이 없는 종목·모르는 티커는 답을 만들지 않는다 ("월 0원"을 답이라 하지 않는다)', () => {
    const noDividend = Object.values(DIVIDEND_UNIVERSE).find((preset) => preset.frequency === 'none');
    if (noDividend) expect(buildTickerIncomeAnswer(noDividend.ticker)).toBeNull();
    expect(buildTickerIncomeAnswer('ZZZZ')).toBeNull();
  });

  it('배당을 주는 모든 프리셋에서 유한한 양수 답이 나온다', () => {
    for (const preset of Object.values(DIVIDEND_UNIVERSE)) {
      if (preset.frequency === 'none' || !(preset.dividendYield > 0)) continue;
      const answer = buildTickerIncomeAnswer(preset.ticker);
      expect(answer, preset.ticker).not.toBeNull();
      for (const row of answer!.rows) {
        expect(Number.isFinite(row.monthlyAfterReinvest) && row.monthlyAfterReinvest > 0, preset.ticker).toBe(true);
      }
    }
  });
});

describe('formatIncomeWon', () => {
  it('만원 이상은 만원 단위, 미만은 원 단위로 쓴다 ("0만원"을 만들지 않는다)', () => {
    expect(formatIncomeWon(212_500)).toBe('21만원');
    expect(formatIncomeWon(8_333.4)).toBe('8,333원');
    expect(formatIncomeWon(123_456_789)).toBe('1억 2,346만원');
    expect(formatIncomeWon(100_000_000)).toBe('1억원');
    expect(formatIncomeWon(0)).toBe('-');
  });
});
