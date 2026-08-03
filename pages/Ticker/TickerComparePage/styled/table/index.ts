/* ==========================================================================
   비교표 — 이 화면의 본문. 원본 `TickerComparePage.styled.ts` 의 "비교표" 구획을
   값 변경 없이 세 파일로 나눈 것이다.
     frame.ts  가로 스크롤 상자 · 스크롤 힌트 · 표 몸통 (sticky 를 성립시키는 전제가 여기 있다)
     head.ts   좌상단 모서리 · 종목 열 머리 · 행 묶음 머리
     cells.ts  항목 칸 · 출처 배지 · 값 칸
   ⚠ 셋은 한 표의 부분이라 서로를 전제한다 — 층위(모서리 3 > 열 머리 2 > 항목 열 1)와
     `METRIC_COLUMN_WIDTH` 는 head.ts·cells.ts 가 함께 지킨다.
   ========================================================================== */

export { TableScroller, ScrollHint, Table } from './frame';

export { HeadCorner, HeadCell, HeadTicker, HeadName, GroupHead, GroupTitle, GroupDesc } from './head';

export {
  MetricCell,
  MetricLabelRow,
  MetricLabel,
  MetricNote,
  BasisBadge,
  ValueCell,
  ValueText,
  UnknownValue,
  ExtremeMark
} from './cells';
