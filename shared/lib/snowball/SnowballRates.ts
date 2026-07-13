import type { DpsGrowthMode } from '@/shared/types';

/** 성장률 하한. 자산이 완전히 소멸(-100%)하지 않도록 막는다. */
export const MIN_GROWTH_RATE = -0.99;

export const toMonthlyGrowthRate = (annualRate: number): number => Math.pow(1 + annualRate, 1 / 12) - 1;

/** 세율(%) → 비율. 미입력(undefined)은 0% 로 취급한다. */
export const toTaxRate = (taxRatePercent: number | undefined): number => (taxRatePercent ?? 0) / 100;

export const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/** 재투자 비율(%) → 0..1 비율. 음수는 0, 100 초과는 1로 clamp 한다. */
export const toReinvestRatio = (reinvestDividendPercent: number): number => clamp01(reinvestDividendPercent / 100);

export type DerivedPriceGrowthParams = {
  expectedTotalReturnPercent: number;
  dividendYieldPercent: number;
};

/**
 * 주가 성장률 = 기대 총수익률 - 배당수익률 (총수익률의 이중 반영을 막는다).
 */
export const toDerivedPriceGrowth = ({
  expectedTotalReturnPercent,
  dividendYieldPercent
}: DerivedPriceGrowthParams): number => {
  const expectedTotalReturn = expectedTotalReturnPercent / 100;
  const dividendYield = dividendYieldPercent / 100;

  return Math.max(MIN_GROWTH_RATE, expectedTotalReturn - dividendYield);
};

export const priceAtMonth = (initialPrice: number, priceGrowth: number, elapsedYearFraction: number): number =>
  initialPrice * Math.pow(1 + priceGrowth, elapsedYearFraction);

export type DpsAtMonthParams = {
  /** 1주당 최초 연간 배당금 (initialPrice * dividendYield) */
  dps0: number;
  dividendGrowth: number;
  mode: DpsGrowthMode;
  elapsedYearFraction: number;
  completedYears: number;
};

/**
 * 해당 월 시점의 1주당 **연간** 배당금(DPS).
 *
 * - `monthlySmooth`: 매월 연속적으로 성장 (지수 = 경과 연 소수)
 * - `annualStep`: 12개월마다 계단식으로 상승 (지수 = 완료된 연 수)
 */
export const dpsAtMonth = ({
  dps0,
  dividendGrowth,
  mode,
  elapsedYearFraction,
  completedYears
}: DpsAtMonthParams): number => {
  const growthExponent = mode === 'monthlySmooth' ? elapsedYearFraction : completedYears;

  return dps0 * Math.pow(1 + dividendGrowth, growthExponent);
};
