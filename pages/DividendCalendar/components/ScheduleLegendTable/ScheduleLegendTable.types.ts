import type { ScheduleLegendRow } from '../../DividendCalendarPage';

export type ScheduleLegendTableProps = {
  /** 지급월 데이터가 있는 선택 종목만. 비어 있으면 아무것도 렌더하지 않는다. */
  rows: ScheduleLegendRow[];
};
