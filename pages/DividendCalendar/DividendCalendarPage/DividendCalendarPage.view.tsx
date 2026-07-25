import { useId } from 'react';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { Banner, Card, Chip } from '@/components/common';
import { DIVIDEND_CALENDAR_COPY } from '../copy';
import {
  AgendaList,
  CalendarToolbar,
  MonthCalendar,
  MonthCalendarSkeleton,
  ScheduleLegendTable,
  TickerPicker,
  UndatedSection
} from '../components';
import { getCalendarMonthOf, shiftCalendarMonth } from '../utils';
import type { DividendCalendarViewProps } from './DividendCalendarPage.types';
import { selectQuickPickOptions } from './DividendCalendarPage.utils';
import {
  AsOfLine,
  BoardColumn,
  CardStack,
  EmptyBody,
  EmptyStateCard,
  EmptyTitle,
  FootNote,
  HeroIconBadge,
  HeroLede,
  HeroTitle,
  LiveRegion,
  MonthSummaryLine,
  PageGrid,
  PageHero,
  PageStack,
  PickerColumn,
  QuickPickItem,
  QuickPickLabel,
  QuickPickList,
  SectionHead,
  SectionHeading,
  SelectedCount,
  SimulatorLink,
  UnavailableBody,
  UnavailableDetails,
  UnavailableItem,
  UnavailableList,
  UnavailableSummary
} from './DividendCalendarPage.styled';

const copy = DIVIDEND_CALENDAR_COPY;

/**
 * 순수 뷰 — 상태를 갖지 않고 props만 그린다.
 *
 * 로딩 / 빈 선택 / 정상 세 상태는 **JS 분기로 상호배타**다(미디어쿼리로 감추지 않는다).
 * 선택했지만 지급월 데이터가 전혀 없으면 달력 표를 그리지 않는다 — 빈 달력은 "지급이 없다"는
 * 거짓 주장이 된다. 반대로 **선택은 있는데 이 달만 비어 있는 경우엔 표를 그대로 그린다**(달력의
 * 모양이 곧 답이고, 요약 문구가 "이 달엔 없다"를 말한다).
 */
export default function DividendCalendarView({
  viewModel,
  status,
  today,
  isCurrentMonth,
  keyword,
  liveMessage,
  unknownTickers,
  onKeywordChange,
  onToggleTicker,
  onClearSelection,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSimulatorLinkClick
}: DividendCalendarViewProps) {
  const pickerHeadingId = useId();
  const monthTitleId = useId();

  const { selected, selectedWithData, unavailable, month, monthLabel } = viewModel;
  const isReady = status === 'ready';
  const showEmptyState = isReady && selected.length === 0;
  const showAllUnavailable = isReady && selected.length > 0 && selectedWithData === 0;
  const showCalendar = isReady && selectedWithData > 0;
  const quickPicks = selectQuickPickOptions(viewModel.options);

  const current = { year: month.year, month: month.month };
  const prev = shiftCalendarMonth(current, -1);
  const next = shiftCalendarMonth(current, 1);
  const todayMonth = getCalendarMonthOf(today);
  const undatedCount = month.undated.length;

  return (
    <PageStack>
      <PageHero>
        <HeroIconBadge>
          <CalendarDays size={20} strokeWidth={1.8} aria-hidden focusable={false} />
        </HeroIconBadge>
        <HeroTitle>{copy.hero.title}</HeroTitle>
        <HeroLede>{copy.hero.lede}</HeroLede>
        <AsOfLine>{viewModel.asOf ? copy.hero.asOf(viewModel.asOf) : copy.hero.asOfUnknown}</AsOfLine>
      </PageHero>

      <Banner tone="info" role="note" title={copy.disclaimer.title}>
        {copy.disclaimer.body}
      </Banner>

      <LiveRegion role="status" aria-live="polite">
        {liveMessage}
      </LiveRegion>

      {unknownTickers.length > 0 ? (
        <Banner tone="warning" role="status">
          {copy.error.unknownTickers(unknownTickers)}
        </Banner>
      ) : null}

      <PageGrid>
        <PickerColumn aria-labelledby={pickerHeadingId}>
          <Card>
            <CardStack>
              <SectionHead>
                <SectionHeading id={pickerHeadingId}>{copy.picker.heading}</SectionHeading>
                <SelectedCount>{copy.picker.selectedCount(selected.length)}</SelectedCount>
              </SectionHead>
              <TickerPicker
                options={viewModel.filtered}
                selected={selected}
                keyword={keyword}
                onKeywordChange={onKeywordChange}
                onToggle={onToggleTicker}
                onClear={onClearSelection}
              />
            </CardStack>
          </Card>

          {unavailable.length > 0 ? (
            <UnavailableDetails>
              <UnavailableSummary>
                <ChevronRight size={14} strokeWidth={1.8} aria-hidden focusable={false} />
                {copy.unavailableSection.summary(unavailable.length)}
              </UnavailableSummary>
              <UnavailableBody>{copy.unavailableSection.body}</UnavailableBody>
              <UnavailableList>
                {unavailable.map((option) => (
                  <UnavailableItem key={option.ticker}>{option.ticker}</UnavailableItem>
                ))}
              </UnavailableList>
            </UnavailableDetails>
          ) : null}
        </PickerColumn>

        <BoardColumn aria-labelledby={monthTitleId}>
          {/* 툴바는 표 바깥에 둔다 — 월을 넘겨도 버튼이 리마운트되지 않아 포커스가 유지된다(연타 가능). */}
          <CalendarToolbar
            monthLabel={monthLabel}
            prevLabel={copy.nav.monthLabel(prev.year, prev.month)}
            nextLabel={copy.nav.monthLabel(next.year, next.month)}
            todayLabel={copy.nav.monthLabel(todayMonth.year, todayMonth.month)}
            isCurrentMonth={isCurrentMonth}
            titleId={monthTitleId}
            onPrev={onPrevMonth}
            onNext={onNextMonth}
            onToday={onToday}
          />

          {showCalendar ? (
            <MonthSummaryLine>
              {month.datedCount === 0 && undatedCount === 0
                ? copy.board.summaryNone(monthLabel)
                : copy.board.summary(monthLabel, month.datedCount, undatedCount)}
            </MonthSummaryLine>
          ) : null}

          {status === 'loading' ? <MonthCalendarSkeleton monthLabel={monthLabel} /> : null}

          {showEmptyState ? (
            <EmptyStateCard>
              <EmptyTitle>{copy.empty.title}</EmptyTitle>
              <EmptyBody>{copy.empty.body}</EmptyBody>
              {quickPicks.length > 0 ? (
                <>
                  <QuickPickLabel>{copy.empty.quickPickLabel}</QuickPickLabel>
                  <QuickPickList>
                    {quickPicks.map((option) => (
                      <QuickPickItem key={option.ticker}>
                        <Chip title={option.koreanName} onClick={() => onToggleTicker(option.ticker)}>
                          {option.ticker}
                        </Chip>
                      </QuickPickItem>
                    ))}
                  </QuickPickList>
                </>
              ) : null}
            </EmptyStateCard>
          ) : null}

          {showAllUnavailable ? (
            <Banner tone="warning" role="status">
              {copy.empty.allUnavailable}
            </Banner>
          ) : null}

          {showCalendar ? (
            <>
              <MonthCalendar weeks={month.weeks} monthLabel={monthLabel} labelledById={monthTitleId} />
              <UndatedSection items={month.undated} />
              <AgendaList days={viewModel.agendaDays} hasUndated={undatedCount > 0} />
              <ScheduleLegendTable rows={viewModel.legendRows} />
            </>
          ) : null}

          <FootNote>{copy.disclaimer.monthSource}</FootNote>
          <FootNote>{copy.disclaimer.undatedNote}</FootNote>
          <SimulatorLink to="/" onClick={onSimulatorLinkClick}>
            {copy.cta.toSimulator}
          </SimulatorLink>
        </BoardColumn>
      </PageGrid>
    </PageStack>
  );
}
