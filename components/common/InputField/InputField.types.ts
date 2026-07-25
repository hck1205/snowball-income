import type { ChangeEventHandler, FocusEventHandler } from 'react';
import type { Frequency } from '@/shared/types';

export type InputFieldProps = {
  label: string;
  value: string | number;
  type?: 'text' | 'number' | 'date';
  helpAriaLabel?: string;
  onHelpClick?: () => void;
  disabled?: boolean;
  placeholder?: string;
  /** 입력값 앞에 붙는 단위 기호(예: 달러 '$'). 순수 표시용 — 값에는 포함되지 않는다. */
  prefix?: string;
  /** 입력값 뒤에 붙는 단위 기호(예: 퍼센트 '%'). 순수 표시용 — 값에는 포함되지 않는다. */
  suffix?: string;
  /**
   * 입력 아래 한 줄 보조 표기(예: 달러 환산 `≈ $1,014`).
   *
   * **입력값 자체는 바꾸지 않는다** — 읽기 전용 참고 정보다. 빈 값/undefined 면 줄 자체를 렌더하지
   * 않아 레이아웃이 흔들리지 않는다. 입력과 연결(`aria-describedby`)해 스크린리더도 함께 읽는다.
   */
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export type SelectFieldProps = {
  label: string;
  value: Frequency;
  helpAriaLabel?: string;
  onHelpClick?: () => void;
  disabled?: boolean;
  onChange: ChangeEventHandler<HTMLSelectElement>;
};
