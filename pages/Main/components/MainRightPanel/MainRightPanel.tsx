import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTickerDisplayName } from '@/shared/utils';
import { createPortal } from 'react-dom';
import { useOptionalCommunityAuth } from '@/components/community/CommunityAuthProvider';
import type { SimulationResult as SimulationResultRow } from '@/shared/types';
import { DISPLAY_CURRENCY_COPY, DIVIDEND_UNIVERSE } from '@/shared/constants';
import { ResultsColumn } from './MainRightPanel.styled';
import {
  LoginNudgeModal,
  PortfolioPresetBoard,
  PostInvestmentProjectionPanel,
  PresetApplyModal,
  ScenarioTabs,
  ScenarioTabTooltip,
  TabDeleteModal,
  type PortfolioPresetPlaceholder
} from './components';
import MonthlyCashflow from '@/components/MonthlyCashflow';
import PortfolioComposition from '@/components/PortfolioComposition';
import SimulationResult from '@/components/SimulationResult';
import YearlyResult from '@/components/YearlyResult';
import {
  useAdjustableTickerCountAtomValue,
  useAllocationPercentByTickerIdAtomValue,
  useDisplayCurrencyViewAtomValue,
  useFixedByTickerIdAtomValue,
  useIncludedProfilesAtomValue,
  useIsResultCompactAtomValue,
  useIsYearlyAreaFillOnAtomValue,
  useNormalizedAllocationAtomValue,
  useSetIsResultCompactWrite,
  useSetIsYearlyAreaFillOnWrite,
  useSetIncludedTickerIdsWrite,
  useSetSelectedTickerIdWrite,
  useSetShowPortfolioDividendCenterWrite,
  useShowQuickEstimateAtomValue,
  useShowSplitGraphsAtomValue,
  useSetTickerProfilesWrite,
  useSetFixedByTickerIdWrite,
  useSetActiveHelpWrite,
  useSetWeightByTickerIdWrite,
  useSetYieldFormWrite,
  useVisibleYearlySeriesAtomValue
} from '@/jotai';
import { useMainComputed, useScenarioTabs, useSnowballForm, useTickerActions } from '@/pages/Main/hooks';
import { ChartPanel, ResponsiveEChart } from '@/pages/Main/components';
import {
  buildPresetPortfolio,
  computeAnnualGrowthRate,
  createResultAmountFormatter,
  formatPercent,
  targetYearLabel
} from '@/pages/Main/utils';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { useScenarioTabInteractions } from './hooks';

function MainRightPanelComponent() {
  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  // 프리셋 적용 확인 모달 대상 — 모바일에서 스크롤 중 실수 탭으로 프리셋이 즉시 적용되는 걸 막는다.
  const [pendingPreset, setPendingPreset] = useState<PortfolioPresetPlaceholder | null>(null);
  const [postInvestmentProjectionYears, setPostInvestmentProjectionYears] = useState(10);
  const [isPostInvestmentAssetView, setIsPostInvestmentAssetView] = useState(false);
  // Provider 없이(커뮤니티 비활성/격리 렌더) 안전한 optional 접근 — 게이트는 커뮤니티 활성일 때만 발동한다.
  const communityAuth = useOptionalCommunityAuth();
  const hasTrackedSimulationRef = useRef(false);
  const hasTrackedPortfolioConfigRef = useRef(false);
  const showQuickEstimate = useShowQuickEstimateAtomValue();
  const isResultCompact = useIsResultCompactAtomValue();
  const setIsResultCompact = useSetIsResultCompactWrite();
  const includedProfiles = useIncludedProfilesAtomValue();
  const normalizedAllocation = useNormalizedAllocationAtomValue();
  const allocationPercentByTickerId = useAllocationPercentByTickerIdAtomValue();
  const adjustableTickerCount = useAdjustableTickerCountAtomValue();
  const fixedByTickerId = useFixedByTickerIdAtomValue();
  const setShowPortfolioDividendCenter = useSetShowPortfolioDividendCenterWrite();
  const setTickerProfiles = useSetTickerProfilesWrite();
  const setIncludedTickerIds = useSetIncludedTickerIdsWrite();
  const setSelectedTickerId = useSetSelectedTickerIdWrite();
  const setWeightByTickerId = useSetWeightByTickerIdWrite();
  const setFixedByTickerId = useSetFixedByTickerIdWrite();
  const setActiveHelp = useSetActiveHelpWrite();
  const setYieldFormValues = useSetYieldFormWrite();
  const showSplitGraphs = useShowSplitGraphsAtomValue();
  const isYearlyAreaFillOn = useIsYearlyAreaFillOnAtomValue();
  const setIsYearlyAreaFillOn = useSetIsYearlyAreaFillOnWrite();
  const visibleYearlySeries = useVisibleYearlySeriesAtomValue();
  const { values, validation } = useSnowballForm();
  /*
   * 결과 **표시** 통화. 계산은 언제나 원화이고, 여기서 만든 포맷터가 표시 직전에 한 번만 환산한다.
   * `display.currency` 는 환율이 없으면 원화로 떨어지는 **적용** 통화라, 이 경로로는 `$NaN` 이 나올 수 없다.
   */
  const display = useDisplayCurrencyViewAtomValue();
  const formatResultAmount = useMemo(
    () => createResultAmountFormatter(display.currency, display.rate),
    [display.currency, display.rate]
  );
  const chartLabelSuffix = display.currency === 'USD' ? DISPLAY_CURRENCY_COPY.chartSuffixUsd : '';
  const {
    simulation,
    tableRows,
    allocationPieOption,
    recentCashflowBarOption,
    yearlyCashflowByTicker,
    postInvestmentDividendProjectionRows,
    yearlyResultBarOption,
    yearlySeriesItems,
    formatChartValue
  } = useMainComputed({
    isValid: validation.isValid,
    values,
    visibleYearlySeries,
    isYearlyAreaFillOn,
    postInvestmentProjectionYears,
    displayCurrency: display.currency,
    fxRate: display.rate
  });
  const { setTickerWeight, toggleTickerFixed, clearAllFixed, removeIncludedTicker } = useTickerActions();
  const {
    tabs,
    activeScenarioId,
    canCreateTab,
    canDeleteTab,
    requiresLoginToCreateTab,
    selectScenarioTab,
    createScenarioTab,
    renameScenarioTab,
    deleteScenarioTab,
    reorderScenarioTabs
  } = useScenarioTabs();
  const {
    editingTabId,
    editingTabName,
    editingTabWidth,
    deleteTargetTabId,
    hoverTooltip,
    draggingTabId,
    dragOverTabId,
    dragJustFinishedRef,
    isLoginNudgeOpen,
    setEditingTabName,
    setDraggingTabId,
    setDragOverTabId,
    startRenameMode,
    cancelRenameMode,
    commitRenameMode,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteTab,
    showHoverTooltip,
    hideHoverTooltip,
    handleCreateTab,
    closeLoginNudge,
    handleLoginFromNudge,
    openScenarioTabsHelp
  } = useScenarioTabInteractions({
    renameScenarioTab,
    deleteScenarioTab,
    createScenarioTab,
    setActiveHelp,
    communityAuth
  });
  const hasGraphData = includedProfiles.length > 0;
  const emptyGraphMessage = '좌측 티커 생성을 통해 포트폴리오를 구성해주세요.';
  /* 지급 일정 스트립(실지급 월별 배당 카드)용 — 이름 규칙은 차트 시리즈와 동일하게 맞춘다. */
  const scheduleTickers = useMemo(
    () =>
      includedProfiles.map((profile) => ({
        ticker: profile.ticker,
        displayName: getTickerDisplayName(profile.ticker, profile.name)
      })),
    [includedProfiles]
  );
  const getYear = useCallback((row: SimulationResultRow) => `${row.year}`, []);
  const getMonthlyDividend = useCallback((row: SimulationResultRow) => row.monthlyDividend, []);
  const getAssetValue = useCallback((row: SimulationResultRow) => row.assetValue, []);
  const getCumulativeDividend = useCallback((row: SimulationResultRow) => row.cumulativeDividend, []);
  const projectedAnnualDividendGrowthRate = computeAnnualGrowthRate(postInvestmentDividendProjectionRows, (row) => row.annualDividend);
  const projectedAnnualAssetGrowthRate = computeAnnualGrowthRate(postInvestmentDividendProjectionRows, (row) => row.assetValue);
  const postInvestmentChartTitle =
    isPostInvestmentAssetView
      ? projectedAnnualAssetGrowthRate === null
        ? '투자 종료 후 자산가치 추정 (추가 납입 없음)'
        : `투자 종료 후 자산가치 추정 (추가 납입 없음, 연 ${projectedAnnualAssetGrowthRate >= 0 ? '+' : ''}${(
            projectedAnnualAssetGrowthRate * 100
          ).toFixed(2)}%)`
      : projectedAnnualDividendGrowthRate === null
        ? '투자 종료 후 월배당 성장 추정 (추가 납입 없음)'
        : `투자 종료 후 월배당 성장 추정 (추가 납입 없음, 연 ${projectedAnnualDividendGrowthRate >= 0 ? '+' : ''}${(
            projectedAnnualDividendGrowthRate * 100
          ).toFixed(2)}%)`;

  const applyPortfolioPreset = useCallback(
    (preset: PortfolioPresetPlaceholder) => {
      const nextPortfolio = buildPresetPortfolio({ preset, universe: DIVIDEND_UNIVERSE });
      if (!nextPortfolio) return;

      trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
        cta_name: 'apply_portfolio_preset',
        placement: 'empty_result_preset_grid',
        preset_id: preset.id
      });
      trackEvent(ANALYTICS_EVENT.PRESET_APPLIED, {
        preset_id: preset.id,
        ticker_count: nextPortfolio.profiles.length
      });

      setTickerProfiles(nextPortfolio.profiles);
      setIncludedTickerIds(nextPortfolio.includedIds);
      setSelectedTickerId(nextPortfolio.selectedTickerId);
      setWeightByTickerId(nextPortfolio.weightByTickerId);
      setFixedByTickerId(nextPortfolio.fixedByTickerId);
      setShowPortfolioDividendCenter(true);
      renameScenarioTab(activeScenarioId, nextPortfolio.scenarioName);
      setYieldFormValues((prev) => ({
        ...prev,
        ...nextPortfolio.formPatch
      }));
    },
    [
      setFixedByTickerId,
      setIncludedTickerIds,
      activeScenarioId,
      renameScenarioTab,
      setSelectedTickerId,
      setShowPortfolioDividendCenter,
      setTickerProfiles,
      setWeightByTickerId,
      setYieldFormValues
    ]
  );

  const cancelApplyPreset = useCallback(() => setPendingPreset(null), []);
  const confirmApplyPreset = useCallback(() => {
    if (pendingPreset) applyPortfolioPreset(pendingPreset);
    setPendingPreset(null);
  }, [pendingPreset, applyPortfolioPreset]);

  useEffect(() => {
    if (!simulation) {
      hasTrackedSimulationRef.current = false;
      hasTrackedPortfolioConfigRef.current = false;
      return;
    }

    if (!hasTrackedSimulationRef.current) {
      trackEvent(ANALYTICS_EVENT.SIMULATION_RESULT_VIEW, {
        included_ticker_count: includedProfiles.length,
        duration_years: values.durationYears,
        show_quick_estimate: showQuickEstimate
      });
      hasTrackedSimulationRef.current = true;
    }

    if (!hasTrackedPortfolioConfigRef.current) {
      trackEvent(ANALYTICS_EVENT.PORTFOLIO_CONFIG_COMPLETED, {
        included_ticker_count: includedProfiles.length,
        has_split_graphs: showSplitGraphs
      });
      hasTrackedPortfolioConfigRef.current = true;
    }
  }, [includedProfiles.length, showQuickEstimate, showSplitGraphs, simulation, values.durationYears]);

  useEffect(() => {
    if (!simulation) return;
    trackEvent(ANALYTICS_EVENT.CHART_VIEW, {
      chart_name: 'yearly_result',
      mode: isYearlyAreaFillOn ? 'fill' : 'line'
    });
  }, [isYearlyAreaFillOn, simulation]);

  useEffect(() => {
    if (!simulation || !showSplitGraphs) return;
    trackEvent(ANALYTICS_EVENT.CHART_VIEW, {
      chart_name: 'split_graphs',
      visible: true
    });
  }, [showSplitGraphs, simulation]);

  useEffect(() => {
    if (!simulation || postInvestmentDividendProjectionRows.length === 0) return;
    trackEvent(ANALYTICS_EVENT.CHART_VIEW, {
      chart_name: 'post_investment_monthly_dividend_projection',
      visible: true
    });
  }, [postInvestmentDividendProjectionRows.length, simulation]);

  return (
    <ResultsColumn>
      <ScenarioTabs
        tabs={tabs}
        activeScenarioId={activeScenarioId}
        editingTabId={editingTabId}
        editingTabName={editingTabName}
        editingTabWidth={editingTabWidth}
        draggingTabId={draggingTabId}
        dragOverTabId={dragOverTabId}
        dragJustFinishedRef={dragJustFinishedRef}
        canCreateTab={canCreateTab}
        canDeleteTab={canDeleteTab}
        requiresLoginToCreateTab={requiresLoginToCreateTab}
        setEditingTabName={setEditingTabName}
        setDraggingTabId={setDraggingTabId}
        setDragOverTabId={setDragOverTabId}
        commitRenameMode={commitRenameMode}
        cancelRenameMode={cancelRenameMode}
        startRenameMode={startRenameMode}
        openDeleteModal={openDeleteModal}
        selectScenarioTab={selectScenarioTab}
        reorderScenarioTabs={reorderScenarioTabs}
        showHoverTooltip={showHoverTooltip}
        hideHoverTooltip={hideHoverTooltip}
        onCreateTab={handleCreateTab}
        openScenarioTabsHelp={openScenarioTabsHelp}
      />

      {simulation ? (
        <>
          <SimulationResult
            simulation={simulation}
            showQuickEstimate={showQuickEstimate}
            isResultCompact={isResultCompact}
            targetMonthlyDividend={values.targetMonthlyDividend}
            onToggleCompact={setIsResultCompact}
            formatResultAmount={formatResultAmount}
            formatPercent={formatPercent}
            targetYearLabel={targetYearLabel}
          />

          <PortfolioComposition
            includedProfiles={includedProfiles}
            normalizedAllocation={normalizedAllocation}
            allocationPieOption={allocationPieOption}
            allocationPercentByTickerId={allocationPercentByTickerId}
            fixedByTickerId={fixedByTickerId}
            adjustableTickerCount={adjustableTickerCount}
            onSetTickerWeight={setTickerWeight}
            onToggleTickerFixed={toggleTickerFixed}
            onClearAllFixed={clearAllFixed}
            onRemoveIncludedTicker={removeIncludedTicker}
            chartLabelSuffix={chartLabelSuffix}
            ResponsiveChart={ResponsiveEChart}
          />

          {showSplitGraphs ? (
            <>
              <ChartPanel
                title="월 평균 배당"
                rows={tableRows}
                hasData={hasGraphData}
                emptyMessage={emptyGraphMessage}
                getXValue={getYear}
                getYValue={getMonthlyDividend}
                yAxisLabelFormatter={formatChartValue}
                chartLabelSuffix={chartLabelSuffix}
              />
              <ChartPanel
                title="자산 가치"
                rows={tableRows}
                hasData={hasGraphData}
                emptyMessage={emptyGraphMessage}
                getXValue={getYear}
                getYValue={getAssetValue}
                yAxisLabelFormatter={formatChartValue}
                chartLabelSuffix={chartLabelSuffix}
              />
              <ChartPanel
                title="누적 배당"
                rows={tableRows}
                hasData={hasGraphData}
                emptyMessage={emptyGraphMessage}
                getXValue={getYear}
                getYValue={getCumulativeDividend}
                yAxisLabelFormatter={formatChartValue}
                chartLabelSuffix={chartLabelSuffix}
              />
            </>
          ) : null}

          {/* 실지급 월별 배당(캘린더 포함)을 연도별 결과보다 위로 — 배당 캘린더 추가(2026-07-25) 후
              "이번 달/올해 얼마"가 장기 연도별 추이보다 먼저 읽혀야 한다는 사용자 결정. */}
          <MonthlyCashflow
            chartOption={recentCashflowBarOption}
            yearlyCashflowByTicker={yearlyCashflowByTicker}
            hasData={hasGraphData}
            emptyMessage={emptyGraphMessage}
            formatAmount={formatChartValue}
            chartLabelSuffix={chartLabelSuffix}
            scheduleTickers={scheduleTickers}
            ResponsiveChart={ResponsiveEChart}
          />

          <YearlyResult
            items={yearlySeriesItems}
            isFillOn={isYearlyAreaFillOn}
            onToggleFill={setIsYearlyAreaFillOn}
            chartOption={yearlyResultBarOption}
            hasData={hasGraphData}
            emptyMessage={emptyGraphMessage}
            chartLabelSuffix={chartLabelSuffix}
            ResponsiveChart={ResponsiveEChart}
          />

          <PostInvestmentProjectionPanel
            title={postInvestmentChartTitle}
            rows={postInvestmentDividendProjectionRows}
            hasData={hasGraphData && postInvestmentDividendProjectionRows.length > 0}
            emptyMessage={emptyGraphMessage}
            projectionYears={postInvestmentProjectionYears}
            onProjectionYearsChange={setPostInvestmentProjectionYears}
            isAssetView={isPostInvestmentAssetView}
            onAssetViewChange={setIsPostInvestmentAssetView}
            yAxisLabelFormatter={formatChartValue}
            chartLabelSuffix={chartLabelSuffix}
          />
        </>
      ) : (
        <PortfolioPresetBoard isPortfolioEmpty={includedProfiles.length === 0} onPresetSelect={setPendingPreset} />
      )}
      {pendingPreset && modalRoot ? (
        <PresetApplyModal
          modalRoot={modalRoot}
          presetTitle={pendingPreset.title}
          onCancel={cancelApplyPreset}
          onConfirm={confirmApplyPreset}
        />
      ) : null}
      {deleteTargetTabId && modalRoot ? (
        <TabDeleteModal modalRoot={modalRoot} onCancel={closeDeleteModal} onConfirm={confirmDeleteTab} />
      ) : null}
      {isLoginNudgeOpen && modalRoot ? (
        <LoginNudgeModal modalRoot={modalRoot} onClose={closeLoginNudge} onLogin={handleLoginFromNudge} />
      ) : null}
      {hoverTooltip && modalRoot
        ? createPortal(
            <ScenarioTabTooltip style={{ left: `${hoverTooltip.x + 10}px`, top: `${hoverTooltip.y + 14}px` }}>
              {hoverTooltip.text}
            </ScenarioTabTooltip>,
            modalRoot
          )
        : null}
    </ResultsColumn>
  );
}

const MainRightPanel = memo(MainRightPanelComponent);

export default MainRightPanel;
