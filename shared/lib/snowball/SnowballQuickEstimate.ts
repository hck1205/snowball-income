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

  /*
   * 지급이 없는 종목(paymentsPerYear === 0)은 배당 경로를 통째로 끊는다.
   *
   * 정밀 계산은 'isPayoutMonth' 가 매달 걸러 주지만 **이 함수는 그 게이트를 지나지 않는 유일한
   * 소비처다.** 아래 근사식은 지급 여부를 묻지 않고 배당률을 그대로 쓰기 때문에, 배당률이 남아
   * 있는 채로 주기만 'none' 이면 같은 카드에서 토글 하나로 "월 배당 6만원"과 "0원"이 갈린다
   * (2026-07-31 실측). 사용자가 셀렉트에서 만들 수 있는 조합이다.
   *
   * 자산 성장은 그대로 돌린다 — 무배당 성장주도 주가는 자란다. 끊는 것은 배당뿐이다.
   * (종전에 'endValue' 가 우연히 맞았던 것은 'Math.pow(x, 0) === 1' 덕분이다. 0 나눗셈이 만든
   *  NaN·Infinity 가 지수 0 에 먹혔을 뿐이라 우연에 기대고 있었다.)
   */
  const pays = paymentsPerYear > 0;
  const effectiveYield = pays ? dividendYield : 0;

  const shareGrowthPerPayment = pays ? (dividendYield / paymentsPerYear) * (1 - taxRate) * reinvestRatio : 0;
  const annualShareGrowth = pays ? Math.pow(1 + shareGrowthPerPayment, paymentsPerYear) : 1;
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
  const yieldOnPriceAtEnd = Math.max(0, effectiveYield);
  const annualDividendApprox = endValue * yieldOnPriceAtEnd * (1 - taxRate);

  return {
    endValue,
    annualDividendApprox,
    monthlyDividendApprox: annualDividendApprox / 12,
    yieldOnPriceAtEnd
  };
};
