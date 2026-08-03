/**
 * 배당 연속 증배 목록 화면 묶음.
 *
 * ⚠ `router/routes.tsx` 는 이 배럴이 아니라 **각 페이지 폴더를 직접 `lazy`** 한다 — 배럴을 lazy 하면
 * 허브와 목록이 한 청크로 묶여 허브만 열어도 목록 셋을 전부 내려받는다(법무 문서 두 벌이 같은 이유로
 * 폴더 직접 import 를 쓴다, `router/routes.tsx` 주석).
 */
export { default as DividendListHubPage } from './DividendListHubPage';
export { default as DividendListPage } from './DividendListPage';
export type { DividendListPageProps } from './DividendListPage';
export { DIVIDEND_LIST_COPY } from './copy';
