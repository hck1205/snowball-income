import { useEffect, useId, useRef } from 'react';
import { ReceiptText } from 'lucide-react';
import { Banner, Button, HintText, MODAL_EXIT_MS, PageFooter, PageHero } from '@/components/common';
import { useOverlayPresence } from '@/shared/hooks';
import { LEDGER_COPY } from '../copy';
import {
  LedgerConnectPanel,
  LedgerEntriesWorkspace,
  LedgerMappingCard,
  LedgerOverlays,
  LedgerReportPanel,
  LedgerSideTabPanel,
  LedgerSignInPanel,
  LedgerSkeletonList,
  LedgerViewTabs
} from '../components';
import type { LedgerViewProps } from './LedgerPage.types';
import {
  ActionHint,
  AlertLane,
  BannerRow,
  CreatedActions,
  LiveRegion,
  PageStack
} from './LedgerPage.styled';

const copy = LEDGER_COPY;


/** 목록 자리의 로딩 골격. 행 세 줄의 **모양**을 그대로 그린다(값이 올 자리를 미리 잡는다). */


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
  onRestoreLastSheet,
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
  /* ⚠ 기록 화면 전용 id·ref(월 제목·지불자·목록·새로고침 사유, 삭제 뒤 포커스)는 **부품이 갖는다**
     (`LedgerEntriesWorkspace`, 2026-08-31). 여기 남기면 쓰지도 않는 상태를 계속 넘겨야 한다.
     🔴 `expiredHintId` 만 여기 남는다 — 오버레이와 **같은 줄**을 가리켜야 해서다. */
  /* 생성 안내 카드의 "구글 시트에서 열기" 버튼 — 링크가 아니라 버튼이다(2026-08-01 사용자 결정). */
  const sheetOpenRef = useRef<HTMLButtonElement | null>(null);

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
            {<LedgerSkeletonList />}
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
        <section aria-busy="true">{<LedgerSkeletonList />}</section>
      ) : null}

      {isPickingSource ? (
        <LedgerConnectPanel
          phase={viewModel.phase}
          headingId={connectHeadingId}
          isAppSignedIn={isAppSignedIn}
          hasStoredLink={viewModel.hasStoredLink}
          onRestoreLastSheet={onRestoreLastSheet}
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

      {/* 🔴 **기록 화면**은 한 부품이 소유한다(2026-08-31 리팩터). 이 뷰가 901줄이었고 그중 300줄이
          이 블록이라, 연결·매핑·탭 상태와 나란히 있으면 "지금 어느 화면 얘기인가"를 매번 되짚어야 했다.
          ⚠ 마운트 조건(연결됨 + 기록 탭)은 **여기가** 정한다 — 부품이 다시 판단하면 조건이 두 곳이 된다. */}
      {isConnected && viewModel.selectedViewTab === 'entries' ? (
        <LedgerEntriesWorkspace
          viewModel={viewModel}
          retryCountdowns={retryCountdowns}
          focusAfterRemoveId={focusAfterRemoveId}
          expiredHintId={expiredHintId}
          onFocusAfterRemoveHandled={onFocusAfterRemoveHandled}
          onSelectTab={onSelectTab}
          onSelectPayerScope={onSelectPayerScope}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onThisMonth={onThisMonth}
          onGoLatestMonth={onGoLatestMonth}
          onOpenCreateForm={onOpenCreateForm}
          onOpenEditForm={onOpenEditForm}
          onRequestRemove={onRequestRemove}
          onRetryRow={onRetryRow}
          onRetryAll={onRetryAll}
          onRefresh={onRefresh}
          onOpenCarryOver={onOpenCarryOver}
          onConfirmCarryOver={onConfirmCarryOver}
          onCloseCarryOver={onCloseCarryOver}
          onRunBackfill={onRunBackfill}
          onToggleDividendOverlay={onToggleDividendOverlay}
        />
      ) : null}

      {footer}

      {/* 🔴 **본문 밖에 뜨는 것**은 한 부품이 소유한다(2026-08-31 리팩터). 이 뷰가 901줄이었고
          오버레이 조건문이 본문 읽기를 끊고 있었다. 중첩 오버레이 금지 규칙도 그쪽이 함께 갖는다.
          ⚠ 열림/닫힘 잔상(useOverlayPresence)은 **여기가** 소유한다 — 뷰의 다른 상태와 같은
            프레임에 있어야 사라지는 동안의 모습이 맞는다. */}
      <LedgerOverlays
        viewModel={viewModel}
        form={form}
        removeTarget={removeTarget}
        expiredHintId={expiredHintId}
        onSideFormChange={onSideFormChange}
        onSideFormSubmit={onSideFormSubmit}
        onSideFormClose={onSideFormClose}
        onFormChange={onFormChange}
        onSubmitForm={onSubmitForm}
        onCloseForm={onCloseForm}
        onConfirmRemove={onConfirmRemove}
        onCloseRemove={onCloseRemove}
        onReconnect={onReconnect}
        onRefresh={onRefresh}
      />
    </PageStack>
  );
}
