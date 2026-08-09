export { default as PrimaryNav, PrimaryNavLinks } from './PrimaryNav';
/* 좁은 폭의 좌측 드로어(`components/NavDrawer`)가 같은 목적지 목록을 그린다 — 두 곳이 각자
   배열을 들면 메뉴가 조용히 갈린다. 이 배열이 유일한 출처다. */
export {
  CALENDAR_GROUP_ITEMS,
  COMMUNITY_GROUP_ITEMS,
  DIVIDEND_LIST_GROUP_ITEMS,
  MARKET_GROUP_ITEMS,
  PERSONAL_GROUP_ITEMS,
  PORTFOLIO_GROUP_ITEMS,
  TICKER_GROUP_ITEMS
} from './PrimaryNav';
export type { PrimaryNavProps } from './PrimaryNav.types';
