// types leaf 직접 참조 — 페이지 배럴은 페이지 컴포넌트(이 컴포넌트의 소비자)를 재수출해 import 순환이 된다.
import type { ScheduleLegendRow } from '../../DividendCalendarPage/DividendCalendarPage.types';

export type ScheduleLegendTableProps = {
  /** 지급월 데이터가 있는 선택 종목만. 비어 있으면 아무것도 렌더하지 않는다. */
  rows: ScheduleLegendRow[];
};
