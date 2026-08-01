import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { LEDGER_COPY } from '../../copy';
import type { LedgerMonthNavProps } from './LedgerMonthNav.types';
import { MonthTitle, NavButton, NavRoot, TodayButton } from './LedgerMonthNav.styled';

const copy = LEDGER_COPY;

/**
 * 월 이동 알약.
 *
 * 🔴 월 제목에 `aria-live` 를 붙이지 않는다 — 월 변경 안내는 페이지의 공용 라이브 리전 한 곳에서만
 * 한다(제목까지 라이브로 만들면 같은 말이 두 번 낭독된다 — 캘린더가 세운 규칙).
 * 표시 중인 달이 이미 이번 달이면 "이번 달" 버튼은 누를 이유가 없으므로 `disabled` 다.
 *
 * ⚠ 만료 상태에서도 이 버튼들은 **활성으로 둔다**. 읽기 실패는 파괴적이지 않고, 사용자는 시도할
 * 권리가 있다(비활성은 쓰기에만 적용한다 — §4.7).
 */
export default function LedgerMonthNav({
  monthLabel,
  prevLabel,
  nextLabel,
  todayLabel,
  isCurrentMonth,
  titleId,
  onPrev,
  onNext,
  onToday
}: LedgerMonthNavProps) {
  return (
    <NavRoot role="group" aria-label={copy.month.groupLabel}>
      <NavButton type="button" aria-label={copy.month.prev(prevLabel)} onClick={onPrev}>
        <ChevronLeft size={16} strokeWidth={1.8} aria-hidden focusable={false} />
      </NavButton>
      <MonthTitle id={titleId}>{monthLabel}</MonthTitle>
      <NavButton type="button" aria-label={copy.month.next(nextLabel)} onClick={onNext}>
        <ChevronRight size={16} strokeWidth={1.8} aria-hidden focusable={false} />
      </NavButton>
      {/* 아이콘 전용 — 접근명만 텍스트로 말한다(캘린더 선례). */}
      <TodayButton
        type="button"
        aria-label={copy.month.todayAria(todayLabel)}
        disabled={isCurrentMonth}
        onClick={onToday}
      >
        <CalendarDays size={16} strokeWidth={1.8} aria-hidden focusable={false} />
      </TodayButton>
    </NavRoot>
  );
}
