/**
 * SEO 랜딩 허브(`/ticker/all`)에서 티커를 묶는 카테고리 라벨.
 * 티커 콘텐츠는 여러 카테고리에 동시에 속할 수 있다(예: 배당성장이면서 코어 지수 성격도 있는 경우).
 * 새 카테고리가 필요하면 이 맵에 한 줄 추가한다 — `TickerCategoryId`는 여기서 파생되므로
 * 다른 파일을 손댈 필요가 없다.
 */
export const TICKER_CATEGORY_LABEL = {
  'dividend-growth': '배당성장 ETF',
  'high-dividend': '고배당 ETF',
  'covered-call': '커버드콜·옵션인컴 ETF',
  reit: '리츠(REITs)',
  international: '해외 배당 ETF',
  'core-index': '코어 지수 ETF',
  'dividend-stock': '개별 배당주'
} as const;

export type TickerCategoryId = keyof typeof TICKER_CATEGORY_LABEL;
