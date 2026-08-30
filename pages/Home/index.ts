/**
 * 첫 화면(`/`) — 목표 하나를 고르는 자리.
 *
 * 🔴 **`/` 의 내용물이 2026-08-27 에 바뀌었다.** 그 전까지 이 주소에 있던 여섯 장짜리 안내문은
 * `pages/Landing` 에 **그대로 있고** 주소만 `/about` 으로 옮겨 갔다(`ABOUT_PATH`). 그래서 이 저장소에는
 * "Landing"(긴 안내문, `/about`)과 "Home"(목표 여섯, `/`)이 **둘 다** 있고 둘은 다른 화면이다.
 * 이름이 헷갈리면 주소로 판단해라.
 *
 * ⚠ `pages/index.ts`(최상위 배럴)에 연결하지 않는다 — 그 배럴은 `MainPage`(eager) 전용이고,
 * 이 화면은 lazy 라우트 청크에서만 로드돼야 한다(랜딩과 같은 규약).
 */
export { default as HomePage } from './HomePage';
export type { HomePageViewProps, HomeViewModel } from './HomePage';
