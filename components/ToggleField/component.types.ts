import type { ChangeEventHandler } from 'react';

export type ToggleFieldProps = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
};
