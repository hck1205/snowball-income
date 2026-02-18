import { memo, useCallback } from "react";
import InvestmentSettings from "@/components/InvestmentSettings";
import TickerCreation from "@/components/TickerCreation";
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
  useSnowballForm,
  useTickerActions,
  usePortfolioPersistence,
} from "@/pages/Main/hooks";
import { ANALYTICS_EVENT, trackEvent } from "@/shared/lib/analytics";

function MainLeftPanelComponent() {
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
    saveNamedState,
    listSavedStateNames,
    loadNamedState,
    deleteNamedState,
    downloadNamedStateAsJson,
    loadStateFromJsonText,
    createShareLink,
  } = usePortfolioPersistence();
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

  return (
    <>
      <TickerCreation
        tickerProfiles={tickerProfiles}
        includedTickerIds={includedTickerIds}
        onOpenCreate={openTickerModal}
        onSaveNamedState={saveNamedState}
        onListSavedStateNames={listSavedStateNames}
        onLoadNamedState={loadNamedState}
        onDeleteNamedState={deleteNamedState}
        onDownloadNamedStateAsJson={downloadNamedStateAsJson}
        onLoadStateFromJsonText={loadStateFromJsonText}
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
