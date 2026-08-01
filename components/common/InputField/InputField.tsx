import type { ChangeEvent } from 'react';
import type { InputFieldProps, SelectFieldProps } from './InputField.types';
import { formatNumericDisplay, normalizeNumericInput, toInputId } from './InputField.utils';
import Select from '@/components/common/Select';
import {
  Adornment,
  BaseInput,
  FieldHint,
  FieldLabel,
  FieldWrapper,
  HelpButton,
  InputAdornmentWrap,
  LabelRow
} from './InputField.styled';

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

function InputField({
  label,
  id: idProp,
  type = 'text',
  value,
  onChange,
  helpAriaLabel,
  onHelpClick,
  prefix,
  suffix,
  hint,
  ...rest
}: InputFieldProps) {
  const id = idProp ?? toInputId(label);
  const isNumber = type === 'number';
  const hintId = hint ? `${id}-hint` : undefined;

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
      aria-describedby={hintId}
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
      {hint ? <FieldHint id={hintId}>{hint}</FieldHint> : null}
    </FieldWrapper>
  );
}

export function FrequencySelect({ label, value, helpAriaLabel, onHelpClick, disabled, hint, onChange }: SelectFieldProps) {
  const id = toInputId(label);
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <FieldWrapper>
      <LabelWithHelp id={id} label={label} helpAriaLabel={helpAriaLabel} onHelpClick={onHelpClick} />
      <Select id={id} aria-label={label} value={value} disabled={disabled} aria-describedby={hintId} onChange={onChange}>
        <option value="monthly">월</option>
        <option value="quarterly">분기</option>
        <option value="semiannual">반기</option>
        <option value="annual">연</option>
        {/* 무배당 종목(성장주)을 정직하게 담기 위한 값. 이 옵션이 없으면 프리셋에서 들어온
            'none' 이 어느 옵션과도 맞지 않아 셀렉트가 빈 칸으로 보인다.
            🔴 배당률이 입력돼 있어도 이 선택지를 **막지 않는다** — 실제로 무배당 종목을 담는 사용자가 있다.
               모순은 위 `hint` 로 말한다(호출부가 만든다). */}
        <option value="none">배당 없음</option>
      </Select>
      {hint ? <FieldHint id={hintId}>{hint}</FieldHint> : null}
    </FieldWrapper>
  );
}

export default InputField;
