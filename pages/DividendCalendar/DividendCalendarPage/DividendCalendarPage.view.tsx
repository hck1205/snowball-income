import { useId } from 'react';
import { CalendarDays, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Banner, Chip, PageFooter, PageHero } from '@/components/common';
import MarketIndexStrip from '@/components/MarketIndexStrip';
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
  BoardCard,
  BoardHead,
  BoardHint,
  DetailCard,
  DetailHead,
  DetailTitle,
  EmptyBody,
  EmptyStateCard,
  EmptyTitle,
  FilterButton,
  FilterCount,
  LiveRegion,
  MonthSummaryLine,
  PageStack,
  PreviewBadge,
  PreviewFrame,
  PreviewOverlay,
  QuickPickItem,
  QuickPickLabel,
  QuickPickList,
  UnavailableBody,
  UnavailableDetails,
  UndatedToggleButton,
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
 * 🔄 2026-07-31: 그 뼈대가 **비어 있기만 하던 것**을 고쳤다. 선택이 0종이면 같은 표에 대표 종목의
 * 실제 예상 지급일을 흐리게 깔고(`previewMonth`, 표현 전용) 안내 카드를 그 위에 띄운다 —
 * 회색 빈 칸 42개가 문서의 43%를 먹으면서 "여기서 무엇을 보게 되는지"는 한 글자도 말하지 않았다.
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
      {/* 🔴 페이지 **맨 위**의 참고 시세(2026-08-02 사용자 결정). 헤더에 얹었다가 되돌린 자리다 —
          헤더는 전 라우트에 상시 있어 시세가 필요 없는 화면(커뮤니티·티커 소개)까지 따라다녔다.
          지금은 시세가 실제로 도움이 되는 세 화면(시뮬레이터·배당 캘린더·내 포트폴리오)만 갖는다. */}
      <MarketIndexStrip />

      {/*
        이 페이지의 유일한 `<h1>`.

        ⚠ 예상 지급일 고지(`disclaimer.body`, 3줄)는 **히어로에서 뺐다** — 제목 + 리드 + 주의문 3줄 +
        기준일까지 담자 히어로가 본문 3덩어리가 되어 각주로 읽혔다(1280에서 히어로 222px). 고지는
        읽는 순간이 "달력을 본 뒤"라 페이지 하단 각주 묶음(`FootNoteCard`, `role="note"`)이 제자리다.
      */}
      <PageHero
        icon={<CalendarDays size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
        title={copy.hero.title}
        titleAs="h1"
        lede={copy.hero.lede}
        meta={viewModel.asOf ? copy.hero.asOf(viewModel.asOf) : copy.hero.asOfUnknown}
      />

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

        {/*
          빈 상태 = **예시 격자 + 그 위에 뜬 안내 카드**.

          구 화면은 "아직 선택한 종목이 없습니다" 카드와 **회색 빈 칸 42개**가 같은 말을 두 번 했고,
          그 격자가 1280에서 문서의 43%·뷰포트의 76%를 먹었다. 이제 그 지면이 "고르면 이런 게 보인다"를
          직접 보여준다(칩 4개 = 예시에 깔린 그 종목들이라, 누르면 흐린 것이 그 자리에서 선명해진다).

          🔴 예시는 **표현 전용**이다 — `previewMonth` 는 선택·저장소·주소 어디에도 들어가지 않는다.
        */}
        {showEmptyState ? (
          <PreviewFrame>
            <PreviewOverlay>
              <EmptyStateCard>
                <PreviewBadge>{copy.preview.label}</PreviewBadge>
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
            </PreviewOverlay>

            {viewModel.previewMonth ? (
              <MonthCalendar
                weeks={viewModel.previewMonth.weeks}
                monthLabel={monthLabel}
                labelledById={monthTitleId}
                isPreview
              />
            ) : null}
          </PreviewFrame>
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

        {/* 빈 상태에서는 위 `PreviewFrame` 안의 예시 표가 이 자리를 대신한다 — 표를 두 개 그리면
            같은 달의 서로 다른 달력이 위아래로 겹쳐 어느 쪽이 사실인지 알 수 없게 된다. */}
        {isReady && !showEmptyState ? (
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
          {/* 섹션 라벨은 이 제목 **한 곳**이다(사용자 결정 2026-07-26 — 탭+제목 중복 정리의 최종형).
              미정 전환은 제목 오른쪽의 토글 하나 — "지급 일정 목록" 탭을 따로 두면 제목과 같은 말이
              두 번 보인다. 미정 0건이면 토글도 없다. */}
          <DetailHead>
            <DetailTitle>{copy.agenda.heading}</DetailTitle>
            {undatedCount > 0 ? (
              <UndatedToggleButton
                type="button"
                $active={activeDetailTab === 'undated'}
                aria-pressed={activeDetailTab === 'undated'}
                onClick={() => onDetailTabChange(activeDetailTab === 'undated' ? 'agenda' : 'undated')}
              >
                {copy.detailTabs.undated(undatedCount)}
              </UndatedToggleButton>
            ) : null}
          </DetailHead>

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

      {/* 각주 + 사이트 공통 고지 = 공용 푸터 한 벌(2026-07-31 수렴 — 구 로컬 `FootNoteCard`).
          문구는 **원문 그대로**이고, 히어로 `notice` 슬롯에서 물려받은 `role="note"` 도 첫 줄에 그대로
          남는다(자리만 바뀌고 의미는 그대로다). */}
      <PageFooter
        notes={[
          <span key="body" role="note">
            {copy.disclaimer.body}
          </span>,
          copy.disclaimer.monthSource,
          copy.disclaimer.undatedNote
        ]}
      />

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
