export const SEMICONDUCTOR_DIVIDEND_GROWTH_PORTFOLIO = {
  AVGO: {
    ticker: 'AVGO',
    name: 'Broadcom Inc.',
    initialPrice: 1350,
    dividendYield: 1.5,
    dividendGrowth: 15,
    expectedTotalReturn: 14,
    frequency: 'quarterly' as const
  },
  TXN: {
    ticker: 'TXN',
    name: 'Texas Instruments Incorporated',
    initialPrice: 190,
    dividendYield: 3.0,
    dividendGrowth: 12,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  ADI: {
    ticker: 'ADI',
    name: 'Analog Devices, Inc.',
    initialPrice: 210,
    dividendYield: 1.8,
    dividendGrowth: 11,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  LRCX: {
    ticker: 'LRCX',
    name: 'Lam Research Corporation',
    initialPrice: 900,
    dividendYield: 1.2,
    dividendGrowth: 15,
    expectedTotalReturn: 13,
    frequency: 'quarterly' as const
  },
  KLAC: {
    ticker: 'KLAC',
    name: 'KLA Corporation',
    initialPrice: 800,
    dividendYield: 1.1,
    dividendGrowth: 13,
    expectedTotalReturn: 12,
    frequency: 'quarterly' as const
  },
  AMAT: {
    ticker: 'AMAT',
    name: 'Applied Materials, Inc.',
    initialPrice: 220,
    dividendYield: 0.9,
    dividendGrowth: 12,
    expectedTotalReturn: 12,
    frequency: 'quarterly' as const
  },
  TSM: {
    ticker: 'TSM',
    name: 'Taiwan Semiconductor Manufacturing Company',
    initialPrice: 170,
    dividendYield: 1.5,
    dividendGrowth: 10,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  ASML: {
    ticker: 'ASML',
    name: 'ASML Holding N.V.',
    initialPrice: 900,
    dividendYield: 0.8,
    dividendGrowth: 10,
    expectedTotalReturn: 11,
    frequency: 'annual' as const
  },
  ETN: {
    ticker: 'ETN',
    name: 'Eaton Corporation plc',
    initialPrice: 320,
    dividendYield: 1.2,
    dividendGrowth: 11,
    expectedTotalReturn: 12,
    frequency: 'quarterly' as const
  },
  VRT: {
    ticker: 'VRT',
    name: 'Vertiv Holdings Co',
    initialPrice: 80,
    dividendYield: 0.2,
    dividendGrowth: 8,
    expectedTotalReturn: 14,
    frequency: 'quarterly' as const
  }
} as const;
