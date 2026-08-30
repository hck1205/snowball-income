/**
 * 긴 안내문(`/about`) — 배당을 처음 접하는 사람이 읽는 지면.
 *
 * 🔴 **2026-08-27 까지 이 화면이 `/` 였다.** 첫 화면이 목표 여섯을 고르는 화면(`pages/Home`)으로
 * 바뀌면서 주소만 `/about` 으로 옮겨 왔다 — **화면 코드는 한 줄도 바뀌지 않았다**. 그래서 이 폴더와
 * 부품·문구·테스트 이름은 계속 "Landing" 이다(이름을 따라 옮기면 순수 rename 에 거대한 diff 가
 * 붙어서, 이름보다 주소로 판단하기로 했다).
 * ⚠ `FAQPage` JSON-LD 가 이 화면을 따라왔다 — FAQ 가 **보이는** 유일한 곳이라서다
 *   (`shared/lib/seo/faqStructuredData.ts`). 이 화면을 다시 옮기면 그 상수도 함께 고쳐라.
 *
 * ── 아래는 `/` 시절의 기록 ──
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
