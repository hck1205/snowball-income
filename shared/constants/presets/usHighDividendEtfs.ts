export const US_HIGH_DIVIDEND_ETFS = {
  VYM: {
    ticker: 'VYM',
    name: 'Vanguard High Dividend Yield ETF',
    initialPrice: 155,
    dividendYield: 2.8,
    dividendGrowth: 5,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  HDV: {
    ticker: 'HDV',
    name: 'iShares Core High Dividend ETF',
    initialPrice: 139,
    dividendYield: 3.4,
    dividendGrowth: 3,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  SDY: {
    ticker: 'SDY',
    name: 'SPDR S&P Dividend ETF',
    initialPrice: 155,
    dividendYield: 2.5,
    dividendGrowth: 4,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  DVY: {
    ticker: 'DVY',
    name: 'iShares Select Dividend ETF',
    initialPrice: 120,
    dividendYield: 3.3,
    dividendGrowth: 4,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  FDVV: {
    ticker: 'FDVV',
    name: 'Fidelity High Dividend ETF',
    initialPrice: 44,
    dividendYield: 2.9,
    dividendGrowth: 5,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  SPYD: {
    ticker: 'SPYD',
    name: 'SPDR Portfolio S&P 500 High Dividend ETF',
    initialPrice: 48,
    dividendYield: 4.2,
    dividendGrowth: 3,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  DHS: {
    ticker: 'DHS',
    name: 'WisdomTree U.S. High Dividend ETF',
    initialPrice: 95,
    dividendYield: 3.8,
    dividendGrowth: 3,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  }
} as const;
