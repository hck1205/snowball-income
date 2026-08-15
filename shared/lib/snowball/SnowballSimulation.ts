import type { MonthlySnapshot, SimulationInput, SimulationOutput, SimulationResult } from '@/shared/types';
import {
  DEFAULT_ACCOUNT_TYPE,
  estimateIsaSettlementTax,
  payoutTaxRateFor,
  resolveDefaultDividendTaxRatePercent
} from '@/shared/constants/tax';
import { buildMonthContext, toStartDate } from './SnowballCalendar';
import { computeMonthlyPayout, isPayoutMonth, paymentsPerYearMap, planReinvestment } from './SnowballPayout';
import { dpsAtMonth, priceAtMonth, toPriceGrowth, toReinvestRatio, toTaxRate } from './SnowballRates';
import { runQuickEstimate } from './SnowballQuickEstimate';
import { buildSummary, buildYearlyRow } from './SnowballSummary';

/**
 * 월 단위 시뮬레이션 루프 (정합 모델 / 고든 성장모형).
 *
 *   priceGrowth  = dividendGrowth            // 가격과 배당이 같은 속도로 성장
 *   dps(t)       = price(t) * dividendYield  // 배당수익률(YoP)이 시간에 대해 불변
 *   totalReturn  = dividendYield + dividendGrowth   // 파생 표시값 (엔진은 쓰지 않는다)
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

  // 🔴 미입력은 **0% 가 아니라 그 종목의 정확한 기본 세율**로 해결한다(미국 상장 15 / 국내 상장 15.4).
  //    세율은 선택 입력이라, 비운 폼·세율 없이 저장된 페이로드·`h:null` 공유 링크가 전부 무세금으로
  //    계산되고 있었다(과대추정, 화면에 경고 없음). 여기가 모든 경로가 지나는 유일한 촉점이다 —
  //    포트폴리오 시뮬레이션도 종목마다 이 함수를 부르므로 **종목별로** 정확해진다.
  //    ⚠ 사용자가 넣은 값은 언제나 이긴다(`??` 는 undefined 일 때만 대체한다 — 0 은 그대로 0%).
  /*
   * 🔴 **계좌가 과세 시점을 정한다** (2026-08-15). ISA 는 계좌 안에서 세금을 떼지 않고
   *    종료 시점에 한 번 정산한다 — 그래서 지급 시 세율이 0 이고, 그만큼 **재투자 원금이 커진다.**
   *    이 계좌를 쓰는 진짜 이유(과세이연 복리)가 여기서 결과에 나타난다.
   *    세율만 9.9% 로 낮추는 근사와 결과가 다르다 — 그 근사는 매 지급마다 떼는 구조가 그대로다.
   * ⚠ 사용자가 넣은 세율은 여전히 이긴다. 다만 ISA 에서는 그 값도 지급 시점에는 쓰이지 않는다
   *   (정산은 `estimateIsaSettlementTax` 가 법정 분리과세율로 한다).
   */
  const accountType = ticker.accountType ?? DEFAULT_ACCOUNT_TYPE;
  const taxableRatePercent = settings.taxRate ?? resolveDefaultDividendTaxRatePercent(ticker.ticker);
  const taxRate = toTaxRate(payoutTaxRateFor(accountType, taxableRatePercent));
  const dividendYield = ticker.dividendYield / 100;
  // 정합 모델: 가격과 배당이 같은 속도로 성장한다. 하나의 growth 를 양쪽에 쓰기 때문에
  // dps(t) === price(t) * dividendYield 가 모든 t 에서 성립한다(= 배당수익률 불변).
  // ticker.expectedTotalReturn 은 더 이상 계산에 쓰이지 않는다 (dividendYield + dividendGrowth 의 파생 표시값).
  const growth = toPriceGrowth(ticker.dividendGrowth);
  const priceGrowth = growth;
  const dividendGrowth = growth;

  const totalMonths = settings.durationYears * 12;
  const paymentsPerYear = paymentsPerYearMap[ticker.frequency];
  const startDate = toStartDate(settings.investmentStartDate);
  const reinvestRatio = toReinvestRatio(settings.reinvestDividendPercent);

  const dps0 = ticker.initialPrice * dividendYield;

  let shares = settings.initialInvestment / ticker.initialPrice;
  let cumulativeDividend = 0;
  let totalTaxPaid = 0;
  let pendingReinvestCash = 0;
  // 배당으로 실제 주식을 산 금액의 누적. 취득원가에 들어간다.
  // **매수가 일어난 시점에만** 더한다 (planReinvestment.amountInvestedNow 주석 참고).
  let totalReinvestedAmount = 0;

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
      totalReinvestedAmount += pendingReinvestCash;
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
      totalReinvestedAmount += reinvestment.amountInvestedNow;
      pendingReinvestCash += reinvestment.cashToCarry;

      cumulativeDividend += dividendPaid;
      totalTaxPaid += taxPaid;
    }

    shares += settings.monthlyContribution / price;

    const rawPortfolioValue = shares * price;
    const portfolioValue = Number.isFinite(rawPortfolioValue) ? rawPortfolioValue : 0;

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

  /*
   * 종료 시점 보유 기준 월 배당(세후) — "지금 이 보유량이면 앞으로 매달 얼마".
   *
   * 🔴 **여기서 계산한다.** `buildSummary` 는 월별 스냅샷만 받는데, 스냅샷에는 세율이 없다
   *    (세율은 종목마다 다르고 이 함수만 알고 있다 — 위 `taxRate` 주석). 요약 쪽에서 다시 유도하려면
   *    세율을 한 번 더 넘겨야 하고, 그러면 같은 값이 두 경로로 흐른다.
   *
   * 마지막 달의 `shares` 는 그 달 적립분까지 반영된 값이라 `finalAssetValue` 와 짝이 맞는다
   * (`portfolioValue = shares * price` 가 같은 줄에서 만들어진다). 그래서 이 값은
   * `finalAssetValue × 배당률 ÷ 12 × (1−세율)` 과 일치한다 — 화면에서 눈으로 검산된다.
   *
   * ⚠ `paymentsPerYear` 로 나누지 않는다. `dps` 가 **연** 주당배당금이라 12 로 나누면 곧 월 환산이고,
   *   그래야 분기 배당 종목도 월 기준으로 읽힌다(지급월에 한 분기치가 튀는 문제가 여기서 사라진다).
   */
  /*
   * ISA 종료 정산세 — 계좌 안에서 미뤄 둔 세금을 마지막에 한 번 센다.
   * 🔴 과세계좌는 0 이다(이미 매 지급마다 뗐다). 두 값을 **함께** 보지 않으면 ISA 시나리오에서
   *    세금이 통째로 사라진 것처럼 읽힌다 — 화면이 이 필드를 반드시 노출해야 하는 이유다.
   */
  const isaSettlementTax = accountType === 'isa' ? estimateIsaSettlementTax(cumulativeDividend) : 0;

  const lastRow = monthly[monthly.length - 1];
  const finalRunRateMonthlyDividend =
    lastRow === undefined ? 0 : (lastRow.shares * lastRow.dividendPerShare * (1 - taxRate)) / 12;

  return {
    monthly,
    yearly,
    summary: buildSummary({
      monthly,
      yearly,
      totalTaxPaid,
      targetMonthlyDividend: settings.targetMonthlyDividend,
      totalReinvestedAmount,
      finalRunRateMonthlyDividend,
      isaSettlementTax
    }),
    quickEstimate: runQuickEstimate(input)
  };
};
