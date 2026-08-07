import { useCallback, useId, useRef } from 'react';
import { CalendarDays, CircleDollarSign, Info, LayoutList, Plus, ReceiptText, Wallet } from 'lucide-react';
import {
  Banner,
  BrandGlyph,
  Button,
  Chip,
  PageFooter,
  PageHero,
  PickCard,
  StatTile
} from '@/components/common';
import { ICON } from '@/shared/styles';
import MarketIndexStrip from '@/components/MarketIndexStrip';
import { PORTFOLIO_COPY } from '../copy';
import {
  GoalCard,
  MonthlyRecap,
  HoldingPicker,
  HoldingPickerDrawer,
  HoldingsComposition,
  HoldingsTable,
  ManualTickerForm
} from '../components';
import type { ManualTickerSubmitResult } from '../components';
import { PortfolioAssumptions } from './components';
import type { PortfolioViewProps } from './PortfolioPage.types';
import {
  ActionHint,
  ActionRow,
  CardDivider,
  CardHead,
  CardHeadPlain,
  CardSubtitle,
  CardTitle,
  CardTitleBadge,
  CardTitleGroup,
  CountBadge,
  Deck,
  EmptyAside,
  EmptyBoard,
  EmptyBody,
  EmptyLead,
  EmptyMascot,
  EmptyTitle,
  EntryActions,
  EntryBody,
  EntryGrid,
  EntryHint,
  ExcludedNote,
  FigureHint,
  FigureList,
  FigureRow,
  FigureTerm,
  FigureValue,
  HeroMascot,
  HeroSlot,
  HoldingsCard,
  LiveRegion,
  MainColumn,
  NextPayoutLabel,
  NextPayoutPanel,
  NextPayoutTickers,
  NextPayoutValue,
  NoteLine,
  PageStack,
  PreviewBody,
  PreviewItem,
  PreviewLabel,
  PreviewList,
  PreviewMark,
  PreviewTerm,
  QuickPickBlock,
  QuickPickItem,
  QuickPickLabel,
  QuickPickList,
  RailColumn,
  SkeletonBar,
  SkeletonCell,
  SkeletonList,
  SkeletonRow,
  SummaryCard,
  UndoRow,
  Workbench
} from './styled';

const copy = PORTFOLIO_COPY;

const SKELETON_ROWS = [0, 1, 2];
const SKELETON_CELLS = [0, 1, 2, 3];

/**
 * 순수 뷰 — 화면 모델을 그대로 그린다. 값 계산·저장·라우팅은 전부 컨테이너 소유다.
 *
 * ## 2026-08-03 2차 리워크 — 무엇이 바뀌었나 (구조)
 * 1. **데크**: 히어로 + `NextPayoutPanel`(다음 지급 D-Day)을 한 줄에 놓는다. D-Day 는 종전
 *    히어로 `notice` 안의 작은 회색 줄이었다 — 같은 데이터가 표제 숫자로 승격됐다.
 *    `role="note"` 는 그대로 유지한다(접근성 계약이자 테스트가 잡는 지점).
 * 2. **작업대 2열**: 왼쪽 `MainColumn`(보유 표 → 목표), 오른쪽 `RailColumn`(지금 받는 배당, sticky).
 *    🔴 DOM 순서는 **보유 종목 → 목표 달성 → 지금 받는 배당** 그대로다(2026-07-29 사용자 확정).
 *    `grid-area` 로 순서를 뒤집지 않는다 — 낭독 순서와 시각 순서를 갈라놓지 않기 위해서다.
 * 3. **요약 카드 내부**: 타일 격자 5개 → hero 숫자 하나 + `FigureList` 정의 목록(밀도 2배).
 * 4. **진입 격자**: 배당 캘린더·가계부가 아래에서 `PickCard` 두 장으로 나란히 선다.
 *    달력 버튼은 종전 요약 카드 안 두 번째 CTA 였다 — **라벨·핸들러·비활성 사유는 그대로**이고
 *    자리만 바뀌었다(요약 카드에는 1급 행동 하나만 남긴다).
 * 5. **빈 상태**: 흰 판 한가운데 버튼 하나 → 2열 보드(권유 | 근거 3줄 + 빠른 시작).
 *
 * 이 파일이 갖는 유일한 명령형 로직은 **포커스 이동**이다(DOM 참조가 필요해 여기 말고는 둘 곳이 없다):
 * 삭제 후 다음 행, 실행 취소 후 복원된 행, 드로어에서 "보유 중"을 눌렀을 때의 그 행.
 * 리렌더로 목록이 바뀐 뒤에 옮겨야 하므로 항상 `requestAnimationFrame` 한 프레임 뒤에 옮긴다
 * (동기 focus 는 아직 없는 노드를 찾거나 옛 문장을 낭독시킨다 — pitfalls 2026-07-26).
 */
export default function PortfolioPageView({
  viewModel,
  goal,
  liveMessage,
  cloudNotice,
  picker,
  taxInput,
  onTaxInputChange,
  onTaxInputBlur,
  onOpenPicker,
  onClosePicker,
  onKeywordChange,
  onAdd,
  onQuantityChange,
  onQuantityBlur,
  onRemove,
  onUndo,
  onSimulate,
  onOpenCalendar,
  onOpenTargetSetup,
  onCommitTarget,
  onOpenSimulator,
  onAddHoldingFromGoal,
  onOpenLedger
}: PortfolioViewProps) {
  const summaryTitleId = useId();
  const holdingsTitleId = useId();
  const emptyTitleId = useId();
  const drawerId = useId();
  const hintIdPrefix = useId();

  const simulateHintId = `${hintIdPrefix}-simulate-hint`;
  const calendarHintId = `${hintIdPrefix}-calendar-hint`;

  const quantityRefs = useRef(new Map<string, HTMLInputElement | null>());
  const deleteRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const addButtonRef = useRef<HTMLButtonElement | null>(null);

  const registerQuantityInput = useCallback((ticker: string, node: HTMLInputElement | null) => {
    if (node === null) quantityRefs.current.delete(ticker);
    else quantityRefs.current.set(ticker, node);
  }, []);

  const registerDeleteButton = useCallback((ticker: string, node: HTMLButtonElement | null) => {
    if (node === null) deleteRefs.current.delete(ticker);
    else deleteRefs.current.set(ticker, node);
  }, []);

  /** 목록이 갱신된 다음 프레임에 그 행의 수량 입력으로. 값이 있으면 바로 고쳐 쓸 수 있게 선택까지. */
  const focusQuantity = useCallback((ticker: string) => {
    window.requestAnimationFrame(() => {
      const node = quantityRefs.current.get(ticker);
      node?.focus();
      node?.select();
    });
  }, []);

  const handleAdd = useCallback(
    (ticker: string) => {
      const result = onAdd(ticker);
      // 이미 보유 중이면 **추가하지 않고** 그 행의 수량으로 데려간다(중복 행을 만들지 않는다).
      if (!result.ok && result.reason === 'duplicate') {
        onClosePicker();
        focusQuantity(result.ticker);
      }
    },
    [focusQuantity, onAdd, onClosePicker]
  );

  const handleFocusHeld = useCallback(
    (ticker: string) => {
      onClosePicker();
      focusQuantity(ticker);
    },
    [focusQuantity, onClosePicker]
  );

  /** 빈 상태의 추천 칩 — 추가하자마자 수량을 적을 수 있게 그 행으로 데려간다. */
  const handleQuickPick = useCallback(
    (ticker: string) => {
      const result = onAdd(ticker);
      focusQuantity(result.ticker);
    },
    [focusQuantity, onAdd]
  );

  const handleManualSubmit = useCallback(
    (input: { ticker: string; price: number; dividendYield: number }): ManualTickerSubmitResult => {
      const result = onAdd({
        ticker: input.ticker,
        manual: { price: input.price, dividendYield: input.dividendYield }
      });

      if (result.ok) return { ok: true };
      // 거절 사유를 접지 않는다 — 하이드레이션 전 거절을 'duplicate' 로 접으면 있지도 않은
      // "이미 보유 중"을 알리게 된다(폼은 목록을 모르므로 사유는 호출부만 안다).
      return { ok: false, reason: result.reason === 'loading' ? 'loading' : 'duplicate' };
    },
    [onAdd]
  );

  const handleRemove = useCallback(
    (ticker: string) => {
      // 지우기 **전에** 다음 포커스 대상을 정한다 — 지운 뒤에는 그 행이 목록에 없다.
      const index = viewModel.rows.findIndex((row) => row.ticker === ticker);
      const next = viewModel.rows[index + 1] ?? viewModel.rows[index - 1] ?? null;

      onRemove(ticker);

      window.requestAnimationFrame(() => {
        const target = next === null ? addButtonRef.current : deleteRefs.current.get(next.ticker);
        target?.focus();
      });
    },
    [onRemove, viewModel.rows]
  );

  const handleUndo = useCallback(() => {
    const restored = onUndo();
    // 되살아난 행의 수량 입력으로 — 사용자가 되돌린 이유는 대개 그 값을 다시 쓰기 위해서다.
    if (restored !== null) focusQuantity(restored);
  }, [focusQuantity, onUndo]);

  /** 목표 카드는 보유 목록 아래(2026-07-29 순서). 빈 상태에서는 빈 상태 보드 아래에 붙는다. */
  const goalCard =
    goal === null ? null : (
      <GoalCard
        model={goal}
        pickerId={drawerId}
        isPickerOpen={picker.isOpen}
        onOpenTargetSetup={onOpenTargetSetup}
        onCommitTarget={onCommitTarget}
        onOpenSimulator={onOpenSimulator}
        onAddHolding={onAddHoldingFromGoal}
      />
    );

  /*
   * 도넛을 그릴 조각이 실제로 있는가. 🔴 가름선은 **여기서** 판정한다 — 컴포넌트가 스스로 `null`
   * 을 내는 것에만 기대면 조각이 없을 때 카드에 선만 하나 남는다(무엇을 가르는지 없는 선).
   */
  const showComposition = !viewModel.isLoading && viewModel.rows.some((row) => (row.weightPercent ?? 0) > 0);

  /*
   * 🔴 진입 격자는 **빈 상태에서도 그대로 선다.** 보유가 없다고 다른 화면으로 가는 문을 닫지 않는다
   * (달력 버튼은 그때 비활성이지만 사유가 카드 안에 남는다 — 무음 비활성 금지).
   */
  const entryGrid = (
    <EntryGrid>
      <PickCard
        title={copy.calendarEntry.title}
        titleAs="h2"
        cap={{
          kind: 'rail',
          axis: 'accent',
          glyph: <CalendarDays size={ICON.xl} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
        }}
        actions={
          <EntryActions>
            <Button
              type="button"
              variant="secondary"
              disabled={viewModel.calendarCta.disabled}
              aria-describedby={viewModel.calendarCta.hint ? calendarHintId : undefined}
              startIcon={<CalendarDays size={ICON.md} strokeWidth={ICON.stroke} aria-hidden focusable={false} />}
              onClick={onOpenCalendar}
            >
              {copy.cta.calendar}
            </Button>
            {/* 무음 비활성 금지 — 활성이어도 왜곡 가능성(직접 추가 종목 제외)은 먼저 말한다. */}
            {viewModel.calendarCta.hint ? (
              <EntryHint id={calendarHintId}>{viewModel.calendarCta.hint}</EntryHint>
            ) : null}
          </EntryActions>
        }
      >
        <EntryBody>{copy.calendarEntry.body}</EntryBody>
      </PickCard>

      {/* ⚠ 카드 자체에 `onClick` 을 주지 않는다: 안에 실제 버튼이 있어 버튼 안의 버튼이 된다.
          진입점은 종전과 똑같이 **[가계부 열기] 버튼 하나**다. 환경변수가 없어 가계부가 꺼진
          배포에서는 이 카드 자체가 없다("준비 중" 표시도 하지 않는다). */}
      {onOpenLedger ? (
        <PickCard
          title={copy.ledgerEntry.title}
          titleAs="h2"
          cap={{
            kind: 'rail',
            axis: 'identity',
            glyph: <ReceiptText size={ICON.xl} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
          }}
          actions={
            <Button
              type="button"
              variant="secondary"
              startIcon={<ReceiptText size={ICON.md} strokeWidth={ICON.stroke} aria-hidden focusable={false} />}
              onClick={onOpenLedger}
            >
              {copy.ledgerEntry.cta}
            </Button>
          }
        >
          <EntryBody>{copy.ledgerEntry.body}</EntryBody>
        </PickCard>
      ) : null}
    </EntryGrid>
  );

  return (
    <PageStack>
      {/* 🔴 페이지 **맨 위**의 참고 시세(2026-08-02 사용자 결정). 헤더에 얹었다가 되돌린 자리다 —
          헤더는 전 라우트에 상시 있어 시세가 필요 없는 화면(커뮤니티·티커 소개)까지 따라다녔다. */}
      <MarketIndexStrip />

      {/* ── 데크: 이 화면이 무엇인가(왼쪽) + 다음 배당은 언제인가(오른쪽) ────────────── */}
      <Deck $split={viewModel.dDay !== null}>
        {/* 이 페이지의 유일한 `<h1>` — 헤더 워드마크가 h1 이 아닌 화면이라 제목을 올린다. */}
        <PageHero
          icon={<Wallet size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
          title={copy.hero.title}
          titleAs="h1"
          lede={copy.hero.lede}
          meta={viewModel.asOfLine}
        />

        {/* 🔴 `viewModel.dDay` 가 `null` 이면 **패널 자체를 렌더하지 않는다** — 보유가 없거나
            지급일을 모를 때 "D-—" 를 남기면 없는 입금을 기다리게 만든다. 날짜의 출처는 요약
            지표 #5 와 **같은 지급 선택 함수**라 두 자리가 어긋날 수 없다.
            `role="note"` 는 구 히어로 `notice` 슬롯에서 그대로 이어받은 계약이다. */}
        {viewModel.dDay ? (
          <NextPayoutPanel role="note">
            <NextPayoutLabel>{viewModel.dDay.label}</NextPayoutLabel>
            <NextPayoutValue>{viewModel.dDay.value}</NextPayoutValue>
            <NextPayoutTickers>{viewModel.dDay.tickers}</NextPayoutTickers>
          </NextPayoutPanel>
        ) : null}
      </Deck>

      <LiveRegion role="status" aria-live="polite">
        {liveMessage}
      </LiveRegion>

      {/* 클라우드 상태 — 비로그인이면 "이 브라우저에만 저장된다"를 저장소 오류보다 **먼저** 말한다. */}
      {cloudNotice}

      {/* 사용자가 직접 친 수량이 저장되지 않는 상태다 — 하던 낭독을 끊어서라도 알린다. */}
      {viewModel.storageError ? (
        <Banner tone="danger" role="alert">
          {viewModel.storageError}
        </Banner>
      ) : null}

      {viewModel.fxError ? (
        <Banner tone="warning" role="status">
          {viewModel.fxError}
        </Banner>
      ) : null}

      {viewModel.undoMessage ? (
        <Banner tone="info" role="status" align="center">
          <UndoRow>
            {viewModel.undoMessage}
            <Button type="button" size="sm" variant="secondary" onClick={handleUndo}>
              {copy.undo.action}
            </Button>
          </UndoRow>
        </Banner>
      ) : null}

      {viewModel.showEmptyState ? (
        <>
          <EmptyBoard aria-labelledby={emptyTitleId}>
            <EmptyLead>
              {/* 마스코트는 **빈 상태에만** 산다 — 값이 있는 화면에 캐릭터를 세우면 숫자와 시선을 다툰다.
                  장식이라 이름을 지지 않는다(`BrandGlyph` 기본이 `aria-hidden`). */}
              <EmptyMascot>
                <BrandGlyph size={96} />
              </EmptyMascot>
              <EmptyTitle id={emptyTitleId}>{copy.empty.title}</EmptyTitle>
              <EmptyBody>{copy.empty.body}</EmptyBody>

              <Button
                type="button"
                variant="primary"
                ref={addButtonRef}
                aria-expanded={picker.isOpen}
                aria-controls={drawerId}
                aria-label={copy.holdings.addAria(0)}
                startIcon={<Plus size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
                onClick={onOpenPicker}
              >
                {copy.empty.cta}
              </Button>
            </EmptyLead>

            {/* 오른쪽 절반 — 종전에는 없던 자리다. "등록하면 무엇을 보는가"를 먼저 말하지 않으면
                빈 상태는 부재만 알리고 끝난다. */}
            <EmptyAside>
              <PreviewLabel>{copy.empty.previewLabel}</PreviewLabel>
              <PreviewList>
                {copy.empty.previews.map((preview, index) => (
                  <PreviewItem key={preview.term}>
                    <PreviewMark aria-hidden>{index + 1}</PreviewMark>
                    <PreviewTerm>{preview.term}</PreviewTerm>
                    <PreviewBody>{preview.body}</PreviewBody>
                  </PreviewItem>
                ))}
              </PreviewList>

              <QuickPickBlock>
                <QuickPickLabel>{copy.empty.quickPickLabel}</QuickPickLabel>
                <QuickPickList>
                  {copy.empty.quickPicks.map((ticker) => (
                    <QuickPickItem key={ticker}>
                      <Chip variant="accentAlt" onClick={() => handleQuickPick(ticker)}>
                        {ticker}
                      </Chip>
                    </QuickPickItem>
                  ))}
                </QuickPickList>
              </QuickPickBlock>
            </EmptyAside>
          </EmptyBoard>

          {/* 이미 정해 둔 목표가 있으면 보유가 비어도 진행을 화면에서 지우지 않는다. */}
          {goalCard}
        </>
      ) : (
        /* 🔴 카드 순서 = **보유 종목 → 목표 달성 → 지금 받는 배당**(사용자 확정 2026-07-29).
           2열이 되어도 **DOM 순서는 그대로다** — 왼쪽 열이 앞의 둘, 오른쪽 레일이 마지막 하나다.
           순서는 `test/portfolio/portfolioCardOrder.test.tsx` 가 DOM 순서로 잠근다. */
        <Workbench>
          <MainColumn>
            <HoldingsCard aria-labelledby={holdingsTitleId} aria-busy={viewModel.isLoading || undefined}>
              <CardHead>
                <CardTitleGroup>
                  <CardTitle id={holdingsTitleId}>
                    <CardTitleBadge aria-hidden>
                      <LayoutList size={ICON.md} strokeWidth={ICON.stroke} focusable={false} />
                    </CardTitleBadge>
                    {copy.holdings.title}
                  </CardTitle>
                  {viewModel.holdingsCount > 0 ? (
                    <CountBadge>{copy.holdings.countBadge(viewModel.holdingsCount)}</CountBadge>
                  ) : null}
                </CardTitleGroup>
                {/* 저장소를 읽는 동안에는 추가를 받지 않는다(훅이 거절한다) — 버튼도 그 사실을 보인다. */}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  ref={addButtonRef}
                  disabled={viewModel.isLoading}
                  aria-expanded={picker.isOpen}
                  aria-controls={drawerId}
                  aria-label={copy.holdings.addAria(viewModel.holdingsCount)}
                  startIcon={<Plus size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
                  onClick={onOpenPicker}
                >
                  {copy.holdings.add}
                </Button>
              </CardHead>

              {viewModel.isLoading ? (
                <SkeletonList aria-hidden>
                  {SKELETON_ROWS.map((row) => (
                    <SkeletonRow key={row}>
                      {SKELETON_CELLS.map((cell) => (
                        <SkeletonCell key={cell} />
                      ))}
                    </SkeletonRow>
                  ))}
                </SkeletonList>
              ) : (
                <HoldingsTable
                  rows={viewModel.rows}
                  onQuantityChange={onQuantityChange}
                  onQuantityBlur={onQuantityBlur}
                  onRemove={handleRemove}
                  registerQuantityInput={registerQuantityInput}
                  registerDeleteButton={registerDeleteButton}
                />
              )}

              {/* 로컬 전용 고지는 화면에서 한 번만 말한다(각주에서 반복하지 않는다).
                  표 **아래**로 내렸다 — 제목과 표 사이를 비우는 편이 목록을 먼저 읽게 한다. */}
              <CardSubtitle>{copy.holdings.localOnly}</CardSubtitle>
            </HoldingsCard>

            {goalCard}
          </MainColumn>

          <RailColumn>
            <SummaryCard aria-labelledby={summaryTitleId} aria-busy={viewModel.isLoading || undefined}>
              <CardHeadPlain>
                <CardTitle id={summaryTitleId}>
                  <CardTitleBadge aria-hidden>
                    <CircleDollarSign size={ICON.md} strokeWidth={ICON.stroke} focusable={false} />
                  </CardTitleBadge>
                  {copy.summary.title}
                </CardTitle>
              </CardHeadPlain>

              <HeroSlot>
                <StatTile
                  emphasis="hero"
                  label={viewModel.heroTile.label}
                  value={viewModel.isLoading ? <SkeletonBar /> : viewModel.heroTile.value}
                  hint={viewModel.heroTile.hint}
                />
                {/* 선글라스 낀 하마 — "내 배당은 이렇게 들어오고 있다"(2026-08-05 사용자 지시).
                    🔴 장식이라 alt 는 빈 문자열이다. 자리·겹침 규칙은 HeroMascot 주석에 있다.
                    ⚠ 불러오는 중(골격)에는 그리지 않는다 — 값이 없는데 자랑하는 그림만 떠 있으면
                      "무엇을" 자랑하는지 모르는 화면이 된다. */}
                {viewModel.isLoading ? null : (
                  <HeroMascot
                    src="/images/hippo/hippo_sun_glasses.png"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                )}
              </HeroSlot>

              {/* 🔴 종전 5칸 타일 격자를 정의 목록으로 내렸다 — 지표 다섯이 hero 와 같은 무게로
                  서면 주인공이 사라진다. 라벨·값·힌트 문자열은 **그대로**다(모델 변경 없음). */}
              <FigureList>
                {viewModel.tiles.map((tile) => (
                  <FigureRow key={tile.label}>
                    <FigureTerm>{tile.label}</FigureTerm>
                    <FigureValue>{viewModel.isLoading ? <SkeletonBar /> : tile.value}</FigureValue>
                    {tile.hint ? <FigureHint>{tile.hint}</FigureHint> : null}
                  </FigureRow>
                ))}
              </FigureList>

              {/*
                월간 리캡 — 이 앱이 "한 번 계산하면 끝"이 되지 않게 하는 자리(평가서 P1-⑤).
                🔴 불러오는 중에는 그리지 않는다. 값이 없는 띠는 "배당이 없다"로 읽힌다.
                ⚠ 지급월을 아는 종목이 없으면 부품이 스스로 null 을 낸다(같은 이유).
              */}
              {viewModel.isLoading || !viewModel.monthlyRecap ? null : (
                <MonthlyRecap model={viewModel.monthlyRecap} />
              )}

              {viewModel.showMonthlyVsThisMonthNote ? (
                <NoteLine>
                  <Info size={16} strokeWidth={1.8} aria-hidden focusable={false} />
                  {copy.summary.monthlyVsThisMonthNote}
                </NoteLine>
              ) : null}

              {viewModel.summaryNotes.map((note) => (
                <ExcludedNote key={note}>{note}</ExcludedNote>
              ))}

              {/* 🔴 요약 카드의 1급 행동은 **하나**다. 종전 두 번째 CTA(지급일 달력)는 아래 진입
                  격자의 카드로 옮겼다 — 라벨·핸들러는 그대로이고 위계만 갈랐다.

                  🔴 CTA 가 **도넛보다 위**에 있는 것은 의도다. 이 카드는 sticky 레일 안에서
                  `max-height` + `overflow-y` 를 갖는다(뷰포트보다 높아도 아래쪽이 도달 불가가 되지
                  않게). 그 경계 아래로 밀려나는 것은 **보조 정보여야지 1급 행동이면 안 된다** —
                  도넛을 CTA 위에 두면 900px 높이 화면에서 버튼이 내부 스크롤 밖으로 나간다. */}
              <ActionRow>
                <Button
                  type="button"
                  variant="primary"
                  disabled={viewModel.simulateCta.disabled}
                  aria-describedby={viewModel.simulateCta.hint ? simulateHintId : undefined}
                  onClick={onSimulate}
                >
                  {copy.cta.simulate}
                </Button>
              </ActionRow>

              {/* 무음 비활성 금지 — 비활성이면 언제나 사유가 남는다(활성이어도 왜곡 가능성은 먼저 말한다). */}
              {viewModel.simulateCta.hint ? (
                <ActionHint id={simulateHintId}>{viewModel.simulateCta.hint}</ActionHint>
              ) : null}

              {/* 🔴 비중 도넛 — 조각 색이 보유 표의 종목 귀와 **같은 값**(assignSeries)이다.
                  로딩 중에는 그리지 않는다(행이 비어 있어 0조각 도넛이 된다). 조각이 없으면
                  컴포넌트가 스스로 null 을 낸다 — 빈 원판은 "0%"로 읽혀 거짓말이 된다. */}
              {showComposition ? (
                <>
                  <CardDivider />
                  <HoldingsComposition rows={viewModel.rows} title={copy.summary.composition.title} />
                </>
              ) : null}
            </SummaryCard>
          </RailColumn>
        </Workbench>
      )}

      {/* 다른 화면으로 가는 문 둘 — 같은 성격이라 같은 형태(brand PickCard · 레일 캡)로 나란히 선다.
          캡은 `rail`(6px)이라 틴트 면 예산을 먹지 않는다(면 하한 8px 미만). */}
      {entryGrid}

      <PortfolioAssumptions
        summaryLabel={viewModel.assumptions.summaryLabel}
        rows={viewModel.assumptions.rows}
        isLoading={viewModel.isLoading}
        taxInput={taxInput}
        onTaxInputChange={onTaxInputChange}
        onTaxInputBlur={onTaxInputBlur}
        // 목표 카드가 없으면(=목표 미설정·미노출) 빈 배열 — 컴포넌트는 이 경우 그룹을 그리지 않는다.
        goalConditionRows={goal?.conditionRows ?? []}
      />

      {/* 각주 + 사이트 공통 고지 = 공용 푸터 한 벌(2026-07-31 수렴). 이 화면의 문구는 **원문 그대로**
          `notes` 로 들어간다 — 면책 문구는 법적 성격이 있어 "비슷하니까" 합칠 수 없다. */}
      <PageFooter
        notesTitle={copy.footnote.title}
        notes={[
          copy.footnote.estimate,
          copy.footnote.schedule,
          // 두 숫자의 계열이 다르다는 사실 — 목표 카드가 실제로 떠 있을 때만 말한다.
          ...(goal ? [copy.footnote.goal] : [])
        ]}
      />

      {/* 패널은 항상 마운트된다(열림은 CSS) — 언마운트하면 검색어·스크롤이 매번 날아간다. */}
      <HoldingPickerDrawer
        id={drawerId}
        isOpen={picker.isOpen}
        title={copy.picker.heading}
        closeLabel={copy.picker.close}
        onClose={onClosePicker}
      >
        <HoldingPicker
          keyword={picker.keyword}
          onKeywordChange={onKeywordChange}
          options={picker.options}
          heldTickers={picker.heldTickers}
          onAdd={handleAdd}
          onFocusHeld={handleFocusHeld}
        />
        <ManualTickerForm forceOpen={picker.options.length === 0} onSubmit={handleManualSubmit} />
      </HoldingPickerDrawer>
    </PageStack>
  );
}
