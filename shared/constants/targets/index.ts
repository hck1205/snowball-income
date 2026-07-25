export const TARGET_MONTHLY_DIVIDENDS = {
  oneMillion: 1_000_000,
  twoMillion: 2_000_000
} as const;

/**
 * 목표 월배당 입력 필드의 **고정 DOM id**.
 *
 * 이 입력의 id는 원래 라벨에서 파생됐다(`toInputId('목표 월배당 (원)')`) — 라벨 카피를 한 글자만
 * 고쳐도 id가 조용히 바뀌는 구조라, 결과 카드의 "직접 입력" CTA가 이 필드로 스크롤·포커스를
 * 옮기는 순간부터는 상수로 못 박는다. 이 id를 바꾸면 그 CTA가 무음으로 아무것도 안 하게 된다.
 */
export const TARGET_MONTHLY_DIVIDEND_INPUT_ID = 'target-monthly-dividend-input';
