/**
 * `/api/fx` 성공 응답 계약 — `server/handlers/Fx/Fx.ts` 의 `FxSuccess` 와 형태가 같다(표시 전용).
 *
 * ⚠ 이 값은 **참고용**이라 시뮬레이션 입력·저장 payload·공유 URL 어디에도 들어가지 않는다.
 *    위젯은 이 값을 화면에만 그리고, 계산 엔진(runSimulation)에 아무것도 넘기지 않는다.
 */
export type FxRate = {
  rate: number;
  base: 'USD';
  quote: 'KRW';
  /** API 가 준 실제 갱신 시각(ISO). 오늘 날짜로 위장하지 않는다. */
  asOf: string;
};

/**
 * 위젯의 화면 상태 4종.
 * - `loading`: 첫 조회 중 — 스켈레톤 + `aria-busy`.
 * - `success`: 최신 환율(신선).
 * - `stale`:   직전 성공값은 있으나 최근 갱신이 실패 — 값 + **실제** as-of + 옅은 '업데이트 실패' 표식.
 * - `error`:   보여줄 값이 없음 — 중립 안내(가짜 환율 금지).
 */
export type ExchangeRateView =
  | { status: 'loading' }
  | { status: 'success'; rate: FxRate }
  | { status: 'stale'; rate: FxRate }
  | { status: 'error' };
