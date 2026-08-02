/**
 * 2026-08-02 확충분(대가 13F 최다 겹침 대형 성장주 6종): `initialPrice`·`dividendYield`·`frequency`
 * 는 갱신 파이프라인과 같은 경로(Yahoo chart API → `scripts/tickerRefresh/derive` 의
 * `computeTtmYield`·`inferFrequency`)로 2026-08-02 에 실측했다. `expectedTotalReturn`만 큐레이터의
 * 가정이고 `dividendGrowth`는 파생값이다.
 *
 * 이 6종은 워런 버핏·켄 피셔·레이 달리오·빌 애크먼·데이비드 테퍼·리루·스탠리 드러켄밀러 등 13F
 * 대상 13명 중 다수가 공통으로 보유한 대형 성장주다(AMZN·GOOGL은 사실상 전원 겹침).
 *
 * ⚠ AMZN·TSLA는 배당을 지급하지 않는다(`frequency: 'none'`, `dividendYield: 0`). 이 프리셋에 있는
 * 이유는 배당이 아니라 자본 성장과 "대가 보유 매칭"이다 — `AI_INFRA_ETFS_AND_STOCKS.ANET`과 같은
 * 정합 모델 처리(정합 모델에서 `dividendGrowth`는 곧 `expectedTotalReturn` 전체와 같다).
 */
export const MEGA_CAP_GROWTH_STOCKS = {
  AAPL: {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    initialPrice: 308.91,
    dividendYield: 0.34,
    dividendGrowth: 10.66,
    expectedTotalReturn: 11,
    frequency: 'quarterly' as const
  },
  MSFT: {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    initialPrice: 464.72,
    dividendYield: 0.77,
    dividendGrowth: 11.23,
    expectedTotalReturn: 12,
    frequency: 'quarterly' as const
  },
  GOOGL: {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    initialPrice: 356.13,
    dividendYield: 0.24,
    dividendGrowth: 11.76,
    expectedTotalReturn: 12,
    frequency: 'quarterly' as const
  },
  AMZN: {
    ticker: 'AMZN',
    name: 'Amazon.com, Inc.',
    initialPrice: 271.58,
    dividendYield: 0,
    dividendGrowth: 13,
    expectedTotalReturn: 13,
    frequency: 'none' as const
  },
  META: {
    ticker: 'META',
    name: 'Meta Platforms, Inc.',
    initialPrice: 556.71,
    dividendYield: 0.38,
    dividendGrowth: 12.62,
    expectedTotalReturn: 13,
    frequency: 'quarterly' as const
  },
  TSLA: {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    initialPrice: 311.21,
    dividendYield: 0,
    dividendGrowth: 14,
    expectedTotalReturn: 14,
    frequency: 'none' as const
  }
} as const;
