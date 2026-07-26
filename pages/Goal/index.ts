/**
 * ⚠ 이 배럴은 **엔트리 번들에서 참조하지 않는다**. 라우터는 `@/pages/Goal/GoalPage`를
 * `React.lazy`로 직접 불러 목표 화면을 별도 청크로 유지한다(`pages/index.ts`에도 연결하지 않는다).
 * 배당 캘린더 배럴과 같은 규칙 — 여기에 연결하는 순간 시뮬레이터 첫 로드가 무거워진다.
 */
export { default as GoalPage } from './GoalPage';
export type { GoalPageProps } from './GoalPage';
