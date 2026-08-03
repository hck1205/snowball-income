import { useCallback, useId, useRef } from 'react';
import { CircleDollarSign, Info, LayoutList, Plus, ReceiptText, Wallet } from 'lucide-react';
import { Banner, BrandGlyph, Button, Chip, PageFooter, PageHero, PickCard, StatTile } from '@/components/common';
import { ICON } from '@/shared/styles';
import MarketIndexStrip from '@/components/MarketIndexStrip';
import { PORTFOLIO_COPY } from '../copy';
import {
  GoalCard,
  HoldingPicker,
  HoldingPickerDrawer,
  HoldingsComposition,
  HoldingsTable,
  ManualTickerForm
} from '../components';
import type { ManualTickerSubmitResult } from '../components';
import { PortfolioAssumptions } from './components';
import type { PortfolioCtaModel, PortfolioViewProps } from './PortfolioPage.types';
import {
  ActionHint,
  ActionRow,
  CardDivider,
  CardHead,
  CardSubtitle,
  CardTitle,
  CardTitleBadge,
  CardTitleGroup,
  CountBadge,
  DDayLine,
  DDaySeparator,
  DDayTickers,
  DDayValue,
  EmptyBody,
  EmptyMascot,
  EmptyStateCard,
  EmptyTitle,
  EntryBody,
  ExcludedNote,
  HeroSlot,
  HoldingsCard,
  LiveRegion,
  NoteLine,
  PageStack,
  QuickPickItem,
  QuickPickLabel,
  QuickPickList,
  SkeletonBar,
  SkeletonList,
  SkeletonRow,
  SummaryCard,
  TileGrid,
  UndoRow
} from './PortfolioPage.styled';

const copy = PORTFOLIO_COPY;

const SKELETON_ROWS = [0, 1, 2];

/**
 * 순수 뷰 — 화면 모델을 그대로 그린다. 값 계산·저장·라우팅은 전부 컨테이너 소유다.
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

  /**
   * CTA 2종 + 사유 줄.
   *
   * 사유 문구는 **같은 문장이면 한 번만** 그린다(두 버튼이 같은 이유로 비활성일 때 같은 문장을 두 번
   * 읽히지 않게) — 대신 두 버튼이 그 한 줄을 `aria-describedby` 로 함께 가리킨다.
   * 버튼이 둘로 줄면서 달력은 ghost → secondary 로 올렸다(primary + ghost 는 위계가 헐겁다).
   */
  const ctaItems: { key: string; cta: PortfolioCtaModel; label: string; variant: 'primary' | 'secondary' | 'ghost'; onClick: () => void }[] = [
    { key: 'simulate', cta: viewModel.simulateCta, label: copy.cta.simulate, variant: 'primary', onClick: onSimulate },
    { key: 'calendar', cta: viewModel.calendarCta, label: copy.cta.calendar, variant: 'secondary', onClick: onOpenCalendar }
  ];

  /** 목표 카드는 보유 목록 아래·요약 카드 위(2026-07-29 순서). 빈 상태에서는 빈 상태 카드 아래에 붙는다. */
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

  const hintIdByText = new Map<string, string>();
  for (const item of ctaItems) {
    if (item.cta.hint && !hintIdByText.has(item.cta.hint)) {
      hintIdByText.set(item.cta.hint, `${hintIdPrefix}-hint-${hintIdByText.size}`);
    }
  }

  return (
    <PageStack>
      {/* 🔴 페이지 **맨 위**의 참고 시세(2026-08-02 사용자 결정). 헤더에 얹었다가 되돌린 자리다 —
          헤더는 전 라우트에 상시 있어 시세가 필요 없는 화면(커뮤니티·티커 소개)까지 따라다녔다.
          지금은 시세가 실제로 도움이 되는 세 화면(시뮬레이터·배당 캘린더·내 포트폴리오)만 갖는다. */}
      <MarketIndexStrip />

      {/* 이 페이지의 유일한 `<h1>` — 헤더 워드마크가 h1 이 아닌 화면이라 제목을 올린다. */}
      <PageHero
        icon={<Wallet size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
        title={copy.hero.title}
        titleAs="h1"
        lede={copy.hero.lede}
        /* 🔴 다음 배당 D-Day. `viewModel.dDay` 가 `null` 이면 **슬롯 자체를 넘기지 않는다** —
           보유가 없거나 지급일을 모를 때 "D-—" 를 남기면 없는 입금을 기다리게 만든다.
           날짜의 출처는 요약 타일 #7 과 **같은 지급 선택 함수**라 두 자리가 어긋날 수 없다. */
        notice={
          viewModel.dDay ? (
            <DDayLine>
              {viewModel.dDay.label} <DDayValue>{viewModel.dDay.value}</DDayValue>
              <DDaySeparator aria-hidden>·</DDaySeparator>
              <DDayTickers>{viewModel.dDay.tickers}</DDayTickers>
            </DDayLine>
          ) : undefined
        }
        meta={viewModel.asOfLine}
      />

      <LiveRegion role="status" aria-live="polite">
        {liveMessage}
      </LiveRegion>

      {/* 클라우드 상태 — 비로그인이면 "이 브라우저에만 저장된다"를 저장소 오류보다 **먼저** 말한다.
          아직 아무 것도 잃지 않았을 때 알려야 의미가 있다. */}
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
        <EmptyStateCard aria-labelledby={emptyTitleId}>
          {/* 마스코트는 **빈 상태에만** 산다 — 값이 있는 화면에 캐릭터를 세우면 숫자와 시선을 다툰다.
              장식이라 이름을 지지 않는다(`BrandGlyph` 기본이 `aria-hidden`). */}
          <EmptyMascot>
            <BrandGlyph size={96} />
          </EmptyMascot>
          <EmptyTitle id={emptyTitleId}>{copy.empty.title}</EmptyTitle>
          <EmptyBody>{copy.empty.body}</EmptyBody>

          <ActionRow>
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
          </ActionRow>

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
        </EmptyStateCard>
        {/* 이미 정해 둔 목표가 있으면 보유가 비어도 진행을 화면에서 지우지 않는다(기준은 노트가 말한다). */}
        {goalCard}
        </>
      ) : (
        <>
          {/* 🔴 카드 순서 = **보유 종목 → 목표 달성 → 지금 받는 배당**(사용자 확정 2026-07-29).
              "무엇을 갖고 있나 → 목표까지 얼마나 왔나 → 지금 얼마 받나" 순으로 읽는다.
              순서는 `test/portfolio/portfolioCardOrder.test.tsx` 가 DOM 순서로 잠근다 — 눈에 잘 띄는 만큼
              회귀도 쉽다. ⚠ hero 타일(`emphasis="hero"`)은 여전히 요약 카드 하나만 갖는다(화면당 1개). */}
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
                variant="ghost"
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
            {/* 로컬 전용 고지는 화면에서 한 번만 말한다(각주에서 반복하지 않는다). */}
            <CardSubtitle>{copy.holdings.localOnly}</CardSubtitle>

            {viewModel.isLoading ? (
              <SkeletonList aria-hidden>
                {SKELETON_ROWS.map((row) => (
                  <SkeletonRow key={row} />
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
          </HoldingsCard>

          {goalCard}

          <SummaryCard aria-labelledby={summaryTitleId} aria-busy={viewModel.isLoading || undefined}>
            <CardHead>
              <CardTitle id={summaryTitleId}>
                <CardTitleBadge aria-hidden>
                  <CircleDollarSign size={ICON.md} strokeWidth={ICON.stroke} focusable={false} />
                </CardTitleBadge>
                {copy.summary.title}
              </CardTitle>
            </CardHead>

            <HeroSlot>
              <StatTile
                emphasis="hero"
                label={viewModel.heroTile.label}
                value={viewModel.isLoading ? <SkeletonBar /> : viewModel.heroTile.value}
                hint={viewModel.heroTile.hint}
              />
            </HeroSlot>

            <TileGrid>
              {viewModel.tiles.map((tile) => (
                <StatTile
                  key={tile.label}
                  label={tile.label}
                  value={viewModel.isLoading ? <SkeletonBar /> : tile.value}
                  hint={tile.hint}
                />
              ))}
            </TileGrid>

            {/* 🔴 비중 도넛 — 조각 색이 위 보유 표의 종목 귀와 **같은 값**(assignSeries)이다.
                로딩 중에는 그리지 않는다(행이 비어 있어 0조각 도넛이 된다). 조각이 없으면
                컴포넌트가 스스로 `null` 을 낸다 — 빈 원판은 "0%"로 읽혀 거짓말이 된다. */}
            {showComposition ? (
              <>
                <CardDivider />
                <HoldingsComposition rows={viewModel.rows} title={copy.summary.composition.title} />
              </>
            ) : null}

            {viewModel.showMonthlyVsThisMonthNote ? (
              <NoteLine>
                <Info size={16} strokeWidth={1.8} aria-hidden focusable={false} />
                {copy.summary.monthlyVsThisMonthNote}
              </NoteLine>
            ) : null}

            {viewModel.summaryNotes.map((note) => (
              <ExcludedNote key={note}>{note}</ExcludedNote>
            ))}

            <ActionRow>
              {ctaItems.map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  variant={item.variant}
                  disabled={item.cta.disabled}
                  aria-describedby={item.cta.hint ? hintIdByText.get(item.cta.hint) : undefined}
                  onClick={item.onClick}
                >
                  {item.label}
                </Button>
              ))}
            </ActionRow>

            {/* 무음 비활성 금지 — 비활성이면 언제나 사유가 남는다(활성이어도 왜곡 가능성은 먼저 말한다). */}
            {[...hintIdByText.entries()].map(([text, id]) => (
              <ActionHint key={id} id={id}>
                {text}
              </ActionHint>
            ))}
          </SummaryCard>
        </>
      )}

      {/* 가계부 진입 — 세 카드(보유 종목 → 목표 달성 → 지금 받는 배당) **뒤에** 붙는다.
          그 순서는 사용자 확정이고 `test/portfolio/portfolioCardOrder.test.tsx` 가 DOM 순서로 잠근다.

          🔴 **여기만 brand 면(PickCard)이다** — 판정 기준 한 줄("여기서 무언가를 고르면 화면이
          바뀌는가")에서 이 카드만 참이다(나머지 셋은 읽는 면이다). 캡은 `rail`(6px)이라 틴트 면
          예산을 먹지 않는다 — 틴트 캡이면 이 화면의 세 번째 면이 되어 기준선 2를 깬다.
          ⚠ 카드 자체에 `onClick` 을 주지 않는다: 안에 실제 버튼이 있어 버튼 안의 버튼이 된다.
             진입점은 종전과 똑같이 **[가계부 열기] 버튼 하나**다.
          🔴 버튼은 secondary — 이 화면의 primary 는 "시뮬레이터로 보내기"가 이미 갖고 있다. */}
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
          `notes` 로 들어간다 — 면책 문구는 법적 성격이 있어 "비슷하니까" 합칠 수 없다.
          ⚠ 단 "투자 자문이 아니며…" 한 줄은 `PageFooter` 의 사이트 공통 고지가 이미 같은 말을 한다
          (2026-07-31 리뷰 m1: 알려진 중복이었고 여기서 닫았다) — 다시 넣지 마라. 남은 셋은
          이 화면에서만 참인 문장이다(스냅샷 시세 · 예상 지급일 · 목표 카드의 계열 차이). */}
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
