/**
 * 2026-08-02 확충분(RYLD·SPYI·QQQI): `initialPrice`·`dividendYield`·`frequency` 는 갱신 파이프라인과
 * 같은 경로(Yahoo chart API → `scripts/tickerRefresh/derive`)로 2026-08-02 에 실측했다.
 *
 * 옵션인컴 계열의 `expectedTotalReturn` 은 배당률보다 **낮게** 잡히는 것이 정상이다 — 정합 모델에서
 * `dividendGrowth = etr - dy` 는 곧 주가 성장률이고, 콜을 팔아 상방을 넘긴 대가로 분배금 일부가
 * 원금(NAV)에서 나오는 구조를 음(-)의 성장률로 정직하게 표현한 것이다(QYLD -3, XYLD -1.5 와 같은 규율).
 */
export const OPTION_INCOME_ETFS = {
  JEPI: {
    ticker: 'JEPI',
    name: 'JPMorgan Equity Premium Income ETF',
    initialPrice: 59,
    dividendYield: 8.0,
    dividendGrowth: 0,
    expectedTotalReturn: 8,
    frequency: 'monthly' as const
  },
  JEPQ: {
    ticker: 'JEPQ',
    name: 'JPMorgan Nasdaq Equity Premium Income ETF',
    initialPrice: 51,
    dividendYield: 8.2,
    dividendGrowth: 0.8,
    expectedTotalReturn: 9,
    frequency: 'monthly' as const
  },
  DIVO: {
    ticker: 'DIVO',
    name: 'Amplify CWP Enhanced Dividend Income ETF',
    initialPrice: 47,
    dividendYield: 5.5,
    dividendGrowth: 4,
    expectedTotalReturn: 9.5,
    frequency: 'monthly' as const
  },
  IDVO: {
    ticker: 'IDVO',
    name: 'Amplify International Enhanced Dividend ETF',
    initialPrice: 29,
    dividendYield: 7.0,
    dividendGrowth: 1,
    expectedTotalReturn: 8,
    frequency: 'monthly' as const
  },
  QDVO: {
    ticker: 'QDVO',
    name: 'QRAFT AI-Enhanced U.S. Dividend ETF',
    initialPrice: 27,
    dividendYield: 6.5,
    dividendGrowth: 2.5,
    expectedTotalReturn: 9,
    frequency: 'monthly' as const
  },
  QYLD: {
    ticker: 'QYLD',
    name: 'Global X Nasdaq 100 Covered Call ETF',
    initialPrice: 18,
    dividendYield: 10,
    dividendGrowth: -3,
    expectedTotalReturn: 7,
    frequency: 'monthly' as const
  },
  XYLD: {
    ticker: 'XYLD',
    name: 'Global X S&P 500 Covered Call ETF',
    initialPrice: 40,
    dividendYield: 9,
    dividendGrowth: -1.5,
    expectedTotalReturn: 7.5,
    frequency: 'monthly' as const
  },
  RYLD: {
    ticker: 'RYLD',
    name: 'Global X Russell 2000 Covered Call ETF',
    initialPrice: 16.01,
    dividendYield: 11.64,
    dividendGrowth: -4.64,
    expectedTotalReturn: 7,
    frequency: 'monthly' as const
  },
  SPYI: {
    ticker: 'SPYI',
    name: 'NEOS S&P 500 High Income ETF',
    initialPrice: 52.86,
    dividendYield: 11.94,
    dividendGrowth: -3.44,
    expectedTotalReturn: 8.5,
    frequency: 'monthly' as const
  },
  QQQI: {
    ticker: 'QQQI',
    name: 'NEOS Nasdaq-100 High Income ETF',
    initialPrice: 53.04,
    dividendYield: 14.38,
    dividendGrowth: -5.38,
    expectedTotalReturn: 9,
    frequency: 'monthly' as const
  }
} as const;
