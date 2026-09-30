import type { OverlapCandidate } from '../../EtfMixPage.types';

export type OverlapPickerProps = {
  readonly listStatus: 'loading' | 'ready' | 'error';
  readonly query: string;
  readonly candidates: readonly OverlapCandidate[];
  readonly isSearching: boolean;
  readonly isAtLimit: boolean;
  /** 바구니에 담긴 ETF 의 종목 색 — 목록에서도 같은 색 점을 단다. */
  readonly seriesOf: (ticker: string) => string;
  readonly onQueryChange: (query: string) => void;
  readonly onSubmitQuery: () => void;
  readonly onAdd: (ticker: string) => void;
  readonly onRemove: (ticker: string) => void;
};
