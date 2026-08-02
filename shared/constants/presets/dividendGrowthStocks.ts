/**
 * 2026-08-02 확충분(PEP 이하 14종): `initialPrice`·`dividendYield`·`frequency` 는 갱신 파이프라인과
 * 같은 경로(Yahoo chart API → `scripts/tickerRefresh/derive` 의 `computeTtmYield`·`inferFrequency`)로
 * 2026-08-02 에 실측했다. `expectedTotalReturn` 만 큐레이터의 가정이고 `dividendGrowth` 는 파생값이다.
 *
 * ⚠ "배당성장주"는 **배당률이 낮고 성장 여력에 무게가 실린 대형주**라는 뜻이지, 매년 인상을 보장한다는
 * 뜻이 아니다. MMM 처럼 사업 분할 과정에서 배당이 재설정된 이력이 있는 종목도 이 묶음에 있다.
 */
export const DIVIDEND_GROWTH_STOCKS = {
  PG: {
    ticker: 'PG',
    name: 'Procter & Gamble',
    initialPrice: 160,
    dividendYield: 2.4,
    dividendGrowth: 6.6,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  KO: {
    ticker: 'KO',
    name: 'Coca-Cola',
    initialPrice: 60,
    dividendYield: 3.1,
    dividendGrowth: 4.9,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  JNJ: {
    ticker: 'JNJ',
    name: 'Johnson & Johnson',
    initialPrice: 160,
    dividendYield: 3.0,
    dividendGrowth: 5.5,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  LOW: {
    ticker: 'LOW',
    name: 'Lowe’s',
    initialPrice: 220,
    dividendYield: 1.8,
    dividendGrowth: 9.2,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  ABBV: {
    ticker: 'ABBV',
    name: 'AbbVie',
    initialPrice: 170,
    dividendYield: 3.7,
    dividendGrowth: 6.3,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  PEP: {
    ticker: 'PEP',
    name: 'PepsiCo',
    initialPrice: 139.56,
    dividendYield: 4.12,
    dividendGrowth: 4.38,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  MCD: {
    ticker: 'MCD',
    name: "McDonald's",
    initialPrice: 270.64,
    dividendYield: 2.72,
    dividendGrowth: 6.28,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  HD: {
    ticker: 'HD',
    name: 'The Home Depot',
    initialPrice: 331.96,
    dividendYield: 2.79,
    dividendGrowth: 6.21,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  TGT: {
    ticker: 'TGT',
    name: 'Target',
    initialPrice: 144.49,
    dividendYield: 3.16,
    dividendGrowth: 5.34,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  WMT: {
    ticker: 'WMT',
    name: 'Walmart',
    initialPrice: 111.2,
    dividendYield: 0.87,
    dividendGrowth: 8.13,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  XOM: {
    ticker: 'XOM',
    name: 'Exxon Mobil',
    initialPrice: 155.44,
    dividendYield: 2.62,
    dividendGrowth: 5.38,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  CVX: {
    ticker: 'CVX',
    name: 'Chevron',
    initialPrice: 196.83,
    dividendYield: 3.55,
    dividendGrowth: 4.95,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  CAT: {
    ticker: 'CAT',
    name: 'Caterpillar',
    initialPrice: 814.81,
    dividendYield: 0.76,
    dividendGrowth: 8.24,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  MMM: {
    ticker: 'MMM',
    name: '3M',
    initialPrice: 176.28,
    dividendYield: 1.71,
    dividendGrowth: 6.29,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  IBM: {
    ticker: 'IBM',
    name: 'International Business Machines',
    initialPrice: 223.65,
    dividendYield: 3.01,
    dividendGrowth: 4.99,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  CSCO: {
    ticker: 'CSCO',
    name: 'Cisco Systems',
    initialPrice: 115.99,
    dividendYield: 1.43,
    dividendGrowth: 7.07,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  AMGN: {
    ticker: 'AMGN',
    name: 'Amgen',
    initialPrice: 385.16,
    dividendYield: 2.54,
    dividendGrowth: 6.46,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  UNH: {
    ticker: 'UNH',
    name: 'UnitedHealth Group',
    initialPrice: 414.4,
    dividendYield: 2.16,
    dividendGrowth: 7.34,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  PLD: {
    ticker: 'PLD',
    name: 'Prologis',
    initialPrice: 144.61,
    dividendYield: 2.88,
    dividendGrowth: 5.62,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  }
} as const;
