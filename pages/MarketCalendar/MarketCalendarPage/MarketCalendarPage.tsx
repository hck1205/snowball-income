import { useMemo } from 'react';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import {
  MARKET_CALENDAR,
  earlyClosesOfYear,
  holidaysOfYear,
  toCalendarDate
} from '@/shared/constants/marketCalendar';
import { MARKET_CALENDAR_COPY } from '../copy';
import MarketCalendarView from './MarketCalendarPage.view';
import type { MarketCalendarViewModel } from './MarketCalendarPage.types';

/** 실적 표에 보일 줄 수. 달력 칸이 나머지를 맡는다. */
const EARNINGS_ROWS = 40;

/**
 * `/market/us-calendar` — 미국 증시 캘린더.
 *
 * 데이터는 **두 겹**이다: 커밋된 큐레이션(휴장·조기폐장·FOMC)과 커밋된 생성물(경제지표·실적).
 * 둘 다 조회가 없다(네트워크 0). 갱신은 각각 손(연 1회)과 `npm run market:calendar`(주 1회).
 *
 * ⚠ `new Date()` 를 **여기서 한 번만** 부른다. 아래 계산·뷰는 전부 이 값을 받는다 —
 *   계층마다 각자 부르면 자정 언저리에 화면 안에서 날짜가 갈린다.
 */
export default function MarketCalendarPage() {
  const viewModel = useMemo<MarketCalendarViewModel>(() => {
    const today = new Date();
    const todayDate = toCalendarDate(today);
    const year = today.getFullYear();

    return {
      today,
      year,
      snapshot: MARKET_CALENDAR,
      closures: [...holidaysOfYear(year), ...earlyClosesOfYear(year)].sort((left, right) =>
        left.date.localeCompare(right.date)
      ),
      /* 지난 실적은 표에서 뺀다 — 캘린더 칸에는 남으므로 기록이 사라지지는 않는다. */
      earnings: MARKET_CALENDAR.earnings.filter((event) => event.date >= todayDate).slice(0, EARNINGS_ROWS)
    };
  }, []);

  useDocumentMeta({
    title: MARKET_CALENDAR_COPY.meta.title,
    description: MARKET_CALENDAR_COPY.meta.description,
    pathname: '/market/us-calendar'
  });

  return (
    <TickerPageShell>
      <MarketCalendarView viewModel={viewModel} />
    </TickerPageShell>
  );
}
