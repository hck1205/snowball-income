/**
 * 섹터 주식 ETF (2026-08-17 신설 IYK · 2026-08-18 사용자 요청으로 8종 확충).
 *
 * 왜 별도 파일인가: 이 레포의 ETF 묶음은 **고르는 기준**으로 갈라져 있다 — 코어 지수(`coreIndexEtfs`)·
 * 배당 스크리닝(`usDividendGrowthEtfs`·`usHighDividendEtfs`)·옵션 인컴(`optionIncomeEtfs`)·
 * 리츠(`reitEtfs`)·지역(`japanEquityEtfs`·`asiaPacificEquityEtfs`)·테마(`thematicEquityEtfs`).
 * 섹터 ETF 는 그중 어디에도 속하지 않는다: 배당으로 고르지 않고(섹터 안 전 종목을 시가총액 비중으로
 * 담는다), 코어 자리도 아니다(한 산업에 집중한다).
 *
 * ⚠ **테마 ETF 와 섞지 마라.** 섹터는 GICS 같은 **표준 산업 분류**를 따르므로 같은 섹터를 건 두 펀드가
 *   거의 같은 종목을 담는다(XLP ↔ VDC, XLK ↔ VGT). 테마는 분류가 아니라 이야기라 그렇지 않다 —
 *   그래서 파일이 다르다(`thematicEquityEtfs.ts` 머리말).
 *
 * ## 값의 출처 — 2026-08-17/18 실측(`ticker:refresh`, Yahoo chart API)
 * `initialPrice`·`dividendYield`·`frequency` 는 갱신 파이프라인이 채우고 자동 갱신된다.
 *
 * 🔴 `expectedTotalReturn` 은 **섹터의 성격별로 한 값씩** 쓴다(종목마다 다르게 잡지 않는다 —
 *    `wellKnownDividendStocks.ts` 머리말):
 *
 *      방어(필수소비재·헬스케어)  8 ~ 8.5   이익이 경기와 무관해 안정적인 대신 성장이 느리다
 *      경기민감(산업재)           9         S&P 500 대역
 *      기술                      10 ~ 10.5  성장 대역(코어의 VUG·QQQ 와 같은 자리)
 *
 *    ⚠ 같은 섹터의 두 펀드는 **같은 ETR** 을 받는다(XLP = VDC = 8). 운용보수 차이로 미래 수익률을
 *      가르는 것은 이 모델이 표현할 수 있는 정밀도를 넘는다.
 */
export const SECTOR_EQUITY_ETFS = {
  /* ── 필수소비재 ─────────────────────────────────────────────────────────────── */
  IYK: {
    ticker: 'IYK',
    name: 'iShares U.S. Consumer Staples ETF',
    initialPrice: 74.22,
    dividendYield: 2.56,
    dividendGrowth: 5.44,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  XLP: {
    ticker: 'XLP',
    name: 'Consumer Staples Select Sector SPDR Fund',
    initialPrice: 84.78,
    dividendYield: 2.59,
    dividendGrowth: 5.41,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  VDC: {
    ticker: 'VDC',
    name: 'Vanguard Consumer Staples ETF',
    initialPrice: 230.32,
    dividendYield: 2.08,
    dividendGrowth: 5.92,
    expectedTotalReturn: 8,
    frequency: 'quarterly' as const
  },
  /* ── 헬스케어 ──────────────────────────────────────────────────────────────── */
  XLV: {
    ticker: 'XLV',
    name: 'Health Care Select Sector SPDR Fund',
    initialPrice: 167.48,
    dividendYield: 1.51,
    dividendGrowth: 6.99,
    expectedTotalReturn: 8.5,
    frequency: 'quarterly' as const
  },
  /* ── 산업재 ───────────────────────────────────────────────────────────────── */
  XLI: {
    ticker: 'XLI',
    name: 'Industrial Select Sector SPDR Fund',
    initialPrice: 186.64,
    dividendYield: 1.1,
    dividendGrowth: 7.9,
    expectedTotalReturn: 9,
    frequency: 'quarterly' as const
  },
  /* ── 기술 ────────────────────────────────────────────────────────────────────
     ⚠ IGV 는 소프트웨어 **하위 산업**만 담아 셋보다 더 좁고, IXN 은 미국 밖까지 담아 더 넓다.
       그래도 고르는 축은 같은 산업 분류이므로 이 파일에 함께 둔다. */
  XLK: {
    ticker: 'XLK',
    name: 'Technology Select Sector SPDR Fund',
    initialPrice: 191.7,
    dividendYield: 0.41,
    dividendGrowth: 10.09,
    expectedTotalReturn: 10.5,
    frequency: 'quarterly' as const
  },
  /* 🔴 **2026-04-21 에 8:1 분할했다**(야후 split 이벤트로 확인). 갱신 파이프라인의 ±50% 가드가
     막아 준 덕에 알았고, 비율은 짐작하지 않고 조회했다. 같은 날 MGK 도 5:1 로 쪼갰다(그 파일 주석).
     ⚠ XLK 도 2025-12-05 에 2:1 분할했다 — 이 파일의 기술 3종은 최근 전부 액면이 바뀌었다. */
  VGT: {
    ticker: 'VGT',
    name: 'Vanguard Information Technology ETF',
    initialPrice: 123.28,
    dividendYield: 0.35,
    dividendGrowth: 10.15,
    expectedTotalReturn: 10.5,
    frequency: 'quarterly' as const
  },
  IGV: {
    ticker: 'IGV',
    name: 'iShares Expanded Tech-Software Sector ETF',
    initialPrice: 102.65,
    dividendYield: 0.02,
    dividendGrowth: 10.48,
    expectedTotalReturn: 10.5,
    frequency: 'annual' as const
  },
  IXN: {
    ticker: 'IXN',
    name: 'iShares Global Tech ETF',
    initialPrice: 145.2,
    dividendYield: 0.75,
    dividendGrowth: 9.25,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  }
} as const;
