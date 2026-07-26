import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { MARKET_DATA } from '@/shared/constants/marketData';
import {
  focusAgendaDay,
  getCalendarMonthOf,
  getCalendarUniverse,
  isSameCalendarMonth,
  shiftCalendarMonth
} from '../utils';
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
  /**
   * 달력 칸 → 아젠다 이동 요청. **페이지 로컬 상태**다(전역 atom을 만들 이유가 없다 — 이 화면 밖에서
   * 의미가 없고 저장·공유 대상도 아니다).
   *
   * 재실행 자체는 **매 호출 새 객체 정체성**이 담보한다(같은 날짜를 다시 눌러도 참조가 달라 effect가 돈다).
   * `seq`는 "같은 날 재클릭도 새 요청"이라는 의도를 코드로 명시하는 표식이다 — 이 상태를 원시값
   * (`date` 문자열)으로 단순화하는 리팩터에서 재점프 계약이 조용히 사라지는 것을 막는다.
   */
  const [jumpRequest, setJumpRequest] = useState<{ date: string; seq: number } | null>(null);

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

  /**
   * 라이브 리전 문구는 **마지막 조작**을 따른다. 판정을 여기서 하는 이유: 선택 훅은 달 이동을 모르므로
   * `lastAction`('cleared')이 월 이동으로 저절로 낡지 않는다. 반대로 `monthAction`은 선택 조작 핸들러가
   * 즉시 비운다 — 그래서 "월 이동이 우선, 비어 있으면 선택 조작"이 시간 순서와 일치한다.
   * (예전처럼 `lastAction`을 먼저 보면 선택을 비운 뒤엔 '선택을 모두 해제했습니다'가 눌러앉아
   * 그 뒤의 월 이동이 영영 낭독되지 않는다.)
   */
  const effectiveAction: CalendarLastAction = monthAction === 'none' ? lastAction : monthAction;

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
    // 다른 달의 목록에 지난 달 강조가 남으면 거짓말이 된다.
    setJumpRequest(null);
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
    setJumpRequest(null);
  }, [resolvedToday]);

  const handleToggleTicker = useCallback(
    (ticker: string) => {
      // 종목을 고른 뒤엔 선택 요약이 읽혀야 한다(월 이동 안내가 남아 있으면 안 된다).
      setMonthAction('none');
      // 선택이 바뀌면 그 날짜의 구성도 바뀐다 — 강조를 들고 가지 않는다.
      setJumpRequest(null);
      toggleTicker(ticker);
    },
    [toggleTicker]
  );

  const handleClearSelection = useCallback(() => {
    setMonthAction('none');
    setJumpRequest(null);
    clearSelection();
  }, [clearSelection]);

  /**
   * 날짜 칸 → 아젠다 이동.
   *
   * 탭을 먼저 'agenda'로 되돌린다 — '날짜 미정' 탭을 보고 있으면 아젠다가 **아직 DOM에 없어서**
   * 그냥 스크롤하면 아무 일도 일어나지 않는다.
   */
  const handleDayJump = useCallback((isoDate: string) => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'dividend_calendar_day_jump',
      placement: 'dividend_calendar'
    });
    setDetailTab('agenda');
    setJumpRequest((prev) => ({ date: isoDate, seq: (prev?.seq ?? 0) + 1 }));
  }, []);

  /** 탭 전환·강조 렌더가 커밋된 **다음 프레임**에 찾는다(그 전엔 대상 노드가 없을 수 있다). */
  useEffect(() => {
    if (!jumpRequest) return undefined;

    const frame = requestAnimationFrame(() => focusAgendaDay(jumpRequest.date));
    return () => cancelAnimationFrame(frame);
  }, [jumpRequest]);

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
        highlightedAgendaDate={jumpRequest?.date ?? null}
        onKeywordChange={setKeyword}
        onDetailTabChange={setDetailTab}
        onOpenPicker={handleOpenPicker}
        onClosePicker={handleClosePicker}
        onDayJump={handleDayJump}
        onToggleTicker={handleToggleTicker}
        onClearSelection={handleClearSelection}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />
    </TickerPageShell>
  );
}
