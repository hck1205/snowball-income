import type { MarketMonthViewModel } from '../../utils';

export type MonthGridProps = {
  readonly month: MarketMonthViewModel;
  /** 이전/다음 달로 옮긴다. `delta` 는 −1 또는 +1. */
  readonly onShift: (delta: number) => void;
  /** "이번 달"로 되돌린다. 지금이 이번 달이면 버튼을 그리지 않는다. */
  readonly onReset: () => void;
  readonly canReset: boolean;
};
