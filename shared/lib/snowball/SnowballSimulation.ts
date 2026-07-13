import type { MonthlySnapshot, SimulationInput, SimulationOutput, SimulationResult } from '@/shared/types';
import { buildMonthContext, toStartDate } from './SnowballCalendar';
import { computeMonthlyPayout, isPayoutMonth, paymentsPerYearMap, planReinvestment } from './SnowballPayout';
import { dpsAtMonth, priceAtMonth, toDerivedPriceGrowth, toReinvestRatio, toTaxRate } from './SnowballRates';
import { runQuickEstimate } from './SnowballQuickEstimate';
import { buildSummary, buildYearlyRow } from './SnowballSummary';

/**
 * 월 단위 시뮬레이션 루프.
 *
 * 이 함수는 **오케스트레이션만** 담당한다. 모든 계산은 아래 순수 함수들이 수행한다:
 * SnowballCalendar / SnowballRates / SnowballPayout / SnowballSummary / SnowballQuickEstimate.
 * 여기 남은 가변 상태(shares, cumulativeDividend, totalTaxPaid, pendingReinvestCash)는
 * 월별로 이월되는 누적값뿐이다.
 *
 * 한 달의 처리 순서 (순서가 결과를 바꾸므로 유지할 것):
 *   1. 가격/DPS 산출  2. 전월 이월 현금 재투자  3. 지급월이면 배당 지급·세금·재투자
 *   4. 월 적립금 매수  5. 스냅샷 기록  6. 12개월째면 연간 행 확정
 */
export const runSimulation = (input: SimulationInput): SimulationOutput => {
  const { ticker, settings } = input;

  const taxRate = toTaxRate(settings.taxRate);
  const dividendYield = ticker.dividendYield / 100;
  const dividendGrowth = ticker.dividendGrowth / 100;
  const priceGrowth = toDerivedPriceGrowth({
    expectedTotalReturnPercent: ticker.expectedTotalReturn,
    dividendYieldPercent: ticker.dividendYield
  });

  const totalMonths = settings.durationYears * 12;
  const paymentsPerYear = paymentsPerYearMap[ticker.frequency];
  const startDate = toStartDate(settings.investmentStartDate);
  const reinvestRatio = toReinvestRatio(settings.reinvestDividendPercent);

  const dps0 = ticker.initialPrice * dividendYield;

  let shares = settings.initialInvestment / ticker.initialPrice;
  let cumulativeDividend = 0;
  let totalTaxPaid = 0;
  let pendingReinvestCash = 0;

  const monthly: MonthlySnapshot[] = [];
  const yearly: SimulationResult[] = [];

  for (let m = 1; m <= totalMonths; m += 1) {
    const context = buildMonthContext(startDate, m);

    const price = priceAtMonth(ticker.initialPrice, priceGrowth, context.elapsedYearFraction);
    const dps = dpsAtMonth({
      dps0,
      dividendGrowth,
      mode: settings.dpsGrowthMode,
      elapsedYearFraction: context.elapsedYearFraction,
      completedYears: context.completedYears
    });

    if (pendingReinvestCash > 0) {
      shares += pendingReinvestCash / price;
      pendingReinvestCash = 0;
    }

    let dividendPaid = 0;
    let taxPaid = 0;

    if (isPayoutMonth(ticker.frequency, context.simulationMonth)) {
      const payout = computeMonthlyPayout({ shares, annualDps: dps, paymentsPerYear, taxRate });
      const reinvestment = planReinvestment({
        netDividend: payout.net,
        price,
        enabled: settings.reinvestDividends,
        ratio: reinvestRatio,
        timing: settings.reinvestTiming
      });

      taxPaid = payout.tax;
      dividendPaid = payout.net;

      shares += reinvestment.sharesToBuyNow;
      pendingReinvestCash += reinvestment.cashToCarry;

      cumulativeDividend += dividendPaid;
      totalTaxPaid += taxPaid;
    }

    shares += settings.monthlyContribution / price;

    const portfolioValue = shares * price;

    monthly.push({
      monthIndex: m,
      year: context.calendarYear,
      month: context.calendarMonth,
      shares,
      price,
      dividendPerShare: dps,
      dividendPaid,
      contributionPaid: settings.monthlyContribution,
      taxPaid,
      portfolioValue,
      cumulativeDividend
    });

    if (context.simulationMonth === 12) {
      yearly.push(
        buildYearlyRow({
          year: context.simulationYearLabel,
          monthIndex: m,
          initialInvestment: settings.initialInvestment,
          monthlyContribution: settings.monthlyContribution,
          assetValue: portfolioValue,
          cumulativeDividend,
          recentMonths: monthly.slice(-12)
        })
      );
    }
  }

  return {
    monthly,
    yearly,
    summary: buildSummary({
      monthly,
      yearly,
      totalTaxPaid,
      targetMonthlyDividend: settings.targetMonthlyDividend
    }),
    quickEstimate: runQuickEstimate(input)
  };
};
