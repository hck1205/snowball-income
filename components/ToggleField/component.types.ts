import type { ChangeEventHandler } from 'react';

export type ToggleFieldProps = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  helpAriaLabel?: string;
  onHelpClick?: () => void;
  onChange: ChangeEventHandler<HTMLInputElement>;
};
