/**
 * 랜딩(`/`) — 배당을 처음 접하는 사람이 도착하는 정문.
 *
 * `/` 는 `router/routes.tsx` 에서 이 페이지를 **조건 없이** 그린다. 한때 공유 링크(`?share=`·`?s=`·`?sv=`)를
 * 가려내 `/simulator` 로 넘기는 래퍼가 있었지만 2026-08-01 에 걷어냈다 — 공유 링크는 `/simulator` 에만
 * 붙는다(사유·되살리는 법은 그 라우트 주석. docs/simulator-route-migration-compat.md §1 은 폐기됐다).
 *
 * ⚠ `pages/index.ts`(최상위 배럴)에 연결하지 않는다 — 그 배럴은 `MainPage`(eager) 전용이고,
 * 랜딩은 lazy 라우트 청크에서만 로드돼야 한다.
 */
export { default as LandingPage } from './LandingPage';
export type { LandingPageViewProps, LandingViewModel } from './LandingPage';
