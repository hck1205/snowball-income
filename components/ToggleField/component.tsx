import type { ToggleFieldProps } from './component.types';
import { toToggleId } from './component.utils';
import {
  HelpButton,
  HiddenCheckbox,
  ToggleControl,
  ToggleHeader,
  ToggleLabel,
  ToggleStateText,
  ToggleThumb
} from './component.styled';

export default function ToggleField({ label, checked, disabled, helpAriaLabel, onHelpClick, onChange }: ToggleFieldProps) {
  const id = toToggleId(label);

  return (
    <ToggleLabel htmlFor={id}>
      <ToggleHeader>
        {label}
        {onHelpClick ? (
          <HelpButton
            type="button"
            aria-label={helpAriaLabel ?? `${label} 설명 열기`}
            onClick={(event) => {
              event.preventDefault();
              onHelpClick();
            }}
          >
            ?
          </HelpButton>
        ) : null}
      </ToggleHeader>
      <ToggleControl checked={checked} disabled={disabled}>
        <ToggleStateText checked={checked} disabled={disabled}>
          {checked ? 'ON' : 'OFF'}
        </ToggleStateText>
        <HiddenCheckbox id={id} type="checkbox" aria-label={label} checked={checked} disabled={disabled} onChange={onChange} />
        <ToggleThumb checked={checked} disabled={disabled} />
      </ToggleControl>
    </ToggleLabel>
  );
}
