import type { LedgerPartialFailureModel } from '../../types';

export type LedgerFailureListProps = {
  model: LedgerPartialFailureModel;
  /** 행 id → 재시도까지 남은 초(429). 페이지 전체를 도는 타이머 1개가 만든다. */
  retryCountdowns: ReadonlyMap<string, number>;
  onRetry: (id: string) => void;
  onRetryAll: () => void;
};
