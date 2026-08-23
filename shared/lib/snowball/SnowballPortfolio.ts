import type { InvestmentSettings, MonthlySnapshot, SimulationOutput, SimulationResult, TickerInput } from '@/shared/types';
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

/** 종목별 초기 투자금·월 적립금은 이 입력이 들고 있으므로, 공통 설정에서는 뺀다. */
export type PortfolioSettings = Omit<InvestmentSettings, 'initialInvestment' | 'monthlyContribution'>;

export type PortfolioTickerInput = {
  ticker: TickerInput;
  /** 이 종목 몫의 초기 투자금(원). */
  initialInvestment: number;
  /** 이 종목 몫의 월 적립금(원). */
  monthlyContribution: number;
  /**
   * 이 종목 배당의 재투자 비율(%). **미지정이면 전역값**(`settings.reinvestDividendPercent`) —
   * 그래서 라우팅을 모르는 기존 호출부가 종전과 똑같이 돈다.
   */
  reinvestPercent?: number;
  /**
   * 이 종목의 배당으로 **어느 종목을 살지**(같은 배열의 인덱스). 미지정·범위 밖이면 자기 자신이다.
   * 자기 자신이 곧 종전 동작이라, 이 필드를 아무도 안 주면 결과가 바뀌지 않는다.
   */
  reinvestTargetIndex?: number;
};

export type PortfolioSimulationInput = {
  tickers: PortfolioTickerInput[];
  settings: PortfolioSettings;
};

/**
 * **결합 포트폴리오 시뮬레이션** — 모든 종목을 하나의 월 루프에서 함께 굴린다.
 *
 * ## 왜 필요한가
 * 종전에는 종목마다 `runSimulation` 을 따로 돌리고 마지막에 합쳤다. 세 시뮬레이션이 서로를
 * 모르므로 **"A 의 배당으로 B 를 산다"를 표현할 통로가 없었다.** 배당 라우팅은 값이 종목 사이를
 * 건너가야 하는 기능이라, 루프를 묶는 것 말고는 방법이 없다.
 *
 * ## 🔴 한 달의 처리 순서 (순서가 결과를 바꾼다 — 바꾸지 말 것)
 *
 *   A. 가격·DPS 산출
 *   B. **이월 현금 매수** — 이번 달 배당 계산에 반영된다(`runSimulation` 과 같은 자리)
 *   C. **배당을 전부 걷는다** — 모든 종목의 지급·세금을 먼저 끝낸다
 *   D. **라우팅해서 매수** — 걷은 배당을 목적지로 보낸다
 *   E. 월 적립금 매수
 *   F. 스냅샷 / 12개월째면 연간 행
 *
 * 🔴 **C 를 전부 끝낸 뒤에 D 를 한다.** 종목마다 "지급 → 재투자"를 붙여서 처리하면, A 의 배당이
 *    B 를 사면서 **같은 달** B 의 배당 계산에 끼어든다 — 그러면 배열 순서가 결과를 바꾼다.
 *    지금 순서에서는 이번 달에 새로 산 주식이 **다음 달부터** 배당을 받는다(실제 증권사와 같다).
 *
 * ## 하위 호환
 * 라우팅을 아무도 지정하지 않으면(각자 자기 자신 · 전역 비율) 종목별 출력이 종전 `runSimulation`
 * 결과와 **한 자리도 다르지 않다**. `test/snowball/coupledEngineParity.test.ts` 가 그 동치를
 * 시나리오마다 직접 대조한다.
 */
export const runPortfolioSimulation = ({ tickers, settings }: PortfolioSimulationInput): SimulationOutput[] => {
  const count = tickers.length;
  if (count === 0) return [];

  const totalMonths = settings.durationYears * 12;
  const startDate = toStartDate(settings.investmentStartDate);

  /* 종목마다 고정된 값 — 루프 안에서 다시 계산하지 않는다. */
  const constants = tickers.map(({ ticker }) => {
    const accountType = ticker.accountType ?? DEFAULT_ACCOUNT_TYPE;
    const taxableRatePercent = settings.taxRate ?? resolveDefaultDividendTaxRatePercent(ticker.ticker);
    const growth = toPriceGrowth(ticker.dividendGrowth);

    return {
      accountType,
      taxRate: toTaxRate(payoutTaxRateFor(accountType, taxableRatePercent)),
      growth,
      paymentsPerYear: paymentsPerYearMap[ticker.frequency],
      dps0: ticker.initialPrice * (ticker.dividendYield / 100)
    };
  });

  /** 재투자 목적지. 범위를 벗어난 인덱스는 자기 자신으로 되돌린다(남의 링크·옛 데이터 방어). */
  const targetOf = tickers.map((item, index) => {
    const target = item.reinvestTargetIndex;
    return target !== undefined && Number.isInteger(target) && target >= 0 && target < count ? target : index;
  });
  /** 재투자 비율(0..1). 종목별 값이 없으면 전역값이다. */
  const ratioOf = tickers.map((item) => toReinvestRatio(item.reinvestPercent ?? settings.reinvestDividendPercent));

  const shares = tickers.map((item) => item.initialInvestment / item.ticker.initialPrice);
  const cumulativeDividend = tickers.map(() => 0);
  const totalTaxPaid = tickers.map(() => 0);
  const pendingReinvestCash = tickers.map(() => 0);
  const totalReinvestedAmount = tickers.map(() => 0);
  const monthly: MonthlySnapshot[][] = tickers.map(() => []);
  const yearly: SimulationResult[][] = tickers.map(() => []);

  for (let m = 1; m <= totalMonths; m += 1) {
    const context = buildMonthContext(startDate, m);

    /* A. 가격·DPS */
    const price = tickers.map((item, i) =>
      priceAtMonth(item.ticker.initialPrice, constants[i].growth, context.elapsedYearFraction)
    );
    const dps = tickers.map((_item, i) =>
      dpsAtMonth({
        dps0: constants[i].dps0,
        dividendGrowth: constants[i].growth,
        mode: settings.dpsGrowthMode,
        elapsedYearFraction: context.elapsedYearFraction,
        completedYears: context.completedYears
      })
    );

    /* B. 이월 현금 매수 (이번 달 배당 계산에 반영된다) */
    for (let i = 0; i < count; i += 1) {
      if (pendingReinvestCash[i] > 0) {
        shares[i] += pendingReinvestCash[i] / price[i];
        totalReinvestedAmount[i] += pendingReinvestCash[i];
        pendingReinvestCash[i] = 0;
      }
    }

    /* C. 배당을 전부 걷는다 (아직 아무것도 사지 않는다) */
    const dividendPaid = tickers.map(() => 0);
    const taxPaid = tickers.map(() => 0);
    for (let i = 0; i < count; i += 1) {
      if (!isPayoutMonth(tickers[i].ticker.frequency, context.simulationMonth)) continue;

      const payout = computeMonthlyPayout({
        shares: shares[i],
        annualDps: dps[i],
        paymentsPerYear: constants[i].paymentsPerYear,
        taxRate: constants[i].taxRate
      });

      dividendPaid[i] = payout.net;
      taxPaid[i] = payout.tax;
      cumulativeDividend[i] += payout.net;
      totalTaxPaid[i] += payout.tax;
    }

    /* D. 라우팅해서 매수 — 가격도 취득원가도 **목적지** 것을 쓴다 */
    for (let i = 0; i < count; i += 1) {
      if (dividendPaid[i] <= 0) continue;

      const target = targetOf[i];
      const plan = planReinvestment({
        netDividend: dividendPaid[i],
        price: price[target],
        enabled: settings.reinvestDividends,
        ratio: ratioOf[i],
        timing: settings.reinvestTiming
      });

      shares[target] += plan.sharesToBuyNow;
      totalReinvestedAmount[target] += plan.amountInvestedNow;
      pendingReinvestCash[target] += plan.cashToCarry;
    }

    /* E. 월 적립금 매수 */
    for (let i = 0; i < count; i += 1) {
      shares[i] += tickers[i].monthlyContribution / price[i];
    }

    /* F. 스냅샷 */
    for (let i = 0; i < count; i += 1) {
      const rawPortfolioValue = shares[i] * price[i];
      const portfolioValue = Number.isFinite(rawPortfolioValue) ? rawPortfolioValue : 0;

      monthly[i].push({
        monthIndex: m,
        year: context.calendarYear,
        month: context.calendarMonth,
        shares: shares[i],
        price: price[i],
        dividendPerShare: dps[i],
        dividendPaid: dividendPaid[i],
        contributionPaid: tickers[i].monthlyContribution,
        taxPaid: taxPaid[i],
        portfolioValue,
        cumulativeDividend: cumulativeDividend[i]
      });

      if (context.simulationMonth === 12) {
        yearly[i].push(
          buildYearlyRow({
            year: context.simulationYearLabel,
            monthIndex: m,
            initialInvestment: tickers[i].initialInvestment,
            monthlyContribution: tickers[i].monthlyContribution,
            assetValue: portfolioValue,
            cumulativeDividend: cumulativeDividend[i],
            recentMonths: monthly[i].slice(-12)
          })
        );
      }
    }
  }

  return tickers.map((item, i) => {
    const lastRow = monthly[i][monthly[i].length - 1];
    /* 종료 시점 보유 기준 월 배당(세후) — 근거는 `runSimulation` 의 같은 자리 주석. */
    const finalRunRateMonthlyDividend =
      lastRow === undefined ? 0 : (lastRow.shares * lastRow.dividendPerShare * (1 - constants[i].taxRate)) / 12;
    const isaSettlementTax = constants[i].accountType === 'isa' ? estimateIsaSettlementTax(cumulativeDividend[i]) : 0;

    return {
      monthly: monthly[i],
      yearly: yearly[i],
      summary: buildSummary({
        monthly: monthly[i],
        yearly: yearly[i],
        totalTaxPaid: totalTaxPaid[i],
        targetMonthlyDividend: settings.targetMonthlyDividend,
        totalReinvestedAmount: totalReinvestedAmount[i],
        finalRunRateMonthlyDividend,
        isaSettlementTax
      }),
      /*
       * 근사치는 종전과 같이 **종목 단독** 기준이다 — 닫힌 식이라 종목 사이를 건너가는 현금을
       * 표현할 수 없다. 라우팅을 켜면 정밀 계산과 벌어지므로, 화면이 근사 모드를 쓸 때
       * 그 사실을 밝혀야 한다(`runQuickEstimate` 머리말의 `annualStep`·`nextMonth` 와 같은 성격).
       */
      quickEstimate: runQuickEstimate({
        ticker: item.ticker,
        settings: {
          ...settings,
          initialInvestment: item.initialInvestment,
          monthlyContribution: item.monthlyContribution,
          reinvestDividendPercent: item.reinvestPercent ?? settings.reinvestDividendPercent
        }
      })
    };
  });
};
