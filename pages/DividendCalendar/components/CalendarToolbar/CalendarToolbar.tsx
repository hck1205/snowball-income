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
      {/*
        🔴 **보이는 텍스트를 되살렸다**(2026-08-07 사용자 신고: "달력 아이콘의 존재 의미를 모르겠다").
        2026-07-26 에 아이콘만 남겼는데, 달력 그림은 "이번 달로 돌아간다"를 말하지 못한다 —
        하물며 여기는 캘린더 화면이라 달력 아이콘이 무엇도 가리키지 않는다.

        ⚠ 현재 달에서 **숨기지 않고 비활성으로 둔다**(미국 증시 캘린더는 숨긴다 — 여기만 다르다).
          누르는 순간 사라지면 포커스가 body 로 떨어져 키보드 사용자가 자리를 잃는다. 그 계약을
          테스트가 지키고 있다(dividendCalendarPage.behavior — "포커스 유지"). 비활성 버튼은
          "이미 이번 달이다"를 말하는 상태이기도 하다.
      */}
      <TodayButton
        type="button"
        aria-label={copy.nav.todayAria(todayLabel)}
        disabled={isCurrentMonth}
        onClick={onToday}
      >
        <CalendarDays size={16} strokeWidth={1.8} aria-hidden focusable={false} />
        {copy.nav.today}
      </TodayButton>
    </ToolbarRoot>
  );
}
