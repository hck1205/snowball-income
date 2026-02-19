export const CORE_INDEX_ETFS = {
  VOO: {
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    initialPrice: 480,
    dividendYield: 1.3,
    dividendGrowth: 6,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  IVV: {
    ticker: 'IVV',
    name: 'iShares Core S&P 500 ETF',
    initialPrice: 520,
    dividendYield: 1.3,
    dividendGrowth: 6,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  SPY: {
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    initialPrice: 500,
    dividendYield: 1.3,
    dividendGrowth: 6,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  VTI: {
    ticker: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    initialPrice: 250,
    dividendYield: 1.4,
    dividendGrowth: 6,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  QQQ: {
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust',
    initialPrice: 430,
    dividendYield: 0.6,
    dividendGrowth: 7,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  VUG: {
    ticker: 'VUG',
    name: 'Vanguard Growth ETF',
    initialPrice: 360,
    dividendYield: 0.5,
    dividendGrowth: 7,
    expectedTotalReturn: 10.5,
    frequency: 'quarterly' as const
  },
  VT: {
    ticker: 'VT',
    name: 'Vanguard Total World Stock ETF',
    initialPrice: 110,
    dividendYield: 1.8,
    dividendGrowth: 5,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  VXUS: {
    ticker: 'VXUS',
    name: 'Vanguard Total International Stock ETF',
    initialPrice: 60,
    dividendYield: 2.5,
    dividendGrowth: 4,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  DIA: {
    ticker: 'DIA',
    name: 'SPDR Dow Jones Industrial Average ETF',
    initialPrice: 390,
    dividendYield: 1.8,
    dividendGrowth: 5,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  }
} as const;
