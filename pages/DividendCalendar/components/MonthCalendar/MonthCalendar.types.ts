import type { DayCell } from '../../utils';

export type MonthCalendarProps = {
  /** 6주 × 7일 고정. */
  weeks: DayCell[][];
  /** '2026년 7월' — `<caption>`에 들어간다. */
  monthLabel: string;
  /** 월 제목 `<h2>` 의 id. 표를 그 제목과 묶는다. */
  labelledById: string;
  /**
   * 지급이 있는 날 칸을 눌렀을 때(ISO 'YYYY-MM-DD').
   * 미배선이면 버튼 자체를 렌더하지 않는다 — 격리 렌더에서도 누를 수 없는 버튼이 생기지 않는다.
   */
  onDayJump?: (isoDate: string) => void;
};
