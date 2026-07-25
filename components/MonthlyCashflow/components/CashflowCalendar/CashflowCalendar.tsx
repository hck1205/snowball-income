import type { CashflowCalendarProps } from './CashflowCalendar.types';
import {
  CalendarCell,
  CalendarGrid,
  CalendarItemRow,
  CalendarMonthLabel,
  CalendarTotal
} from './CashflowCalendar.styled';

/**
 * 캘린더 뷰 — 엔진의 월 분배가 아니라 **관측 지급월**로 재배분된 12칸을 보여준다.
 * 재배분 자체는 utils `buildCalendarMonths` 가 하고, 여기서는 그리기만 한다.
 */
function CashflowCalendar({ months, formatAmount, labelSuffix }: CashflowCalendarProps) {
  return (
    <CalendarGrid aria-label={`선택 연도의 배당 캘린더 (관측 지급월 기준)${labelSuffix}`}>
      {months.map((cell) => (
        <CalendarCell key={cell.month} $paying={cell.total > 0}>
          <CalendarMonthLabel>{cell.month}월</CalendarMonthLabel>
          <CalendarTotal>{cell.total > 0 ? formatAmount(cell.total) : '—'}</CalendarTotal>
          {cell.items.map((item) => (
            <CalendarItemRow key={item.name} $estimated={item.source !== 'pay'} title={item.name}>
              {item.name} {formatAmount(item.amount)}
              {item.source === 'ex' ? ' (추정)' : item.source === 'sim' ? ' (시뮬)' : ''}
            </CalendarItemRow>
          ))}
        </CalendarCell>
      ))}
    </CalendarGrid>
  );
}

export default CashflowCalendar;
