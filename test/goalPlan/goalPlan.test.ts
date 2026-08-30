// @vitest-environment node — 순수 함수만 본다.
import { describe, expect, it } from 'vitest';
import { formatMonths, monthsToReachAmount, principalForMonthlyDividend } from '@/shared/lib/goalPlan';

/**
 * 랜딩 첫 화면의 여섯 버튼이 내보내는 숫자의 근거.
 *
 * 🔴 화면에 **숫자를 보여 주는** 계산이라 틀리면 사용자가 잘못된 계획을 세운다. 계산 엔진만큼
 * 정밀하지는 않지만(종목을 모른다), 그 어림이 **적어도 산수로는 맞아야** 한다.
 */

describe('monthsToReachAmount — 목표 자산까지', () => {
  it('연 7%로 월 100만 원이면 1억까지 6~7년', () => {
    const months = monthsToReachAmount({ target: 1e8, monthlyContribution: 1e6, annualReturnRate: 0.07 });

    expect(months).not.toBeNull();
    expect(months! / 12).toBeGreaterThan(6);
    expect(months! / 12).toBeLessThan(7);
  });

  it('많이 넣을수록 빨리 닿는다', () => {
    const slow = monthsToReachAmount({ target: 1e8, monthlyContribution: 5e5, annualReturnRate: 0.07 })!;
    const fast = monthsToReachAmount({ target: 1e8, monthlyContribution: 2e6, annualReturnRate: 0.07 })!;

    expect(fast).toBeLessThan(slow);
  });

  it('이미 가진 돈이 있으면 그만큼 앞당겨진다', () => {
    const bare = monthsToReachAmount({ target: 1e8, monthlyContribution: 1e6, annualReturnRate: 0.07 })!;
    const withSeed = monthsToReachAmount({
      target: 1e8,
      monthlyContribution: 1e6,
      annualReturnRate: 0.07,
      initialAmount: 5e7
    })!;

    expect(withSeed).toBeLessThan(bare);
  });

  it('이미 목표를 넘었으면 0개월이다', () => {
    expect(
      monthsToReachAmount({ target: 1e8, monthlyContribution: 1e6, annualReturnRate: 0.07, initialAmount: 2e8 })
    ).toBe(0);
  });

  it('🔴 수익률 0 이어도 죽지 않는다 — 단순 나눗셈으로 답한다', () => {
    /**
     * 로그 공식은 분모가 `ln(1+i)` 라 i=0 이면 0으로 나눈다. 그 분기를 따로 두었다.
     * 월 100만 원씩 1억이면 정확히 100개월.
     */
    expect(monthsToReachAmount({ target: 1e8, monthlyContribution: 1e6, annualReturnRate: 0 })).toBe(100);
  });

  it('넣는 돈이 없으면 답이 없다 (null)', () => {
    expect(monthsToReachAmount({ target: 1e8, monthlyContribution: 0, annualReturnRate: 0.07 })).toBeNull();
  });

  it('말이 안 되는 입력에 throw 하지 않는다', () => {
    for (const target of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() =>
        monthsToReachAmount({ target, monthlyContribution: 1e6, annualReturnRate: 0.07 })
      ).not.toThrow();
    }
  });
});

describe('principalForMonthlyDividend — 목표 월배당에 필요한 원금', () => {
  it('월 100만 원 · 배당률 4% · 세율 15.4% 면 3.5억쯤', () => {
    const principal = principalForMonthlyDividend({
      monthlyDividend: 1e6,
      dividendYield: 0.04,
      taxRate: 0.154
    })!;

    expect(principal / 1e8).toBeGreaterThan(3.4);
    expect(principal / 1e8).toBeLessThan(3.7);
  });

  it('🔴 배당률이 높을수록 필요 원금이 줄어든다', () => {
    // 이 관계가 뒤집히면 화면이 "고배당인데 더 많이 필요하다"는 거짓을 말하게 된다.
    const low = principalForMonthlyDividend({ monthlyDividend: 1e6, dividendYield: 0.03, taxRate: 0.154 })!;
    const high = principalForMonthlyDividend({ monthlyDividend: 1e6, dividendYield: 0.08, taxRate: 0.154 })!;

    expect(high).toBeLessThan(low);
  });

  it('세율이 높을수록 더 많이 필요하다', () => {
    const light = principalForMonthlyDividend({ monthlyDividend: 1e6, dividendYield: 0.04, taxRate: 0.15 })!;
    const heavy = principalForMonthlyDividend({ monthlyDividend: 1e6, dividendYield: 0.04, taxRate: 0.3 })!;

    expect(heavy).toBeGreaterThan(light);
  });

  it('세율 100%처럼 성립하지 않는 입력은 null', () => {
    expect(principalForMonthlyDividend({ monthlyDividend: 1e6, dividendYield: 0.04, taxRate: 1 })).toBeNull();
    expect(principalForMonthlyDividend({ monthlyDividend: 1e6, dividendYield: 0, taxRate: 0.154 })).toBeNull();
  });
});

describe('formatMonths', () => {
  it('년과 개월로 나눠 읽는다', () => {
    expect(formatMonths(0)).toBe('0개월');
    expect(formatMonths(7)).toBe('7개월');
    expect(formatMonths(12)).toBe('1년');
    expect(formatMonths(19)).toBe('1년 7개월');
  });

  it('소수 개월은 반올림한다 — 화면에 "10.4개월"이 뜨면 안 된다', () => {
    expect(formatMonths(11.6)).toBe('1년');
    expect(formatMonths(0.4)).toBe('0개월');
  });
});
