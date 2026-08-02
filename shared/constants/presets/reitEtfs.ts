/**
 * 2026-08-02 확충분(VNQ): `initialPrice`·`dividendYield`·`frequency` 는 갱신 파이프라인과 같은
 * 경로(Yahoo chart API → `scripts/tickerRefresh/derive`)로 2026-08-02 에 실측했다.
 */
export const REIT_ETFS = {
  SCHH: {
    ticker: 'SCHH',
    name: 'Schwab U.S. REIT ETF',
    initialPrice: 20,
    dividendYield: 3.8,
    dividendGrowth: 4.2,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  VNQI: {
    ticker: 'VNQI',
    name: 'Vanguard Global ex-US Real Estate ETF',
    initialPrice: 44,
    dividendYield: 4.5,
    dividendGrowth: 3,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  },
  VNQ: {
    ticker: 'VNQ',
    name: 'Vanguard Real Estate ETF',
    initialPrice: 98.95,
    dividendYield: 3.51,
    dividendGrowth: 4.49,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  }
} as const;
