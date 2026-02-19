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
