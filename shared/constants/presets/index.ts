export const PRESET_TICKERS = {
  SCHD: {
    ticker: 'SCHD',
    initialPrice: 31.61,
    dividendYield: 3.34,
    dividendGrowth: 9.08,
    priceGrowth: 10.85,
    frequency: 'quarterly' as const
  },
  JEPI: {
    ticker: 'JEPI',
    initialPrice: 59.31,
    dividendYield: 7.99,
    dividendGrowth: 7.88,
    priceGrowth: 10.09,
    frequency: 'monthly' as const
  },
  VIG: {
    ticker: 'VIG',
    initialPrice: 227.26,
    dividendYield: 1.57,
    dividendGrowth: 9.13,
    priceGrowth: 11.7,
    frequency: 'quarterly' as const
  },
  DGRO: {
    ticker: 'DGRO',
    initialPrice: 73.62,
    dividendYield: 1.97,
    dividendGrowth: 7.08,
    priceGrowth: 12.33,
    frequency: 'quarterly' as const
  },
  VYM: {
    ticker: 'VYM',
    initialPrice: 155.37,
    dividendYield: 2.25,
    dividendGrowth: 3.76,
    priceGrowth: 13.46,
    frequency: 'quarterly' as const
  },
  HDV: {
    ticker: 'HDV',
    initialPrice: 138.76,
    dividendYield: 2.82,
    dividendGrowth: 1.84,
    priceGrowth: 13.06,
    frequency: 'quarterly' as const
  },
  DIVO: {
    ticker: 'DIVO',
    initialPrice: 46.59,
    dividendYield: 6.18,
    dividendGrowth: 9.42,
    priceGrowth: 12.65,
    frequency: 'monthly' as const
  },
  NOBL: {
    ticker: 'NOBL',
    initialPrice: 114.0,
    dividendYield: 1.95,
    dividendGrowth: 5.45,
    priceGrowth: 9.1,
    frequency: 'quarterly' as const
  },
  SDY: {
    ticker: 'SDY',
    initialPrice: 155.25,
    dividendYield: 2.36,
    dividendGrowth: 3.75,
    priceGrowth: 9.63,
    frequency: 'quarterly' as const
  },
  SPYD: {
    ticker: 'SPYD',
    initialPrice: 48.07,
    dividendYield: 4.11,
    dividendGrowth: 3.76,
    priceGrowth: 10.61,
    frequency: 'quarterly' as const
  }
};

export type PresetTickerKey = keyof typeof PRESET_TICKERS;
