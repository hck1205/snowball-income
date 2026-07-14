import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * primary   — 화면당 하나. 그 화면에서 사용자가 할 "그 일".
 * secondary — 동등한 비중의 대안 액션. 테두리 있는 중립 버튼.
 * ghost     — 밀도 높은 자리(카드 헤더, 툴바)의 3순위 액션. 배경 없음.
 * danger    — 되돌릴 수 없는 파괴적 액션(삭제).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/** sm(32px) — 밀도 높은 툴바용. md(40px) — 기본. 둘 다 히트 영역은 44px로 확장된다. */
export type ButtonSize = 'sm' | 'md';

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 진행 중. 자동으로 비활성화되고 스피너를 보여준다. 레이아웃은 흔들리지 않는다. */
  loading?: boolean;
  fullWidth?: boolean;
  /** 아이콘만 있는 정사각 버튼(닫기 ×, 톱니 등). 라벨이 없으므로 `aria-label`이 필수다. */
  iconOnly?: boolean;
  /** 라벨 앞에 붙는 아이콘. */
  startIcon?: ReactNode;
  children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;
