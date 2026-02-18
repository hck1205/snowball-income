import { useCallback, useMemo } from 'react';
import type { PortfolioPersistedState } from '@/shared/types/snowball';
import type { PersistedInvestmentSettings, PersistedScenarioState } from '@/jotai/snowball/types';
import {
  EMPTY_INVESTMENT_SETTINGS,
  MAX_SCENARIO_TABS,
  useActiveScenarioIdAtomValue,
  useFixedByTickerIdAtomValue,
  useIncludedTickerIdsAtomValue,
  useIsResultCompactAtomValue,
  useIsYearlyAreaFillOnAtomValue,
  useScenarioTabsAtomValue,
  useSelectedTickerIdAtomValue,
  useSetActiveScenarioIdWrite,
  useSetFixedByTickerIdWrite,
  useSetIncludedTickerIdsWrite,
  useSetIsResultCompactWrite,
  useSetIsYearlyAreaFillOnWrite,
  useSetScenarioTabsWrite,
  useSetSelectedTickerIdWrite,
  useSetShowPortfolioDividendCenterWrite,
  useSetShowQuickEstimateWrite,
  useSetShowSplitGraphsWrite,
  useSetTickerProfilesWrite,
  useSetVisibleYearlySeriesWrite,
  useSetWeightByTickerIdWrite,
  useSetYieldFormWrite,
  useShowPortfolioDividendCenterAtomValue,
  useShowQuickEstimateAtomValue,
  useShowSplitGraphsAtomValue,
  useTickerProfilesAtomValue,
  useVisibleYearlySeriesAtomValue,
  useWeightByTickerIdAtomValue,
  useYieldFormAtomValue
} from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

const makeScenarioId = () => `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const sanitizeScenarioName = (rawName: string) => rawName.trim();

const createEmptyScenarioPortfolio = (): PortfolioPersistedState => {
  return {
    tickerProfiles: [],
    includedTickerIds: [],
    weightByTickerId: {},
    fixedByTickerId: {},
    selectedTickerId: null
  };
};

const createEmptyScenarioInvestmentSettings = (): PersistedInvestmentSettings => ({
  ...EMPTY_INVESTMENT_SETTINGS,
  visibleYearlySeries: { ...EMPTY_INVESTMENT_SETTINGS.visibleYearlySeries }
});

export const useScenarioTabs = () => {
  const tabs = useScenarioTabsAtomValue();
  const activeScenarioId = useActiveScenarioIdAtomValue();

  const tickerProfiles = useTickerProfilesAtomValue();
  const includedTickerIds = useIncludedTickerIdsAtomValue();
  const weightByTickerId = useWeightByTickerIdAtomValue();
  const fixedByTickerId = useFixedByTickerIdAtomValue();
  const selectedTickerId = useSelectedTickerIdAtomValue();

  const values = useYieldFormAtomValue();
  const showQuickEstimate = useShowQuickEstimateAtomValue();
  const showSplitGraphs = useShowSplitGraphsAtomValue();
  const isResultCompact = useIsResultCompactAtomValue();
  const isYearlyAreaFillOn = useIsYearlyAreaFillOnAtomValue();
  const showPortfolioDividendCenter = useShowPortfolioDividendCenterAtomValue();
  const visibleYearlySeries = useVisibleYearlySeriesAtomValue();

  const setScenarioTabs = useSetScenarioTabsWrite();
  const setActiveScenarioId = useSetActiveScenarioIdWrite();
  const setTickerProfiles = useSetTickerProfilesWrite();
  const setIncludedTickerIds = useSetIncludedTickerIdsWrite();
  const setWeightByTickerId = useSetWeightByTickerIdWrite();
  const setFixedByTickerId = useSetFixedByTickerIdWrite();
  const setSelectedTickerId = useSetSelectedTickerIdWrite();
  const setShowQuickEstimate = useSetShowQuickEstimateWrite();
  const setShowSplitGraphs = useSetShowSplitGraphsWrite();
  const setIsResultCompact = useSetIsResultCompactWrite();
  const setIsYearlyAreaFillOn = useSetIsYearlyAreaFillOnWrite();
  const setShowPortfolioDividendCenter = useSetShowPortfolioDividendCenterWrite();
  const setVisibleYearlySeries = useSetVisibleYearlySeriesWrite();
  const setYieldFormValues = useSetYieldFormWrite();

  const currentInvestmentSettings = useMemo<PersistedInvestmentSettings>(
    () => ({
      initialInvestment: values.initialInvestment,
      monthlyContribution: values.monthlyContribution,
      targetMonthlyDividend: values.targetMonthlyDividend,
      investmentStartDate: values.investmentStartDate,
      durationYears: values.durationYears,
      reinvestDividends: values.reinvestDividends,
      reinvestDividendPercent: values.reinvestDividendPercent,
      taxRate: values.taxRate,
      reinvestTiming: values.reinvestTiming,
      dpsGrowthMode: values.dpsGrowthMode,
      showQuickEstimate,
      showSplitGraphs,
      isResultCompact,
      isYearlyAreaFillOn,
      showPortfolioDividendCenter,
      visibleYearlySeries
    }),
    [
      isResultCompact,
      isYearlyAreaFillOn,
      showPortfolioDividendCenter,
      showQuickEstimate,
      showSplitGraphs,
      values.dpsGrowthMode,
      values.durationYears,
      values.initialInvestment,
      values.investmentStartDate,
      values.monthlyContribution,
      values.reinvestDividends,
      values.reinvestDividendPercent,
      values.reinvestTiming,
      values.targetMonthlyDividend,
      values.taxRate,
      visibleYearlySeries
    ]
  );

  const applyScenario = useCallback(
    (scenario: PersistedScenarioState) => {
      setTickerProfiles(scenario.portfolio.tickerProfiles);
      setIncludedTickerIds(scenario.portfolio.includedTickerIds);
      setWeightByTickerId(scenario.portfolio.weightByTickerId);
      setFixedByTickerId(scenario.portfolio.fixedByTickerId);
      setSelectedTickerId(scenario.portfolio.selectedTickerId);

      setYieldFormValues((prev) => ({
        ...prev,
        initialInvestment: scenario.investmentSettings.initialInvestment,
        monthlyContribution: scenario.investmentSettings.monthlyContribution,
        targetMonthlyDividend: scenario.investmentSettings.targetMonthlyDividend,
        investmentStartDate: scenario.investmentSettings.investmentStartDate,
        durationYears: scenario.investmentSettings.durationYears,
        reinvestDividends: scenario.investmentSettings.reinvestDividends,
        reinvestDividendPercent: scenario.investmentSettings.reinvestDividendPercent,
        taxRate: scenario.investmentSettings.taxRate,
        reinvestTiming: scenario.investmentSettings.reinvestTiming,
        dpsGrowthMode: scenario.investmentSettings.dpsGrowthMode
      }));
      setShowQuickEstimate(scenario.investmentSettings.showQuickEstimate);
      setShowSplitGraphs(scenario.investmentSettings.showSplitGraphs);
      setIsResultCompact(scenario.investmentSettings.isResultCompact);
      setIsYearlyAreaFillOn(scenario.investmentSettings.isYearlyAreaFillOn);
      setShowPortfolioDividendCenter(scenario.investmentSettings.showPortfolioDividendCenter);
      setVisibleYearlySeries(scenario.investmentSettings.visibleYearlySeries);
    },
    [
      setFixedByTickerId,
      setIncludedTickerIds,
      setIsResultCompact,
      setIsYearlyAreaFillOn,
      setSelectedTickerId,
      setShowPortfolioDividendCenter,
      setShowQuickEstimate,
      setShowSplitGraphs,
      setTickerProfiles,
      setVisibleYearlySeries,
      setWeightByTickerId,
      setYieldFormValues
    ]
  );

  const snapshotCurrentScenario = useCallback(
    (scenario: PersistedScenarioState): PersistedScenarioState => ({
      ...scenario,
      portfolio: {
        tickerProfiles,
        includedTickerIds,
        weightByTickerId,
        fixedByTickerId,
        selectedTickerId
      },
      investmentSettings: currentInvestmentSettings
    }),
    [
      currentInvestmentSettings,
      fixedByTickerId,
      includedTickerIds,
      selectedTickerId,
      tickerProfiles,
      weightByTickerId
    ]
  );

  const prepareTabsWithActiveSnapshot = useCallback(() => {
    const activeIndex = tabs.findIndex((tab) => tab.id === activeScenarioId);
    if (activeIndex < 0) return tabs;
    const next = [...tabs];
    next[activeIndex] = snapshotCurrentScenario(next[activeIndex]);
    return next;
  }, [activeScenarioId, snapshotCurrentScenario, tabs]);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeScenarioId) ?? tabs[0] ?? null,
    [activeScenarioId, tabs]
  );

  const selectScenarioTab = useCallback(
    (nextScenarioId: string) => {
      if (nextScenarioId === activeScenarioId) return;

      const nextTabs = prepareTabsWithActiveSnapshot();
      const target = nextTabs.find((tab) => tab.id === nextScenarioId);
      if (!target) return;

      setScenarioTabs(nextTabs);
      setActiveScenarioId(nextScenarioId);
      applyScenario(target);
      trackEvent(ANALYTICS_EVENT.SCENARIO_TAB_ACTION, {
        action: 'select',
        scenario_id: nextScenarioId
      });
    },
    [activeScenarioId, applyScenario, prepareTabsWithActiveSnapshot, setActiveScenarioId, setScenarioTabs]
  );

  const createScenarioTab = useCallback(() => {
    if (tabs.length >= MAX_SCENARIO_TABS) return false;

    const nextTabs = prepareTabsWithActiveSnapshot();
    const newTabNumber = nextTabs.length + 1;
    const emptyPortfolio = createEmptyScenarioPortfolio();
    const emptyInvestmentSettings = createEmptyScenarioInvestmentSettings();
    const newTab: PersistedScenarioState = {
      id: makeScenarioId(),
      name: `탭 ${newTabNumber}`,
      portfolio: emptyPortfolio,
      investmentSettings: emptyInvestmentSettings
    };

    setScenarioTabs([...nextTabs, newTab]);
    setActiveScenarioId(newTab.id);
    applyScenario(newTab);
    trackEvent(ANALYTICS_EVENT.SCENARIO_TAB_ACTION, {
      action: 'create',
      scenario_id: newTab.id
    });
    return true;
  }, [
    applyScenario,
    prepareTabsWithActiveSnapshot,
    setActiveScenarioId,
    setScenarioTabs,
    tabs.length,
  ]);

  const deleteScenarioTab = useCallback((scenarioId: string) => {
    if (tabs.length <= 1) return false;

    const nextTabs = prepareTabsWithActiveSnapshot();
    const deletingIndex = nextTabs.findIndex((tab) => tab.id === scenarioId);
    if (deletingIndex < 0) return false;

    const remainingTabs = nextTabs.filter((tab) => tab.id !== scenarioId);
    const nextActiveTab =
      scenarioId === activeScenarioId
        ? remainingTabs[Math.max(0, deletingIndex - 1)] ?? remainingTabs[0]
        : nextTabs.find((tab) => tab.id === activeScenarioId) ?? remainingTabs[0];
    if (!nextActiveTab) return false;

    setScenarioTabs(remainingTabs);
    setActiveScenarioId(nextActiveTab.id);
    applyScenario(nextActiveTab);
    trackEvent(ANALYTICS_EVENT.SCENARIO_TAB_ACTION, {
      action: 'delete',
      scenario_id: scenarioId
    });
    return true;
  }, [activeScenarioId, applyScenario, prepareTabsWithActiveSnapshot, setActiveScenarioId, setScenarioTabs, tabs.length]);

  const renameScenarioTab = useCallback(
    (scenarioId: string, rawName: string) => {
      const nextName = sanitizeScenarioName(rawName);
      if (!nextName) return false;

      setScenarioTabs((prev) =>
        prev.map((tab) => (tab.id === scenarioId ? { ...tab, name: nextName } : tab))
      );
      trackEvent(ANALYTICS_EVENT.SCENARIO_TAB_ACTION, {
        action: 'rename',
        scenario_id: scenarioId
      });
      return true;
    },
    [setScenarioTabs]
  );

  return {
    tabs,
    activeScenarioId,
    activeScenarioName: activeTab?.name ?? '',
    canCreateTab: tabs.length < MAX_SCENARIO_TABS,
    canDeleteTab: tabs.length > 1,
    selectScenarioTab,
    createScenarioTab,
    renameScenarioTab,
    deleteScenarioTab
  };
};
