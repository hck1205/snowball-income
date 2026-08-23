import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import InvestmentSettings from "@/components/InvestmentSettings";
import TickerCreation from "@/components/TickerCreation";
import { CloudReconcileModal } from "@/components/CloudReconcileModal";
import { previewBlend } from "@/jotai/snowball/cloud";
import MainContentLoader from "@/pages/Main/components/MainContentLoader";
import { DrawerResultStrip, SettingsToolsSection } from "./components";
import { useReinvestRouting } from "./hooks";
import {
  useDisplayCurrencyViewAtomValue,
  useIncludedTickerIdsAtomValue,
  useSetActiveHelpWrite,
  useSetDisplayCurrencyWrite,
  useSetShowQuickEstimateWrite,
  useSetShowSplitGraphsWrite,
  useShowQuickEstimateAtomValue,
  useShowSplitGraphsAtomValue,
  useTickerProfilesAtomValue,
} from "@/jotai";
import {
  useCloudSyncAnalytics,
  useCloudWorkspaceSync,
  useSnowballForm,
  useTickerActions,
  usePortfolioPersistence,
} from "@/pages/Main/hooks";
import { ANALYTICS_EVENT, trackEvent } from "@/shared/lib/analytics";
import type { MainLeftPanelProps } from "./MainLeftPanel.types";

function MainLeftPanelComponent({
  onHydratedChange,
  onRegisterRetryCloudSave,
  onRegisterResumeConflict,
}: MainLeftPanelProps) {
  const modalRoot = typeof document !== "undefined" ? document.body : null;
  const tickerProfiles = useTickerProfilesAtomValue();
  const includedTickerIds = useIncludedTickerIdsAtomValue();
  const showQuickEstimate = useShowQuickEstimateAtomValue();
  const setShowQuickEstimate = useSetShowQuickEstimateWrite();
  const showSplitGraphs = useShowSplitGraphsAtomValue();
  const setShowSplitGraphs = useSetShowSplitGraphsWrite();
  // 표시 통화 토글(투자 설정 카드 안)에 내려줄 상태. 환율 조회/선호 통화에만 반응하는 파생 atom이라
  // 폼 타건으로는 값이 바뀌지 않는다 — 이 구독이 타건 리렌더를 늘리지 않는다.
  const display = useDisplayCurrencyViewAtomValue();
  const setDisplayCurrency = useSetDisplayCurrencyWrite();
  const setActiveHelp = useSetActiveHelpWrite();
  const { values, validation, setField } = useSnowballForm();
  /* 종목별 배당 재투자(비율·목적지) — 읽기·쓰기 규칙은 훅이 갖는다. */
  const reinvestRouting = useReinvestRouting(values.reinvestDividendPercent);

  const {
    openTickerModal,
    handleTickerChipClick,
    handleTickerPressStart,
    handleTickerPressEnd,
    openTickerEditModal,
  } = useTickerActions();
  const {
    isPortfolioHydrated,
    createShareLink,
    buildPayload,
    applyPersistedPayload,
    retryCloudSave,
    readLocalAutosaveForSync,
  } = usePortfolioPersistence();

  // 세션 시작 시 클라우드 워크스페이스 동기화. **진짜 동시편집(양쪽 다 base에서 변함)** 만 충돌로 감지되고
  // 화해 API(conflict/summary/resolve*/defer)를 반환한다 — 그걸 캡처해 화해 모달에 연결한다. 단방향 변경은
  // 엔진이 조용히 fast-forward한다(모달 없음). 로컬 read는 하이드레이션과 공유한다(readLocalAutosaveForSync).
  const {
    conflict,
    summary,
    isResolving,
    hasResolveFailed,
    resolveWithDevice,
    resolveWithCloud,
    resolveWithBlend,
    deferConflict,
  } = useCloudWorkspaceSync({
    isPortfolioHydrated,
    buildPayload,
    applyPersistedPayload,
    readLocalAutosave: readLocalAutosaveForSync,
  });

  // 충돌 모달의 열림/닫힘 로컬 상태. 이연(닫기)해도 conflict atom은 남아(헤더 재개봉용) 열림 여부를 따로 쥔다.
  // 새 충돌이 오면(또는 화해로 conflict가 null이 되면) dismiss를 리셋해 다음 충돌이 정상 표면화되게 한다.
  const [isConflictDismissed, setConflictDismissed] = useState(false);
  useEffect(() => {
    if (!conflict) setConflictDismissed(false);
  }, [conflict]);
  const isConflictModalOpen = conflict !== null && !isConflictDismissed;

  // 헤더의 '동기화 보류' 표시가 부를 수 있도록 모달 재개봉 트리거를 상위에 등록한다(retryCloudSave와 동일 ref 패턴).
  const resumeConflict = useCallback(() => setConflictDismissed(false), []);
  useEffect(() => {
    onRegisterResumeConflict(resumeConflict);
    return () => onRegisterResumeConflict(null);
  }, [onRegisterResumeConflict, resumeConflict]);

  // 이연: 결정 없이 닫기 → 엔진 defer(디바이스 유지 + 세션 push 정지) + 모달만 로컬로 닫는다(충돌 데이터는 남는다).
  const handleDeferConflict = useCallback(() => {
    deferConflict();
    setConflictDismissed(true);
  }, [deferConflict]);

  // 블렌드 미리보기("합치면 N개 탭") — 순수(previewBlend). 모달이 열렸을 때만 계산한다.
  const blendTabCount = useMemo(() => (conflict ? previewBlend(conflict).tabCount : 0), [conflict]);

  // 클라우드 동기화 상태 전이(saved/error)를 GA4로 흘린다(엔진은 순수, 계측은 이 경계에서).
  useCloudSyncAnalytics();

  // 하이드레이션 완료를 상위(Main.view)로 올려 우패널 결과와 동시에 홀딩/공개한다.
  // 하이드레이션 트리거는 이 컴포넌트가 소유하므로(항상 마운트) 게이트가 열려도 데드락이 없다.
  useEffect(() => {
    onHydratedChange(isPortfolioHydrated);
  }, [isPortfolioHydrated, onHydratedChange]);

  // 헤더의 CloudSyncIndicator가 부를 수 있도록 클라우드 저장 재시도를 상위에 등록한다(함수 참조만 대입).
  // retryCloudSave는 매 렌더 새 함수라 이 effect가 매 렌더 재등록하지만 ref 대입이라 리렌더를 유발하지 않는다.
  const onRetryCloud = useCallback(() => void retryCloudSave(), [retryCloudSave]);
  useEffect(() => {
    onRegisterRetryCloudSave(onRetryCloud);
    return () => onRegisterRetryCloudSave(null);
  }, [onRegisterRetryCloudSave, onRetryCloud]);

  const handleHelpResultMode = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: "open_help_result_mode",
      placement: "investment_settings",
    });
    setActiveHelp("resultMode");
  }, [setActiveHelp]);
  const handleHelpReinvestTiming = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: "open_help_reinvest_timing",
      placement: "investment_settings",
    });
    setActiveHelp("reinvestTiming");
  }, [setActiveHelp]);
  const handleHelpDpsGrowthMode = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: "open_help_dps_growth_mode",
      placement: "investment_settings",
    });
    setActiveHelp("dpsGrowthMode");
  }, [setActiveHelp]);

  // 하이드레이션 전에는 좌패널 입력을 홀딩한다 — 기본값을 그렸다가 저장값으로 갈아끼우는 깜빡임 제거.
  // 위의 훅(하이드레이션 트리거 포함)이 모두 호출된 뒤의 조기 반환이라 훅 순서/데드락 문제가 없다.
  if (!isPortfolioHydrated) {
    return <MainContentLoader label="설정을 불러오는 중…" minHeight="360px" />;
  }

  return (
    /*
     * 🔴 드로어 본문의 **섹션 순서는 사용 빈도 순**이다 — ①종목 ②투자 조건 ③계산 방식 ④도구.
     *   종전 순서(공유 → 티커 생성 → 칩 → 환율 → 토글 → 조건 입력)는 정확히 그 반대였다:
     *   시각적으로 가장 강한 두 요소(전폭 고스트 공유 · 전폭 그라디언트 CTA)가 가장 드물게 쓰는
     *   동작이었고, 정작 자주 고치는 월적립·기간·세율은 스크롤 한참 아래에 있었다.
     *   순서를 바꾸려면 `test/main/settingsDrawerSectionOrder.test.tsx` 가 먼저 묻는다.
     *
     *   맨 위 스트립은 섹션이 아니라 **결과의 사본**이다(드로어가 결과 hero 숫자를 100% 가린다).
     */
    <>
      <DrawerResultStrip />
      <TickerCreation
        tickerProfiles={tickerProfiles}
        includedTickerIds={includedTickerIds}
        onOpenCreate={openTickerModal}
        onTickerClick={handleTickerChipClick}
        onTickerPressStart={handleTickerPressStart}
        onTickerPressEnd={handleTickerPressEnd}
        onOpenEdit={openTickerEditModal}
      />
      <InvestmentSettings
        reinvestRouting={reinvestRouting}
        values={values}
        showQuickEstimate={showQuickEstimate}
        showSplitGraphs={showSplitGraphs}
        display={display}
        validationErrors={validation.errors}
        validationFields={validation.fields}
        onSetField={setField}
        onToggleQuickEstimate={setShowQuickEstimate}
        onToggleSplitGraphs={setShowSplitGraphs}
        onChangeCurrency={setDisplayCurrency}
        onHelpResultMode={handleHelpResultMode}
        onHelpReinvestTiming={handleHelpReinvestTiming}
        onHelpDpsGrowthMode={handleHelpDpsGrowthMode}
      />
      {/* ④ 도구 — 공유 + 표시 전용 환율 위젯. 드로어에서 가장 드물게 쓰는 것들이라 맨 아래다.
          (환율은 계산 엔진과 분리 — 엔진에 아무것도 넘기지 않아 저장/공유/결과에 영향이 없다.) */}
      <SettingsToolsSection onCreateShareLink={createShareLink} />
      {/* 충돌 화해 모달 — 전역 오버레이로 body에 포털. 닫기(Esc/바깥클릭)는 이연이다(무음 화해 금지).
          merge-base 덕분에 진짜 동시편집일 때만 세션당 1회 열린다(단방향 변경은 조용히 fast-forward). */}
      {isConflictModalOpen && summary && modalRoot
        ? createPortal(
            <CloudReconcileModal
              summary={summary}
              blendTabCount={blendTabCount}
              isResolving={isResolving}
              hasResolveFailed={hasResolveFailed}
              onUseDevice={resolveWithDevice}
              onUseCloud={resolveWithCloud}
              onBlend={resolveWithBlend}
              onDefer={handleDeferConflict}
            />,
            modalRoot
          )
        : null}
    </>
  );
}

const MainLeftPanel = memo(MainLeftPanelComponent);

export default MainLeftPanel;
