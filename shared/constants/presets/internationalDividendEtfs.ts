export const INTERNATIONAL_DIVIDEND_ETFS = {
  VIGI: {
    ticker: 'VIGI',
    name: 'Vanguard International Dividend Appreciation ETF',
    initialPrice: 76,
    dividendYield: 1.9,
    dividendGrowth: 7.1,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  VYMI: {
    ticker: 'VYMI',
    name: 'Vanguard International High Dividend Yield ETF',
    initialPrice: 70,
    dividendYield: 4.0,
    dividendGrowth: 4,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  SCHY: {
    ticker: 'SCHY',
    name: 'Schwab International Dividend Equity ETF',
    initialPrice: 24,
    dividendYield: 4.2,
    dividendGrowth: 4.3,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  IDV: {
    ticker: 'IDV',
    name: 'iShares International Select Dividend ETF',
    initialPrice: 29,
    dividendYield: 6.0,
    dividendGrowth: 1.5,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  },
  DWX: {
    ticker: 'DWX',
    name: 'SPDR S&P International Dividend ETF',
    initialPrice: 34,
    dividendYield: 5.5,
    dividendGrowth: 2,
    expectedTotalReturn: 7.5,
    frequency: 'quarterly' as const
  },
  /* ── 2026-08-18 사용자 요청 2종. 미국 밖 종목을 **배당 기준으로 고르는** 스크린이라 이 파일 소속이다.
       (같은 요청의 VPL·BBAX·ASEA 는 배당이 아니라 지역으로 고르므로 `asiaPacificEquityEtfs.ts` 에 있다.) ── */
  IGRO: {
    ticker: 'IGRO',
    name: 'iShares International Dividend Growth ETF',
    initialPrice: 92.09,
    dividendYield: 2.63,
    dividendGrowth: 5.87,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  IQDG: {
    ticker: 'IQDG',
    name: 'WisdomTree International Quality Dividend Growth Fund',
    initialPrice: 44.7,
    dividendYield: 2.31,
    dividendGrowth: 6.19,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  }
} as const;
