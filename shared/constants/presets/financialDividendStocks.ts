/**
 * 2026-08-02 확충분(대형 금융주 18종): `initialPrice`·`dividendYield`·`frequency`는 갱신 파이프라인과
 * 같은 경로(Yahoo chart API → `scripts/tickerRefresh/derive`)로 2026-08-02 에 실측했다.
 * `expectedTotalReturn`만 큐레이터의 가정이고 `dividendGrowth`는 파생값이다.
 *
 * 은행(JPM·BAC·WFC·C·MS·GS·USB)·카드/소비자금융(AXP·COF·ALLY)·보험(CB·AFL)·신용평가/데이터(MCO·SPGI)·
 * 결제망(V·MA)·자산운용(TROW·BEN) — 버핏(AXP)·피셔(GS·JPM 등)·달리오(다수)·데일리 저널(WFC·BAC·USB)
 * 13F 보유분과 대부분 겹친다.
 */
export const FINANCIAL_DIVIDEND_STOCKS = {
  JPM: {
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    initialPrice: 351.79,
    dividendYield: 1.71,
    dividendGrowth: 8.29,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  BAC: {
    ticker: 'BAC',
    name: 'Bank of America Corporation',
    initialPrice: 61.95,
    dividendYield: 1.81,
    dividendGrowth: 7.69,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  WFC: {
    ticker: 'WFC',
    name: 'Wells Fargo & Company',
    initialPrice: 86.45,
    dividendYield: 2.08,
    dividendGrowth: 7.42,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  C: {
    ticker: 'C',
    name: 'Citigroup Inc.',
    initialPrice: 132.45,
    dividendYield: 1.81,
    dividendGrowth: 7.69,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  MS: {
    ticker: 'MS',
    name: 'Morgan Stanley',
    initialPrice: 210.42,
    dividendYield: 1.97,
    dividendGrowth: 8.03,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  GS: {
    ticker: 'GS',
    name: 'The Goldman Sachs Group, Inc.',
    initialPrice: 1018.38,
    dividendYield: 1.67,
    dividendGrowth: 8.33,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  AXP: {
    ticker: 'AXP',
    name: 'American Express Company',
    initialPrice: 336.25,
    dividendYield: 1.05,
    dividendGrowth: 9.45,
    expectedTotalReturn: 10.5,
    frequency: 'quarterly' as const
  },
  COF: {
    ticker: 'COF',
    name: 'Capital One Financial Corporation',
    initialPrice: 209.01,
    dividendYield: 1.44,
    dividendGrowth: 8.06,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  ALLY: {
    ticker: 'ALLY',
    name: 'Ally Financial Inc.',
    initialPrice: 43.33,
    dividendYield: 2.77,
    dividendGrowth: 6.23,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  USB: {
    ticker: 'USB',
    name: 'U.S. Bancorp',
    initialPrice: 63.01,
    dividendYield: 3.3,
    dividendGrowth: 5.7,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  CB: {
    ticker: 'CB',
    name: 'Chubb Limited',
    initialPrice: 350.68,
    dividendYield: 0.57,
    dividendGrowth: 8.43,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  MCO: {
    ticker: 'MCO',
    name: "Moody's Corporation",
    initialPrice: 478.38,
    dividendYield: 0.82,
    dividendGrowth: 11.18,
    expectedTotalReturn: 12,
    frequency: 'quarterly' as const
  },
  SPGI: {
    ticker: 'SPGI',
    name: 'S&P Global Inc.',
    initialPrice: 411.93,
    dividendYield: 0.89,
    dividendGrowth: 11.11,
    expectedTotalReturn: 12,
    frequency: 'quarterly' as const
  },
  V: {
    ticker: 'V',
    name: 'Visa Inc.',
    initialPrice: 366.13,
    dividendYield: 0.71,
    dividendGrowth: 12.29,
    expectedTotalReturn: 13,
    frequency: 'quarterly' as const
  },
  MA: {
    ticker: 'MA',
    name: 'Mastercard Incorporated',
    initialPrice: 573.1,
    dividendYield: 0.59,
    dividendGrowth: 12.41,
    expectedTotalReturn: 13,
    frequency: 'quarterly' as const
  },
  AFL: {
    ticker: 'AFL',
    name: 'Aflac Incorporated',
    initialPrice: 127.48,
    dividendYield: 1.87,
    dividendGrowth: 7.13,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  TROW: {
    ticker: 'TROW',
    name: 'T. Rowe Price Group, Inc.',
    initialPrice: 111.75,
    dividendYield: 4.6,
    dividendGrowth: 3.9,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  BEN: {
    ticker: 'BEN',
    name: 'Franklin Resources, Inc.',
    initialPrice: 33.86,
    dividendYield: 3.87,
    dividendGrowth: 4.13,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  }
} as const;
