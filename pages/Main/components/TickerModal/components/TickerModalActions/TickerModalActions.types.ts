import type { TickerModalMode } from '@/shared/types/snowball';

export type TickerModalActionsProps = {
  mode: TickerModalMode;
  /** 엔진이 받아들이지 못하는 직접 입력 드래프트면 생성 버튼을 잠근다. */
  isCreateDisabled: boolean;
  onDelete: () => void;
  onClose: () => void;
  onSave: () => void;
};
