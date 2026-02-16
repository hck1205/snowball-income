export const DIVIDEND_GROWTH_STOCKS = {
  PG: {
    ticker: 'PG',
    name: 'Procter & Gamble',
    initialPrice: 160,
    dividendYield: 2.4,
    dividendGrowth: 6,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  KO: {
    ticker: 'KO',
    name: 'Coca-Cola',
    initialPrice: 60,
    dividendYield: 3.1,
    dividendGrowth: 4,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  JNJ: {
    ticker: 'JNJ',
    name: 'Johnson & Johnson',
    initialPrice: 160,
    dividendYield: 3.0,
    dividendGrowth: 5,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  LOW: {
    ticker: 'LOW',
    name: 'Lowe’s',
    initialPrice: 220,
    dividendYield: 1.8,
    dividendGrowth: 15,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  ABBV: {
    ticker: 'ABBV',
    name: 'AbbVie',
    initialPrice: 170,
    dividendYield: 3.7,
    dividendGrowth: 8,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  }
} as const;
