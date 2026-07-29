import { APP_HEADER_HEIGHT_VAR } from '@/shared/styles';

/**
 * 헤더 실측 높이를 문서 루트의 CSS 변수로 발행한다.
 *
 * 헤더 아래에 붙는 sticky 요소(티커 상세 목차 바 · 시뮬레이터 설정 도크)가 이 값을 `top` 으로 쓴다.
 * 높이를 숫자로 못 박아 두면 헤더 구성이 바뀔 때마다 조용히 낡는다 — 실제로 티커 셸의
 * `--tk-header-h` 는 56 → 80 → 88px 로 세 번 고쳐졌고 그때마다 목차 바가 어긋났다.
 *
 * 0 이하는 무시한다. jsdom 처럼 레이아웃을 계산하지 않는 환경에서 변수를 `0px` 로 덮어쓰면
 * 폴백(88px)이 사라져 sticky 요소가 헤더 뒤로 숨는다.
 */
export const publishHeaderHeight = (element: HTMLElement | null): void => {
  if (!element || typeof document === 'undefined') return;
  const height = Math.round(element.getBoundingClientRect().height);
  if (height <= 0) return;
  document.documentElement.style.setProperty(APP_HEADER_HEIGHT_VAR, `${height}px`);
};
