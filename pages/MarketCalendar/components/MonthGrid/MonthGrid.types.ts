import type { MarketMonthViewModel } from '../../utils';

export type MonthGridProps = {
  readonly month: MarketMonthViewModel;
  /** 이전/다음 달로 옮긴다. `delta` 는 −1 또는 +1. */
  readonly onShift: (delta: number) => void;
  /** "이번 달"로 되돌린다. 지금이 이번 달이면 버튼을 그리지 않는다. */
  readonly onReset: () => void;
  readonly canReset: boolean;
  /**
   * 날짜 칸을 눌렀을 때(2026-08-05 신설). 인자는 `YYYY-MM-DD`.
   *
   * 🔴 격자는 **무엇을 열지 모른다** — 드로어를 소유한 페이지가 그 답을 갖는다. 여기서 드로어를
   * 직접 열면 이 부품이 페이지 상태에 묶여 다른 화면에서 못 쓰게 된다.
   * ⚠ 칸은 **일정이 없는 날에도** 누를 수 있다. "이 날은 아무 일정도 없다"는 것도 답이고,
   *   일정이 있는 칸만 눌리면 사용자는 어떤 칸이 눌리는지 매번 시험해야 한다.
   */
  readonly onSelectDay: (date: string) => void;
  /** 지금 드로어가 열려 있는 날짜(`YYYY-MM-DD`). 그 칸이 눌린 상태로 보인다. */
  readonly selectedDate: string | null;
};
