import type { CalendarMonth } from '../../MonthlyCashflow.utils';

export type CashflowCalendarProps = {
  /** 관측 지급월로 재배분된 12개월(utils `buildCalendarMonths` 결과). */
  months: CalendarMonth[];
  formatAmount: (value: number) => string;
  /** 달러 표시 중일 때 `aria-label` 에 붙는 접미. */
  labelSuffix: string;
};
