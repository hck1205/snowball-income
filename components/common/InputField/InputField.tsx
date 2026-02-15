import type { ChangeEvent } from 'react';
import type { InputFieldProps, SelectFieldProps } from './InputField.types';
import { formatNumericDisplay, normalizeNumericInput, toInputId } from './InputField.utils';
import { BaseInput, BaseSelect, FieldLabel, HelpButton, LabelRow } from './InputField.styled';

const LabelWithHelp = ({ label, helpAriaLabel, onHelpClick }: { label: string; helpAriaLabel?: string; onHelpClick?: () => void }) => (
  <LabelRow>
    {label}
    {onHelpClick ? (
      <HelpButton
        type="button"
        aria-label={helpAriaLabel ?? `${label} 도움말`}
        onClick={(event) => {
          event.preventDefault();
          onHelpClick();
        }}
      >
        ?
      </HelpButton>
    ) : null}
  </LabelRow>
);

function InputField({ label, type = 'text', value, onChange, helpAriaLabel, onHelpClick, ...rest }: InputFieldProps) {
  const id = toInputId(label);

  if (type === 'number') {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const normalizedValue = normalizeNumericInput(event.target.value);

      const nextEvent = {
        ...event,
        target: { ...event.target, value: normalizedValue },
        currentTarget: { ...event.currentTarget, value: normalizedValue }
      } as ChangeEvent<HTMLInputElement>;

      onChange(nextEvent);
    };

    return (
      <FieldLabel htmlFor={id}>
        <LabelWithHelp label={label} helpAriaLabel={helpAriaLabel} onHelpClick={onHelpClick} />
        <BaseInput
          id={id}
          aria-label={label}
          type="text"
          inputMode="decimal"
          value={formatNumericDisplay(value)}
          onChange={handleChange}
          {...rest}
        />
      </FieldLabel>
    );
  }

  return (
    <FieldLabel htmlFor={id}>
      <LabelWithHelp label={label} helpAriaLabel={helpAriaLabel} onHelpClick={onHelpClick} />
      <BaseInput id={id} aria-label={label} type={type} value={value} onChange={onChange} {...rest} />
    </FieldLabel>
  );
}

export function FrequencySelect({ label, value, helpAriaLabel, onHelpClick, disabled, onChange }: SelectFieldProps) {
  const id = toInputId(label);

  return (
    <FieldLabel htmlFor={id}>
      <LabelWithHelp label={label} helpAriaLabel={helpAriaLabel} onHelpClick={onHelpClick} />
      <BaseSelect id={id} aria-label={label} value={value} disabled={disabled} onChange={onChange}>
        <option value="monthly">월</option>
        <option value="quarterly">분기</option>
        <option value="semiannual">반기</option>
        <option value="annual">연</option>
      </BaseSelect>
    </FieldLabel>
  );
}

export default InputField;
