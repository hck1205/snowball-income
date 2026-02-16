export const PRESET_TICKERS = {
  REALTY_INCOME: {
    ticker: 'O',
    name: '리얼티인컴',
    initialPrice: 57,
    dividendYield: 5.5,
    dividendGrowth: 4,
    expectedTotalReturn: 8,
    frequency: 'monthly' as const
  },
  SCHD: {
    ticker: 'SCHD',
    name: '',
    initialPrice: 31.61,
    dividendYield: 3.34,
    dividendGrowth: 7,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  JEPI: {
    ticker: 'JEPI',
    name: '',
    initialPrice: 59.31,
    dividendYield: 8.5,
    dividendGrowth: 1.5,
    expectedTotalReturn: 8,
    frequency: 'monthly' as const
  },
  VIG: {
    ticker: 'VIG',
    name: '',
    initialPrice: 227.26,
    dividendYield: 1.57,
    dividendGrowth: 9,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  DGRO: {
    ticker: 'DGRO',
    name: '',
    initialPrice: 73.62,
    dividendYield: 1.97,
    dividendGrowth: 8,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  VYM: {
    ticker: 'VYM',
    name: '',
    initialPrice: 155.37,
    dividendYield: 2.25,
    dividendGrowth: 4,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  HDV: {
    ticker: 'HDV',
    name: '',
    initialPrice: 138.76,
    dividendYield: 2.82,
    dividendGrowth: 2,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  DIVO: {
    ticker: 'DIVO',
    name: '',
    initialPrice: 46.59,
    dividendYield: 6.18,
    dividendGrowth: 8,
    expectedTotalReturn: 9.5,
    frequency: 'monthly' as const
  },
  NOBL: {
    ticker: 'NOBL',
    name: '',
    initialPrice: 114.0,
    dividendYield: 1.95,
    dividendGrowth: 5,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  SDY: {
    ticker: 'SDY',
    name: '',
    initialPrice: 155.25,
    dividendYield: 2.36,
    dividendGrowth: 4,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  SPYD: {
    ticker: 'SPYD',
    name: '',
    initialPrice: 48.07,
    dividendYield: 4.11,
    dividendGrowth: 3.5,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  IDVO: {
    ticker: 'IDVO',
    name: '',
    initialPrice: 29,
    dividendYield: 7,
    dividendGrowth: 2,
    expectedTotalReturn: 8,
    frequency: 'monthly' as const
  },
  DHS: {
    ticker: 'DHS',
    name: '',
    initialPrice: 95,
    dividendYield: 3.8,
    dividendGrowth: 3,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  SCHY: {
    ticker: 'SCHY',
    name: '',
    initialPrice: 24,
    dividendYield: 4,
    dividendGrowth: 4,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  DGRW: {
    ticker: 'DGRW',
    name: '',
    initialPrice: 74,
    dividendYield: 2,
    dividendGrowth: 8,
    expectedTotalReturn: 10,
    frequency: 'monthly' as const
  },
  SCHF: {
    ticker: 'SCHF',
    name: '',
    initialPrice: 38,
    dividendYield: 2.5,
    dividendGrowth: 4,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  VNQI: {
    ticker: 'VNQI',
    name: '',
    initialPrice: 44,
    dividendYield: 4.5,
    dividendGrowth: 3,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  },
  VIGI: {
    ticker: 'VIGI',
    name: '',
    initialPrice: 76,
    dividendYield: 1.8,
    dividendGrowth: 8,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  JEPQ: {
    ticker: 'JEPQ',
    name: '',
    initialPrice: 51,
    dividendYield: 8,
    dividendGrowth: 2,
    expectedTotalReturn: 9,
    frequency: 'monthly' as const
  },
  QDVO: {
    ticker: 'QDVO',
    name: '',
    initialPrice: 27,
    dividendYield: 6.5,
    dividendGrowth: 5,
    expectedTotalReturn: 9,
    frequency: 'monthly' as const
  }
} as const;

export type PresetTickerKey = keyof typeof PRESET_TICKERS;
