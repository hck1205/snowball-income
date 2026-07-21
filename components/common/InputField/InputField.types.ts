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
