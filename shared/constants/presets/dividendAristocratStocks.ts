/**
 * 2026-08-02 확충분(S&P 500 배당귀족·배당킹 계열 대형주 40종, 유니버스에 없던 것만): `initialPrice`·
 * `dividendYield`·`frequency`는 갱신 파이프라인과 같은 경로(Yahoo chart API →
 * `scripts/tickerRefresh/derive`)로 2026-08-02 에 실측했다. `expectedTotalReturn`만 큐레이터의
 * 가정이고 `dividendGrowth`는 파생값이다.
 *
 * 25년 이상(귀족) 또는 50년 이상(킹) 연속 배당 인상 이력이 있는 종목 중, 초소형/저유동성(예:
 * 배당킹 중 소형주)은 "대형주"라는 트랙 지침에 따라 제외하고 시가총액 상위 종목만 담았다.
 *
 * ⚠ EXPD(Expeditors International)는 연 2회 지급이다 — 10년치 이력이 정확히 2회/년이지만,
 * `inferFrequency`의 트레일링 365일 창이 두 지급 간격(~168·195일) 경계에서 3회로 잡혀 'quarterly'로
 * 오분류하는 것을 확인해(2026-08-02 실측 원자료) `'semiannual'`로 수기 보정했다. `dividendYield`는
 * "오늘" 기준 TTM 창이라 이 버그의 영향을 받지 않는다.
 */
export const DIVIDEND_ARISTOCRAT_STOCKS = {
  APD: {
    ticker: 'APD',
    name: 'Air Products and Chemicals, Inc.',
    initialPrice: 294.89,
    dividendYield: 2.44,
    dividendGrowth: 6.56,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  AOS: {
    ticker: 'AOS',
    name: 'A. O. Smith Corporation',
    initialPrice: 60.13,
    dividendYield: 2.39,
    dividendGrowth: 6.11,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  ADM: {
    ticker: 'ADM',
    name: 'Archer-Daniels-Midland Company',
    initialPrice: 79.27,
    dividendYield: 2.6,
    dividendGrowth: 5.4,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  ATO: {
    ticker: 'ATO',
    name: 'Atmos Energy Corporation',
    initialPrice: 172.78,
    dividendYield: 2.24,
    dividendGrowth: 5.76,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  ADP: {
    ticker: 'ADP',
    name: 'Automatic Data Processing, Inc.',
    initialPrice: 266.46,
    dividendYield: 2.49,
    dividendGrowth: 7.51,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  BDX: {
    ticker: 'BDX',
    name: 'Becton, Dickinson and Company',
    initialPrice: 165.62,
    dividendYield: 2.26,
    dividendGrowth: 6.24,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  BRO: {
    ticker: 'BRO',
    name: 'Brown & Brown, Inc.',
    initialPrice: 70.4,
    dividendYield: 0.92,
    dividendGrowth: 9.08,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  CAH: {
    ticker: 'CAH',
    name: 'Cardinal Health, Inc.',
    initialPrice: 230.03,
    dividendYield: 0.89,
    dividendGrowth: 7.61,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  CHRW: {
    ticker: 'CHRW',
    name: 'C.H. Robinson Worldwide, Inc.',
    initialPrice: 147.73,
    dividendYield: 1.7,
    dividendGrowth: 6.3,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  CHD: {
    ticker: 'CHD',
    name: 'Church & Dwight Co., Inc.',
    initialPrice: 98.81,
    dividendYield: 1.22,
    dividendGrowth: 6.78,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  CINF: {
    ticker: 'CINF',
    name: 'Cincinnati Financial Corporation',
    initialPrice: 177.68,
    dividendYield: 2.04,
    dividendGrowth: 5.96,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  CL: {
    ticker: 'CL',
    name: 'Colgate-Palmolive Company',
    initialPrice: 91.3,
    dividendYield: 2.3,
    dividendGrowth: 5.7,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  CLX: {
    ticker: 'CLX',
    name: 'The Clorox Company',
    initialPrice: 95.53,
    dividendYield: 5.19,
    dividendGrowth: 2.31,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  },
  CTAS: {
    ticker: 'CTAS',
    name: 'Cintas Corporation',
    initialPrice: 204.63,
    dividendYield: 0.88,
    dividendGrowth: 9.12,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  DOV: {
    ticker: 'DOV',
    name: 'Dover Corporation',
    initialPrice: 204.62,
    dividendYield: 1.02,
    dividendGrowth: 7.98,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  ECL: {
    ticker: 'ECL',
    name: 'Ecolab Inc.',
    initialPrice: 277.63,
    dividendYield: 1.02,
    dividendGrowth: 7.98,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  ED: {
    ticker: 'ED',
    name: 'Consolidated Edison, Inc.',
    initialPrice: 108.85,
    dividendYield: 3.19,
    dividendGrowth: 3.81,
    expectedTotalReturn: 7,
    frequency: 'quarterly' as const
  },
  EMR: {
    ticker: 'EMR',
    name: 'Emerson Electric Co.',
    initialPrice: 149.82,
    dividendYield: 1.46,
    dividendGrowth: 7.04,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  ESS: {
    ticker: 'ESS',
    name: 'Essex Property Trust, Inc.',
    initialPrice: 284.14,
    dividendYield: 3.63,
    dividendGrowth: 3.87,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  },
  EXPD: {
    ticker: 'EXPD',
    name: 'Expeditors International of Washington, Inc.',
    initialPrice: 167.89,
    dividendYield: 0.94,
    dividendGrowth: 7.56,
    expectedTotalReturn: 8.5,
    frequency: 'semiannual' as const
  },
  FRT: {
    ticker: 'FRT',
    name: 'Federal Realty Investment Trust',
    initialPrice: 124.09,
    dividendYield: 3.64,
    dividendGrowth: 3.86,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  },
  GD: {
    ticker: 'GD',
    name: 'General Dynamics Corporation',
    initialPrice: 383.42,
    dividendYield: 1.61,
    dividendGrowth: 7.39,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  GPC: {
    ticker: 'GPC',
    name: 'Genuine Parts Company',
    initialPrice: 124.37,
    dividendYield: 3.37,
    dividendGrowth: 4.63,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  GWW: {
    ticker: 'GWW',
    name: 'W.W. Grainger, Inc.',
    initialPrice: 1382.22,
    dividendYield: 0.67,
    dividendGrowth: 9.33,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  HRL: {
    ticker: 'HRL',
    name: 'Hormel Foods Corporation',
    initialPrice: 25.01,
    dividendYield: 4.67,
    dividendGrowth: 2.33,
    expectedTotalReturn: 7,
    frequency: 'quarterly' as const
  },
  ITW: {
    ticker: 'ITW',
    name: 'Illinois Tool Works Inc.',
    initialPrice: 286.95,
    dividendYield: 2.24,
    dividendGrowth: 6.76,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  KMB: {
    ticker: 'KMB',
    name: 'Kimberly-Clark Corporation',
    initialPrice: 109.31,
    dividendYield: 4.65,
    dividendGrowth: 2.35,
    expectedTotalReturn: 7,
    frequency: 'quarterly' as const
  },
  LIN: {
    ticker: 'LIN',
    name: 'Linde plc',
    initialPrice: 478.38,
    dividendYield: 1.3,
    dividendGrowth: 8.7,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  MDT: {
    ticker: 'MDT',
    name: 'Medtronic plc',
    initialPrice: 85.39,
    dividendYield: 3.34,
    dividendGrowth: 5.16,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  MKC: {
    ticker: 'MKC',
    name: 'McCormick & Company, Incorporated',
    initialPrice: 50.9,
    dividendYield: 3.71,
    dividendGrowth: 3.79,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  },
  NDSN: {
    ticker: 'NDSN',
    name: 'Nordson Corporation',
    initialPrice: 297.78,
    dividendYield: 1.1,
    dividendGrowth: 7.9,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  PNR: {
    ticker: 'PNR',
    name: 'Pentair plc',
    initialPrice: 65.44,
    dividendYield: 1.62,
    dividendGrowth: 7.38,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  PPG: {
    ticker: 'PPG',
    name: 'PPG Industries, Inc.',
    initialPrice: 110.52,
    dividendYield: 2.57,
    dividendGrowth: 5.93,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  ROP: {
    ticker: 'ROP',
    name: 'Roper Technologies, Inc.',
    initialPrice: 391.97,
    dividendYield: 0.91,
    dividendGrowth: 9.59,
    expectedTotalReturn: 10.5,
    frequency: 'quarterly' as const
  },
  SHW: {
    ticker: 'SHW',
    name: 'The Sherwin-Williams Company',
    initialPrice: 340.85,
    dividendYield: 0.93,
    dividendGrowth: 9.57,
    expectedTotalReturn: 10.5,
    frequency: 'quarterly' as const
  },
  SJM: {
    ticker: 'SJM',
    name: 'The J. M. Smucker Company',
    initialPrice: 119.26,
    dividendYield: 3.69,
    dividendGrowth: 3.31,
    expectedTotalReturn: 7,
    frequency: 'quarterly' as const
  },
  SWK: {
    ticker: 'SWK',
    name: 'Stanley Black & Decker, Inc.',
    initialPrice: 94.58,
    dividendYield: 3.51,
    dividendGrowth: 4.49,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  SYY: {
    ticker: 'SYY',
    name: 'Sysco Corporation',
    initialPrice: 85.24,
    dividendYield: 2.55,
    dividendGrowth: 5.95,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  WST: {
    ticker: 'WST',
    name: 'West Pharmaceutical Services, Inc.',
    initialPrice: 340.96,
    dividendYield: 0.26,
    dividendGrowth: 9.24,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  PH: {
    ticker: 'PH',
    name: 'Parker-Hannifin Corporation',
    initialPrice: 976.53,
    dividendYield: 0.76,
    dividendGrowth: 9.24,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  }
} as const;
