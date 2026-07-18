import { memo, useCallback, useEffect } from "react";
import InvestmentSettings from "@/components/InvestmentSettings";
import TickerCreation from "@/components/TickerCreation";
import MainContentLoader from "@/pages/Main/components/MainContentLoader";
import {
  useIncludedTickerIdsAtomValue,
  useSetActiveHelpWrite,
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

function MainLeftPanelComponent({ onHydratedChange, onRegisterRetryCloudSave }: MainLeftPanelProps) {
  const tickerProfiles = useTickerProfilesAtomValue();
  const includedTickerIds = useIncludedTickerIdsAtomValue();
  const showQuickEstimate = useShowQuickEstimateAtomValue();
  const setShowQuickEstimate = useSetShowQuickEstimateWrite();
  const showSplitGraphs = useShowSplitGraphsAtomValue();
  const setShowSplitGraphs = useSetShowSplitGraphsWrite();
  const setActiveHelp = useSetActiveHelpWrite();
  const { values, validation, setField } = useSnowballForm();
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

  // 세션 시작 시 클라우드 워크스페이스 동기화(조용한 로드 + 안전 마이그레이션, 충돌 프롬프트 없음).
  // 로컬 read는 하이드레이션과 공유한다(readLocalAutosaveForSync) — 독립 read 불일치로 인한 유실 경로 차단.
  useCloudWorkspaceSync({
    isPortfolioHydrated,
    buildPayload,
    applyPersistedPayload,
    readLocalAutosave: readLocalAutosaveForSync,
  });

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
    <>
      <TickerCreation
        tickerProfiles={tickerProfiles}
        includedTickerIds={includedTickerIds}
        onOpenCreate={openTickerModal}
        onCreateShareLink={createShareLink}
        onTickerClick={handleTickerChipClick}
        onTickerPressStart={handleTickerPressStart}
        onTickerPressEnd={handleTickerPressEnd}
        onOpenEdit={openTickerEditModal}
      />
      <InvestmentSettings
        values={values}
        showQuickEstimate={showQuickEstimate}
        showSplitGraphs={showSplitGraphs}
        validationErrors={validation.errors}
        onSetField={setField}
        onToggleQuickEstimate={setShowQuickEstimate}
        onToggleSplitGraphs={setShowSplitGraphs}
        onHelpResultMode={handleHelpResultMode}
        onHelpReinvestTiming={handleHelpReinvestTiming}
        onHelpDpsGrowthMode={handleHelpDpsGrowthMode}
      />
    </>
  );
}

const MainLeftPanel = memo(MainLeftPanelComponent);

export default MainLeftPanel;
