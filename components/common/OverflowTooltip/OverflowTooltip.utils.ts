/**
 * "이 텍스트가 실제로 잘렸는가"를 재는 자와, 그 측정을 **행 수와 무관한 비용**으로 만드는 관찰자.
 *
 * `text-overflow: ellipsis` 는 순수 CSS 라 DOM 에도 접근성 트리에도 흔적을 남기지 않는다 —
 * 렌더된 뒤 실측하는 것 말고는 잘림 여부를 알 방법이 없다.
 */

/**
 * 렌더된 요소가 잘렸는가.
 *
 * **두 방향을 다 본다** — 앱에 줄임이 두 종류 있기 때문이다:
 *  ① 한 줄 말줄임(`text-overflow: ellipsis`) → 가로로 넘친다(`scrollWidth > clientWidth`).
 *  ② 여러 줄 자름(`-webkit-line-clamp`)      → 세로로 넘친다(`scrollHeight > clientHeight`).
 * 가로만 재면 ②가 걸리는 카드·표(종목 이름·게시글 요약)가 조용히 툴팁 없이 잘린다.
 *
 * 🔴 **1px 여유를 둔다.** 두 값은 정수로 반올림된 값이라 서브픽셀 레이아웃에서
 * (예: 133.4px 상자 안 133.2px 글자) 잘리지 않았는데도 1 차이가 난다. 그대로 비교하면
 * 멀쩡한 이름에까지 툴팁이 붙어 **같은 글자를 두 번 보여주는 소음**이 된다.
 */
export const isTextClipped = (element: HTMLElement): boolean =>
  element.scrollWidth - element.clientWidth > 1 || element.scrollHeight - element.clientHeight > 1;

type WidthListener = () => void;

/**
 * 🔴 관찰자는 **앱 전체에 하나**다.
 *
 * 이 목록은 가상 스크롤이 아니라 행이 수십 개고, 폭이 바뀔 때마다 전 행이 다시 재야 한다.
 * 행마다 `new ResizeObserver` 를 만들면 관찰자 객체가 행 수만큼 생기고 달을 넘길 때마다
 * 그만큼 만들고 버린다. 콜백 표 하나 + 관찰자 하나로 모으면 비용이 행 수와 무관해진다.
 */
const listeners = new Map<Element, WidthListener>();
let sharedObserver: ResizeObserver | null = null;

/**
 * `element` 의 크기가 바뀔 때 `onResize` 를 부른다. 해제 함수를 돌려준다.
 *
 * ⚠ `ResizeObserver` 가 없는 환경(jsdom 기본·구형 브라우저)에서는 조용히 아무것도 하지 않는다 —
 * 첫 렌더의 1회 측정만 남고, 그것이 이 기능의 최소 동작이다(실패로 만들 이유가 없다).
 */
export const observeWidth = (element: Element, onResize: WidthListener): (() => void) => {
  if (typeof ResizeObserver === 'undefined') return () => {};

  sharedObserver ??= new ResizeObserver((entries) => {
    for (const entry of entries) listeners.get(entry.target)?.();
  });

  listeners.set(element, onResize);
  sharedObserver.observe(element);

  return () => {
    listeners.delete(element);
    sharedObserver?.unobserve(element);
  };
};
