import type { MouseEventHandler, ReactNode } from 'react';

/**
 * 칩의 색 계열(§4.6 공용 배지 규칙).
 *  - neutral:   기본. 선택 여부만 색으로 말한다(선택=brand — 기존 학습 보존).
 *  - accent:    성장·달성·증가 계열 정보 배지 (오로라 teal 틴트).
 *  - accentAlt: 목표·추천·하이라이트 계열 정보 배지 (오로라 violet 틴트).
 * **부호 있는 숫자에는 쓰지 마라** — 숫자의 색은 up/down(tone) 어휘 소유다.
 */
export type ChipVariant = 'neutral' | 'accent' | 'accentAlt';

export type ChipProps = {
  children: ReactNode;
  /** 선택된 상태(브랜드 톤). variant보다 우선한다. */
  selected?: boolean;
  /** 색 계열. 기본 neutral — 기존 사용처는 시각 변화 없음. */
  variant?: ChipVariant;
  disabled?: boolean;
  /** 칩 본체 클릭. 주면 `<button>`, 안 주면 `<span>`으로 렌더된다(장식용 칩). */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** 제거(×) 핸들러. 주면 칩 오른쪽에 제거 버튼이 붙는다. */
  onRemove?: () => void;
  /** 제거 버튼의 접근성 이름. 없으면 `"{children} 제거"`. */
  removeAriaLabel?: string;
  title?: string;
};
