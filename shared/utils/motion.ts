/**
 * 모션 선호 판정 + 안전한 스크롤 이동.
 *
 * 같은 5줄짜리 `matchMedia('(prefers-reduced-motion: reduce)')` 구현이 화면마다 흩어져 있어
 * 한 곳으로 모았다(티커 상세·결과 카드 CTA·투어 가이드).
 *
 * ⚠ **reduce 판정을 CSS에 맡길 수 없다.** 전역 `@media (prefers-reduced-motion: reduce)` 의
 * `scroll-behavior: auto !important` 는 CSS가 정하는 스크롤에만 적용되고,
 * `scrollIntoView({ behavior: 'smooth' })` 처럼 **JS가 명시한 behavior 는 못 이긴다**.
 * 그래서 호출 시점에 JS에서 한 번 더 본다.
 */

/** matchMedia 가 없거나(SSR/구형) reduce 선호가 아니면 false. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * 요소를 화면 안으로 옮긴다. 없는 요소·`scrollIntoView` 가 없는 환경(jsdom)에서 조용히 넘어간다.
 *
 * 기본 `behavior` 는 모션 선호를 따른다 — 호출부가 명시하면 그 값이 이긴다.
 *
 * `behavior` 를 **분해해서 빼낸 뒤** 나머지만 펼치는 이유: `{ behavior: 계산값, ...options }` 형태는
 * 호출부가 `behavior: undefined` 를 명시로 넘기는 순간 계산값을 `undefined` 로 덮어써 폴백이 사라진다.
 */
export const scrollIntoViewSafely = (
  element: Element | null | undefined,
  options: ScrollIntoViewOptions = {}
): void => {
  if (!element) return;

  const { behavior, ...rest } = options;

  element.scrollIntoView?.({
    behavior: behavior ?? (prefersReducedMotion() ? 'auto' : 'smooth'),
    ...rest
  });
};
