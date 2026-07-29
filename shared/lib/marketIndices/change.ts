/**
 * 전일 대비 변동률 — **순수 계산만**. 문자열화(부호·자릿수·통화 표기)는 여기 없다,
 * 표시 부품의 `.utils.ts` 몫이다(같은 숫자를 화면마다 다르게 포맷할 수 있어야 한다).
 *
 * 🔗 **짝은 `shared/lib/fx/fxChange.ts` 의 `computeFxChange` 다 — 규칙이 갈리면 안 된다.**
 *   이 모듈은 서버 핸들러(`server/handlers/MarketIndices`)가 import 하는 **완전 순수 모듈**이라
 *   `shared/lib/fx` 와 서로 import 시키면 그 경계가 흐려진다(앱 배럴이 딸려 들어오면 Vercel Node
 *   런타임이 모듈 평가 단계에서 죽는다). 그래서 합치지 않고 **의도적으로 중복**하되, 보합 엡실론과
 *   "원값을 담는다"는 규칙을 문자 그대로 같게 유지한다
 *   (두 함수의 동등성은 `test/shared/changeDirectionParity.test.ts` 가 기계적으로 강제한다).
 */
import { isFinitePositiveNumber } from './quotes';

export type IndexChange = {
  /**
   * 변동률(%) — **반올림하지 않은 원값**이다. 표시할 때 자릿수를 정한다.
   * 권장 포맷 레시피(부호는 `direction` 에서, 숫자는 절대값에서):
   * `sign = up ? '+' : down ? '-' : ''` + `Math.abs(percent).toFixed(2)` + `'%'`
   * — 이렇게 하면 보합인데 `-0.00%` 로 찍히는 사고가 없다.
   */
  percent: number;
  direction: 'up' | 'down' | 'flat';
};

/** 방향 판정에 쓰는 표시 정밀도(소수 2자리). 아래 주석의 보합 규칙과 짝을 이룬다. */
const DIRECTION_DECIMALS = 2;
const DIRECTION_EPSILON = 10 ** -DIRECTION_DECIMALS / 2;

/**
 * 현재가와 전일 종가로 변동률을 낸다.
 *
 * - `previousClose` 가 없거나 **유한 양수가 아니면 `null`** — 그 지수는 변동률을 생략한다(0% 로 위장 금지).
 * - **보합 판정**: 소수 2자리로 반올림했을 때 `0.00` 이면 `'flat'`. 화면에는 0.00% 인데 방향을
 *   위/아래로 말하면 그 자체가 거짓말이 되기 때문이다(표시 정밀도와 방향을 같은 기준으로 맞춘다).
 */
export const computeIndexChange = (price: number, previousClose: number | undefined): IndexChange | null => {
  if (!isFinitePositiveNumber(price)) return null;
  if (!isFinitePositiveNumber(previousClose)) return null;

  const percent = ((price - previousClose) / previousClose) * 100;
  if (!Number.isFinite(percent)) return null;

  if (Math.abs(percent) < DIRECTION_EPSILON) return { percent, direction: 'flat' };
  return { percent, direction: percent > 0 ? 'up' : 'down' };
};
