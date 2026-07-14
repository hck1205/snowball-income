import type { MouseEventHandler, ReactNode } from 'react';

export type ChipProps = {
  children: ReactNode;
  /** 선택된 상태(브랜드 톤). */
  selected?: boolean;
  disabled?: boolean;
  /** 칩 본체 클릭. 주면 `<button>`, 안 주면 `<span>`으로 렌더된다(장식용 칩). */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** 제거(×) 핸들러. 주면 칩 오른쪽에 제거 버튼이 붙는다. */
  onRemove?: () => void;
  /** 제거 버튼의 접근성 이름. 없으면 `"{children} 제거"`. */
  removeAriaLabel?: string;
  title?: string;
};
