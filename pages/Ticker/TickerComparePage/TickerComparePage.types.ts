import type { CompareCandidate, TickerCompareModel } from '../utils';
import type { ComparePresetPreview } from './TickerComparePage.utils';

/** 뷰가 그리는 데 필요한 전부. 계산은 `pages/Ticker/utils` 가 이미 끝냈다. */
export type TickerCompareViewModel = {
  readonly model: TickerCompareModel;
  /** 고를 수 있는 전체 목록(이미 고른 것은 호출부가 걸러 준다). */
  readonly candidates: readonly CompareCandidate[];
  /** 상한에 닿았는가 — 추가 컨트롤을 잠그고 사유를 말한다. */
  readonly isAtLimit: boolean;
  /** 비교가 성립하는 최소 개수를 넘었는가. */
  readonly hasEnough: boolean;
  /**
   * 빈 상태에서 눌러 볼 수 있는 예시 조합.
   *
   * 라벨만 있던 종전(`ComparePreset`)에서 **1년 커버리지 미리보기**(`coveredCount`·`monthFlags`)와
   * 카드 레일 색까지 담은 `ComparePresetPreview` 로 올라갔다 — 열 개 중 무엇을 누를지 정하는
   * 근거가 라벨 한 줄뿐이면 목록이 길어질수록 아무 단서도 주지 못한다.
   */
  readonly suggestions: readonly ComparePresetPreview[];
};

export type TickerCompareViewProps = {
  viewModel: TickerCompareViewModel;
  onAdd: (ticker: string) => void;
  onRemove: (ticker: string) => void;
  onApplySuggestion: (tickers: readonly string[]) => void;
  /** "이 종목으로 계산" — 고른 종목 하나를 시뮬레이터로 보낸다(프리필 + 계측은 컨테이너가 한다). */
  onSimulate: (ticker: string) => void;
};
