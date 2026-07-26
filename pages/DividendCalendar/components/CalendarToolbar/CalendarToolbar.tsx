import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { DIVIDEND_CALENDAR_COPY } from '../../copy';
import type { CalendarToolbarProps } from './CalendarToolbar.types';
import { MonthTitle, NavButton, ToolbarRoot, TodayButton } from './CalendarToolbar.styled';

const copy = DIVIDEND_CALENDAR_COPY;

/**
 * 월 이동 툴바.
 *
 * 월 제목에 `aria-live`를 붙이지 않는다 — 월 변경 안내는 페이지의 공용 라이브 리전 한 곳에서만 한다
 * (제목까지 라이브로 만들면 같은 말이 두 번 낭독된다). 표시 중인 달이 이미 이번 달이면 "이번 달"
 * 버튼은 누를 이유가 없으므로 `disabled` — 눌러도 아무 일이 없는 버튼을 활성으로 두는 게 더 나쁘다.
 */
export default function CalendarToolbar({
  monthLabel,
  prevLabel,
  nextLabel,
  todayLabel,
  isCurrentMonth,
  titleId,
  onPrev,
  onNext,
  onToday
}: CalendarToolbarProps) {
  return (
    <ToolbarRoot role="group" aria-label={copy.nav.groupLabel}>
      <NavButton type="button" aria-label={copy.nav.prev(prevLabel)} onClick={onPrev}>
        <ChevronLeft size={16} strokeWidth={1.8} aria-hidden focusable={false} />
      </NavButton>
      <MonthTitle id={titleId}>{monthLabel}</MonthTitle>
      <NavButton type="button" aria-label={copy.nav.next(nextLabel)} onClick={onNext}>
        <ChevronRight size={16} strokeWidth={1.8} aria-hidden focusable={false} />
      </NavButton>
      {/* "이번 달" 텍스트는 뺐다(사용자 결정 2026-07-26) — 아이콘 전용, 접근명은 그대로 말한다. */}
      <TodayButton
        type="button"
        aria-label={copy.nav.todayAria(todayLabel)}
        disabled={isCurrentMonth}
        onClick={onToday}
      >
        <CalendarDays size={16} strokeWidth={1.8} aria-hidden focusable={false} />
      </TodayButton>
    </ToolbarRoot>
  );
}
