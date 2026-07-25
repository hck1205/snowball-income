import type { DayCell } from '../../utils';

export type MonthCalendarProps = {
  /** 6주 × 7일 고정. */
  weeks: DayCell[][];
  /** '2026년 7월' — `<caption>`에 들어간다. */
  monthLabel: string;
  /** 월 제목 `<h2>` 의 id. 표를 그 제목과 묶는다. */
  labelledById: string;
};
