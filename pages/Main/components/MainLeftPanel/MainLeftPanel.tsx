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

export default function MainLeftPanel() {
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
  } = usePortfolioPersistence();

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
        onHelpResultMode={() => setActiveHelp("resultMode")}
        onHelpReinvestTiming={() => setActiveHelp("reinvestTiming")}
        onHelpDpsGrowthMode={() => setActiveHelp("dpsGrowthMode")}
      />
    </>
  );
}
