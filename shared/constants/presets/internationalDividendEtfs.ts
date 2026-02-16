export const INTERNATIONAL_DIVIDEND_ETFS = {
  VIGI: {
    ticker: 'VIGI',
    name: 'Vanguard International Dividend Appreciation ETF',
    initialPrice: 76,
    dividendYield: 1.9,
    dividendGrowth: 8,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  VYMI: {
    ticker: 'VYMI',
    name: 'Vanguard International High Dividend Yield ETF',
    initialPrice: 70,
    dividendYield: 4.0,
    dividendGrowth: 3,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  SCHY: {
    ticker: 'SCHY',
    name: 'Schwab International Dividend Equity ETF',
    initialPrice: 24,
    dividendYield: 4.2,
    dividendGrowth: 4,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  IDV: {
    ticker: 'IDV',
    name: 'iShares International Select Dividend ETF',
    initialPrice: 29,
    dividendYield: 6.0,
    dividendGrowth: 2,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  },
  DWX: {
    ticker: 'DWX',
    name: 'SPDR S&P International Dividend ETF',
    initialPrice: 34,
    dividendYield: 5.5,
    dividendGrowth: 2,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  }
} as const;
