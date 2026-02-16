export const REIT_ETFS = {
  SCHH: {
    ticker: 'SCHH',
    name: 'Schwab U.S. REIT ETF',
    initialPrice: 20,
    dividendYield: 3.8,
    dividendGrowth: 3,
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
  }
} as const;
