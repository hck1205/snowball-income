import type { StockExposure } from '@/shared/lib/etfOverlap';

export type OverlapStocksProps = {
  /** `analyzeBasket` 의 정렬 그대로(겹치는 종목 먼저). */
  readonly stocks: readonly StockExposure[];
  /** 보유 종목을 받은 ETF(바구니 순서) — 행마다 이 순서로 색 점을 찍는다. */
  readonly tickers: readonly string[];
  readonly seriesOf: (ticker: string) => string;
};
