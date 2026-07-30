/**
 * 뷰포트 폭 스텁.
 *
 * jsdom 은 `@media` 를 평가하지 않고, 전역 스텁(`test/setup.ts`)은 **모든 질의에 `matches:false`** 를
 * 답한다. 그래서 폭으로 갈리는 JS 분기(드로어 딤·스크롤락, 목표 포커스 전 드로어 열기)는 스텁 없이는
 * 항상 한쪽만 검증된다 — 두 폭을 다 태우려면 이 헬퍼로 폭을 명시해야 한다.
 *
 * 기존에 6곳이 손으로 복붙하던 `Object.defineProperty(window,'matchMedia',…)` 블록을 대신한다.
 * 복붙본들은 `matches: query === '(max-width: 960px)'` 처럼 **질의 문자열 정확일치**였는데, 그러면
 * 같은 폭을 다르게 쓴 질의(`(min-width: 961px)`)가 조용히 false 가 된다. 여기서는 폭 하나를 정하고
 * 질의를 **실제로 평가**하므로 그 함정이 사라진다.
 */

const ORIGINAL_MATCH_MEDIA = Object.getOwnPropertyDescriptor(window, 'matchMedia');

const MAX_WIDTH = /\(\s*max-width:\s*(\d+(?:\.\d+)?)px\s*\)/;
const MIN_WIDTH = /\(\s*min-width:\s*(\d+(?:\.\d+)?)px\s*\)/;

/**
 * 폭 질의만 평가한다. `prefers-reduced-motion` 같은 비-폭 질의는 전역 스텁과 같이 false —
 * 폭 스텁이 OS 설정까지 대신 답하면 두 관심사가 뒤엉킨다.
 */
const evaluate = (query: string, width: number): boolean => {
  const max = MAX_WIDTH.exec(query);
  if (max && width > Number(max[1])) return false;

  const min = MIN_WIDTH.exec(query);
  if (min && width < Number(min[1])) return false;

  return Boolean(max || min);
};

/** 뷰포트 폭을 고정한다. 예: `stubViewportWidth(360)` = 모바일, `stubViewportWidth(1440)` = 데스크톱. */
export const stubViewportWidth = (width: number): void => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: evaluate(query, width),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    })
  });
};

/**
 * **터치가 주 입력인 기기**(호버 없음 + 굵은 포인터)를 재현한다.
 *
 * 공유 경로 분기(OS 시트 vs 앱 공유 창)는 폭이 아니라 **입력 방식**으로 갈리므로
 * `stubViewportWidth` 로는 만들 수 없다. 전역 스텁은 모든 질의에 false 라서
 * 스텁하지 않은 테스트는 자동으로 "데스크톱"이다(의도).
 */
export const stubTouchPrimary = (): void => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: /hover:\s*none/.test(query) && /pointer:\s*coarse/.test(query),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    })
  });
};

/**
 * **모션을 줄이라고 설정한 사용자**를 재현한다.
 *
 * 이 질의는 폭 스텁이 일부러 답하지 않는다(위 `evaluate` 주석) — 전역 스텁도 false 라
 * 스텁 없는 테스트는 자동으로 "모션 허용"이다(의도). 로딩·전이 UI가 reduced-motion 에서
 * 시각 단서를 잃는 회귀(2026-07-30 `Button` 로딩)는 이 스텁 없이는 관측할 수 없다.
 */
export const stubReducedMotion = (): void => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: /prefers-reduced-motion:\s*reduce/.test(query),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    })
  });
};

/** `matchMedia` 자체가 없는 환경(SSR·구형 브라우저)을 재현한다. */
export const removeMatchMedia = (): void => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: undefined });
};

/** 원래 구현(대개 `test/setup.ts` 의 전역 스텁)으로 되돌린다. `afterEach` 에서 반드시 부를 것. */
export const restoreMatchMedia = (): void => {
  if (ORIGINAL_MATCH_MEDIA) Object.defineProperty(window, 'matchMedia', ORIGINAL_MATCH_MEDIA);
};
