export { default as PrimaryNav, PrimaryNavLinks } from './PrimaryNav';
/*
 * 좁은 폭의 좌측 드로어(`components/NavDrawer`)와 사이트맵(`/sitemap`)이 같은 목적지 목록을 그린다 —
 * 세 곳이 각자 배열을 들면 메뉴가 조용히 갈린다. `PrimaryNav.utils` 가 유일한 출처다.
 *
 * 🔴 새 화면을 붙일 때 손대는 곳은 저 파일 하나다. 드로어·사이트맵은 `buildNavTree()` 를 통해
 *    자동으로 따라온다 — 여기서 항목을 다시 적지 마라.
 */
export {
  buildNavTree,
  isNavPathActive,
  CALENDAR_GROUP_ITEMS,
  COMMUNITY_GROUP_ITEMS,
  DIVIDEND_LIST_GROUP_ITEMS,
  MARKET_GROUP_ITEMS,
  PERSONAL_GROUP_ITEMS,
  PORTFOLIO_GROUP_ITEMS,
  TICKER_GROUP_ITEMS
} from './PrimaryNav.utils';
export type { NavColumn, NavGroup, NavLeaf, PrimaryNavProps } from './PrimaryNav.types';
