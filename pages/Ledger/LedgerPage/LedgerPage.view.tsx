import { useCallback, useEffect, useId, useRef } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, CalendarOff, Plus, ReceiptText, RefreshCw, RotateCw } from 'lucide-react';
import { Banner, Button, Card, HintText, MODAL_EXIT_MS, PageFooter, PageHero, Select } from '@/components/common';
import { useOverlayPresence } from '@/shared/hooks';
import { LEDGER_COPY } from '../copy';
import {
  LedgerAnalysisCard,
  LedgerConnectPanel,
  LedgerDividendCard,
  LedgerFailureList,
  LedgerFormModal,
  LedgerMappingCard,
  LedgerReportPanel,
  LedgerSideFormModal,
  LedgerSideTabPanel,
  LedgerViewTabs,
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
  CarryOverAmount,
  CarryOverBody,
  CarryOverLabel,
  CarryOverList,
  CarryOverMeta,
  CarryOverRow,
  CarryOverTitle,
  AlertLane,
  BannerRow,
  CountBadge,
  CreatedActions,
  EmptyBlock,
  EmptyBody,
  EmptyGlyph,
  EmptyTitle,
  FlowCell,
  FlowCount,
  FlowGrid,
  FlowHead,
  FlowValue,
  FreshnessNotice,
  LedgerColumn,
  ListToolbar,
  LiveRegion,
  PageStack,
  ReadAtText,
  PayerScopeLabel,
  PayerScopeRow,
  ScopePanel,
  ScopeRail,
  SkeletonBar,
  SkeletonCell,
  SkeletonList,
  SkeletonRow,
  SummaryCard,
  SummaryHint,
  SummaryLabel,
  SummaryValue,
  Workspace
} from './LedgerPage.styled';

const copy = LEDGER_COPY;

const SKELETON_ROWS = [0, 1, 2];

/** 목록 자리의 로딩 골격. 행 세 줄의 **모양**을 그대로 그린다(값이 올 자리를 미리 잡는다). */
const renderSkeletonList = () => (
  <SkeletonList aria-hidden>
    {SKELETON_ROWS.map((row) => (
      <SkeletonRow key={row}>
        <SkeletonCell />
      </SkeletonRow>
    ))}
  </SkeletonList>
);

/**
 * 월 요약(주역 카드). 🔴 **화면에 하나뿐인 `raised` 면**이다.
 *
 * ## 구조 (2026-08-03 재설계)
 * 예전에는 hero `StatTile` 하나 + 2열 타일 격자였다. 세 숫자가 같은 부품·같은 리듬으로 서서
 * **"순액이 결론이고 수입·지출은 그 내역"이라는 관계가 화면에 없었다.** 지금은 3단이다 —
 * 라벨 → 큰 순액 → 가로선 아래 내역 두 칸(방향 글리프 + 이름 + 건수 + 금액).
 *
 * 🔴 손익색을 쓰지 않는다(수입·지출은 P&L 이 아니다). 방향은 **글리프와 글자**가 말한다.
 * 🔴 값이 아직 없으면 숫자를 지어내지 않고 골격만 그린다.
 * 🔴 배당은 이 카드에 **한 번도 더해지지 않는다** — 형제 카드가 따로 말한다(B-4).
 */
const renderSummaryCard = (params: {
  labelledBy: string;
  netLabel: string;
  summary: LedgerMonthSummary;
  isLoading?: boolean;
  isBusy?: boolean;
}) => (
  <SummaryCard aria-labelledby={params.labelledBy} aria-busy={params.isBusy || undefined}>
    <div>
      <SummaryLabel>{params.netLabel}</SummaryLabel>
      <SummaryValue>{params.isLoading ? <SkeletonBar /> : params.summary.netText}</SummaryValue>
      <SummaryHint>{copy.summary.netHint}</SummaryHint>
    </div>

    <FlowGrid>
      <FlowCell>
        <FlowHead>
          <ArrowDownToLine size={16} strokeWidth={1.8} aria-hidden focusable={false} />
          {copy.summary.income}
          <FlowCount>{copy.summary.countHint(params.summary.incomeCount)}</FlowCount>
        </FlowHead>
        <FlowValue>{params.isLoading ? <SkeletonBar /> : params.summary.incomeText}</FlowValue>
      </FlowCell>

      <FlowCell>
        <FlowHead>
          <ArrowUpFromLine size={16} strokeWidth={1.8} aria-hidden focusable={false} />
          {copy.summary.expense}
          <FlowCount>{copy.summary.countHint(params.summary.expenseCount)}</FlowCount>
        </FlowHead>
        <FlowValue>{params.isLoading ? <SkeletonBar /> : params.summary.expenseText}</FlowValue>
      </FlowCell>
    </FlowGrid>
  </SummaryCard>
);

/**
 * 순수 뷰 — 화면 모델을 그대로 그린다. 연결·조회·쓰기는 전부 컨테이너 소유다.
 *
 * ## 레이아웃 (2026-08-03 재설계)
 * 연결 후 화면은 **콘솔 2단**이다. 왼쪽 `ScopeRail` 이 "무엇을 보고 있는가"(장부 · 기간 · 그 달의
 * 숫자 · 배당 겹침)를 sticky 로 들고, 오른쪽 `LedgerColumn` 이 "무엇이 적혀 있는가"(표 · 저장 실패
 * 대기열)를 갖는다. 1023px 이하에서는 1열로 눕고 순서는 범위 → 요약 → 배당 → 내역 그대로다.
 * 자세한 근거는 `LedgerPage.styled.ts` 머리말.
 *
 * 🔴 배너 순서는 위에서 아래로 **만료 → 충돌 → 권한 거부 → 팝업 차단 → 생성 안내 → 연결 실패 →
 * 부분 실패**다. 만료가 가장 위인 이유: 더 근본적인 차단이고, 재연결이 충돌 재조회를 포함한다.
 * 배너들은 `AlertLane` 한 띠에 묶인다 — 본문 간격(최대 28px)으로 흩어지면 여섯 종이 동시에 떴을 때
 * 화면 절반이 배너가 되고 그중 무엇이 한 사건인지 읽히지 않는다.
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
  onCancelMapping,
  onSelectTab,
  onSelectViewTab,
  onSelectPayerScope,
  onRetrySideTab,
  onAddSideEntry,
  onSideFormChange,
  onSideFormSubmit,
  onSideFormClose,
  onSimulateInvestments,
  onRunBackfill,
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
  onOpenCarryOver,
  onConfirmCarryOver,
  onCloseCarryOver,
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
  const payerScopeId = `${idPrefix}-payer-scope`;
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

  /*
   * 🔴 새로고침이 막히는 경우는 둘이고, **둘 다 사유 줄을 가리킨다**(무음 비활성 금지).
   *  - 만료: 토큰이 없어 다시 읽을 수 없다. 누르면 아무 일도 안 나는 버튼을 남기지 않는다.
   *  - 429: 요청 제한. 카운트다운이 끝나면 스스로 풀린다.
   */
  const isRateLimited = viewModel.freshness.retrySeconds !== null;
  const isRefreshBlocked = viewModel.isExpired || isRateLimited;
  const refreshBlockedHintId = viewModel.isExpired ? expiredHintId : isRateLimited ? refreshHintId : undefined;

  /**
   * 🔴 히어로에 액션이 **없다**(2026-08-08).
   *
   * 종전에는 `시트에서 열기` 하나가 있었다. 그 버튼이 왼쪽 범위 레일로 내려갔고(탭이 하나뿐일 때
   * 탭 피커 자리를 대신한다), 같은 일을 하는 버튼이 화면에 둘이면 사용자는 둘이 다른 일을 한다고
   * 읽는다. 히어로는 "이 화면이 무엇인가"(제목 · 권한 고지)만 말한다.
   *
   * ⚠ `항목 추가` 가 목록 카드의 도구 줄에 있는 것과 같은 판단이다 — 액션은 그 대상 옆에 선다.
   *   시트를 여는 일의 대상은 "지금 보고 있는 장부"이고, 그것을 말하는 자리가 범위 레일이다.
   */
  const heroActions = undefined;

  /*
   * 🔴 **연결 전에는 히어로가 `plain` 이다**(2026-08-03, tintscan 실측으로 잡은 초과).
   *
   * 미연결 화면에는 색면이 셋이 섰다 — 히어로 그라디언트 + 네이비 무대(`ConnectStage`) + 네이비
   * 각주(`PageFooter` 의 `brandPanel()`). 상한은 2 다. 무대는 이 화면의 첫인상이라 양보할 수 없고
   * 각주는 전역 부품이므로, **그라디언트가 이미 다른 곳에 있을 때**를 위해 만들어진 `tone="plain"`
   * 을 히어로에 준다(`PageHeroProps` 주석 그대로의 용도).
   *
   * ⚠ **지금 이 분기는 그리는 결과가 같다**(2026-08-03 흰 캔버스 전환 이후). 같은 날 `gradient-hero`
   *   토큰이 파스텔 램프에서 **단색으로 내려앉아** 16테마 전부에서 `surface` 와 같은 값이 됐다
   *   (`shared/styles/presets/*.ts` 실측) — 즉 `plain` 과 `gradient` 가 현재 같은 색을 낸다.
   *   그래도 **지우지 않는다**: 이 줄은 "히어로가 색면일 때 이 화면은 상한을 넘는다"는 사실을
   *   코드로 붙잡아 둔 가드이고, 히어로에 채도가 돌아오는 날 자동으로 다시 작동한다.
   *
   * ⚠ 상한을 올려서 해결하지 마라. 세 번째 색면이 필요해 보이면 그건 무대나 각주 중 하나가
   *   같은 말을 두 번 하고 있다는 신호다.
   */
  const isPickingSource = viewModel.state === 'disconnected' || viewModel.state === 'denied';

  const hero = (
    <PageHero
      icon={<ReceiptText size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
      title={copy.hero.title}
      titleAs="h1"
      tone={isPickingSource && !isGated ? 'plain' : 'gradient'}
      lede={copy.hero.lede}
      /* 🔴 상시 고지 — 권한 범위를 화면에서 한 번만 말하는 자리. */
      notice={copy.hero.scopeNotice}
      /* ⚠ `meta`(연결 요약)를 **일부러 넘기지 않는다** — "어느 장부"는 탭 줄이, "언제 기준"은 목록
         카드 헤더가 말한다(2026-08-02 B-2). 되살리면 탭이 1개일 때 같은 제목이 두 번 뜬다. */
      actions={heroActions}
      /* 마스코트는 **화면이 하는 일**을 고른다 — 가계부는 들어온 배당을 들여다보는 곳이라
         '분석하는 하마'다(2026-08-05 사용자 지시). 장식이라 alt 는 부품이 비운다. */
      mascot="/images/hippo/hippo_analyzing.png"
      /* 이 히어로는 리드가 짧아 오른쪽이 크게 빈다 — 크게 세워야 허전하지 않다(2026-08-05 사용자 지시). */
      mascotSize="lg"
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
            {renderSkeletonList()}
          </section>
        ) : (
          <LedgerSignInPanel headingId={signInHeadingId} onSignIn={onSignIn} />
        )}
        {footer}
      </PageStack>
    );
  }

  /* 경보 레인은 **내용이 있을 때만** 존재한다 — 빈 그리드가 남으면 본문 간격이 두 번 붙는다. */
  const hasAlerts =
    viewModel.isExpired ||
    viewModel.isConflict ||
    viewModel.isDenied ||
    viewModel.isPopupBlocked ||
    Boolean(viewModel.showCreatedNotice && viewModel.sheetUrl && viewModel.sheetName) ||
    viewModel.connectError !== null ||
    Boolean(viewModel.partialFailure?.hasBatchReport);

  return (
    <PageStack>
      {hero}

      <LiveRegion role="status" aria-live="polite">
        {viewModel.liveMessage}
      </LiveRegion>

      {hasAlerts ? (
        <AlertLane>
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
                 * 보여야 한다. 시트 이름은 위 `body` 문장과 탭 줄이 이미 말한다.
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
              title={copy.error.partial.title(
                viewModel.partialFailure.successCount,
                viewModel.partialFailure.totalCount
              )}
            >
              {copy.error.partial.body(viewModel.partialFailure.rows.length)}
            </Banner>
          ) : null}
        </AlertLane>
      ) : null}

      {viewModel.state === 'checking' && viewModel.showCheckingSkeleton ? (
        <section aria-busy="true">{renderSkeletonList()}</section>
      ) : null}

      {isPickingSource ? (
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
          onBack={onCancelMapping}
        />
      ) : null}

      {/*
        🔴 **화면 탭바 — 작업면 전체보다 위**다. 이 컨트롤이 "아래에 무엇이 보이는가"를 정하므로
           작업면 안에 넣으면 자기가 만드는 것 안에 사는 모양이 된다.
        ⚠ `tabPicker`(어느 워크시트인가)는 아래 `ScopePanel` 에 그대로 남는다 — **다른 축**이다.
           둘을 한 줄에 합치면 "탭을 넘기면 파일도 바뀌나"라는 오해가 생긴다.
      */}
      {isConnected ? (
        <LedgerViewTabs
          tabs={viewModel.viewTabs}
          selected={viewModel.selectedViewTab}
          onSelect={onSelectViewTab}
        />
      ) : null}

      {/* 🔴 `한눈에 보기` 는 시트 탭이 아니라 **앱이 읽은 것을 그리는 화면**이라 따로 선다. */}
      {isConnected && viewModel.selectedViewTab === 'report' ? (
        <LedgerReportPanel
          entries={viewModel.report.entries}
          holdings={viewModel.report.holdings}
          investments={viewModel.report.investments}
          isLoadingSideTabs={viewModel.report.isLoadingSideTabs}
        />
      ) : null}

      {isConnected
      && viewModel.selectedViewTab !== 'entries'
      && viewModel.selectedViewTab !== 'report'
      && viewModel.sideTab ? (
        <LedgerSideTabPanel
          tab={viewModel.selectedViewTab}
          state={viewModel.sideTab}
          sheetUrl={viewModel.sheetUrl ?? undefined}
          onRetry={onRetrySideTab}
          onAdd={onAddSideEntry}
          canSimulate={viewModel.canSimulateInvestments}
          unknownTickers={viewModel.unknownInvestmentTickers}
          onSimulate={onSimulateInvestments}
        />
      ) : null}

      {isConnected && viewModel.selectedViewTab === 'entries' ? (
        <Workspace>
          <ScopeRail>
            {/*
              🔴 **연결 정보 영역**(어느 장부인가)은 월 네비(어느 기간인가)보다 위다 — 두 축을 같은 줄에
              섞으면 "탭을 넘기면 달도 넘어가나"라는 오해가 생긴다. 탭이 하나뿐이면 이름만 말한다.

              ⚠ 이 줄이 **연결 정보의 단일 출처**다(2026-08-02 B-2). 히어로 메타가 같은 제목을 한 번 더
              말하던 중복은 히어로 쪽을 없애 정리했고, "언제 기준"은 아래 목록 카드 헤더가 갖는다.
              여기에 읽은 시각·새로고침을 다시 얹지 마라 — 같은 사실이 또 두 곳이 된다.

              ⚠ 두 컨트롤은 한 틀(`ScopePanel`)을 공유하지만 **한 컨트롤로 합치지 않는다**. 월 이동은
              자기 `role="group"` 을 그대로 갖고, 탭 셀렉트는 그 밖에 선다.
            */}
            <ScopePanel>
              {viewModel.tabPicker ? (
                <LedgerTabPicker
                  model={viewModel.tabPicker}
                  sheetUrl={viewModel.sheetUrl ?? undefined}
                  onSelectTab={onSelectTab}
                />
              ) : null}

              {/*
                🔴 **주체 범위** — 부부·연인이 한 장부를 나눠 볼 때. 둘 이상일 때만 그린다
                   (선택지 하나인 필터는 화면의 거짓말이다).
                🔴 `공동` 은 하나의 선택지다 — 사람별 합의 총합이 전체와 정확히 같아야 하므로
                   겹치지 않게 나눈다(근거: `ledgerPayerScope.ts`).
              */}
              {viewModel.offerPayerScope ? (
                <PayerScopeRow>
                  <PayerScopeLabel htmlFor={payerScopeId}>누구의 것을 볼지</PayerScopeLabel>
                  <Select
                    id={payerScopeId}
                    value={viewModel.payerScope ?? ''}
                    onChange={(event) =>
                      onSelectPayerScope(event.target.value.length === 0 ? null : event.target.value)
                    }
                  >
                    <option value="">전체</option>
                    {viewModel.payers.map((payer) => (
                      <option key={payer} value={payer}>
                        {payer}
                      </option>
                    ))}
                  </Select>
                </PayerScopeRow>
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
            </ScopePanel>

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

            {/*
              P4·P5 — **이 달 살펴보기**. 배당 카드와 같은 층의 형제다(`Card` 안 `Card` 금지 ·
              주역 카드는 화면당 1개이고 그것은 위 월 요약이다).
              🔴 여기 숫자는 요약 3숫자에 **한 번도 더해지지 않는다** — 요약은 "얼마인가",
                 이 카드는 "어디에 몰렸는가"다. 두 카드가 같은 합계를 두 번 말하면 어느 쪽이
                 진짜인지 사용자가 물어야 한다.
              🔴 시트에 아무것도 쓰지 않는다(읽은 것을 접어 보여 줄 뿐이다).
            */}
            <LedgerAnalysisCard model={viewModel.analysis} monthLabel={viewModel.monthLabel} />
          </ScopeRail>

          <LedgerColumn>
            <Card
              tone="default"
              title={copy.list.title}
              subtitle={hasRows ? copy.list.subtitle : undefined}
              /*
               * 🔴 B-2 — "언제 기준인가"와 "다시 읽기"는 **읽은 것 바로 옆**에 선다(D2-4).
               * 시각은 아직 한 번도 못 읽었으면 그리지 않는다(없는 값에 "—" 를 남기지 않는다).
               * 🔴 429 대기 중에는 버튼을 잠그고 아래 사유 줄을 가리킨다 — 연타를 유도하지 않는다.
               * 🔴 `항목 추가` 는 0건일 때 여기 없다 — 그때는 빈 상태 블록이 그 버튼을 갖는다
               *   (한 화면에 추가 버튼은 **항상 정확히 1개**).
               */
              titleRight={
                <ListToolbar>
                  {/* 제목은 `Card` 가 문자열로만 받는다 — 건수는 도구 줄 맨 앞에 세워 제목과 이웃하게 한다. */}
                  {hasRows ? <CountBadge>{copy.summary.countHint(viewModel.rows.length)}</CountBadge> : null}
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
                  {hasRows ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      startIcon={<Plus size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
                      disabled={viewModel.isExpired}
                      aria-describedby={viewModel.isExpired ? expiredHintId : undefined}
                      onClick={onOpenCreateForm}
                    >
                      {copy.hero.addEntry}
                    </Button>
                  ) : null}
                </ListToolbar>
              }
            >
              {viewModel.freshness.retrySeconds === null ? null : (
                <FreshnessNotice id={refreshHintId}>
                  {copy.error.rateLimitedCountdown(viewModel.freshness.retrySeconds)}
                </FreshnessNotice>
              )}

              {/* 🔴 "달라졌다"까지만 말한다 — 어느 행이 어떻게 바뀌었는지는 확정할 수 없다(D2-3). */}
              {viewModel.freshness.hasUpdate ? (
                <FreshnessNotice>
                  <RefreshCw size={14} strokeWidth={1.8} aria-hidden focusable={false} />
                  {copy.freshness.updated}
                </FreshnessNotice>
              ) : null}

              {viewModel.isFirstLoad ? (
                renderSkeletonList()
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
                  <EmptyGlyph aria-hidden>
                    <CalendarOff size={24} strokeWidth={1.8} focusable={false} />
                  </EmptyGlyph>
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
                      startIcon={<Plus size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
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

            {/*
              고정비 이어가기 — 지난달 고정비를 이번 달에 한 번에 넣는다.

              🔴 **두 단계다.** 버튼은 목록을 열 뿐이고, 확인해야 시트에 쓴다. 남의 시트에 여러 줄을
                 한 번에 넣는 일이라 한 번의 오조작이 비싸다(되돌리려면 넣은 줄을 하나씩 지운다).
              🔴 이어갈 것이 없으면 **자리 자체가 없다** — 눌러도 아무 일 없는 컨트롤을 두지 않는다.
              🔴 만료 중에는 잠그고 사유 줄을 가리킨다(다른 쓰기 컨트롤과 같은 규율).
            */}
            {viewModel.carryOver ? (
              <Card tone="sunken">
                {viewModel.carryOver.isOpen ? (
                  <>
                    <CarryOverTitle>{copy.carryOver.title}</CarryOverTitle>
                    <CarryOverBody>{copy.carryOver.body}</CarryOverBody>
                    <CarryOverList>
                      {viewModel.carryOver.rows.map((row) => (
                        <CarryOverRow key={row.id}>
                          <CarryOverLabel>{row.label}</CarryOverLabel>
                          <CarryOverMeta>{row.dateText}</CarryOverMeta>
                          <CarryOverAmount>{row.amountText}</CarryOverAmount>
                        </CarryOverRow>
                      ))}
                    </CarryOverList>
                    <ActionRow>
                      <Button
                        type="button"
                        variant="primary"
                        loading={viewModel.carryOver.isSaving}
                        disabled={viewModel.isExpired}
                        aria-describedby={viewModel.isExpired ? expiredHintId : undefined}
                        onClick={onConfirmCarryOver}
                      >
                        {viewModel.carryOver.isSaving ? copy.carryOver.saving : copy.carryOver.confirm}
                      </Button>
                      <Button type="button" variant="secondary" onClick={onCloseCarryOver}>
                        {copy.carryOver.cancel}
                      </Button>
                    </ActionRow>
                  </>
                ) : (
                  <ActionRow>
                    <Button
                      type="button"
                      variant="secondary"
                      startIcon={<RotateCw size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
                      disabled={viewModel.isExpired}
                      aria-describedby={viewModel.isExpired ? expiredHintId : undefined}
                      onClick={onOpenCarryOver}
                    >
                      {copy.carryOver.open(viewModel.carryOver.count)}
                    </Button>
                  </ActionRow>
                )}
              </Card>
            ) : null}

            {/*
              🔴 **되채워 쓰기**(2026-08-09). 히포가 채운 분류는 앱 화면에만 있고 시트에는 빈 칸이라,
                 시트를 단독으로 열면 `월별 요약`·`현금흐름` 의 SUMIFS 가 그 행을 못 세어 요약이
                 통째로 0 이 된다. 적어 주면 두 세계가 같은 것을 본다.
              ⚠ **사용자가 시작한다.** 남의 시트에 여러 줄을 한 번에 넣는 일이라 되돌리려면 하나씩
                지워야 한다 — 자동으로 조용히 쓰지 않는다.
            */}
            {viewModel.backfill ? (
              <Banner tone="info" title={copy.backfill.title(viewModel.backfill.count)}>
                <BannerRow>
                  {copy.backfill.body}
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={viewModel.backfill.isSaving}
                    onClick={onRunBackfill}
                  >
                    {viewModel.backfill.isSaving ? copy.backfill.saving : copy.backfill.cta}
                  </Button>
                </BannerRow>
              </Banner>
            ) : null}

            {/* 🔴 요약 카드 **밖 형제**로 둔다(`Card` 안 `Card` 금지). */}
            {viewModel.partialFailure ? (
              <LedgerFailureList
                model={viewModel.partialFailure}
                retryCountdowns={retryCountdowns}
                onRetry={onRetryRow}
                onRetryAll={onRetryAll}
              />
            ) : null}
          </LedgerColumn>
        </Workspace>
      ) : null}

      {footer}

      {/* 🔴 자산·투자 직접 적기. 검증 규칙은 시트 쓰기와 같은 파일을 쓴다(`ledgerSideForm.ts`). */}
      {viewModel.sideForm ? (
        <LedgerSideFormModal
          kind={viewModel.sideForm.kind}
          draft={viewModel.sideForm.draft}
          errors={viewModel.sideForm.errors}
          isSaving={viewModel.sideForm.isSaving}
          writeError={viewModel.sideForm.writeError}
          onChange={onSideFormChange}
          onSubmit={onSideFormSubmit}
          onClose={onSideFormClose}
        />
      ) : null}

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
