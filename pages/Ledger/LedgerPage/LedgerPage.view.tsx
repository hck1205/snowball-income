import { useCallback, useEffect, useId, useRef } from 'react';
import { ReceiptText, RotateCw } from 'lucide-react';
import { Banner, Button, Card, HintText, MODAL_EXIT_MS, PageFooter, PageHero, StatTile } from '@/components/common';
import { useOverlayPresence } from '@/shared/hooks';
import { LEDGER_COPY } from '../copy';
import {
  LedgerConnectPanel,
  LedgerDividendCard,
  LedgerFailureList,
  LedgerFormModal,
  LedgerMappingCard,
  LedgerMonthNav,
  LedgerRemoveDialog,
  LedgerSignInPanel,
  LedgerTabPicker,
  LedgerTable
} from '../components';
import type { LedgerMonthSummary } from '../types';
import type { LedgerViewProps } from './LedgerPage.types';
import {
  ActionHint,
  ActionRow,
  BannerRow,
  CreatedActions,
  EmptyBlock,
  EmptyBody,
  EmptyTitle,
  FreshnessNotice,
  FreshnessRow,
  HeroSlot,
  ReadAtText,
  LiveRegion,
  PageStack,
  SkeletonBar,
  SkeletonList,
  SkeletonRow,
  SummaryCard,
  TileGrid
} from './LedgerPage.styled';

const copy = LEDGER_COPY;

const SKELETON_ROWS = [0, 1, 2];

/**
 * 월 요약(주역 카드). 🔴 **화면에 하나뿐인 `raised` 면**이라 단일 가계부와 블렌딩이 같은 부품을
 * 쓴다 — 두 벌로 복제하면 "주역 카드는 화면당 1개"가 소스에서 두 개가 되고, 위계 규율을 잠근
 * 가드(`cardElevation('raised')` 정확히 1건)가 무의미해진다.
 *
 * 🔴 손익색을 쓰지 않는다(수입·지출은 P&L 이 아니다). 값이 아직 없으면 숫자를 지어내지 않고
 * 골격만 그린다.
 */
const renderSummaryCard = (params: {
  labelledBy: string;
  netLabel: string;
  summary: LedgerMonthSummary;
  isLoading?: boolean;
  isBusy?: boolean;
}) => (
  <SummaryCard aria-labelledby={params.labelledBy} aria-busy={params.isBusy || undefined}>
    <HeroSlot>
      <StatTile
        emphasis="hero"
        label={params.netLabel}
        value={params.isLoading ? <SkeletonBar /> : params.summary.netText}
        hint={copy.summary.netHint}
      />
    </HeroSlot>
    <TileGrid>
      <StatTile
        label={copy.summary.income}
        value={params.isLoading ? <SkeletonBar /> : params.summary.incomeText}
        hint={copy.summary.countHint(params.summary.incomeCount)}
      />
      <StatTile
        label={copy.summary.expense}
        value={params.isLoading ? <SkeletonBar /> : params.summary.expenseText}
        hint={copy.summary.countHint(params.summary.expenseCount)}
      />
    </TileGrid>
  </SummaryCard>
);

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
  onSignIn,
  onPickExistingSheet,
  onCreateSheet,
  onMappingChange,
  onConfirmMapping,
  onSelectTab,
  onToggleDividendOverlay,
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
  const signInHeadingId = `${idPrefix}-signin`;
  const monthTitleId = `${idPrefix}-month`;
  const listTitleId = `${idPrefix}-list`;
  /* 429 로 새로고침이 막혔을 때의 사유 줄 — 비활성 버튼이 이것을 가리킨다(무음 비활성 금지). */
  const refreshHintId = `${idPrefix}-refresh`;

  const removeButtonRefs = useRef(new Map<string, HTMLButtonElement | null>());
  const listTitleRef = useRef<HTMLHeadingElement | null>(null);
  /* 생성 안내 카드의 "구글 시트에서 열기" 버튼 — 링크가 아니라 버튼이다(2026-08-01 사용자 결정). */
  const sheetOpenRef = useRef<HTMLButtonElement | null>(null);

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
    const raf = window.requestAnimationFrame(() => sheetOpenRef.current?.focus());
    return () => window.cancelAnimationFrame(raf);
  }, [viewModel.showCreatedNotice]);

  const form = useOverlayPresence(viewModel.form, MODAL_EXIT_MS);
  const removeTarget = useOverlayPresence(viewModel.removeTarget, MODAL_EXIT_MS);

  /**
   * 🔴 **앱 로그인 게이트는 시트 연결보다 앞선 다른 축이다**(`LedgerAppAuthGate` 주석).
   * 로그인 전에는 시트 연결·목록·배너·모달을 **하나도** 그리지 않는다 — 연결 상태를 물어볼
   * 대상 자체가 아직 없다. 히어로와 각주는 그대로 남아 이 화면이 무엇인지는 계속 말한다.
   */
  const gate = viewModel.appAuth;
  const isAuthChecking = gate !== null && !gate.isReady;
  const isSignInRequired = gate !== null && gate.isReady && !gate.isLoggedIn;
  const isAppSignedIn = gate !== null && gate.isReady && gate.isLoggedIn;
  const isGated = isAuthChecking || isSignInRequired;

  /* 🔴 헤더에서 로그아웃하면 연결돼 있던 화면도 즉시 게이트로 돌아간다 — 그때 히어로에 쓰기
     액션이 남으면 로그인 안내 위에 "항목 추가"가 뜬다. 게이트 중에는 액션을 아예 만들지 않는다. */
  const isConnected = viewModel.state === 'connected' && !isGated;
  const hasRows = viewModel.rows.length > 0;

  /**
   */

  /* 구성이 없으면 먼저 고르게 하고, 있으면 곧바로 켠다 — 첫 진입에 빈 화면을 보여 주지 않는다. */

  /*
   * 🔴 새로고침이 막히는 경우는 둘이고, **둘 다 사유 줄을 가리킨다**(무음 비활성 금지).
   *  - 만료: 토큰이 없어 다시 읽을 수 없다. 누르면 아무 일도 안 나는 버튼을 남기지 않는다.
   *  - 429: 요청 제한. 카운트다운이 끝나면 스스로 풀린다.
   */
  const isRateLimited = viewModel.freshness.retrySeconds !== null;
  const isRefreshBlocked = viewModel.isExpired || isRateLimited;
  const refreshBlockedHintId = viewModel.isExpired ? expiredHintId : isRateLimited ? refreshHintId : undefined;

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

  const hero = (
    <PageHero
      icon={<ReceiptText size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
      title={copy.hero.title}
      titleAs="h1"
      lede={copy.hero.lede}
      /* 🔴 상시 고지 — 권한 범위를 화면에서 한 번만 말하는 자리. */
      notice={copy.hero.scopeNotice}
      /* ⚠ `meta`(연결 요약)를 **일부러 넘기지 않는다** — "어느 장부"는 탭 줄이, "언제 기준"은 목록
         카드 헤더가 말한다(2026-08-02 B-2). 되살리면 탭이 1개일 때 같은 제목이 두 번 뜬다. */
      actions={heroActions}
    />
  );

  /*
   * 🔴 각주는 **연결 후에도 남아야 하는 사실**만 싣는다. 소유·권한 범위·취소 방법은
   * `copy.privacy` 가 소유하고 연결 화면 본문에서 강조된다 — 여기 다시 적으면 같은 말이 두 곳에서
   * 갈린다(2026-08-01 정리). 다만 **연결이 끝난 사용자도 확인할 수 있어야** 하므로 소유와 취소는
   * 각주에 요약본이 아니라 `privacy` 원문 그대로 실어 단일 출처를 유지한다.
   */
  const footer = (
    <PageFooter
      notesTitle={copy.footnote.title}
      notes={[copy.privacy.where, copy.footnote.order, copy.privacy.revoke]}
    />
  );

  if (isGated) {
    return (
      <PageStack>
        {hero}
        {isAuthChecking ? (
          /* "아직 모름" 구간 — 로그인 게이트를 성급히 보여주면 이미 로그인한 사용자가 깜빡인다. */
          <section aria-busy="true" aria-label={copy.signIn.checking}>
            <SkeletonList aria-hidden>
              {SKELETON_ROWS.map((row) => (
                <SkeletonRow key={row} />
              ))}
            </SkeletonList>
          </section>
        ) : (
          <LedgerSignInPanel headingId={signInHeadingId} onSignIn={onSignIn} />
        )}
        {footer}
      </PageStack>
    );
  }

  return (
    <PageStack>
      {hero}

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
            {/*
             * 🔴 **버튼 하나만 남긴다**(2026-08-01 사용자 지적).
             *
             * 예전에는 시트 이름 링크 + "구글 시트에서 열기" 버튼이 한 카드에 둘 다 있었고, 히어로에도
             * 상시 `시트에서 열기` 가 있어 같은 동작으로 가는 길이 **한 화면에 셋**이었다
             * (`design-taste-frontend` CTA 중복 금지). 남길 하나로 **버튼**을 고른 이유: 이 카드는 방금
             * 만든 직후의 안내라 "지금 열어 본다"가 유일한 다음 행동이고, 그 행동은 눌러야 할 것처럼
             * 보여야 한다. 시트 이름은 위 `body` 문장과 히어로 메타(`연결한 시트 …`)가 이미 말한다.
             * ⚠ 이름 링크를 다시 넣지 마라 — 같은 곳으로 가는 길이 둘이 된다.
             */}
            <Button
              ref={sheetOpenRef}
              type="button"
              size="sm"
              variant="secondary"
              aria-label={copy.created.openAria}
              onClick={onOpenSheet}
            >
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
          isAppSignedIn={isAppSignedIn}
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
          {/*
            🔴 **연결 정보 영역**(어느 장부인가)은 월 네비(어느 기간인가)보다 위다 — 두 축을 같은 줄에
            섞으면 "탭을 넘기면 달도 넘어가나"라는 오해가 생긴다. 탭이 하나뿐이면 이름만 말한다.

            ⚠ 이 줄이 **연결 정보의 단일 출처**다(2026-08-02 B-2). 히어로 메타가 같은 제목을 한 번 더
            말하던 중복은 히어로 쪽을 없애 정리했고, "언제 기준"은 아래 목록 카드 헤더가 갖는다.
            여기에 읽은 시각·새로고침을 다시 얹지 마라 — 같은 사실이 또 두 곳이 된다.
          */}
          {viewModel.tabPicker ? (
            <LedgerTabPicker model={viewModel.tabPicker} onSelectTab={onSelectTab} />
          ) : null}

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
          {renderSummaryCard({
            labelledBy: monthTitleId,
            netLabel: copy.summary.net(viewModel.monthLabel),
            summary: viewModel.summary,
            isLoading: viewModel.isFirstLoad,
            isBusy: viewModel.isRefetching
          })}

          {/*
            🔴 B-4 — 배당은 **요약 카드 밖 형제**다(`Card` 안 `Card` 금지 · 주역 카드는 화면당 1개).
            위 요약 3숫자(수입·지출·합계)에는 배당이 **한 번도 더해지지 않는다** — 더하면 "가계부
            총합"의 정의가 둘이 되고, 사용자가 배당 입금을 시트에 이미 적어 뒀다면 이중 계상이 된다.
          */}
          <LedgerDividendCard
            model={viewModel.dividend}
            monthLabel={viewModel.monthLabel}
            onToggle={onToggleDividendOverlay}
          />

          <Card
            tone="default"
            title={copy.list.title}
            subtitle={hasRows ? copy.list.subtitle : undefined}
            /*
             * 🔴 B-2 — "언제 기준인가"와 "다시 읽기"는 **읽은 것 바로 옆**에 선다(D2-4).
             * 시각은 아직 한 번도 못 읽었으면 그리지 않는다(없는 값에 "—" 를 남기지 않는다).
             * 🔴 429 대기 중에는 버튼을 잠그고 아래 사유 줄을 가리킨다 — 연타를 유도하지 않는다.
             */
            titleRight={
              <FreshnessRow>
                {viewModel.freshness.readAtText ? (
                  <ReadAtText>{viewModel.freshness.readAtText}</ReadAtText>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  startIcon={<RotateCw size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
                  loading={viewModel.freshness.isRefreshing}
                  disabled={isRefreshBlocked}
                  aria-describedby={refreshBlockedHintId}
                  onClick={onRefresh}
                >
                  {copy.freshness.refresh}
                </Button>
              </FreshnessRow>
            }
          >
            {viewModel.freshness.retrySeconds === null ? null : (
              <FreshnessNotice id={refreshHintId}>
                {copy.error.rateLimitedCountdown(viewModel.freshness.retrySeconds)}
              </FreshnessNotice>
            )}

            {/* 🔴 "달라졌다"까지만 말한다 — 어느 행이 어떻게 바뀌었는지는 확정할 수 없다(D2-3). */}
            {viewModel.freshness.hasUpdate ? <FreshnessNotice>{copy.freshness.updated}</FreshnessNotice> : null}

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

      {footer}

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
