/**
 * 수량 입력 문자열의 정규화 규칙 — **표시 계층 전용**(값의 의미는 계산 엔진이 정한다).
 *
 * 입력 중에는 콤마를 넣지 않는다: 소수점을 찍는 도중 천단위 구분이 끼면 캐럿이 튄다(`InputField` 의
 * 숫자 표시 포맷을 여기서 재사용하지 않는 이유).
 */

/**
 * 수량의 유효 소수 자릿수.
 *
 * ⚠ 계산 엔진의 `PORTFOLIO_QUANTITY_DECIMALS`(shared/lib/portfolio)와 **같은 값이어야 한다**.
 * 여기서 상수를 다시 정의하는 이유는 이 컴포넌트가 `components/common`(엔트리 번들)이라
 * 시세 스냅샷을 끌어오는 계산 계층을 import 하지 않기 위해서다. 두 값이 어긋나면
 * `test/portfolio/quantityInput.test.ts` 가 즉시 빨개진다(그 테스트가 두 상수를 대조한다).
 */
export const QUANTITY_INPUT_DECIMALS = 4;

/**
 * 숫자와 점 1개만 남긴다. **마이너스·지수·공백은 없다**(수량은 음수가 될 수 없다).
 * 두 번째 이후의 점은 버린다(`"1.2.3"` → `"1.23"`) — 잘못 찍힌 점 때문에 값이 통째로 사라지는 것보다
 * 앞의 입력을 지키는 쪽이 덜 놀랍다.
 */
export const normalizeQuantityInput = (raw: string): string => {
  if (typeof raw !== 'string') return '';

  let result = '';
  let hasDot = false;

  for (const char of raw) {
    if (char >= '0' && char <= '9') {
      result += char;
      continue;
    }
    if (char === '.' && !hasDot) {
      hasDot = true;
      result += char;
    }
  }

  return result;
};

/** 소수 `decimals` 자리를 넘는 입력은 **자른다**(반올림하지 않는다 — 타이핑 중에 값이 커지면 놀란다). */
export const clampQuantityDecimals = (raw: string, decimals: number = QUANTITY_INPUT_DECIMALS): string => {
  const dotIndex = raw.indexOf('.');
  if (dotIndex < 0) return raw;

  return raw.slice(0, dotIndex + 1 + Math.max(0, decimals));
};

/** onChange 한 번에 적용되는 규칙(정규화 → 자릿수 제한). */
export const toQuantityInputChange = (raw: string, decimals: number = QUANTITY_INPUT_DECIMALS): string =>
  clampQuantityDecimals(normalizeQuantityInput(raw), decimals);
