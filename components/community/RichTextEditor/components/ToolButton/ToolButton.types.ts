import type { ReactNode } from 'react';

export type ToolButtonProps = {
  label: string;
  shortcut?: string;
  /** 토글형 버튼만 넘긴다. 삽입/이력처럼 상태가 없는 버튼은 생략해 aria-pressed를 붙이지 않는다. */
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};
