import type { PairOverlap } from '@/shared/lib/etfOverlap';

export type OverlapMatrixProps = {
  /** 보유 종목을 받은 ETF(바구니 순서). 둘 미만이면 안내만 보인다. */
  readonly tickers: readonly string[];
  readonly pairs: readonly PairOverlap[];
  readonly seriesOf: (ticker: string) => string;
};
