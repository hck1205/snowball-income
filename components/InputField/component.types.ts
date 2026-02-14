import type { ChangeEventHandler } from 'react';
import type { Frequency } from '@/shared/types';

export type InputFieldProps = {
  label: string;
  value: string | number;
  type?: 'text' | 'number';
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export type SelectFieldProps = {
  label: string;
  value: Frequency;
  disabled?: boolean;
  onChange: ChangeEventHandler<HTMLSelectElement>;
};
