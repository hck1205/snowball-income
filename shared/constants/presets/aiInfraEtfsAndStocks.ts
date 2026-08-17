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
  /**
   * 인텔 (2026-08-17 추가). 배당을 **중단한** 종목이라 위 ANET 과 같은 형태(`dividendYield: 0`,
   * `frequency: 'none'`)로 들어간다 — 마지막 지급이 2024-08-07 이고 그 뒤 2년째 지급이 없다
   * (2026-08-17 Yahoo 실측: 주가 102.5, TTM 배당률 산출 불가).
   *
   * ## 🔴 `wellKnownDividendStocks`(인지도 높은 배당주)에는 일부러 넣지 않았다
   *
   * 2026-08-14 확충(`9ee8c55`)에서 **의도적으로 걸러진 종목**이다 — 그 묶음의 선정 기준이
   * "인지도 + **배당 지급 사실**"이라 배당을 중단한 회사는 자격이 없다. 그 결정을 뒤집지 않으면서도
   * 인텔을 찾을 수 있게 하는 자리가 여기다: 이 묶음의 근거는 배당이 아니라 **반도체·AI 인프라**이고,
   * 배당률 0% 인 ANET 이 이미 같은 이유로 앉아 있다.
   *
   * ## `expectedTotalReturn` 을 8% 로 둔 이유 — 섹터 평균(SMH 12%)을 주지 않는다
   *
   * 12% 를 적으면 "인텔이 반도체 지수만큼 한다"는 **주장**이 된다. 파운드리 전환 중인 회사에 대해
   * 이 앱이 할 주장이 아니다. 그래서 `wellKnownDividendStocks` 가 쓰는 **광의의 주식 기대수익률
   * 8% 균일값**을 그대로 쓴다 — 특정 회사의 미래를 주장하지 않는 모델링 가정이고, 사용자가 화면에서
   * 바로 고친다. 5년 배당 CAGR 로 유도하는 길은 이 종목에서 특히 못 쓴다(그 파일 머리말이 든 예가
   * 바로 "인텔 14% — 삭감한 해에도 양수"다).
   *
   * ⚠ 배당이 0 이므로 이 8% 는 **전부 주가 성장**으로 실현된다(정합 모델에서 `dividendGrowth` 가
   *   곧 주가 성장률이다). 배당 재투자 시뮬레이션에서는 현금흐름이 0 인 종목으로 계산된다.
   */
  INTC: {
    ticker: 'INTC',
    name: 'Intel Corporation',
    initialPrice: 102.5,
    dividendYield: 0,
    dividendGrowth: 8,
    expectedTotalReturn: 8,
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
