/**
 * 2026-08-02 확충분(SPHD·PEY·FDL): `initialPrice`·`dividendYield`·`frequency` 는 이 레포의 갱신
 * 파이프라인과 **같은 경로**(Yahoo chart API → `scripts/tickerRefresh/derive` 의 `computeTtmYield`·
 * `inferFrequency`)로 2026-08-02 에 실측한 값이다. `expectedTotalReturn` 은 언제나처럼 큐레이터의
 * 가정이며(관측값 아님), `dividendGrowth` 는 거기서 파생된다(`dy + dg === etr`).
 */
export const US_HIGH_DIVIDEND_ETFS = {
  VYM: {
    ticker: 'VYM',
    name: 'Vanguard High Dividend Yield ETF',
    initialPrice: 155,
    dividendYield: 2.8,
    dividendGrowth: 6.2,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  HDV: {
    ticker: 'HDV',
    name: 'iShares Core High Dividend ETF',
    initialPrice: 139,
    dividendYield: 3.4,
    dividendGrowth: 5.1,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  SDY: {
    ticker: 'SDY',
    name: 'SPDR S&P Dividend ETF',
    initialPrice: 155,
    dividendYield: 2.5,
    dividendGrowth: 6,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  DVY: {
    ticker: 'DVY',
    name: 'iShares Select Dividend ETF',
    initialPrice: 120,
    dividendYield: 3.3,
    dividendGrowth: 5.2,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  FDVV: {
    ticker: 'FDVV',
    name: 'Fidelity High Dividend ETF',
    initialPrice: 44,
    dividendYield: 2.9,
    dividendGrowth: 6.1,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  SPYD: {
    ticker: 'SPYD',
    name: 'SPDR Portfolio S&P 500 High Dividend ETF',
    initialPrice: 48,
    dividendYield: 4.2,
    dividendGrowth: 3.8,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  DHS: {
    ticker: 'DHS',
    name: 'WisdomTree U.S. High Dividend ETF',
    initialPrice: 95,
    dividendYield: 3.8,
    dividendGrowth: 4.2,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  SPHD: {
    ticker: 'SPHD',
    name: 'Invesco S&P 500 High Dividend Low Volatility ETF',
    initialPrice: 52.35,
    dividendYield: 4.56,
    dividendGrowth: 3.44,
    expectedTotalReturn: 8,
    frequency: 'monthly' as const
  },
  PEY: {
    ticker: 'PEY',
    name: 'Invesco High Yield Equity Dividend Achievers ETF',
    initialPrice: 24.16,
    dividendYield: 4.26,
    dividendGrowth: 3.74,
    expectedTotalReturn: 8,
    frequency: 'monthly' as const
  },
  FDL: {
    ticker: 'FDL',
    name: 'First Trust Morningstar Dividend Leaders Index Fund',
    initialPrice: 51.48,
    dividendYield: 3.59,
    dividendGrowth: 4.91,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  }
} as const;
