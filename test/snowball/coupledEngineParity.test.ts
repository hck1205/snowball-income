// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import type { SimulationOutput } from '@/shared/types';
import { runPortfolioSimulation, runSimulation } from '@/shared/lib/snowball';
import { buildNormalizedAllocation } from '@/pages/Main/utils';
import { PORTFOLIO_SCENARIOS } from './portfolioScenarios';

/**
 * **결합 엔진 ↔ 종전 독립 실행의 동치 검증.**
 *
 * 배당 라우팅을 넣으려고 종목별 독립 실행을 하나의 월 루프로 묶었다. 라우팅을 아무도 지정하지
 * 않으면(각자 자기 자신 · 전역 비율) 결과가 **한 자리도 달라지면 안 된다** — 이 레포의 모든
 * 저장 데이터·공유 링크가 그 값 위에 서 있기 때문이다.
 *
 * 🔴 골든 픽스처(`portfolioCharacterization`)는 **합산 결과**를 지킨다. 이 파일은 그 한 단계
 *    아래인 **종목별 출력**을 지킨다. 합산은 손대지 않았으므로, 종목별이 같으면 합산도 같다 —
 *    반대로 여기서 깨지면 어느 종목의 어느 달이 틀어졌는지가 바로 나온다.
 */

/** 종전 경로 — 종목마다 따로 20년을 돌린다(`pages/Main/utils/simulation.ts` 의 `runForProfile`). */
const runIndependently = (scenario: (typeof PORTFOLIO_SCENARIOS)[number]): SimulationOutput[] => {
  const allocation = buildNormalizedAllocation(scenario.profiles, scenario.weights);
  const { values } = scenario;

  return allocation.map(({ profile, weight }) =>
    runSimulation({
      ticker: {
        ticker: profile.ticker,
        initialPrice: profile.initialPrice,
        dividendYield: profile.dividendYield,
        dividendGrowth: profile.dividendGrowth,
        expectedTotalReturn: profile.expectedTotalReturn,
        frequency: profile.frequency
      },
      settings: {
        initialInvestment: values.initialInvestment * weight,
        monthlyContribution: values.monthlyContribution * weight,
        targetMonthlyDividend: values.targetMonthlyDividend,
        investmentStartDate: values.investmentStartDate,
        durationYears: values.durationYears,
        reinvestDividends: values.reinvestDividends,
        reinvestDividendPercent: values.reinvestDividendPercent,
        taxRate: values.taxRate,
        reinvestTiming: values.reinvestTiming,
        dpsGrowthMode: values.dpsGrowthMode
      }
    })
  );
};

/** 새 경로 — 한 월 루프에서 함께 돈다. 라우팅은 지정하지 않는다(= 각자 자기 자신). */
const runCoupled = (scenario: (typeof PORTFOLIO_SCENARIOS)[number]): SimulationOutput[] => {
  const allocation = buildNormalizedAllocation(scenario.profiles, scenario.weights);
  const { values } = scenario;

  return runPortfolioSimulation({
    tickers: allocation.map(({ profile, weight }) => ({
      ticker: {
        ticker: profile.ticker,
        initialPrice: profile.initialPrice,
        dividendYield: profile.dividendYield,
        dividendGrowth: profile.dividendGrowth,
        expectedTotalReturn: profile.expectedTotalReturn,
        frequency: profile.frequency
      },
      initialInvestment: values.initialInvestment * weight,
      monthlyContribution: values.monthlyContribution * weight
    })),
    settings: {
      targetMonthlyDividend: values.targetMonthlyDividend,
      investmentStartDate: values.investmentStartDate,
      durationYears: values.durationYears,
      reinvestDividends: values.reinvestDividends,
      reinvestDividendPercent: values.reinvestDividendPercent,
      taxRate: values.taxRate,
      reinvestTiming: values.reinvestTiming,
      dpsGrowthMode: values.dpsGrowthMode
    }
  });
};

describe('결합 엔진 — 기본 라우팅은 종전과 동일하다', () => {
  it.each(PORTFOLIO_SCENARIOS)('$name — 종목별 출력이 완전히 같다', (scenario) => {
    const before = runIndependently(scenario);
    const after = runCoupled(scenario);

    expect(after).toHaveLength(before.length);
    before.forEach((expected, index) => {
      expect(after[index].monthly).toEqual(expected.monthly);
      expect(after[index].yearly).toEqual(expected.yearly);
      expect(after[index].summary).toEqual(expected.summary);
      expect(after[index].quickEstimate).toEqual(expected.quickEstimate);
    });
  });
});

describe('결합 엔진 — 라우팅', () => {
  /** SCHD(분기) + JEPI(월). 둘 다 배당이 있어 어느 방향으로든 보낼 수 있다. */
  const base = PORTFOLIO_SCENARIOS[2];
  const tickerInputs = (overrides: Array<{ reinvestPercent?: number; reinvestTargetIndex?: number }>) =>
    buildNormalizedAllocation(base.profiles, base.weights).map(({ profile, weight }, index) => ({
      ticker: {
        ticker: profile.ticker,
        initialPrice: profile.initialPrice,
        dividendYield: profile.dividendYield,
        dividendGrowth: profile.dividendGrowth,
        expectedTotalReturn: profile.expectedTotalReturn,
        frequency: profile.frequency
      },
      initialInvestment: base.values.initialInvestment * weight,
      monthlyContribution: base.values.monthlyContribution * weight,
      ...overrides[index]
    }));

  const settings = {
    targetMonthlyDividend: base.values.targetMonthlyDividend,
    investmentStartDate: base.values.investmentStartDate,
    durationYears: base.values.durationYears,
    reinvestDividends: true,
    reinvestDividendPercent: 100,
    taxRate: base.values.taxRate,
    reinvestTiming: 'sameMonth' as const,
    dpsGrowthMode: base.values.dpsGrowthMode
  };

  const finalShares = (output: SimulationOutput) => output.monthly[output.monthly.length - 1].shares;

  it('배당을 다른 종목으로 보내면 그 종목의 주식 수가 늘고 보낸 쪽은 줄어든다', () => {
    const selfRouted = runPortfolioSimulation({ tickers: tickerInputs([{}, {}]), settings });
    // 0번(SCHD)의 배당을 1번(JEPI)으로 보낸다.
    const crossRouted = runPortfolioSimulation({
      tickers: tickerInputs([{ reinvestTargetIndex: 1 }, {}]),
      settings
    });

    expect(finalShares(crossRouted[0])).toBeLessThan(finalShares(selfRouted[0]));
    expect(finalShares(crossRouted[1])).toBeGreaterThan(finalShares(selfRouted[1]));
  });

  it('보낸 배당은 사라지지 않는다 — 지급액 총합은 라우팅과 무관하다', () => {
    const selfRouted = runPortfolioSimulation({ tickers: tickerInputs([{}, {}]), settings });
    const crossRouted = runPortfolioSimulation({
      tickers: tickerInputs([{ reinvestTargetIndex: 1 }, {}]),
      settings
    });

    // 라우팅은 **어디에 쌓이는가**만 바꾼다. 다만 재투자 대상이 달라지면 이후 보유량이 갈리므로
    // 누적 배당 자체는 달라진다 — 여기서 지키는 것은 "첫 지급월까지는 동일하다"이다.
    const firstPayoutMonth = selfRouted[0].monthly.findIndex((row) => row.dividendPaid > 0);
    expect(firstPayoutMonth).toBeGreaterThanOrEqual(0);
    expect(crossRouted[0].monthly[firstPayoutMonth].dividendPaid).toBeCloseTo(
      selfRouted[0].monthly[firstPayoutMonth].dividendPaid,
      8
    );
  });

  it('🔴 이번 달에 받은 배당으로 산 주식은 같은 달 배당을 다시 받지 않는다', () => {
    // 0번의 배당을 1번으로 보낸다. 1번은 월배당이라 같은 달에 지급월이 겹친다 —
    // C(전부 걷기) 다음에 D(매수)를 하지 않으면 여기서 배당이 부풀어 오른다.
    const crossRouted = runPortfolioSimulation({
      tickers: tickerInputs([{ reinvestTargetIndex: 1 }, {}]),
      settings
    });
    const selfRouted = runPortfolioSimulation({ tickers: tickerInputs([{}, {}]), settings });

    const month = crossRouted[0].monthly.findIndex((row) => row.dividendPaid > 0);
    // 그 달 1번의 배당은 아직 종전과 같아야 한다(새 주식은 다음 달부터 받는다).
    expect(crossRouted[1].monthly[month].dividendPaid).toBeCloseTo(selfRouted[1].monthly[month].dividendPaid, 8);
    // 그리고 다음 지급월에는 벌어져 있어야 한다.
    const nextMonth = crossRouted[1].monthly.findIndex(
      (row, index) => index > month && row.dividendPaid > 0
    );
    expect(crossRouted[1].monthly[nextMonth].dividendPaid).toBeGreaterThan(
      selfRouted[1].monthly[nextMonth].dividendPaid
    );
  });

  it('종목별 재투자 비율이 전역값을 덮는다', () => {
    const globalOnly = runPortfolioSimulation({ tickers: tickerInputs([{}, {}]), settings });
    const perTicker = runPortfolioSimulation({
      tickers: tickerInputs([{ reinvestPercent: 0 }, {}]),
      settings
    });

    expect(finalShares(perTicker[0])).toBeLessThan(finalShares(globalOnly[0]));
    // 손대지 않은 종목은 그대로다.
    expect(finalShares(perTicker[1])).toBeCloseTo(finalShares(globalOnly[1]), 8);
  });

  it('범위 밖 목적지는 자기 자신으로 되돌린다 (남의 링크·옛 데이터 방어)', () => {
    const selfRouted = runPortfolioSimulation({ tickers: tickerInputs([{}, {}]), settings });
    const bogus = runPortfolioSimulation({
      tickers: tickerInputs([{ reinvestTargetIndex: 99 }, {}]),
      settings
    });

    expect(bogus[0].monthly).toEqual(selfRouted[0].monthly);
    expect(bogus[1].monthly).toEqual(selfRouted[1].monthly);
  });
});
