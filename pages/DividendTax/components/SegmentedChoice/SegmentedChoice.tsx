import { useId } from 'react';
import { Field, FieldLabel, SegmentButton, Segmented } from './SegmentedChoice.styled';

export type SegmentedChoiceProps<T extends string> = {
  readonly label: string;
  readonly options: readonly { readonly value: T; readonly label: string }[];
  readonly value: T;
  readonly onChange: (value: T) => void;
};

/**
 * 3칸 선택(라디오 그룹) — 공용 InputField 와 같은 골격(라벨 줄 + 40px 컨트롤)이라 같은 줄의 입력창과 윗선·아랫선이 맞는다.
 * 세금 계산기의 건강보험 자격 · 연금 받는 나이가 쓴다.
 */
export default function SegmentedChoice<T extends string>({ label, options, value, onChange }: SegmentedChoiceProps<T>) {
  const labelId = useId();
  return (
    <Field>
      <FieldLabel id={labelId}>{label}</FieldLabel>
      <Segmented role="radiogroup" aria-labelledby={labelId}>
        {options.map((option) => (
          <SegmentButton
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            active={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </SegmentButton>
        ))}
      </Segmented>
    </Field>
  );
}
