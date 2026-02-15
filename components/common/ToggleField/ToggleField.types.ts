import type { ChangeEventHandler } from 'react';

export type ToggleFieldProps = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  hideLabel?: boolean;
  controlWidth?: string;
  stateTextColor?: string;
  onText?: string;
  offText?: string;
  helpAriaLabel?: string;
  onHelpClick?: () => void;
  onChange: ChangeEventHandler<HTMLInputElement>;
};
