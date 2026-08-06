import snapshot from './congressTrades.generated.json';
import type { CongressTradesSnapshot, UsdRange } from './congressTrades.types';

export * from './congressTrades.types';

/**
 * 미 하원 의원 주식 거래 스냅샷 — **커밋된 생성물**을 읽는 유일한 문.
 *
 * 갱신: `npm run congress:trades` (하원 사무국 색인 ZIP → 의원별 PDF → 집계).
 * 자료의 한계는 `congressTrades.types.ts` 머리말이 여섯 항목으로 못 박아 두었다 —
 * **화면은 그 여섯 개를 반드시 말해야 한다.**
 *
 * 🔴 `as` 단언을 쓰는 이유: JSON 을 import 하면 TypeScript 가 리터럴을 넓은 타입(`string`)으로
 * 추론해 `action: 'buy' | 'sell'` 같은 유니온과 맞지 않는다. 값의 모양은 생성 스크립트가
 * 보장하고(그쪽이 유일한 작성자다), 여기서는 그 계약을 한 줄로 선언한다.
 * ⚠ 그래서 **스크립트의 출력 형태를 바꾸면 이 타입도 함께 고쳐야 한다** — 컴파일러가 못 잡는다.
 */
export const CONGRESS_TRADES = snapshot as unknown as CongressTradesSnapshot;

/**
 * 구간 합을 "얼마에서 얼마" 문자열의 재료로 바꾼다.
 *
 * 🔴 **가운뎃값을 만들지 않는다.** `$1,001 - $15,000` 의 중간값 8,000달러는 어디에도 없는 숫자다.
 * 신고 제도가 구간으로만 알려 주기로 한 것을, 화면 편의를 위해 점 하나로 접으면 그 순간 거짓이 된다.
 *
 * `maxUsd === null` 이면 상한이 없다(5,000만 달러 초과 구간이 섞였다) — 호출부는 "이상"으로 읽는다.
 */
export const isOpenEnded = (range: UsdRange): boolean => range.maxUsd === null;

/** 매수 + 매도 건수. 교환(E)은 방향이 없어 어느 쪽에도 세지 않는다. */
export const tradeCount = (row: { buys: number; sells: number }): number => row.buys + row.sells;

/**
 * 매수 우위인가. 같으면 `null` — "중립"이라는 세 번째 상태를 억지로 한쪽에 붙이지 않는다.
 * 화면은 이 값으로 **색과 글자를 함께** 바꾼다(색 단독 금지).
 */
export const netDirection = (row: { buys: number; sells: number }): 'buy' | 'sell' | null => {
  if (row.buys === row.sells) return null;
  return row.buys > row.sells ? 'buy' : 'sell';
};
