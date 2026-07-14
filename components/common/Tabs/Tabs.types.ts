import type { ReactNode } from 'react';

export type TabItem = {
  id: string;
  label: ReactNode;
  disabled?: boolean;
};

export type TabsProps = {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** `role="tablist"`의 접근성 이름. 필수 — 탭 묶음이 뭘 고르는 건지 말해줘야 한다. */
  ariaLabel: string;
};
