import { useCallback, useEffect, useId, useRef } from 'react';
import { ReceiptText } from 'lucide-react';
import { Banner, Button, Card, HintText, MODAL_EXIT_MS, PageFooter, PageHero, StatTile } from '@/components/common';
import { useOverlayPresence } from '@/shared/hooks';
import { LEDGER_COPY } from '../copy';
import {
  LedgerConnectPanel,
  LedgerFailureList,
  LedgerFormModal,
  LedgerMappingCard,
  LedgerMonthNav,
  LedgerRemoveDialog,
  LedgerTable
} from '../components';
import type { LedgerViewProps } from './LedgerPage.types';
import {
  ActionHint,
  ActionRow,
  BannerRow,
  CreatedActions,
  EmptyBlock,
  EmptyBody,
  EmptyTitle,
  HeroSlot,
  LiveRegion,
  PageStack,
  SheetLink,
  SkeletonBar,
  SkeletonList,
  SkeletonRow,
  SummaryCard,
  TileGrid
} from './LedgerPage.styled';

const copy = LEDGER_COPY;

const SKELETON_ROWS = [0, 1, 2];

/**
 * 순수 뷰 — 화면 모델을 그대로 그린다. 연결·조회·쓰기는 전부 컨테이너 소유다.
 *
 * 🔴 배너 순서는 위에서 아래로 **만료 → 충돌 → 권한 거부 → 팝업 차단 → 생성 안내 → 연결 실패 →
 * 부분 실패**다. 만료가 가장 위인 이유: 더 근본적인 차단이고, 재연결이 충돌 재조회를 포함한다.
 * 🔴 오류는 라이브 리전이 아니라 `Banner role="alert"` 가 낭독한다 — 두 곳에서 같은 실패를 말하지 않는다.
 * 🔴 스크롤 진입 애니메이션·페이지 로드 오케스트레이션 **없음**(확정 결정). 모션은 모달 진입/퇴장뿐이다.
 */
export default function LedgerPageView({
  viewModel,
  retryCountdowns,
  focusAfterRemoveId,
  onFocusAfterRemoveHandled,
  onPickExistingSheet,
  onCreateSheet,
  onMappingChange,
  onConfirmMapping,
  onPrevMonth,
  onNextMonth,
  onThisMonth,
  onGoLatestMonth,
  onOpenCreateForm,
  onOpenEditForm,
  onFormChange,
  onSubmitForm,
  onCloseForm,
  onRequestRemove,
  onConfirmRemove,
  onCloseRemove,
  onRetryRow,
  onRetryAll,
  onReconnect,
  onRefresh,
  onOpenSheet,
  onDismissCreatedNotice
}: LedgerViewProps) {
  const idPrefix = useId();
  const expiredHintId = `${idPrefix}-expired`;
  const connectHeadingId = `${idPrefix}-connect`;
  const monthTitleId = `${idPrefix}-month`;
  const listTitleId = `${idPrefix}-list`;

  const removeButtonRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const listTitleRef = useRef<HTMLHeadingElement | null>(null);
  const sheetLinkRef = useRef<HTMLAnchorElement | null>(null);

  const registerRemoveButton = useCallback((id: string, node: HTMLButtonElement | null) => {
    if (node === null) removeButtonRefs.current.delete(id);
    else removeButtonRefs.current.set(id, node);
  }, []);

  /* 삭제 뒤 포커스 — 목록이 갱신된 **다음 프레임**에 옮긴다(동기 focus 는 아직 없는 노드를 찾는다). */
  useEffect(() => {
    if (focusAfterRemoveId === null) return undefined;
    const raf = window.requestAnimationFrame(() => {
      const target = removeButtonRefs.current.get(focusAfterRemoveId) ?? listTitleRef.current;
      target?.focus();
      onFocusAfterRemoveHandled();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [focusAfterRemoveId, onFocusAfterRemoveHandled]);

  /* 생성 직후 안내가 뜨면 시트 링크로 — 방금 만든 것을 바로 열 수 있게. */
  useEffect(() => {
    if (!viewModel.showCreatedNotice) return undefined;
    const raf = window.requestAnimationFrame(() => sheetLinkRef.current?.focus());
    return () => window.cancelAnimationFrame(raf);
  }, [viewModel.showCreatedNotice]);

  const form = useOverlayPresence(viewModel.form, MODAL_EXIT_MS);
  const removeTarget = useOverlayPresence(viewModel.removeTarget, MODAL_EXIT_MS);

  const isConnected = viewModel.state === 'connected';
  const hasRows = viewModel.rows.length > 0;

  /**
   * 히어로 액션 — 최대 2개.
   * 🔴 0건 화면에서는 "항목 추가"를 히어로에 두지 않는다. 한 화면에 추가 버튼은 **항상 정확히 1개**이고,
   * 그 상태에서는 빈 상태 블록이 그 버튼을 갖는다.
   */
  const heroActions = isConnected ? (
    <>
      {hasRows ? (
        <Button
          type="button"
          variant="primary"
          disabled={viewModel.isExpired}
          aria-describedby={viewModel.isExpired ? expiredHintId : undefined}
          onClick={onOpenCreateForm}
        >
          {copy.hero.addEntry}
        </Button>
      ) : null}
      <Button type="button" variant="secondary" aria-label={copy.hero.openSheetAria} onClick={onOpenSheet}>
        {copy.hero.openSheet}
      </Button>
    </>
  ) : undefined;

  return (
    <PageStack>
      <PageHero
        icon={<ReceiptText size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
        title={copy.hero.title}
        titleAs="h1"
        lede={copy.hero.lede}
        /* 🔴 상시 고지 — 권한 범위를 화면에서 한 번만 말하는 자리. */
        notice={copy.hero.scopeNotice}
        meta={viewModel.sheetMetaLine ?? undefined}
        actions={heroActions}
      />

      <LiveRegion role="status" aria-live="polite">
        {viewModel.liveMessage}
      </LiveRegion>

      {/* 🔴 만료돼도 아래 목록·요약은 마지막으로 읽은 그대로 남는다(백지·흐림 금지). */}
      {viewModel.isExpired ? (
        <>
          <Banner tone="warning" role="alert" title={copy.expired.bannerTitle}>
            <BannerRow>
              {copy.expired.bannerBody}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={viewModel.isReconnecting}
                onClick={onReconnect}
              >
                {copy.expired.reconnect}
              </Button>
            </BannerRow>
          </Banner>
          {/* 사유 줄은 화면에 **하나**다. 비활성 버튼들이 전부 이것을 가리킨다. */}
          <ActionHint id={expiredHintId}>{copy.expired.writeBlockedHint}</ActionHint>
        </>
      ) : null}

      {viewModel.isConflict ? (
        <Banner tone="warning" role="alert" title={copy.conflict.title}>
          <BannerRow>
            {copy.conflict.body}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={viewModel.phase === 'refreshing'}
              onClick={onRefresh}
            >
              {copy.conflict.refresh}
            </Button>
          </BannerRow>
        </Banner>
      ) : null}

      {/* 🔴 danger 가 아니다 — 사용자가 의도적으로 거부했을 수 있고 아무것도 망가지지 않았다. */}
      {viewModel.isDenied ? (
        <>
          <Banner tone="warning" role="status" title={copy.denied.title}>
            <BannerRow>
              {copy.denied.body}
              <Button type="button" size="sm" variant="secondary" onClick={onPickExistingSheet}>
                {copy.denied.retry}
              </Button>
            </BannerRow>
          </Banner>
          <HintText>{copy.denied.unaffected}</HintText>
        </>
      ) : null}

      {viewModel.isPopupBlocked ? (
        <Banner tone="warning" role="alert">
          {copy.connect.popupBlocked}
        </Banner>
      ) : null}

      {viewModel.showCreatedNotice && viewModel.sheetUrl && viewModel.sheetName ? (
        <Banner
          tone="info"
          role="status"
          title={copy.created.title}
          onDismiss={onDismissCreatedNotice}
          dismissAriaLabel={copy.created.dismiss}
        >
          {copy.created.body}
          <CreatedActions>
            {/* 🔴 시트 이름 자체가 링크다 — 주소를 복사·북마크할 수 있어야 "내 드라이브에 있다"가 증명된다. */}
            <SheetLink
              ref={sheetLinkRef}
              href={viewModel.sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={copy.created.openAria}
            >
              {viewModel.sheetName}
            </SheetLink>
            <Button type="button" size="sm" variant="secondary" onClick={onOpenSheet}>
              {copy.created.open}
            </Button>
          </CreatedActions>
        </Banner>
      ) : null}

      {viewModel.connectError ? (
        <Banner tone="danger" role="alert" title={viewModel.connectError.title}>
          <BannerRow>
            {viewModel.connectError.body}
            <Button type="button" size="sm" variant="secondary" onClick={onPickExistingSheet}>
              {copy.error.retry}
            </Button>
          </BannerRow>
        </Banner>
      ) : null}

      {/* 🔴 "일부 실패했습니다" 가 아니라 `M건 / 전체 N건` 을 숫자로 말한다. */}
      {viewModel.partialFailure?.hasBatchReport ? (
        <Banner
          tone="danger"
          role="alert"
          title={copy.error.partial.title(viewModel.partialFailure.successCount, viewModel.partialFailure.totalCount)}
        >
          {copy.error.partial.body(viewModel.partialFailure.rows.length)}
        </Banner>
      ) : null}

      {viewModel.state === 'checking' && viewModel.showCheckingSkeleton ? (
        <section aria-busy="true">
          <SkeletonList aria-hidden>
            {SKELETON_ROWS.map((row) => (
              <SkeletonRow key={row} />
            ))}
          </SkeletonList>
        </section>
      ) : null}

      {viewModel.state === 'disconnected' || viewModel.state === 'denied' ? (
        <LedgerConnectPanel
          phase={viewModel.phase}
          headingId={connectHeadingId}
          onPickExistingSheet={onPickExistingSheet}
          onCreateSheet={onCreateSheet}
        />
      ) : null}

      {viewModel.state === 'mapping' && viewModel.mapping ? (
        <LedgerMappingCard
          model={viewModel.mapping}
          phase={viewModel.phase}
          onMappingChange={onMappingChange}
          onConfirm={onConfirmMapping}
          onReselect={onPickExistingSheet}
        />
      ) : null}

      {isConnected ? (
        <>
          <LedgerMonthNav
            monthLabel={viewModel.monthLabel}
            prevLabel={viewModel.prevMonthLabel}
            nextLabel={viewModel.nextMonthLabel}
            todayLabel={viewModel.thisMonthLabel}
            isCurrentMonth={viewModel.isCurrentMonth}
            titleId={monthTitleId}
            onPrev={onPrevMonth}
            onNext={onNextMonth}
            onToday={onThisMonth}
          />

          {/* 🔴 이 화면의 주역 카드. 제목이 없고, 월 제목이 그 이름이 된다. */}
          <SummaryCard aria-labelledby={monthTitleId} aria-busy={viewModel.isRefetching || undefined}>
            <HeroSlot>
              <StatTile
                emphasis="hero"
                label={copy.summary.net(viewModel.monthLabel)}
                value={viewModel.isFirstLoad ? <SkeletonBar /> : viewModel.summary.netText}
                hint={copy.summary.netHint}
              />
            </HeroSlot>
            <TileGrid>
              <StatTile
                label={copy.summary.income}
                value={viewModel.isFirstLoad ? <SkeletonBar /> : viewModel.summary.incomeText}
                hint={copy.summary.countHint(viewModel.summary.incomeCount)}
              />
              <StatTile
                label={copy.summary.expense}
                value={viewModel.isFirstLoad ? <SkeletonBar /> : viewModel.summary.expenseText}
                hint={copy.summary.countHint(viewModel.summary.expenseCount)}
              />
            </TileGrid>
          </SummaryCard>

          <Card
            tone="default"
            title={copy.list.title}
            subtitle={hasRows ? copy.list.subtitle : undefined}
          >
            {viewModel.isFirstLoad ? (
              <SkeletonList aria-hidden>
                {SKELETON_ROWS.map((row) => (
                  <SkeletonRow key={row} />
                ))}
              </SkeletonList>
            ) : hasRows ? (
              <LedgerTable
                rows={viewModel.rows}
                monthLabel={viewModel.monthLabel}
                isWriteBlocked={viewModel.isExpired}
                writeBlockedHintId={expiredHintId}
                retryCountdowns={retryCountdowns}
                onEdit={onOpenEditForm}
                onRemove={onRequestRemove}
                onRetry={onRetryRow}
                registerRemoveButton={registerRemoveButton}
              />
            ) : (
              /* 🔴 연결 전과 다른 화면이다 — 월 네비와 요약 카드가 그대로 남아 "연결은 정상"을 증명한다. */
              <EmptyBlock>
                <EmptyTitle ref={listTitleRef} tabIndex={-1} id={listTitleId}>
                  {viewModel.isCurrentMonth
                    ? copy.emptyMonth.titleCurrent
                    : copy.emptyMonth.titleOther(viewModel.monthLabel)}
                </EmptyTitle>
                <EmptyBody>
                  {viewModel.latestMonthLabel
                    ? copy.emptyMonth.latestElsewhere(viewModel.latestMonthLabel)
                    : copy.emptyMonth.sheetEmpty}
                </EmptyBody>
                <ActionRow>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={viewModel.isExpired}
                    aria-describedby={viewModel.isExpired ? expiredHintId : undefined}
                    onClick={onOpenCreateForm}
                  >
                    {copy.emptyMonth.add}
                  </Button>
                  {viewModel.latestMonthLabel ? (
                    <Button type="button" variant="secondary" onClick={onGoLatestMonth}>
                      {copy.emptyMonth.goLatest(viewModel.latestMonthLabel)}
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" onClick={onPrevMonth}>
                      {copy.emptyMonth.prevMonth}
                    </Button>
                  )}
                </ActionRow>
              </EmptyBlock>
            )}
          </Card>

          {/* 🔴 요약 카드 **밖 형제**로 둔다(`Card` 안 `Card` 금지). */}
          {viewModel.partialFailure ? (
            <LedgerFailureList
              model={viewModel.partialFailure}
              retryCountdowns={retryCountdowns}
              onRetry={onRetryRow}
              onRetryAll={onRetryAll}
            />
          ) : null}
        </>
      ) : null}

      <PageFooter
        notesTitle={copy.footnote.title}
        notes={[copy.footnote.ownership, copy.footnote.order, copy.footnote.consent]}
      />

      {form.value ? (
        <LedgerFormModal
          model={form.value}
          phase={form.phase}
          isOpen={viewModel.form !== null}
          isExpired={viewModel.isExpired}
          isReconnecting={viewModel.isReconnecting}
          expiredHintId={expiredHintId}
          isConflict={viewModel.isConflict}
          onChange={onFormChange}
          onSubmit={onSubmitForm}
          onClose={onCloseForm}
          onReconnect={onReconnect}
          onRefresh={onRefresh}
        />
      ) : null}

      {/* 🔴 폼 모달이 열려 있으면 삭제 다이얼로그를 열 수 없다(중첩 오버레이 0). */}
      {removeTarget.value && viewModel.form === null ? (
        <LedgerRemoveDialog
          target={removeTarget.value}
          phase={removeTarget.phase}
          isOpen={viewModel.removeTarget !== null}
          isRemoving={viewModel.isRemoving}
          isExpired={viewModel.isExpired}
          isReconnecting={viewModel.isReconnecting}
          expiredHintId={expiredHintId}
          error={viewModel.removeError}
          onConfirm={onConfirmRemove}
          onClose={onCloseRemove}
          onReconnect={onReconnect}
        />
      ) : null}
    </PageStack>
  );
}
