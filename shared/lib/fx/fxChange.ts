/**
 * 전일 대비 변동률 — **순수 계산**(표시 전용).
 *
 * `/api/fx` 가 당일 환율과 전일 종가를 **한 스냅샷**으로 주므로(server/handlers/Fx/Fx.ts), 위젯은 그 둘로
 * "+0.32% / -0.18%" 를 그린다. 계산을 컴포넌트 밖에 두는 이유는 상태 계층·위젯·테스트가 같은 규칙을
 * 공유해야 하기 때문이다.
 *
 * ⚠ **문자열화(부호·퍼센트 기호·로케일)는 여기서 하지 않는다** — 소비하는 위젯의 `.utils.ts` 담당이다.
 *   여기는 숫자와 방향만 낸다.
 *
 * 🔗 **짝은 `shared/lib/marketIndices/change.ts` 의 `computeIndexChange` 다 — 규칙이 갈리면 안 된다.**
 *   같은 계산을 일부러 두 벌 두는 이유: `shared/lib/marketIndices` 는 서버 핸들러
 *   (`server/handlers/MarketIndices`)가 import 하는 **완전 순수 모듈**이라 앱 쪽 배럴과 얽히면 Vercel Node
 *   런타임이 모듈 평가 단계에서 죽는다. 그래서 합치지 않고 **의도적으로 중복**하되, 보합 엡실론과
 *   "원값을 담는다"는 규칙을 문자 그대로 같게 유지한다
 *   (두 함수의 동등성은 `test/shared/changeDirectionParity.test.ts` 가 기계적으로 강제한다).
 */

/** 방향. `flat` 은 "표시 정밀도에서 변동이 없다"는 뜻이다(아래 `percent` 주석 참고). */
import { isFinitePositive } from '@/shared/lib/numeric';

export type FxChangeDirection = 'up' | 'down' | 'flat';

export type FxChange = {
  /**
   * 전일 대비 변동률(%) — **반올림하지 않은 원값**이다. 표시할 때 자릿수를 정한다.
   * 권장 포맷 레시피(부호는 `direction` 에서, 숫자는 절대값에서):
   * `sign = up ? '+' : down ? '-' : ''` + `Math.abs(percent).toFixed(2)` + `'%'`
   * — 이렇게 하면 보합인데 `-0.00%` 로 찍히는 사고가 없다(공용 포맷터 `formatChangePercent`).
   */
  percent: number;
  direction: FxChangeDirection;
};

/** 방향 판정에 쓰는 표시 정밀도(소수 2자리). 아래 주석의 보합 규칙과 짝을 이룬다. */
const DIRECTION_DECIMALS = 2;
const DIRECTION_EPSILON = 10 ** -DIRECTION_DECIMALS / 2;

/**
 * 당일 환율과 전일 종가로 변동률을 낸다.
 *
 * - 전일 종가가 없거나(폴백 공급자가 이겼을 때·구버전 캐시 응답) **유한 양수가 아니면 `null`** — 그 경우
 *   소비자는 변동률을 **생략**한다(0% 로 위장하거나 다른 출처의 값으로 채우지 않는다).
 * - **보합 판정**: 소수 2자리로 반올림했을 때 `0.00` 이면 `'flat'`. 화면에는 0.00% 인데 방향을
 *   위/아래로 말하면 그 자체가 거짓말이 되기 때문이다(표시 정밀도와 방향을 같은 기준으로 맞춘다).
 *   경계(`±0.005%`)는 **부호 대칭**이다 — 같은 크기의 상승과 하락은 반드시 같은 판정을 받는다.
 */
export const computeFxChange = (rate: number, previousClose: number | undefined): FxChange | null => {
  if (!isFinitePositive(rate)) return null;
  if (!isFinitePositive(previousClose)) return null;

  const percent = ((rate - previousClose) / previousClose) * 100;
  if (!Number.isFinite(percent)) return null;

  if (Math.abs(percent) < DIRECTION_EPSILON) return { percent, direction: 'flat' };
  return { percent, direction: percent > 0 ? 'up' : 'down' };
};
