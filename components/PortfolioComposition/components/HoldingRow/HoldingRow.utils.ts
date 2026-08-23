/**
 * 주식 수 표시·입력 정밀도 — **소수 둘째 자리**(2026-08-23 사용자 지시).
 *
 * 표시와 입력에 **같은 값**을 쓴다. 표시만 접고 입력은 넷째 자리까지 받으면, `100.1234` 를 친
 * 사용자가 포커스를 잃는 순간 `100.12` 로 바뀐 화면을 보게 된다 — 방금 친 숫자가 그대로 서 있어야
 * 한다는 아래 규율이 깨진다.
 */
export const ALLOCATION_SHARES_DECIMALS = 2;

/**
 * 파생된 주식 수 → 수량 입력창의 표시값.
 *
 * 주식 수는 `초기 투자금 × 비중 ÷ 주가` 로 되읽은 값이라, 사용자가 `120` 을 넣어도 곱셈·나눗셈을
 * 왕복하면서 `119.99999999` 같은 잡음이 남는다. 방금 친 숫자가 그대로 서 있지 않으면 입력창을
 * 믿을 수 없게 되므로, 이 화면의 정밀도(`ALLOCATION_SHARES_DECIMALS`)로 접는다.
 *
 * 🔴 `null` 은 0주가 아니라 **낼 수 없다**는 뜻이다(환율 미조회) — 0 을 찍으면 없는 사실을
 *    지어내는 것이라 빈 문자열로 둔다. 그 줄의 입력은 잠기고 사유가 따로 붙는다.
 * ⚠ `0` 은 빈 문자열이 아니다. 이 화면에서 0주는 "안 넣었다"가 아니라 **"이 종목은 0주"** 라는
 *   실제 배분이다(초기 투자금 기본값이 0이라 첫 화면이 바로 이 상태다).
 */
export const toSharesDisplayValue = (shares: number | null): string => {
  if (shares === null) return '';
  if (!Number.isFinite(shares) || shares <= 0) return '0';
  return String(Number(shares.toFixed(ALLOCATION_SHARES_DECIMALS)));
};
