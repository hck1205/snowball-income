import { useCallback, useMemo, useState } from 'react';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { MARKET_DATA } from '@/shared/constants/marketData';
import { getCalendarUniverse } from '../utils';
import { useCalendarSelection } from '../hooks';
import { DIVIDEND_CALENDAR_COPY } from '../copy';
import DividendCalendarView from './DividendCalendarPage.view';
import type { DividendCalendarPageProps } from './DividendCalendarPage.types';
import { buildCalendarLiveMessage, buildDividendCalendarViewModel } from './DividendCalendarPage.utils';

const copy = DIVIDEND_CALENDAR_COPY;

/**
 * `/dividend/calendar` 컨테이너 — 상태(선택·검색어)를 조립해 순수 뷰에 넘긴다.
 *
 * 유니버스와 스냅샷은 빌드 시점에 고정된 정적 데이터라 마운트당 한 번만 조인한다.
 * 이 화면은 시뮬레이션을 돌리지 않는다 — "언제 주는가"만 답한다.
 */
export default function DividendCalendarPage({ currentMonth }: DividendCalendarPageProps = {}) {
  const universe = useMemo(() => getCalendarUniverse(), []);
  const [keyword, setKeyword] = useState('');
  const { selected, status, lastAction, unknownTickers, toggleTicker, clearSelection } =
    useCalendarSelection(universe);

  useDocumentMeta({
    title: copy.meta.title,
    description: copy.meta.description,
    pathname: copy.meta.pathname
  });

  const viewModel = useMemo(
    () => buildDividendCalendarViewModel({ universe, keyword, selected, asOf: MARKET_DATA.asOf }),
    [keyword, selected, universe]
  );

  const liveMessage = useMemo(
    () =>
      buildCalendarLiveMessage({
        status,
        keyword,
        filteredCount: viewModel.filtered.length,
        selectedCount: selected.length,
        payingMonthCount: viewModel.payingMonthCount,
        lastAction
      }),
    [keyword, lastAction, selected.length, status, viewModel.filtered.length, viewModel.payingMonthCount]
  );

  const handleSimulatorLinkClick = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'dividend_calendar_to_simulator',
      placement: 'dividend_calendar'
    });
  }, []);

  // 로컬 타임존 기준의 "이번 달". 테스트는 props로 고정할 수 있다.
  const resolvedCurrentMonth = currentMonth ?? new Date().getMonth() + 1;

  return (
    <TickerPageShell>
      <DividendCalendarView
        viewModel={viewModel}
        status={status}
        currentMonth={resolvedCurrentMonth}
        keyword={keyword}
        liveMessage={liveMessage}
        unknownTickers={unknownTickers}
        onKeywordChange={setKeyword}
        onToggleTicker={toggleTicker}
        onClearSelection={clearSelection}
        onSimulatorLinkClick={handleSimulatorLinkClick}
      />
    </TickerPageShell>
  );
}
