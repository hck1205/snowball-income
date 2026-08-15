/**
 * 계산 계층 공용 수치 유틸 — 도메인도 DOM 도 모르는 순수 함수만 둔다.
 *
 * `sumBy` 는 원래 **세 곳에 글자 그대로 복붙돼 있었다**(`SnowballReport` · `SnowballScenarioRun` ·
 * `pages/Main/utils/simulation`). 셋 다 같은 숫자를 내야 하는 합산 경로라, 한쪽만 고치면
 * (예: 부동소수 보정을 넣으면) 화면·공유 카드·PDF 가 조용히 갈린다. 그 위험을 없애려고 모았다.
 *
 * 🔴 **`shared/utils` 가 아니라 여기 있는 이유**: `shared/utils` 배럴은 `motion.ts` 를 통해
 * **DOM 에 묶여 있다**(`window`·`scrollIntoView`). 계산 엔진(`shared/lib/snowball/**`)은 Vercel
 * 서버리스 번들에도 들어가므로 DOM 심볼을 끌고 오면 타입체크부터 깨진다 — 실제로 이 함수를
 * `shared/utils` 에 뒀다가 그 에러를 만났다. 엔진이 쓰는 유틸은 엔진 쪽 계층에 둔다.
 */

/** `items` 를 `getValue` 로 매핑해 더한다. 빈 배열이면 0. */
export const sumBy = <T>(items: readonly T[], getValue: (item: T) => number): number =>
  items.reduce((sum, item) => sum + getValue(item), 0);

/**
 * **유한한 양수인가** — 외부에서 들어온 값을 숫자로 받아들이기 전의 관문.
 *
 * 🔴 원래 **네 곳에 바이트 단위로 똑같이** 있었다(`shared/lib/fx/exchangeRate` · `shared/lib/fx/fxChange` ·
 * `server/handlers/Fx` · `server/handlers/MarketIndices`). 넷 다 **신뢰할 수 없는 외부 API 응답**
 * (환율·지수 시세)을 거르는 자리라, 한 사본만 느슨해지면(예: `value >= 0` 으로) 그 경로만 조용히
 * 0·음수 시세를 통과시킨다. 화면에는 그럴듯한 숫자가 뜨고 아무도 모른다.
 *
 * 세 조건이 전부 필요하다: `typeof` 는 문자열 `"1350"` 을, `Number.isFinite` 는 `NaN`·`Infinity` 를,
 * `> 0` 은 0·음수를 막는다. JSON 파싱 결과에는 셋 다 실제로 들어온다.
 */
export const isFinitePositive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/**
 * `value` 를 `[min, max]` 안으로 가둔다.
 *
 * `RangeSlider` · `TourGuide` · 차트 툴팁 위치 계산에 같은 구현이 흩어져 있었다.
 * ⚠ `min > max` 면 `min` 이 이긴다(`Math.max` 가 바깥) — 호출부가 뒤집힌 범위를 넘기지 않는 것이 전제다.
 */
export const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
