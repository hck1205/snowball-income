/**
 * 레이어를 가로질러 재사용되는 React 훅.
 *
 * `shared/index.ts`(types·utils·constants 배럴)에는 **일부러 넣지 않는다** — 그 배럴은
 * React가 없는 실행 환경(서버 핸들러·인덱서 스크립트)에서도 import되기 때문이다.
 * 소비처는 폴더 경로 `@/shared/hooks`로 가져간다.
 */
export { useDrawerBackClose } from './useDrawerBackClose';
