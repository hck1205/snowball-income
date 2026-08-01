/**
 * AI 인프라 ETF·개별주.
 *
 * ⚠ **AVGO·TSM·ASML·ETN·VRT 5종은 `semiconductorDividendGrowthPortfolio.ts` 도 이 정의를 참조한다**
 * (그 파일 상단 주석 참조). 즉 여기 값을 고치면 두 프리셋에 동시에 반영된다 — 그게 의도다.
 * 반도체 쪽만 다른 값을 주고 싶어지면 그건 "티커 하나에 정의 둘"로 되돌아가는 것이니 하지 마라.
 */
export const AI_INFRA_ETFS_AND_STOCKS = {
  SMH: {
    ticker: 'SMH',
    name: 'VanEck Semiconductor ETF',
    initialPrice: 220,
    dividendYield: 0.9,
    dividendGrowth: 11.1,
    expectedTotalReturn: 12,
    frequency: 'quarterly' as const
  },
  AIQ: {
    ticker: 'AIQ',
    name: 'Global X Artificial Intelligence & Technology ETF',
    initialPrice: 38,
    dividendYield: 0.3,
    dividendGrowth: 10.7,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  SRVR: {
    ticker: 'SRVR',
    name: 'Pacer Data & Infrastructure Real Estate ETF',
    initialPrice: 32,
    dividendYield: 2.4,
    dividendGrowth: 7.6,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  },
  VRT: {
    ticker: 'VRT',
    name: 'Vertiv Holdings Co',
    initialPrice: 90,
    dividendYield: 0.3,
    dividendGrowth: 15.7,
    expectedTotalReturn: 16,
    frequency: 'quarterly' as const
  },
  ETN: {
    ticker: 'ETN',
    name: 'Eaton Corporation',
    initialPrice: 320,
    dividendYield: 1.1,
    dividendGrowth: 11.9,
    expectedTotalReturn: 13,
    frequency: 'quarterly' as const
  },
  /**
   * 배당을 지급하지 않는 성장주. 이 프리셋에 있는 이유는 배당이 아니라 자본 성장이다
   * (`expectedTotalReturn` 14% 가 전부 주가 성장으로 실현된다 — 정합 모델에서
   * `dividendGrowth` 는 곧 주가 성장률이므로 이 값은 0 이 아니라 14 가 맞다).
   *
   * `frequency: 'none'` = "지급 주기 데이터가 없다"가 아니라 **"지급이 없다"**.
   * 구 값 `'quarterly'` 는 계산상 무해했지만(0 에 무엇을 곱해도 0), 화면이 이 종목을
   * "데이터 준비 중"으로 분류하게 만들었다.
   */
  ANET: {
    ticker: 'ANET',
    name: 'Arista Networks',
    initialPrice: 290,
    dividendYield: 0,
    dividendGrowth: 14,
    expectedTotalReturn: 14,
    frequency: 'none' as const
  },
  NVDA: {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    initialPrice: 900,
    dividendYield: 0.03,
    dividendGrowth: 17.97,
    expectedTotalReturn: 18,
    frequency: 'quarterly' as const
  },
  AVGO: {
    ticker: 'AVGO',
    name: 'Broadcom Inc',
    initialPrice: 1300,
    dividendYield: 1.6,
    dividendGrowth: 13.4,
    expectedTotalReturn: 15,
    frequency: 'quarterly' as const
  },
  TSM: {
    ticker: 'TSM',
    name: 'Taiwan Semiconductor Manufacturing Company',
    initialPrice: 150,
    dividendYield: 1.4,
    dividendGrowth: 11.6,
    expectedTotalReturn: 13,
    frequency: 'quarterly' as const
  },
  ASML: {
    ticker: 'ASML',
    name: 'ASML Holding NV',
    initialPrice: 950,
    dividendYield: 0.9,
    dividendGrowth: 13.1,
    expectedTotalReturn: 14,
    frequency: 'quarterly' as const
  },
  CEG: {
    ticker: 'CEG',
    name: 'Constellation Energy Corporation',
    initialPrice: 200,
    dividendYield: 0.7,
    dividendGrowth: 11.3,
    expectedTotalReturn: 12,
    frequency: 'quarterly' as const
  },
  NEE: {
    ticker: 'NEE',
    name: 'NextEra Energy',
    initialPrice: 65,
    dividendYield: 2.6,
    dividendGrowth: 7.4,
    expectedTotalReturn: 10,
    frequency: 'quarterly' as const
  }
} as const;
