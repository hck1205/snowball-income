export const OPTION_INCOME_ETFS = {
  JEPI: {
    ticker: 'JEPI',
    name: 'JPMorgan Equity Premium Income ETF',
    initialPrice: 59,
    dividendYield: 8.0,
    dividendGrowth: 2,
    expectedTotalReturn: 8,
    frequency: 'monthly' as const
  },
  JEPQ: {
    ticker: 'JEPQ',
    name: 'JPMorgan Nasdaq Equity Premium Income ETF',
    initialPrice: 51,
    dividendYield: 8.2,
    dividendGrowth: 3,
    expectedTotalReturn: 9,
    frequency: 'monthly' as const
  },
  DIVO: {
    ticker: 'DIVO',
    name: 'Amplify CWP Enhanced Dividend Income ETF',
    initialPrice: 47,
    dividendYield: 5.5,
    dividendGrowth: 6,
    expectedTotalReturn: 9.5,
    frequency: 'monthly' as const
  },
  IDVO: {
    ticker: 'IDVO',
    name: 'Amplify International Enhanced Dividend ETF',
    initialPrice: 29,
    dividendYield: 7.0,
    dividendGrowth: 2,
    expectedTotalReturn: 8,
    frequency: 'monthly' as const
  },
  QDVO: {
    ticker: 'QDVO',
    name: 'QRAFT AI-Enhanced U.S. Dividend ETF',
    initialPrice: 27,
    dividendYield: 6.5,
    dividendGrowth: 5,
    expectedTotalReturn: 9,
    frequency: 'monthly' as const
  },
  QYLD: {
    ticker: 'QYLD',
    name: 'Global X Nasdaq 100 Covered Call ETF',
    initialPrice: 18,
    dividendYield: 10,
    dividendGrowth: 0,
    expectedTotalReturn: 7,
    frequency: 'monthly' as const
  },
  XYLD: {
    ticker: 'XYLD',
    name: 'Global X S&P 500 Covered Call ETF',
    initialPrice: 40,
    dividendYield: 9,
    dividendGrowth: 0,
    expectedTotalReturn: 7.5,
    frequency: 'monthly' as const
  }
} as const;
