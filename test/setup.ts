/*
 * 모든 테스트의 공통 진입점.
 *
 * 이 레포의 테스트는 두 환경으로 나뉜다 — 렌더가 필요한 테스트는 **jsdom**(vitest.config.ts 의 기본값),
 * 순수 계산·스키마·포맷 테스트는 파일 첫 줄 `// @vitest-environment node` 로 **node** 에서 돈다.
 * (환경 준비가 스위트 시간의 최대 항목이라 그만큼이 그대로 절약된다. 어디에 둘지는 vitest.config.ts 주석 참고.)
 *
 * node 환경에서는 아래 DOM 준비물이 무의미할 뿐 아니라, 모듈 최상위에서 window·HTMLElement 를
 * 만지는 순간 터진다 — 그래서 **DOM 이 있을 때만** 동적으로 로드한다. 타임존·환경변수 고정처럼
 * 환경과 무관한 것은 vitest.config.ts 의 `env` 가 담당하므로 양쪽 환경에 똑같이 적용된다.
 */
// 정적 import 가 하나도 없으면 TS 가 이 파일을 스크립트로 보고 top-level await 을 거부한다(TS1375).
export {};

if (typeof window !== 'undefined') {
  await import('./setup.dom');
}
