import type { ReactNode } from 'react';

export type HoldingPickerDrawerProps = {
  /** 트리거의 `aria-controls` 와 짝을 맞출 id. */
  id: string;
  isOpen: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
};
