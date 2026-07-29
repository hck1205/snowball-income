import { useCallback, useId, useRef } from 'react';
import { Info, Plus, Wallet } from 'lucide-react';
import { Banner, Button, Chip, InputField, StatTile } from '@/components/common';
import { PORTFOLIO_COPY } from '../copy';
import { GoalCard, HoldingPicker, HoldingPickerDrawer, HoldingsTable, ManualTickerForm } from '../components';
import type { ManualTickerSubmitResult } from '../components';
import type { PortfolioCtaModel, PortfolioViewProps } from './PortfolioPage.types';
import {
  ActionHint,
  ActionRow,
  AsOfLine,
  AssumptionsBody,
  AssumptionsDetails,
  AssumptionsGroupNote,
  AssumptionsGroupTitle,
  AssumptionsSummary,
  CardHead,
  CardSubtitle,
  CardTitle,
  ConditionRow,
  ConditionTerm,
  ConditionValue,
  ConditionsList,
  EmptyBody,
  EmptyStateCard,
  EmptyTitle,
  ExcludedNote,
  FootNote,
  FootNoteCard,
  FootNoteTitle,
  HeroIconBadge,
  HeroLede,
  HeroSlot,
  HeroTitle,
  HeroTitleRow,
  HoldingsCard,
  LiveRegion,
  NoteLine,
  PageHero,
  PageStack,
  QuickPickItem,
  QuickPickLabel,
  QuickPickList,
  SkeletonBar,
  SkeletonList,
  SkeletonRow,
  SummaryCard,
  TaxFieldSlot,
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
  onAddHoldingFromGoal
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

  const hintIdByText = new Map<string, string>();
  for (const item of ctaItems) {
    if (item.cta.hint && !hintIdByText.has(item.cta.hint)) {
      hintIdByText.set(item.cta.hint, `${hintIdPrefix}-hint-${hintIdByText.size}`);
    }
  }

  return (
    <PageStack>
      <PageHero>
        <HeroTitleRow>
          <HeroIconBadge>
            <Wallet size={20} strokeWidth={1.8} aria-hidden focusable={false} />
          </HeroIconBadge>
          <HeroTitle>{copy.hero.title}</HeroTitle>
        </HeroTitleRow>
        <HeroLede>{copy.hero.lede}</HeroLede>
        <AsOfLine>{viewModel.asOfLine}</AsOfLine>
      </PageHero>

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
              <CardTitle id={holdingsTitleId}>{copy.holdings.title}</CardTitle>
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
              <CardTitle id={summaryTitleId}>{copy.summary.title}</CardTitle>
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

      <AssumptionsDetails>
        <AssumptionsSummary>{viewModel.assumptions.summaryLabel}</AssumptionsSummary>
        <AssumptionsBody>
          <TaxFieldSlot>
            {/* 세율도 하이드레이션 전에는 훅이 거절한다 — 입력은 받되 버려지는 상태를 만들지 않는다. */}
            <InputField
              label={copy.assumptions.taxLabel}
              type="number"
              value={taxInput}
              suffix="%"
              min={0}
              max={100}
              disabled={viewModel.isLoading}
              hint={copy.assumptions.taxHint}
              onChange={(event) => onTaxInputChange(event.target.value)}
              onBlur={onTaxInputBlur}
            />
          </TaxFieldSlot>

          <ConditionsList>
            {viewModel.assumptions.rows.map((row) => (
              <ConditionRow key={row.label}>
                <ConditionTerm>{row.label}</ConditionTerm>
                <ConditionValue>{row.value}</ConditionValue>
              </ConditionRow>
            ))}
          </ConditionsList>

          {/*
            예상 달성 시점의 근거는 화면에서 여기 한 곳에만 있다 — 빼면 ETA 가 어디서 왔는지 알 길이 없다.
            페이지의 `<details>` 는 계속 하나다(새 접기 블록을 만들지 않는다). 세율 라벨이 두 번 나오지만
            그룹 제목이 소속을 밝히므로 모순이 아니다(포트폴리오 세율 vs 시뮬레이터에 저장된 세율).
          */}
          {goal && goal.conditionRows.length > 0 ? (
            <>
              <AssumptionsGroupTitle>{copy.goal.conditions.groupTitle}</AssumptionsGroupTitle>
              <AssumptionsGroupNote>{copy.goal.conditions.groupNote}</AssumptionsGroupNote>
              <ConditionsList>
                {goal.conditionRows.map((row) => (
                  <ConditionRow key={row.label}>
                    <ConditionTerm>{row.label}</ConditionTerm>
                    <ConditionValue>{row.value}</ConditionValue>
                  </ConditionRow>
                ))}
              </ConditionsList>
            </>
          ) : null}
        </AssumptionsBody>
      </AssumptionsDetails>

      <FootNoteCard>
        <FootNoteTitle>{copy.footnote.title}</FootNoteTitle>
        <FootNote>{copy.footnote.estimate}</FootNote>
        <FootNote>{copy.footnote.schedule}</FootNote>
        {/* 두 숫자의 계열이 다르다는 사실 — 목표 카드가 실제로 떠 있을 때만 말한다. */}
        {goal ? <FootNote>{copy.footnote.goal}</FootNote> : null}
        <FootNote>{copy.footnote.notAdvice}</FootNote>
      </FootNoteCard>

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
