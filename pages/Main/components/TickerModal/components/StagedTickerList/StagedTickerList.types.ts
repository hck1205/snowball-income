import type { StagedTicker } from '../../TickerModal.utils';

export type StagedTickerListProps = {
  /** 생성 대기 목록. 비어 있으면 이 컴포넌트는 스스로 아무것도 그리지 않는다. */
  staged: readonly StagedTicker[];
  onRemove: (key: string) => void;
  onClear: () => void;
};
