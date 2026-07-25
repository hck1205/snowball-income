import { useCallback, useMemo, useRef, useState } from 'react';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { MARKET_DATA } from '@/shared/constants/marketData';
import { getCalendarMonthOf, getCalendarUniverse, isSameCalendarMonth, shiftCalendarMonth } from '../utils';
import type { CalendarYearMonth } from '../utils';
import { useCalendarSelection } from '../hooks';
import { DIVIDEND_CALENDAR_COPY } from '../copy';
import DividendCalendarView from './DividendCalendarPage.view';
import type {
  CalendarDetailTab,
  CalendarLastAction,
  DividendCalendarPageProps
} from './DividendCalendarPage.types';
import { buildCalendarLiveMessage, buildDividendCalendarViewModel } from './DividendCalendarPage.utils';

const copy = DIVIDEND_CALENDAR_COPY;

/**
 * `/dividend/calendar` 컨테이너 — 상태(선택·검색어·표시 중인 달)를 조립해 순수 뷰에 넘긴다.
 *
 * '오늘'은 **여기서 한 번만** 만들어 뷰와 유틸에 주입한다. 아래 계층이 각자 `new Date()` 를 부르면
 * 렌더 사이에 날짜가 갈릴 수 있고(자정 경계) 테스트가 실제 날짜에 매인다.
 * 이 화면은 시뮬레이션을 돌리지 않는다 — "언제 주는가"만 답한다.
 */
export default function DividendCalendarPage({ today }: DividendCalendarPageProps = {}) {
  const universe = useMemo(() => getCalendarUniverse(), []);
  const resolvedToday = useRef(today ?? new Date()).current;

  const [keyword, setKeyword] = useState('');
  const [visibleMonth, setVisibleMonth] = useState<CalendarYearMonth>(() =>
    getCalendarMonthOf(resolvedToday)
  );
  const [monthAction, setMonthAction] = useState<CalendarLastAction>('none');
  // 달을 옮겨도 보고 있던 탭은 유지한다 — 미정만 훑는 사람이 매달 다시 누르게 하지 않는다.
  const [detailTab, setDetailTab] = useState<CalendarDetailTab>('agenda');
  /**
   * 종목 선택 드로어. 고른 뒤 자동으로 닫지 않는다 — 대개 여러 종목을 연달아 고르고,
   * 첫 선택마다 닫히면 매번 다시 열어야 한다(결과는 뒤에서 실시간으로 갱신된다).
   */
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const { selected, status, lastAction, unknownTickers, toggleTicker, clearSelection } =
    useCalendarSelection(universe);

  useDocumentMeta({
    title: copy.meta.title,
    description: copy.meta.description,
    pathname: copy.meta.pathname
  });

  const viewModel = useMemo(
    () =>
      buildDividendCalendarViewModel({
        universe,
        keyword,
        selected,
        asOf: MARKET_DATA.asOf,
        year: visibleMonth.year,
        month: visibleMonth.month,
        today: resolvedToday
      }),
    [keyword, resolvedToday, selected, universe, visibleMonth.month, visibleMonth.year]
  );

  // 선택을 바꾸면 월 이동 안내는 낡은다 — 마지막 조작이 무엇이었는지로 라이브 리전 문구를 가른다.
  const effectiveAction: CalendarLastAction = lastAction === 'none' ? monthAction : lastAction;

  const liveMessage = useMemo(
    () =>
      buildCalendarLiveMessage({
        status,
        keyword,
        filteredCount: viewModel.filtered.length,
        selectedCount: selected.length,
        monthLabel: viewModel.monthLabel,
        datedCount: viewModel.month.datedCount,
        undatedCount: viewModel.month.undated.length,
        lastAction: effectiveAction
      }),
    [
      effectiveAction,
      keyword,
      selected.length,
      status,
      viewModel.filtered.length,
      viewModel.month.datedCount,
      viewModel.month.undated.length,
      viewModel.monthLabel
    ]
  );

  const moveMonth = useCallback((delta: number, ctaName: string) => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: ctaName, placement: 'dividend_calendar' });
    setVisibleMonth((prev) => shiftCalendarMonth(prev, delta));
    setMonthAction('month');
  }, []);

  const handlePrevMonth = useCallback(() => moveMonth(-1, 'dividend_calendar_month_prev'), [moveMonth]);
  const handleNextMonth = useCallback(() => moveMonth(1, 'dividend_calendar_month_next'), [moveMonth]);

  const handleToday = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'dividend_calendar_month_today',
      placement: 'dividend_calendar'
    });
    setVisibleMonth(getCalendarMonthOf(resolvedToday));
    setMonthAction('month');
  }, [resolvedToday]);

  const handleToggleTicker = useCallback(
    (ticker: string) => {
      // 종목을 고른 뒤엔 선택 요약이 읽혀야 한다(월 이동 안내가 남아 있으면 안 된다).
      setMonthAction('none');
      toggleTicker(ticker);
    },
    [toggleTicker]
  );

  const handleClearSelection = useCallback(() => {
    setMonthAction('none');
    clearSelection();
  }, [clearSelection]);

  const handleOpenPicker = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'dividend_calendar_picker_open',
      placement: 'dividend_calendar'
    });
    setIsPickerOpen(true);
  }, []);

  const handleClosePicker = useCallback(() => setIsPickerOpen(false), []);


  return (
    <TickerPageShell>
      <DividendCalendarView
        viewModel={viewModel}
        status={status}
        today={resolvedToday}
        isCurrentMonth={isSameCalendarMonth(visibleMonth, getCalendarMonthOf(resolvedToday))}
        keyword={keyword}
        detailTab={detailTab}
        isPickerOpen={isPickerOpen}
        liveMessage={liveMessage}
        unknownTickers={unknownTickers}
        onKeywordChange={setKeyword}
        onDetailTabChange={setDetailTab}
        onOpenPicker={handleOpenPicker}
        onClosePicker={handleClosePicker}
        onToggleTicker={handleToggleTicker}
        onClearSelection={handleClearSelection}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />
    </TickerPageShell>
  );
}
