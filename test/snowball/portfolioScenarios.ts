import type { TickerProfile } from '@/shared/types/snowball';
import type { YieldFormValues } from '@/shared/types';

/**
 * 포트폴리오(다종목) 특성화용 시나리오.
 *
 * 🔴 배당 **라우팅**(어느 종목의 배당으로 어느 종목을 사는가)을 넣기 전에, 지금의 합산 결과를
 *    그대로 굳혀 두기 위한 입력이다. 새 결합 엔진이 **기본 라우팅**(각자 자기 자신 · 전역 비율)
 *    에서 이 골든 값을 한 자리도 안 틀리게 재현해야 한다.
 *
 * 단일 종목 쪽은 `scenarios.ts` + `characterization.golden.json` 이 이미 지키고 있다. 이 파일은
 * 그 사각지대 — **종목 간 합산**과 지급 주기가 서로 다를 때의 월별 정렬 — 를 덮는다.
 *
 * ⚠ `investmentStartDate` 를 명시한다. `defaultYieldFormValues` 는 모듈 로드 시각을 잡아
 *   결정적이지 않다(`scenarios.ts` 와 같은 이유).
 */
const BASE_VALUES: YieldFormValues = {
  ticker: 'SCHD',
  initialPrice: 31.61,
  dividendYield: 3.34,
  dividendGrowth: 6.66,
  expectedTotalReturn: 10,
  frequency: 'quarterly',
  initialInvestment: 20_000_000,
  monthlyContribution: 1_000_000,
  targetMonthlyDividend: 2_000_000,
  investmentStartDate: '2026-03-15',
  durationYears: 4,
  reinvestDividends: false,
  reinvestDividendPercent: 100,
  taxRate: 15.4,
  reinvestTiming: 'sameMonth',
  dpsGrowthMode: 'monthlySmooth'
};

const profile = (
  id: string,
  ticker: string,
  initialPrice: number,
  dividendYield: number,
  dividendGrowth: number,
  frequency: YieldFormValues['frequency']
): TickerProfile => ({
  id,
  ticker,
  name: '',
  initialPrice,
  dividendYield,
  dividendGrowth,
  expectedTotalReturn: dividendYield + dividendGrowth,
  frequency
});

export type PortfolioScenario = {
  name: string;
  profiles: TickerProfile[];
  /** 종목별 비중(%). 합이 100 이 아니어도 정규화된다 — 그 동작도 함께 굳힌다. */
  weights: Record<string, number>;
  values: YieldFormValues;
};

export const PORTFOLIO_SCENARIOS: PortfolioScenario[] = [
  {
    /* 지급 주기가 서로 다른 둘 — 월별 정렬과 합산이 어긋나면 여기서 잡힌다. */
    name: 'two-tickers-mixed-frequency-no-reinvest',
    profiles: [
      profile('a', 'SCHD', 31.61, 3.34, 6.66, 'quarterly'),
      profile('b', 'JEPI', 55.2, 7.5, 0, 'monthly')
    ],
    weights: { a: 60, b: 40 },
    values: { ...BASE_VALUES }
  },
  {
    /* 🔴 재투자 ON — 라우팅이 들어갈 자리다. 지금은 **각자 자기 자신**을 산다. */
    name: 'three-tickers-reinvest-full-same-month',
    profiles: [
      profile('a', 'SCHD', 31.61, 3.34, 6.66, 'quarterly'),
      profile('b', 'JEPI', 55.2, 7.5, 0, 'monthly'),
      profile('c', 'QQQ', 430, 0.6, 10.4, 'quarterly')
    ],
    weights: { a: 50, b: 30, c: 20 },
    values: { ...BASE_VALUES, reinvestDividends: true, reinvestDividendPercent: 100 }
  },
  {
    /* 부분 재투자 + 이월(nextMonth) — 이월 현금이 다음 달 배당 계산에 반영되는 순서를 굳힌다. */
    name: 'two-tickers-reinvest-partial-next-month',
    profiles: [
      profile('a', 'SCHD', 31.61, 3.34, 6.66, 'quarterly'),
      profile('b', 'JEPI', 55.2, 7.5, 0, 'monthly')
    ],
    weights: { a: 70, b: 30 },
    values: {
      ...BASE_VALUES,
      reinvestDividends: true,
      reinvestDividendPercent: 45,
      reinvestTiming: 'nextMonth'
    }
  },
  {
    /* 무배당 종목이 섞인 경우 — 배당이 0인 종목은 라우팅의 출발점이 될 수 없다. */
    name: 'with-non-dividend-ticker',
    profiles: [
      profile('a', 'SCHD', 31.61, 3.34, 6.66, 'quarterly'),
      profile('b', 'BRK', 700, 0, 9, 'none')
    ],
    weights: { a: 50, b: 50 },
    values: { ...BASE_VALUES, reinvestDividends: true, reinvestDividendPercent: 100 }
  }
];
