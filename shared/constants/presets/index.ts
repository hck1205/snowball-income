export const PRESET_TICKERS = {
  SCHD: {
    ticker: 'SCHD',
    initialPrice: 31.61,
    dividendYield: 3.34,
    dividendGrowth: 7,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  JEPI: {
    ticker: 'JEPI',
    initialPrice: 59.31,
    dividendYield: 8.5,
    dividendGrowth: 1.5,
    expectedTotalReturn: 8,
    frequency: 'monthly' as const
  },
  VIG: {
    ticker: 'VIG',
    initialPrice: 227.26,
    dividendYield: 1.57,
    dividendGrowth: 9,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  DGRO: {
    ticker: 'DGRO',
    initialPrice: 73.62,
    dividendYield: 1.97,
    dividendGrowth: 8,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  VYM: {
    ticker: 'VYM',
    initialPrice: 155.37,
    dividendYield: 2.25,
    dividendGrowth: 4,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  HDV: {
    ticker: 'HDV',
    initialPrice: 138.76,
    dividendYield: 2.82,
    dividendGrowth: 2,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  DIVO: {
    ticker: 'DIVO',
    initialPrice: 46.59,
    dividendYield: 6.18,
    dividendGrowth: 8,
    expectedTotalReturn: 9.5,
    frequency: 'monthly' as const
  },
  NOBL: {
    ticker: 'NOBL',
    initialPrice: 114.0,
    dividendYield: 1.95,
    dividendGrowth: 5,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  SDY: {
    ticker: 'SDY',
    initialPrice: 155.25,
    dividendYield: 2.36,
    dividendGrowth: 4,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  SPYD: {
    ticker: 'SPYD',
    initialPrice: 48.07,
    dividendYield: 4.11,
    dividendGrowth: 3.5,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  }
};

export type PresetTickerKey = keyof typeof PRESET_TICKERS;
