import type { ReactElement, ReactNode } from 'react';

export interface TooltipProps {
  /** 말풍선 내용 — 짧은 한 줄 텍스트를 권장한다. */
  content: ReactNode;
  /**
   * 단일 트리거 요소. 열려 있는 동안 `aria-describedby`가 주입되므로
   * 포커스 가능한 요소(button 등)를 넘겨야 키보드로도 열 수 있다.
   */
  children: ReactElement;
}
