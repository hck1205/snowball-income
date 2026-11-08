import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MARKET_CALENDAR, earlyClosesOfYear, holidaysOfYear } from '@/shared/constants/marketCalendar';
import { MARKET_CALENDAR_COPY } from '@/pages/MarketCalendar/copy';
import { findNextClosure, formatMonthDay } from '@/pages/MarketCalendar/utils';
import MarketCalendarView from '@/pages/MarketCalendar/MarketCalendarPage/MarketCalendarPage.view';

/**
 * 첫 화면의 "다음 휴장일"(2026-11-09).
 *
 * 이 페이지의 대표 검색어가 "미국 증시 휴장일"인데 그 답(휴장일 표)은 페이지 맨 아래였다. 잠그는 것:
 * ① 오늘 포함 이후 첫 휴장·조기폐장을 고른다 ② 올해에 남은 것이 없으면 내년으로 넘어간다
 * ③ "오늘과 다음 거래일" 묶음에 그 답이 보인다.
 */
const copy = MARKET_CALENDAR_COPY;

const firstClosureOf = (year: number) =>
  [...holidaysOfYear(year), ...earlyClosesOfYear(year)].sort((left, right) => left.date.localeCompare(right.date))[0];

describe('findNextClosure', () => {
  it('오늘 이후 가장 가까운 휴장·조기폐장을 고른다', () => {
    const first = firstClosureOf(2026)!;
    const [year, month, day] = first.date.split('-').map(Number) as [number, number, number];
    const dayBefore = new Date(year, month - 1, day - 1);

    expect(findNextClosure(dayBefore)?.date).toBe(first.date);
  });

  it('🔴 그날 당일이면 그날을 고른다 (오늘 휴장인데 다음 휴장을 보여 주지 않는다)', () => {
    const first = firstClosureOf(2026)!;
    const [year, month, day] = first.date.split('-').map(Number) as [number, number, number];

    expect(findNextClosure(new Date(year, month - 1, day))?.date).toBe(first.date);
  });

  it('올해에 남은 것이 없으면 내년 첫 휴장으로 넘어간다 (12월 말 방문자)', () => {
    const nextYearFirst = firstClosureOf(2027);
    if (!nextYearFirst) return; // 내년 큐레이션이 아직 없으면 검사 대상이 없다.
    expect(findNextClosure(new Date(2026, 11, 31))?.date).toBe(nextYearFirst.date);
  });
});

describe('캘린더 첫 화면', () => {
  it('🔴 "오늘과 다음 거래일" 묶음에 다음 휴장일과 그 이름이 보인다', () => {
    const today = new Date(2026, 10, 9);
    const next = findNextClosure(today)!;

    render(
      <MemoryRouter>
        <MarketCalendarView
          viewModel={{ today, year: 2026, snapshot: MARKET_CALENDAR, closures: [], earnings: [] }}
        />
      </MemoryRouter>
    );

    // 같은 날짜가 아래 "다가오는 일정"에도 있다 — 라벨이 붙은 **그 칸**으로 좁혀 본다.
    let tile: HTMLElement | null = screen.getByText(copy.today.nextClosureLabel);
    for (let depth = 0; depth < 4 && tile && !tile.textContent?.includes(next.nameKo); depth += 1) {
      tile = tile.parentElement;
    }
    expect(tile?.textContent).toContain(formatMonthDay(next.date));
    expect(tile?.textContent).toContain(next.nameKo);
    expect(tile?.textContent).not.toContain(copy.today.etLabel); // 묶음 전체가 아니라 그 칸이다
  });
});
