export const US_DIVIDEND_GROWTH_ETFS = {
  SCHD: {
    ticker: 'SCHD',
    name: 'Schwab U.S. Dividend Equity ETF',
    initialPrice: 31.61,
    dividendYield: 3.34,
    dividendGrowth: 7,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  VIG: {
    ticker: 'VIG',
    name: 'Vanguard Dividend Appreciation ETF',
    initialPrice: 185,
    dividendYield: 1.9,
    dividendGrowth: 8,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  DGRO: {
    ticker: 'DGRO',
    name: 'iShares Core Dividend Growth ETF',
    initialPrice: 73,
    dividendYield: 2.2,
    dividendGrowth: 8,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  DGRW: {
    ticker: 'DGRW',
    name: 'WisdomTree U.S. Quality Dividend Growth ETF',
    initialPrice: 74,
    dividendYield: 2.0,
    dividendGrowth: 8,
    expectedTotalReturn: 10,
    frequency: 'monthly' as const
  },
  NOBL: {
    ticker: 'NOBL',
    name: 'ProShares S&P 500 Dividend Aristocrats ETF',
    initialPrice: 114,
    dividendYield: 2.1,
    dividendGrowth: 6,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  RDVY: {
    ticker: 'RDVY',
    name: 'First Trust Rising Dividend Achievers ETF',
    initialPrice: 55,
    dividendYield: 1.5,
    dividendGrowth: 10,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  SDVY: {
    ticker: 'SDVY',
    name: 'First Trust SMID Cap Rising Dividend Achievers ETF',
    initialPrice: 33,
    dividendYield: 1.7,
    dividendGrowth: 11,
    expectedTotalReturn: 11.5,
    frequency: 'quarterly' as const
  },
  CGDV: {
    ticker: 'CGDV',
    name: 'Capital Group Dividend Value ETF',
    initialPrice: 31,
    dividendYield: 1.4,
    dividendGrowth: 9,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  DLN: {
    ticker: 'DLN',
    name: 'WisdomTree U.S. LargeCap Dividend Fund',
    initialPrice: 130,
    dividendYield: 2.1,
    dividendGrowth: 6,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  DON: {
    ticker: 'DON',
    name: 'WisdomTree U.S. MidCap Dividend Fund',
    initialPrice: 47,
    dividendYield: 2.3,
    dividendGrowth: 6,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  DES: {
    ticker: 'DES',
    name: 'WisdomTree U.S. SmallCap Dividend Fund',
    initialPrice: 32,
    dividendYield: 2.7,
    dividendGrowth: 5,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  }
} as const;
