import type { ChangeEventHandler } from 'react';
import type { Frequency } from '@/shared/types';

export type InputFieldProps = {
  label: string;
  value: string | number;
  type?: 'text' | 'number';
  helpAriaLabel?: string;
  onHelpClick?: () => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
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
