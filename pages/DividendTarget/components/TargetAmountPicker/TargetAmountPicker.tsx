import { useId, useState, type FormEvent } from 'react';
import { DIVIDEND_TARGET_COPY } from '../../copy';
import {
  MONTHLY_TARGET_CHOICES_MAN,
  MONTHLY_TARGET_MAX_MAN,
  MONTHLY_TARGET_MIN_MAN,
  formatManWon,
  sanitizeMonthlyMan
} from '../../utils';
import type { TargetAmountPickerProps } from './TargetAmountPicker.types';
import {
  AmountChip,
  ChipRow,
  ChoiceLabel,
  CustomApply,
  CustomField,
  CustomForm,
  CustomHint,
  Eyebrow,
  Lede,
  PickerRoot,
  Title,
  TitleAmount
} from './TargetAmountPicker.styled';

const COPY = DIVIDEND_TARGET_COPY;

/**
 * 히어로 + 목표 금액 선택.
 *
 * 직접 입력은 **적용을 눌러야** 반영한다(타이핑마다 반영하지 않는다). "1" → "18" → "180" 을 칠 때마다
 * 원금이 1만원·18만원으로 널뛰면 아래 카드 열두 장이 깜빡이고, 중간값이 쿼리에 남는다.
 * 칩과 같은 금액을 쳐도 그대로 받는다 — 같은 상태가 될 뿐이다.
 */
export default function TargetAmountPicker({ monthlyMan, onChange }: TargetAmountPickerProps) {
  const [draft, setDraft] = useState('');
  const [invalid, setInvalid] = useState(false);
  const labelId = useId();
  const hintId = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = sanitizeMonthlyMan(draft);
    if (value === null) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setDraft('');
    onChange(value, 'custom');
  };

  return (
    <PickerRoot aria-labelledby={labelId}>
      <Eyebrow>{COPY.hero.eyebrow}</Eyebrow>
      <Title id={labelId}>
        {COPY.hero.titleLead} <TitleAmount>{formatManWon(monthlyMan)}</TitleAmount> {COPY.hero.titleTail}
      </Title>
      <Lede>{COPY.hero.lede}</Lede>

      <ChoiceLabel>{COPY.picker.label}</ChoiceLabel>
      <ChipRow role="group" aria-label={COPY.picker.label}>
        {MONTHLY_TARGET_CHOICES_MAN.map((man) => (
          <AmountChip key={man} type="button" aria-pressed={man === monthlyMan} onClick={() => onChange(man, 'chip')}>
            {formatManWon(man)}
          </AmountChip>
        ))}
      </ChipRow>

      <CustomForm onSubmit={handleSubmit} noValidate>
        <CustomField>
          {COPY.picker.customLabel}
          <input
            inputMode="numeric"
            value={draft}
            placeholder={COPY.picker.customPlaceholder}
            aria-invalid={invalid}
            aria-describedby={hintId}
            onChange={(event) => {
              setDraft(event.target.value);
              if (invalid) setInvalid(false);
            }}
          />
          {COPY.picker.customUnit}
        </CustomField>
        <CustomApply type="submit">{COPY.picker.customApply}</CustomApply>
        <CustomHint id={hintId} $invalid={invalid}>
          {COPY.picker.customHint(MONTHLY_TARGET_MIN_MAN, MONTHLY_TARGET_MAX_MAN)}
        </CustomHint>
      </CustomForm>
    </PickerRoot>
  );
}
