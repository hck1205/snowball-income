import type { CompareCandidate, TickerCompareModel } from '../utils';

/** 뷰가 그리는 데 필요한 전부. 계산은 `pages/Ticker/utils` 가 이미 끝냈다. */
export type TickerCompareViewModel = {
  readonly model: TickerCompareModel;
  /** 고를 수 있는 전체 목록(이미 고른 것은 호출부가 걸러 준다). */
  readonly candidates: readonly CompareCandidate[];
  /** 상한에 닿았는가 — 추가 컨트롤을 잠그고 사유를 말한다. */
  readonly isAtLimit: boolean;
  /** 비교가 성립하는 최소 개수를 넘었는가. */
  readonly hasEnough: boolean;
  /** 빈 상태에서 눌러 볼 수 있는 추천 조합. */
  readonly suggestions: readonly (readonly string[])[];
};

export type TickerCompareViewProps = {
  viewModel: TickerCompareViewModel;
  onAdd: (ticker: string) => void;
  onRemove: (ticker: string) => void;
  onApplySuggestion: (tickers: readonly string[]) => void;
};
