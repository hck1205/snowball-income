import type { ToggleFieldProps } from './ToggleField.types';
import { toToggleId } from './ToggleField.utils';
import {
  HelpButton,
  HiddenCheckbox,
  ToggleControl,
  ToggleHeader,
  ToggleLabel,
  ToggleStateText,
  ToggleThumb
} from './ToggleField.styled';

export default function ToggleField({
  label,
  checked,
  disabled,
  hideLabel,
  controlWidth,
  stateTextColor,
  onText,
  offText,
  helpAriaLabel,
  onHelpClick,
  onChange
}: ToggleFieldProps) {
  const id = toToggleId(label);

  return (
    <ToggleLabel htmlFor={id}>
      {hideLabel ? null : (
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
      )}
      <ToggleControl checked={checked} disabled={disabled} controlWidth={controlWidth}>
        <ToggleStateText checked={checked} disabled={disabled} stateTextColor={stateTextColor}>
          {checked ? (onText ?? 'ON') : (offText ?? 'OFF')}
        </ToggleStateText>
        <HiddenCheckbox
          id={id}
          type="checkbox"
          aria-label={label}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
        />
        <ToggleThumb checked={checked} disabled={disabled} />
      </ToggleControl>
    </ToggleLabel>
  );
}
