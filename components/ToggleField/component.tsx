import type { ToggleFieldProps } from './component.types';
import { toToggleId } from './component.utils';
import { ToggleLabel } from './component.styled';

export default function ToggleField({ label, checked, disabled, onChange }: ToggleFieldProps) {
  const id = toToggleId(label);

  return (
    <ToggleLabel htmlFor={id}>
      <input id={id} type="checkbox" aria-label={label} checked={checked} disabled={disabled} onChange={onChange} />
      {label}
    </ToggleLabel>
  );
}
