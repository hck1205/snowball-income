import type { QuickEstimateOutput, SimulationInput } from '@/shared/types';
import { MIN_GROWTH_RATE, toDerivedPriceGrowth, toMonthlyGrowthRate, toTaxRate } from './SnowballRates';

/**
 * 닫힌 형태(closed-form) 근사치.
 *
 * 주의: 이 근사는 **재투자 설정(reinvestDividends / reinvestDividendPercent / reinvestTiming)과
 * 지급 주기(frequency)를 전혀 사용하지 않는다.** 세후 총수익률로 적립식 성장을 계산할 뿐이므로
 * 재투자를 켜도 endValue 가 변하지 않는다. 월별 루프(runSimulation)와는 다른 모델이다.
 */
export const runQuickEstimate = (input: SimulationInput): QuickEstimateOutput => {
  const taxRate = toTaxRate(input.settings.taxRate);
  const dividendYield = input.ticker.dividendYield / 100;
  const expectedTotalReturn = input.ticker.expectedTotalReturn / 100;
  const priceGrowth = toDerivedPriceGrowth({
    expectedTotalReturnPercent: input.ticker.expectedTotalReturn,
    dividendYieldPercent: input.ticker.dividendYield
  });
  const annualReturn = Math.max(MIN_GROWTH_RATE, expectedTotalReturn - (dividendYield * taxRate));
  const monthlyReturn = toMonthlyGrowthRate(annualReturn);
  const totalMonths = input.settings.durationYears * 12;

  const monthlyContributionGrowth = Math.abs(monthlyReturn) < 1e-12
    ? input.settings.monthlyContribution * totalMonths
    : input.settings.monthlyContribution * ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn);
  const initialInvestmentGrowth = input.settings.initialInvestment * Math.pow(1 + monthlyReturn, totalMonths);
  const endValue = monthlyContributionGrowth + initialInvestmentGrowth;

  const dividendGrowth = input.ticker.dividendGrowth / 100;

  const relativeYieldGrowth = (1 + priceGrowth) <= 0 ? 1 : (1 + dividendGrowth) / (1 + priceGrowth);
  const yieldOnPriceAtEnd = Math.max(0, dividendYield * Math.pow(relativeYieldGrowth, input.settings.durationYears));
  const annualDividendApprox = endValue * yieldOnPriceAtEnd * (1 - taxRate);

  return {
    endValue,
    annualDividendApprox,
    monthlyDividendApprox: annualDividendApprox / 12,
    yieldOnPriceAtEnd
  };
};
