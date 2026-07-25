import type { CalendarMonthCell } from '../../DividendCalendarPage';

export type MonthBoardProps = {
  /** 길이 12 고정, month 1..12. */
  months: CalendarMonthCell[];
  /** 1-12. "이번 달" 배지가 붙는 칸. */
  currentMonth: number;
};
