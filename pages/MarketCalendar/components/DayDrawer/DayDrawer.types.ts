import type { MarketDayCell } from '../../utils';

export type DayDrawerProps = {
  /** 여는 쪽과 짝을 맺는 id(공통 조상에서 `useId`). */
  readonly id: string;
  readonly isOpen: boolean;
  /**
   * 보고 있는 날. 닫힌 상태에서는 `null` 이다.
   *
   * 🔴 **칸 자체를 받는다**(날짜 문자열이 아니라). 달력이 이미 그 날의 거래 상태와 일정을 들고
   * 있으므로, 드로어가 같은 계산을 다시 하면 두 표면이 다른 답을 말할 여지가 생긴다.
   */
  readonly cell: MarketDayCell | null;
  readonly onClose: () => void;
};
