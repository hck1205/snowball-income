import type { ReactNode } from 'react';

export type PickerDrawerProps = {
  /** 여는 버튼의 `aria-controls`와 짝이 되는 패널 id. */
  id: string;
  isOpen: boolean;
  /** 패널 제목(접근명으로도 쓰인다). */
  title: string;
  /** 닫기 버튼의 접근명. */
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
};
