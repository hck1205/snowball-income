import { useId } from 'react';
import { CalendarDays, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Banner, Chip } from '@/components/common';
import { DIVIDEND_CALENDAR_COPY } from '../copy';
import {
  AgendaList,
  CalendarToolbar,
  MonthCalendar,
  MonthCalendarSkeleton,
  PickerDrawer,
  ScheduleLegendTable,
  TickerPicker,
  UndatedSection
} from '../components';
import { getCalendarMonthOf, shiftCalendarMonth } from '../utils';
import type { DividendCalendarViewProps } from './DividendCalendarPage.types';
import { selectQuickPickOptions } from './DividendCalendarPage.utils';
import {
  AsOfLine,
  BoardCard,
  BoardHead,
  BoardHint,
  DetailCard,
  DetailTabButton,
  DetailTabList,
  EmptyBody,
  EmptyStateCard,
  EmptyTitle,
  FilterButton,
  FilterCount,
  FootNote,
  FootNoteCard,
  HeroDisclaimer,
  HeroIconBadge,
  HeroLede,
  HeroTitle,
  HeroTitleRow,
  LiveRegion,
  MonthSummaryLine,
  PageHero,
  PageStack,
  QuickPickItem,
  QuickPickLabel,
  QuickPickList,
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
 * **월간 달력 표는 로딩만 아니면 항상 그린다**(사용자 결정 2026-07-25). 선택이 없거나 선택 종목에
 * 지급월 데이터가 없어도 빈 달력이 화면의 뼈대로 남아 있어야 이 페이지가 무엇을 하는 곳인지 읽힌다.
 * 대신 "지급이 없다"는 주장은 표가 하지 않는다 — 요약 줄·빈 상태 안내·경고 배너가 말한다
 * (요약과 상세 목록은 여전히 `selectedWithData > 0` 일 때만 붙는다).
 *
 * 종목 선택은 **우측 드로어**로 빠졌다(사용자 결정 2026-07-25) — 달력이 본문 전폭을 쓰고,
 * 화면에 남는 것은 달력·상세·각주 세 층뿐이다. 다만 "지금 몇 종을 보고 있나"와 빈 상태 안내는
 * 드로어 밖(달력 위)에 남는다: 드로어를 열지 않고도 상태를 알 수 있어야 한다.
 */
export default function DividendCalendarView({
  viewModel,
  status,
  today,
  isCurrentMonth,
  keyword,
  detailTab,
  isPickerOpen,
  liveMessage,
  unknownTickers,
  highlightedAgendaDate,
  onKeywordChange,
  onDetailTabChange,
  onOpenPicker,
  onClosePicker,
  onDayJump,
  onToggleTicker,
  onClearSelection,
  onPrevMonth,
  onNextMonth,
  onToday
}: DividendCalendarViewProps) {
  const monthTitleId = useId();
  const drawerId = useId();

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
  // 미정이 0건이면 그 탭은 사라진다 — 사라진 탭이 선택돼 있으면 빈 화면이 되므로 목록으로 접어 읽는다.
  const activeDetailTab = detailTab === 'undated' && undatedCount === 0 ? 'agenda' : detailTab;

  return (
    <PageStack>
      <PageHero>
        <HeroTitleRow>
          <HeroIconBadge>
            <CalendarDays size={20} strokeWidth={1.8} aria-hidden focusable={false} />
          </HeroIconBadge>
          <HeroTitle>{copy.hero.title}</HeroTitle>
        </HeroTitleRow>
        <HeroLede>{copy.hero.lede}</HeroLede>
        {/* 예상 지급일 고지 — 별도 배너 대신 히어로에 흡수(제목이 곧 맥락이라 disclaimer.title은 생략). */}
        <HeroDisclaimer role="note">{copy.disclaimer.body}</HeroDisclaimer>
        <AsOfLine>{viewModel.asOf ? copy.hero.asOf(viewModel.asOf) : copy.hero.asOfUnknown}</AsOfLine>
      </PageHero>

      <LiveRegion role="status" aria-live="polite">
        {liveMessage}
      </LiveRegion>

      {unknownTickers.length > 0 ? (
        <Banner tone="warning" role="status">
          {copy.error.unknownTickers(unknownTickers)}
        </Banner>
      ) : null}

      <BoardCard aria-labelledby={monthTitleId}>
        <BoardHead>
          <FilterButton
            type="button"
            aria-label={copy.picker.open(selected.length)}
            aria-expanded={isPickerOpen}
            aria-controls={drawerId}
            onClick={onOpenPicker}
          >
            <SlidersHorizontal size={16} strokeWidth={1.8} aria-hidden focusable={false} />
            {copy.picker.openShort}
            {selected.length > 0 ? <FilterCount aria-hidden>{selected.length}</FilterCount> : null}
          </FilterButton>
          {/* 별도의 "선택 N종" 텍스트는 두지 않는다(사용자 결정 2026-07-25 — 배지와 중복).
              개수는 배지가 눈으로, 버튼 접근명(`picker.open`)과 라이브 리전이 소리로 말한다. */}
        </BoardHead>

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
          <MonthSummaryLine>
            {month.datedCount === 0 && undatedCount === 0
              ? copy.board.summaryNone(monthLabel)
              : copy.board.summary(monthLabel, month.datedCount, undatedCount)}
          </MonthSummaryLine>
        ) : null}

        {status === 'loading' ? <MonthCalendarSkeleton monthLabel={monthLabel} /> : null}

        {isReady ? (
          <MonthCalendar
            weeks={month.weeks}
            monthLabel={monthLabel}
            labelledById={monthTitleId}
            onDayJump={onDayJump}
          />
        ) : null}

        {/* 누를 수 있는 날짜가 실제로 있을 때만 안내한다 — 없는 상호작용을 광고하지 않는다. */}
        {showCalendar && month.datedCount > 0 ? <BoardHint>{copy.board.jumpHint}</BoardHint> : null}
      </BoardCard>

      {showCalendar ? (
        <DetailCard>
          {/* 상세는 한 줄 전환으로 하나만 보여준다 — 목록 두 개가 세로로 쌓이면 달력에서 멀어진다.
              미정이 0건이면 전환할 대상이 없다 — 탭 한 개만 남는 줄은 통째로 그리지 않는다
              (사용자 결정 2026-07-26: "지급 일정 목록" 라벨 중복 제거의 일부). */}
          {undatedCount > 0 ? (
            <DetailTabList role="group" aria-label={copy.detailTabs.groupLabel}>
              <DetailTabButton
                type="button"
                $active={activeDetailTab === 'agenda'}
                aria-pressed={activeDetailTab === 'agenda'}
                onClick={() => onDetailTabChange('agenda')}
              >
                {copy.detailTabs.agenda}
              </DetailTabButton>
              <DetailTabButton
                type="button"
                $active={activeDetailTab === 'undated'}
                aria-pressed={activeDetailTab === 'undated'}
                onClick={() => onDetailTabChange('undated')}
              >
                {copy.detailTabs.undated(undatedCount)}
              </DetailTabButton>
            </DetailTabList>
          ) : null}

          {activeDetailTab === 'undated' ? (
            <UndatedSection items={month.undated} />
          ) : (
            <AgendaList
              days={viewModel.agendaDays}
              hasUndated={undatedCount > 0}
              highlightedDate={highlightedAgendaDate}
            />
          )}
          <ScheduleLegendTable rows={viewModel.legendRows} />
        </DetailCard>
      ) : null}

      <FootNoteCard>
        <FootNote>{copy.disclaimer.monthSource}</FootNote>
        <FootNote>{copy.disclaimer.undatedNote}</FootNote>
      </FootNoteCard>

      <PickerDrawer
        id={drawerId}
        isOpen={isPickerOpen}
        title={copy.picker.heading}
        closeLabel={copy.picker.close}
        onClose={onClosePicker}
      >
        <TickerPicker
          options={viewModel.filtered}
          selected={selected}
          keyword={keyword}
          onKeywordChange={onKeywordChange}
          onToggle={onToggleTicker}
          onClear={onClearSelection}
        />

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
      </PickerDrawer>
    </PageStack>
  );
}
