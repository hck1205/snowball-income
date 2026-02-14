import type { InputFieldProps, SelectFieldProps } from './component.types';
import { toInputId } from './component.utils';
import { BaseInput, BaseSelect, FieldLabel } from './component.styled';

function InputField({ label, type = 'text', ...rest }: InputFieldProps) {
  const id = toInputId(label);

  return (
    <FieldLabel htmlFor={id}>
      {label}
      <BaseInput id={id} aria-label={label} type={type} {...rest} />
    </FieldLabel>
  );
}

export function FrequencySelect({ label, value, disabled, onChange }: SelectFieldProps) {
  const id = toInputId(label);

  return (
    <FieldLabel htmlFor={id}>
      {label}
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
