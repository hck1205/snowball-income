import type { QuickEstimateOutput, SimulationInput } from '@/shared/types';
import { paymentsPerYearMap } from './SnowballPayout';
import { MIN_GROWTH_RATE, toMonthlyGrowthRate, toPriceGrowth, toReinvestRatio, toTaxRate } from './SnowballRates';

/**
 * 닫힌 형태(closed-form) 근사치.
 *
 * 정합 모델에서는 근사가 아주 단순해진다. 배당수익률(y)이 주가 대비 불변이므로
 * 지급 1회당 재투자로 늘어나는 주식 수 비율이 시점과 무관하게 일정하다:
 *
 *   지급 1회당 주식수 증가율 ρ = (y / n) * (1 - 세율) * 재투자비율      (n = 연간 지급 횟수)
 *   연간 자산 성장률 R        = (1 + g) * (1 + ρ)^n - 1                 (g = 주가/배당 성장률)
 *
 * 재투자 100% → 자산이 사실상 총수익률로, 재투자 OFF(ρ = 0) → 자산이 주가 성장률 g 로만 성장하고
 * 배당은 인출된다. 즉 **재투자 설정이 그대로 반영된다** (구버전은 이를 무시해 재투자 OFF 를 크게 과대추정했다).
 *
 * `dpsGrowthMode: 'monthlySmooth'` + `reinvestTiming: 'sameMonth'` 조건에서는 월별 루프와
 * 수학적으로 동일하다. `annualStep` / `nextMonth` 는 지급·매수 시점이 어긋나 소폭 차이가 난다.
 */
export const runQuickEstimate = (input: SimulationInput): QuickEstimateOutput => {
  const { ticker, settings } = input;

  const taxRate = toTaxRate(settings.taxRate);
  const dividendYield = ticker.dividendYield / 100;
  const growth = toPriceGrowth(ticker.dividendGrowth);
  const paymentsPerYear = paymentsPerYearMap[ticker.frequency];
  const reinvestRatio = settings.reinvestDividends ? toReinvestRatio(settings.reinvestDividendPercent) : 0;

  const shareGrowthPerPayment = (dividendYield / paymentsPerYear) * (1 - taxRate) * reinvestRatio;
  const annualShareGrowth = Math.pow(1 + shareGrowthPerPayment, paymentsPerYear);
  const annualReturn = Math.max(MIN_GROWTH_RATE, ((1 + growth) * annualShareGrowth) - 1);

  const monthlyReturn = toMonthlyGrowthRate(annualReturn);
  const totalMonths = settings.durationYears * 12;

  const monthlyContributionGrowth = Math.abs(monthlyReturn) < 1e-12
    ? settings.monthlyContribution * totalMonths
    : settings.monthlyContribution * ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn);
  const initialInvestmentGrowth = settings.initialInvestment * Math.pow(1 + monthlyReturn, totalMonths);
  const rawEndValue = monthlyContributionGrowth + initialInvestmentGrowth;
  const endValue = Number.isFinite(rawEndValue) ? Math.max(0, rawEndValue) : 0;

  // 정합 모델의 핵심 성질: 배당수익률은 주가 대비 불변이다. 60년이 지나도 초기 배당률 그대로다.
  const yieldOnPriceAtEnd = Math.max(0, dividendYield);
  const annualDividendApprox = endValue * yieldOnPriceAtEnd * (1 - taxRate);

  return {
    endValue,
    annualDividendApprox,
    monthlyDividendApprox: annualDividendApprox / 12,
    yieldOnPriceAtEnd
  };
};
