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
 *
 * ⚠ `type="number"` 가 아니라 **`type="text"` + `inputMode="decimal"`** 이다. 숫자 입력은 브라우저가
 * 파싱하지 못하는 중간 상태(`"120."`)를 badInput 으로 보고 `value` 를 **빈 문자열로** 넘겨,
 * 화면에는 `120.` 이 남는데 상태는 `''` 이 되는 괴리가 생긴다(소수점을 찍는 순간 값이 사라진다).
 * 텍스트로 받으면 원문이 그대로 오고 걸러내기는 아래 한 곳(`toQuantityInputChange`)이 전부 맡는다.
 * 모바일 숫자 키패드는 `inputMode` 가 책임진다.
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
        type="text"
        inputMode="decimal"
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
