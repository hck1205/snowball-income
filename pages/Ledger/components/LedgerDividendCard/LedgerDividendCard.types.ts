import type { LedgerDividendModel } from '../../types';

export type LedgerDividendCardProps = {
  model: LedgerDividendModel;
  /** 보고 있는 달의 라벨(`2026년 8월`). 지표 이름과 각주가 "어느 달"인지 말한다. */
  monthLabel: string;
  /** 겹쳐 보기 토글. 🔴 값을 시트에 쓰지 않는다 — 이 콜백이 하는 일은 화면 상태 전환뿐이다. */
  onToggle: (isOn: boolean) => void;
};
