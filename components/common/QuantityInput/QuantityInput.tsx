import type { QuantityInputProps } from './QuantityInput.types';
import { toQuantityInputChange } from './QuantityInput.utils';
import { QuantityField, QuantityRoot, QuantityUnit } from './QuantityInput.styled';

/**
 * 라벨 없는 인라인 수량 입력 — 표 셀·목록 행처럼 **열 머리가 이미 라벨 역할을 하는 자리**에 쓴다.
 *
 * `InputField` 를 쓰지 않는 이유: 그 컴포넌트는 시각 라벨을 항상 렌더하므로 표 안에서 열 머리와
 * 라벨이 중복된다. 대신 접근성 이름은 `ariaLabel` 로 **반드시** 받는다(라벨 없는 입력 금지).
 *
 * 값은 사용자가 친 문자열 그대로 들고 있고(`"1."` 도 유효한 중간 상태), 입력할 때마다
 * 숫자·점 1개·소수 4자리로만 걸러낸다. **표시값 반올림은 blur 시 호출부가** 한다 —
 * "정규화된 수량"의 정의는 계산 엔진이 소유하고, 이 컴포넌트가 그 규칙을 두 번째로 구현하지 않는다.
 */
export default function QuantityInput({
  value,
  onChange,
  ariaLabel,
  suffix = '주',
  describedById,
  inputRef,
  disabled,
  onBlur
}: QuantityInputProps) {
  return (
    <QuantityRoot>
      <QuantityField
        type="number"
        inputMode="decimal"
        step="any"
        min="0"
        autoComplete="off"
        ref={inputRef}
        value={value}
        aria-label={ariaLabel}
        aria-describedby={describedById}
        disabled={disabled}
        onChange={(event) => onChange(toQuantityInputChange(event.target.value))}
        onBlur={onBlur}
      />
      {suffix ? <QuantityUnit aria-hidden>{suffix}</QuantityUnit> : null}
    </QuantityRoot>
  );
}
