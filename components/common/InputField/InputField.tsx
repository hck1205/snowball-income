import type { ChangeEvent } from 'react';
import type { InputFieldProps, SelectFieldProps } from './InputField.types';
import { formatNumericDisplay, normalizeNumericInput, toInputId } from './InputField.utils';
import Select from '@/components/common/Select';
import { Adornment, BaseInput, FieldLabel, FieldWrapper, HelpButton, InputAdornmentWrap, LabelRow } from './InputField.styled';

const LabelWithHelp = ({
  id,
  label,
  helpAriaLabel,
  onHelpClick
}: {
  id: string;
  label: string;
  helpAriaLabel?: string;
  onHelpClick?: () => void;
}) => (
  <LabelRow>
    <FieldLabel htmlFor={id}>{label}</FieldLabel>
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

function InputField({ label, type = 'text', value, onChange, helpAriaLabel, onHelpClick, prefix, suffix, ...rest }: InputFieldProps) {
  const id = toInputId(label);
  const isNumber = type === 'number';

  // 숫자 입력은 표시값을 포맷하고 입력을 정규화한다(기존 동작 보존). type은 text로 두어 브라우저 스피너를 없앤다.
  const handleChange = isNumber
    ? (event: ChangeEvent<HTMLInputElement>) => {
        const normalizedValue = normalizeNumericInput(event.target.value);
        onChange({
          ...event,
          target: { ...event.target, value: normalizedValue },
          currentTarget: { ...event.currentTarget, value: normalizedValue }
        } as ChangeEvent<HTMLInputElement>);
      }
    : onChange;

  const adorn = [prefix ? 'prefix' : '', suffix ? 'suffix' : ''].filter(Boolean).join(' ');

  const input = (
    <BaseInput
      id={id}
      aria-label={label}
      type={isNumber ? 'text' : type}
      value={isNumber ? formatNumericDisplay(value) : value}
      onChange={handleChange}
      data-adorn={adorn || undefined}
      {...(isNumber ? { inputMode: 'decimal' as const } : {})}
      {...rest}
    />
  );

  return (
    <FieldWrapper>
      <LabelWithHelp id={id} label={label} helpAriaLabel={helpAriaLabel} onHelpClick={onHelpClick} />
      {prefix || suffix ? (
        <InputAdornmentWrap>
          {prefix ? <Adornment side="prefix">{prefix}</Adornment> : null}
          {input}
          {suffix ? <Adornment side="suffix">{suffix}</Adornment> : null}
        </InputAdornmentWrap>
      ) : (
        input
      )}
    </FieldWrapper>
  );
}

export function FrequencySelect({ label, value, helpAriaLabel, onHelpClick, disabled, onChange }: SelectFieldProps) {
  const id = toInputId(label);

  return (
    <FieldWrapper>
      <LabelWithHelp id={id} label={label} helpAriaLabel={helpAriaLabel} onHelpClick={onHelpClick} />
      <Select id={id} aria-label={label} value={value} disabled={disabled} onChange={onChange}>
        <option value="monthly">월</option>
        <option value="quarterly">분기</option>
        <option value="semiannual">반기</option>
        <option value="annual">연</option>
      </Select>
    </FieldWrapper>
  );
}

export default InputField;
