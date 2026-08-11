import { useId } from 'react';
import { CalendarDays, CalendarRange, ChevronRight, ListChecks, SlidersHorizontal } from 'lucide-react';
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
import { getCalendarMonthOf, shiftCalendarMonth, tickerSeriesResolver } from '../utils';
import type { DividendCalendarViewProps } from './DividendCalendarPage.types';
import { selectQuickPickOptions } from './DividendCalendarPage.utils';
import {
  BoardHint,
  CardCount,
  CardHead,
  CardTitle,
  DeckBar,
  EmptyBody,
  EmptyGlyph,
  EmptyTitle,
  FilterButton,
  FilterCount,
  HeadSpacer,
  LedgerCard,
  LiveRegion,
  MapCard,
  MapZoneLabel,
  MonthDeck,
  MineNoteLine,
  MineSummaryLine,
  ModeTabButton,
  ModeTabs,
  MonthSummaryLine,
  NextLead,
  NextLeadBody,
  NextLeadCountdown,
  NextLeadDate,
  NextLeadDot,
  NextLeadLabel,
  NextLeadMain,
  NextLeadNote,
  NextLeadStatic,
  NextLeadTicker,
  NextLeadTickers,
  PageStack,
  PreviewBadge,
  PreviewPane,
  QuickPickDot,
  QuickPickItem,
  QuickPickLabel,
  QuickPickList,
  SectionGlyph,
  StartBench,
  StartCard,
  UnavailableBody,
  UnavailableDetails,
  UndatedToggleButton,
  UnavailableItem,
  UnavailableList,
  UnavailableSummary,
  Workbench
} from './styled';

const copy = DIVIDEND_CALENDAR_COPY;

/** 데크 판이 칩으로 세우는 종목 수. 넘치면 "외 N종"으로 접는다(판은 한 건의 요약이지 목록이 아니다). */
const DECK_TICKER_LIMIT = 4;

/**
 * 순수 뷰 — 상태를 갖지 않고 props만 그린다.
 *
 * ── 2026-08-03 2차 리워크: **무엇이 먼저 오는가**를 다시 정했다 ──────────────────
 *
 * 1차 리워크는 42칸 격자의 면 채움을 링·밑줄로 바꿨을 뿐 구성은 그대로였다. 그런데 이 화면의
 * 질문은 "이번 달 언제 들어오나"이고, 구 구성에서 그 답은 **달력 보드 978px 아래**에 있었다
 * (1280 실측: 히어로 174 · 보드 978 · 상세 405 — 답이 스크롤 밖이었다).
 *
 * 그래서 세 층으로 다시 세웠다.
 *
 * ```
 *  ① MonthDeck   — 조작(달 이동 + 종목 선택) · **다음 예상 지급 한 건** · 그 달 집계 한 줄
 *  ② Workbench   — 좌: 지급 일정 목록(주역) / 우: 월간 지급 지도 + 연간 지급 리듬(sticky 개관)
 *  ③ PageFooter  — 고지
 * ```
 *
 * **DOM 순서 = 답 → 목록 → 지도**다. 달력은 이제 화면의 주인이 아니라 옆에 붙어 따라다니는
 * 지도이고, 좁은 폭에서는 목록이 지도보다 **먼저** 온다.
 *
 * 🔴 **잃은 진입점은 하나도 없다.** 종목 선택 드로어·월 이동 3버튼·일자 점프·칩 툴팁·미정 토글·
 * 범례 표·빠른 선택 칩·데이터 없는 종목 접이식이 전부 그대로 있고, **데크의 판 하나가 늘었다**
 * (다음 지급일로 가는 지름길 — 달력 칸을 눈으로 찾지 않아도 된다).
 *
 * 종목 선택은 여전히 **우측 드로어**다(사용자 결정 2026-07-25). 다만 그 문을 여는 버튼은 달력
 * 카드 머리가 아니라 **데크 조작 줄**로 올라왔다 — "무엇을 보는가"와 "언제를 보는가"는 같은 종류의
 * 결정이라 한 줄에 선다.
 *
 * 🔴 예시 미리보기(`previewMonth`)는 **표현 전용**이다 — 선택·저장소·주소 어디에도 들어가지 않는다.
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
  mode,
  mine,
  onModeChange,
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
  const ledgerTitleId = useId();
  const mapTitleId = useId();

  const { selected, selectedWithData, unavailable, month, monthLabel, nextPayout } = viewModel;
  const isReady = status === 'ready';
  const isMine = mode === 'mine';
  /*
   * 내 배당 탭에서는 일반 빈 상태(종목 고르기 안내)를 쓰지 않는다 — 여기서 할 말은
   * "고르세요"가 아니라 "보유를 등록하세요"다(아래 `showMineEmpty`).
   */
  const showEmptyState = isReady && selected.length === 0 && !isMine;
  const showMineEmpty = isMine && mine.status === 'ready' && !mine.hasHoldings;
  const showAllUnavailable = isReady && selected.length > 0 && selectedWithData === 0;
  const showCalendar = isReady && selectedWithData > 0;
  const quickPicks = selectQuickPickOptions(viewModel.options);

  const current = { year: month.year, month: month.month };
  const prev = shiftCalendarMonth(current, -1);
  const next = shiftCalendarMonth(current, 1);
  const todayMonth = getCalendarMonthOf(today);
  const undatedCount = month.undated.length;

  /**
   * 🔴 **이 화면의 색 사전은 하나다.** 데크 칩 점 · 달력 칩 점 · 아젠다 막대 · 미정 점 · 범례 표가
   * 전부 이 함수를 받는다 — 부품이 각자 색을 정하면 2겹 배정(집합 내 충돌 회피)이 무너져 같은
   * 화면에서 두 종목이 같은 색을 갖는다. 그러면 "이 색이 곧 그 종목"이라는 길찾기 단서가 거짓말이 된다.
   *
   * 배정 집합은 **지금 화면에 실제로 그려지는 종목**이다: 고른 게 있으면 선택 집합, 하나도 없으면
   * 예시로 깔리는 추천 종목들. 예시 상태에서 추천 칩과 예시 격자의 같은 종목이 같은 색이어야
   * "누르면 이게 선명해진다"가 성립한다.
   *
   * ⚠ `useMemo` 를 걸지 않는다 — 의존값 중 `quickPicks` 가 매 렌더 새 배열이라 캐시가 절대 맞지 않고,
   * 배정 자체는 8종 이하의 순수 계산이다. "메모한 척"이 실제로 메모하지 않는 것이 더 나쁘다.
   */
  const seriesOf = tickerSeriesResolver(
    selected.length > 0 ? selected : quickPicks.map((option) => option.ticker)
  );
  // 미정이 0건이면 그 탭은 사라진다 — 사라진 탭이 선택돼 있으면 빈 화면이 되므로 목록으로 접어 읽는다.
  const activeDetailTab = detailTab === 'undated' && undatedCount === 0 ? 'agenda' : detailTab;

  const deckTickers = nextPayout ? nextPayout.tickers.slice(0, DECK_TICKER_LIMIT) : [];
  const deckHiddenTickers = nextPayout ? nextPayout.tickers.length - deckTickers.length : 0;

  /**
   * 데크의 판. 세 갈래고, 셋 다 **같은 기하**를 쓴다 — 상태에 따라 자리가 사라지면 그 위아래가
   * 매번 다른 높이로 뛴다.
   *
   * ⚠ 불러오는 중에는 아예 그리지 않는다. 아직 선택을 모르는 상태라 "이 달 예상 지급 없음"은
   *   거짓이 될 수 있다(라이브 리전이 "불러오는 중"을 이미 말한다).
   */
  const renderNextLead = () => {
    if (!isReady) return null;

    if (selected.length === 0) {
      return (
        <NextLeadStatic>
          <NextLeadMain>
            <NextLeadLabel>{copy.deck.emptyLabel}</NextLeadLabel>
            <NextLeadBody>{copy.deck.emptyLead}</NextLeadBody>
          </NextLeadMain>
        </NextLeadStatic>
      );
    }

    if (!nextPayout) {
      return (
        <NextLeadStatic>
          <NextLeadMain>
            <NextLeadLabel>{copy.deck.noneLabel}</NextLeadLabel>
            <NextLeadBody>{copy.deck.noneLead}</NextLeadBody>
          </NextLeadMain>
        </NextLeadStatic>
      );
    }

    return (
      <NextLead
        type="button"
        aria-label={copy.deck.jumpToDay(nextPayout.month, nextPayout.day)}
        onClick={() => onDayJump(nextPayout.date)}
      >
        <NextLeadMain>
          <NextLeadLabel>{nextPayout.isPast ? copy.deck.pastLabel : copy.deck.nextLabel}</NextLeadLabel>
          <NextLeadDate>
            {copy.deck.dateLine(nextPayout.month, nextPayout.day, copy.board.weekdays[nextPayout.weekday])}
          </NextLeadDate>
          <NextLeadTickers>
            {deckTickers.map((ticker) => (
              <NextLeadTicker key={ticker}>
                {/* 점은 장식이다 — 티커 글자가 바로 옆에서 같은 말을 하므로 회색조에서도 읽힌다. */}
                <NextLeadDot aria-hidden style={{ background: seriesOf(ticker) }} />
                {ticker}
              </NextLeadTicker>
            ))}
            {deckHiddenTickers > 0 ? (
              <NextLeadTicker>{copy.deck.tickerMore(deckHiddenTickers)}</NextLeadTicker>
            ) : null}
          </NextLeadTickers>
        </NextLeadMain>

        {/* 🔴 큰 숫자는 **D-N 일 때만**이다. '오늘 지급 예정'·'지난 일정'은 문장이라 6xl 로 키우면
            판을 넘치고, 무엇보다 셋을 같은 무게로 두면 "며칠 남았나"가 숫자로 안 읽힌다. */}
        {nextPayout.daysUntil !== null && nextPayout.daysUntil > 0 ? (
          <NextLeadCountdown>{copy.deck.countdown(nextPayout.daysUntil)}</NextLeadCountdown>
        ) : (
          <NextLeadNote>
            {nextPayout.daysUntil === 0 ? copy.deck.countdown(0) : copy.deck.countdownPast}
          </NextLeadNote>
        )}
      </NextLead>
    );
  };

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
        읽는 순간이 "달력을 본 뒤"라 페이지 하단 각주 묶음(`PageFooter`, `role="note"`)이 제자리다.
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

      {/* ── ① 데크 — 조작과 답이 한 판에 ──────────────────────────────────────── */}
      {/*
        DeckBar 는 데크 카드 **밖**에 있다(2026-08-07 사용자 지시: 붙은 조작 줄이 문서 끝까지
        따라와야 한다). position: sticky 는 **부모 상자 안에서만** 붙으므로, 카드 안에 두면
        카드가 화면 위로 지나가는 순간 떨어진다. 페이지 루트의 직계여야 문서 전체가 그 범위다.
      */}
      {/*
        ── 달력 종류 — "무엇을 보는가"는 달·종목보다 상위 결정이라 조작 줄 위에 선다.
      */}
      <ModeTabs role="group" aria-label={copy.mode.groupLabel}>
        <ModeTabButton
          type="button"
          $active={!isMine}
          aria-pressed={!isMine}
          onClick={() => onModeChange('all')}
        >
          {copy.mode.all}
        </ModeTabButton>
        <ModeTabButton
          type="button"
          $active={isMine}
          aria-pressed={isMine}
          onClick={() => onModeChange('mine')}
        >
          {copy.mode.mine}
        </ModeTabButton>
      </ModeTabs>

      {showMineEmpty ? (
        <Banner tone="info" role="status">
          {copy.mode.emptyTitle} — {copy.mode.emptyBody} <a href={copy.mode.emptyCtaHref}>{copy.mode.emptyCta}</a>
        </Banner>
      ) : null}

      {isMine && mine.status === 'read-error' ? (
        <Banner tone="warning" role="status">
          {copy.mode.readError}
        </Banner>
      ) : null}

      <DeckBar>
        {/* 툴바는 표 바깥에 있다 — 월을 넘겨도 버튼이 리마운트되지 않아 포커스가 유지된다(연타 가능). */}
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
        <HeadSpacer />
        {/* 🔴 내 배당 탭에는 종목 선택이 없다 — 목록을 정하는 것은 보유이지 취향이 아니다. */}
        {isMine ? null : (
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
        )}
        {/* 별도의 "선택 N종" 텍스트는 두지 않는다(사용자 결정 2026-07-25 — 배지와 중복).
            개수는 배지가 눈으로, 버튼 접근명(`picker.open`)과 라이브 리전이 소리로 말한다. */}
      </DeckBar>

      <MonthDeck aria-labelledby={monthTitleId}>

        {renderNextLead()}

        {isMine && mine.totalLabel !== null ? (
          <MineSummaryLine>{copy.mode.mineTotal(monthLabel, mine.totalLabel, mine.entryCount)}</MineSummaryLine>
        ) : null}
        {isMine && mine.status === 'ready' && mine.hasHoldings && mine.totalLabel === null ? (
          <MineSummaryLine>{copy.mode.mineNone(monthLabel)}</MineSummaryLine>
        ) : null}
        {isMine && mine.unknownCount > 0 ? (
          <MineNoteLine>{copy.mode.mineUnknown(mine.unknownCount)}</MineNoteLine>
        ) : null}

        {showCalendar ? (
          <MonthSummaryLine>
            {month.datedCount === 0 && undatedCount === 0
              ? copy.board.summaryNone(monthLabel)
              : copy.board.summary(monthLabel, month.datedCount, undatedCount)}
          </MonthSummaryLine>
        ) : null}
      </MonthDeck>

      {showAllUnavailable ? (
        <Banner tone="warning" role="status">
          {copy.empty.allUnavailable}
        </Banner>
      ) : null}

      {status === 'loading' ? (
        <PreviewPane>
          <MonthCalendarSkeleton monthLabel={monthLabel} />
        </PreviewPane>
      ) : null}

      {/*
        ── 빈 상태 — 이 화면의 유일한 "고르는 면" ────────────────────────────────

        구 화면은 예시 격자 **위에** 안내 카드를 절대 배치로 띄웠다(두 층이 서로를 가렸다).
        이제는 겹치지 않는다: 왼쪽에 고르는 카드(brand · 큰 반경 · 레일 캡), 오른쪽에 흐린 예시 달력.
        작업대와 **같은 2열 골격**이라, 칩을 누르면 오른쪽의 흐린 것이 그 자리에서 선명해진다.
      */}
      {showEmptyState ? (
        <StartBench>
          <StartCard>
            <EmptyGlyph aria-hidden>
              <CalendarDays size={24} strokeWidth={1.8} focusable={false} />
            </EmptyGlyph>
            <PreviewBadge>{copy.preview.label}</PreviewBadge>
            <EmptyTitle>{copy.empty.title}</EmptyTitle>
            <EmptyBody>{copy.empty.body}</EmptyBody>
            {quickPicks.length > 0 ? (
              <>
                <QuickPickLabel>{copy.empty.quickPickLabel}</QuickPickLabel>
                <QuickPickList>
                  {quickPicks.map((option) => (
                    <QuickPickItem key={option.ticker}>
                      {/* 점은 칩 **밖**에 둔다 — 칩의 접근명은 티커 한 단어여야 한다(장식이 이름에 섞이면
                          "SCHD 색 점" 같은 이름이 된다). 옆의 예시 격자에서 같은 종목이 같은 색을 단다. */}
                      <QuickPickDot aria-hidden style={{ background: seriesOf(option.ticker) }} />
                      <Chip title={option.koreanName} onClick={() => onToggleTicker(option.ticker)}>
                        {option.ticker}
                      </Chip>
                    </QuickPickItem>
                  ))}
                </QuickPickList>
              </>
            ) : null}
          </StartCard>

          {viewModel.previewMonth ? (
            <PreviewPane>
              <MonthCalendar
                weeks={viewModel.previewMonth.weeks}
                monthLabel={monthLabel}
                labelledById={monthTitleId}
                seriesOf={seriesOf}
                compact
                isPreview
              />
            </PreviewPane>
          ) : null}
        </StartBench>
      ) : null}

      {/* ── ② 작업대 — 주역은 왼쪽 목록, 달력은 따라붙는 지도 ────────────────── */}
      {showCalendar ? (
        <Workbench>
          <LedgerCard aria-labelledby={ledgerTitleId}>
            {/* 섹션 라벨은 이 제목 **한 곳**이다(사용자 결정 2026-07-26 — 탭+제목 중복 정리의 최종형).
                미정 전환은 제목 오른쪽의 토글 하나 — 미정 0건이면 토글도 없다. */}
            <CardHead>
              <SectionGlyph aria-hidden>
                <ListChecks size={18} strokeWidth={1.8} focusable={false} />
              </SectionGlyph>
              <CardTitle id={ledgerTitleId}>{copy.ledger.sectionLabel}</CardTitle>
              {month.datedCount > 0 ? <CardCount>{copy.ledger.count(month.datedCount)}</CardCount> : null}
              <HeadSpacer />
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
            </CardHead>

            {activeDetailTab === 'undated' ? (
              <UndatedSection items={month.undated} seriesOf={seriesOf} />
            ) : (
              <AgendaList
                days={viewModel.agendaDays}
                hasUndated={undatedCount > 0}
                /* 금액은 내 배당 탭에서만 — 전체 탭에는 수량이 없어 낼 수 있는 금액이 없다. */
                amountLabelByTicker={isMine ? mine.amountLabelByTicker : undefined}
                highlightedDate={highlightedAgendaDate}
                seriesOf={seriesOf}
              />
            )}

            {/* 같은 데이터의 **전치**(종목 × 12개월). 달력이 "이 달에 누가"를 답하면 이쪽은
                "이 종목이 언제"를 답한다. 훑어보기라는 성격은 지도 열과 같지만, 13열짜리 표는
                460px 열에서 데스크톱에서도 가로 스크롤이 남는다 — **표가 요구하는 폭**이 배치를
                정한다. 기본은 접혀 있다(네이티브 details, JS 상태 없음). */}
            {viewModel.legendRows.length > 0 ? (
              <>
                <MapZoneLabel>{copy.ledger.legendLabel}</MapZoneLabel>
                <ScheduleLegendTable rows={viewModel.legendRows} seriesOf={seriesOf} />
              </>
            ) : null}
          </LedgerCard>

          <MapCard aria-labelledby={mapTitleId}>
            <CardHead>
              <SectionGlyph aria-hidden>
                <CalendarRange size={18} strokeWidth={1.8} focusable={false} />
              </SectionGlyph>
              <CardTitle id={mapTitleId}>{copy.board.sectionLabel}</CardTitle>
            </CardHead>

            <MonthCalendar
              weeks={month.weeks}
              monthLabel={monthLabel}
              labelledById={monthTitleId}
              seriesOf={seriesOf}
              compact
              onDayJump={onDayJump}
            />

            {/* 누를 수 있는 날짜가 실제로 있을 때만 안내한다 — 없는 상호작용을 광고하지 않는다. */}
            {month.datedCount > 0 ? <BoardHint>{copy.board.jumpHint}</BoardHint> : null}
          </MapCard>
        </Workbench>
      ) : null}

      {/*
        고른 종목에 **놓을 일정이 하나도 없는** 경우(배당 없음·데이터 준비 중만 고른 상태).
        위 경고 배너가 이유를 말하고, 달력은 **빈 채로 남는다** — 화면의 뼈대이자 "여기가 무엇을
        하는 곳인지"를 계속 말하는 자리다(사용자 결정 2026-07-25).

        🔴 지급 일정 목록은 그리지 않는다. 놓인 일정이 0건인데 목록을 세우면 "이 달에는 지급 예정이
        없습니다"가 경고 배너와 같은 말을 두 번 하고, 원인(종목 자체에 일정이 없다)과 결과(이 달에
        없다)가 뒤섞인다. 옆에 세울 목록이 없으므로 지도는 작업대 밖에서 전폭으로 선다.

        🔴 여기서도 `compact` 다(2026-08-03 검증에서 고침). 이 상태의 격자는 **42칸이 전부 비어
        있다** — 기본 밀도(칸 112px)로 세우면 1280에서 830px 짜리 백지가 화면을 덮어, 이 리워크가
        걷어낸 바로 그 모양("달력이 화면을 지배한다")이 예외 상태에서 되살아난다. 놓인 것이 없는
        격자일수록 자리를 적게 차지해야 경고 배너가 화면의 주인이 된다.
      */}
      {showAllUnavailable ? (
        <MapCard $solo aria-labelledby={mapTitleId}>
          <CardHead>
            <SectionGlyph aria-hidden>
              <CalendarRange size={18} strokeWidth={1.8} focusable={false} />
            </SectionGlyph>
            <CardTitle id={mapTitleId}>{copy.board.sectionLabel}</CardTitle>
          </CardHead>
          <MonthCalendar weeks={month.weeks} monthLabel={monthLabel} labelledById={monthTitleId} compact />
        </MapCard>
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
