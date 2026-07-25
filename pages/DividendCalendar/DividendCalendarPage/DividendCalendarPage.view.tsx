import { useId } from 'react';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { Banner, Card, Chip } from '@/components/common';
import { DIVIDEND_CALENDAR_COPY } from '../copy';
import { MonthBoard, MonthBoardSkeleton, ScheduleLegendTable, TickerPicker } from '../components';
import type { DividendCalendarViewProps } from './DividendCalendarPage.types';
import { selectQuickPickOptions } from './DividendCalendarPage.utils';
import {
  AsOfLine,
  BoardColumn,
  CardStack,
  CoverageNote,
  CoverageSummary,
  EmptyBody,
  EmptyStateCard,
  EmptyTitle,
  FootNote,
  HeroIconBadge,
  HeroLede,
  HeroTitle,
  LiveRegion,
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
 * 선택했지만 전원 데이터가 없는 경우엔 12칸 그리드를 아예 그리지 않는다 — 빈 12칸은
 * "지급이 없다"는 거짓말로 읽힌다.
 */
export default function DividendCalendarView({
  viewModel,
  status,
  currentMonth,
  keyword,
  liveMessage,
  unknownTickers,
  onKeywordChange,
  onToggleTicker,
  onClearSelection,
  onSimulatorLinkClick
}: DividendCalendarViewProps) {
  const pickerHeadingId = useId();
  const boardHeadingId = useId();

  const { selected, selectedWithData, payingMonthCount, emptyMonths, unavailable } = viewModel;
  const isReady = status === 'ready';
  const showEmptyState = isReady && selected.length === 0;
  const showAllUnavailable = isReady && selected.length > 0 && selectedWithData === 0;
  const showBoard = isReady && selectedWithData > 0;
  const quickPicks = selectQuickPickOptions(viewModel.options);

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

        <BoardColumn aria-labelledby={boardHeadingId}>
          <SectionHead>
            <SectionHeading id={boardHeadingId}>{copy.board.heading}</SectionHeading>
            <CoverageSummary>{copy.board.coverage(selected.length, payingMonthCount)}</CoverageSummary>
          </SectionHead>

          {status === 'loading' ? <MonthBoardSkeleton /> : null}

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

          {showBoard ? (
            <>
              <MonthBoard months={viewModel.months} currentMonth={currentMonth} />
              <CoverageNote>
                {emptyMonths.length === 0 ? copy.board.coverageFull : copy.board.coverageGap(emptyMonths)}
              </CoverageNote>
              <ScheduleLegendTable rows={viewModel.legendRows} />
            </>
          ) : null}

          <FootNote>{copy.disclaimer.monthOnly}</FootNote>
          <SimulatorLink to="/" onClick={onSimulatorLinkClick}>
            {copy.cta.toSimulator}
          </SimulatorLink>
        </BoardColumn>
      </PageGrid>
    </PageStack>
  );
}
