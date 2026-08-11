import type { TickerModalMode } from '@/shared/types/snowball';

export type TickerModalActionsProps = {
  mode: TickerModalMode;
  /** 엔진이 받아들이지 못하는 드래프트거나 담은 것이 하나도 없으면 생성 버튼을 잠근다. */
  isCreateDisabled: boolean;
  /**
   * 이번에 만들어질 개수(담은 목록 + 담지 않은 유효한 직접 입력). 라벨이 이 숫자를 그대로 쓴다 —
   * 판정은 `resolveCreateTargets` 한 곳이 소유한다.
   */
  createCount: number;
  onDelete: () => void;
  onClose: () => void;
  onSave: () => void;
};
