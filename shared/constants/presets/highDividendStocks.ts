export const HIGH_DIVIDEND_STOCKS = {
  O: {
    ticker: 'O',
    name: 'Realty Income',
    initialPrice: 57,
    dividendYield: 5.5,
    dividendGrowth: 4,
    expectedTotalReturn: 8,
    frequency: 'monthly' as const
  },
  ENB: {
    ticker: 'ENB',
    name: 'Enbridge',
    initialPrice: 35,
    dividendYield: 7.0,
    dividendGrowth: 4,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  VICI: {
    ticker: 'VICI',
    name: 'VICI Properties',
    initialPrice: 32,
    dividendYield: 5.2,
    dividendGrowth: 6,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  UPS: {
    ticker: 'UPS',
    name: 'United Parcel Service',
    initialPrice: 145,
    dividendYield: 4.0,
    dividendGrowth: 6,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  T: {
    ticker: 'T',
    name: 'AT&T',
    initialPrice: 18,
    dividendYield: 6.5,
    dividendGrowth: 2,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  }
} as const;
