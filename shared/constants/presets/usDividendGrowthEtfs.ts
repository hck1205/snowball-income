export const US_DIVIDEND_GROWTH_ETFS = {
  SCHD: {
    ticker: 'SCHD',
    name: 'Schwab U.S. Dividend Equity ETF',
    initialPrice: 31.61,
    dividendYield: 3.34,
    dividendGrowth: 6.66,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  VIG: {
    ticker: 'VIG',
    name: 'Vanguard Dividend Appreciation ETF',
    initialPrice: 185,
    dividendYield: 1.9,
    dividendGrowth: 7.6,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  DGRO: {
    ticker: 'DGRO',
    name: 'iShares Core Dividend Growth ETF',
    initialPrice: 73,
    dividendYield: 2.2,
    dividendGrowth: 7.3,
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
    dividendGrowth: 6.9,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  RDVY: {
    ticker: 'RDVY',
    name: 'First Trust Rising Dividend Achievers ETF',
    initialPrice: 55,
    dividendYield: 1.5,
    dividendGrowth: 9.5,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  SDVY: {
    ticker: 'SDVY',
    name: 'First Trust SMID Cap Rising Dividend Achievers ETF',
    initialPrice: 33,
    dividendYield: 1.7,
    dividendGrowth: 9.8,
    expectedTotalReturn: 11.5,
    frequency: 'quarterly' as const
  },
  CGDV: {
    ticker: 'CGDV',
    name: 'Capital Group Dividend Value ETF',
    initialPrice: 31,
    dividendYield: 1.4,
    dividendGrowth: 8.6,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  DLN: {
    ticker: 'DLN',
    name: 'WisdomTree U.S. LargeCap Dividend Fund',
    initialPrice: 130,
    dividendYield: 2.1,
    dividendGrowth: 6.9,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  DON: {
    ticker: 'DON',
    name: 'WisdomTree U.S. MidCap Dividend Fund',
    initialPrice: 47,
    dividendYield: 2.3,
    dividendGrowth: 6.7,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  DES: {
    ticker: 'DES',
    name: 'WisdomTree U.S. SmallCap Dividend Fund',
    initialPrice: 32,
    dividendYield: 2.7,
    dividendGrowth: 5.8,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  /*
   * VSDA — 2026-08-17 합류(사용자 요청). 이 묶음의 기준(배당으로 종목을 고르는 미국 ETF)에 정확히
   * 맞는다: 나스닥 빅토리 배당 액셀러레이터 지수를 따라 **앞으로 배당을 올릴 가능성이 높은** 종목을
   * 고른다 — 과거 증배 연수를 세는 NOBL·VIG 와 고르는 방식이 다르지만 고르는 축은 같다.
   * ⚠ `expectedTotalReturn` 9.5 는 같은 성격의 이웃(VIG·DGRO)과 같은 값이다 — 저배당·고성장 쪽이라
   *   파생 성장률이 이 파일에서 가장 높은 편에 선다.
   * 🔴 **월배당이다**(2026-08-17 실측 — `inferFrequency` 가 12개월 지급을 확인했고 `ticker:paydates`
   *   도 지급월 [1..12] 로 맞췄다). 이 파일의 월배당은 DGRW·DIVG 와 함께 셋이다.
   *   처음에 분기로 짐작해 넣었다가 실측에서 뒤집혔다:
   *   나머지 배당성장 ETF 가 전부 분기라고 해서 새 종목도 분기인 것이 아니다. 주기는 재투자 복리
   *   횟수를 바꾸는 입력이라(`paymentsPerYearMap`) 짐작이 곧 계산 오차다.
   * 값의 출처: 아래 셋 다 2026-08-17 실측(`ticker:refresh`, Yahoo).
   */
  VSDA: {
    ticker: 'VSDA',
    name: 'VictoryShares Dividend Accelerator ETF',
    initialPrice: 60.36,
    dividendYield: 2.4,
    dividendGrowth: 7.1,
    expectedTotalReturn: 9.5,
    frequency: 'monthly' as const
  },
  /* ── 2026-08-18 사용자 요청 3종. 셋 다 "앞으로 배당을 올릴 종목"을 고르는 스크린이라 이 파일 소속이다. ── */
  /* 액티브 운용(지수 추종이 아니다)이지만 고르는 축은 같다 — 배당을 늘려 온 대형 우량주. */
  TDVG: {
    ticker: 'TDVG',
    name: 'T. Rowe Price Dividend Growth ETF',
    initialPrice: 50.38,
    dividendYield: 0.95,
    dividendGrowth: 8.55,
    expectedTotalReturn: 9.5,
    frequency: 'quarterly' as const
  },
  DIVG: {
    ticker: 'DIVG',
    name: 'Invesco S&P 500 High Dividend Growers ETF',
    initialPrice: 38.71,
    dividendYield: 2.91,
    dividendGrowth: 6.09,
    expectedTotalReturn: 9,
    frequency: 'monthly' as const
  },
  /* ⚠ 밸류라인 **랭킹**으로 고르고 동일가중한다 — 배당률 자체는 선정 기준이 아니라 문턱이다. */
  FVD: {
    ticker: 'FVD',
    name: 'First Trust Value Line Dividend Index Fund',
    initialPrice: 50.53,
    dividendYield: 2.21,
    dividendGrowth: 6.29,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  }
} as const;
