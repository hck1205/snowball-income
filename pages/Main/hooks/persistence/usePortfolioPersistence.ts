import { useEffect, useState } from 'react';
import {
  DEFAULT_SCENARIO_TAB_ID,
  DEFAULT_SCENARIO_TAB_NAME,
  deletePersistedAppStateByName,
  listPersistedStateNames,
  parsePersistedAppStateJson,
  readPersistedAppStateByName,
  readPersistedAppState,
  useActiveScenarioIdAtomValue,
  useFixedByTickerIdAtomValue,
  useIncludedTickerIdsAtomValue,
  useIsResultCompactAtomValue,
  useIsYearlyAreaFillOnAtomValue,
  useScenarioTabsAtomValue,
  useSelectedTickerIdAtomValue,
  useSetActiveScenarioIdWrite,
  useSetIsResultCompactWrite,
  useSetIsYearlyAreaFillOnWrite,
  useSetFixedByTickerIdWrite,
  useSetIncludedTickerIdsWrite,
  useSetScenarioTabsWrite,
  useSetShowPortfolioDividendCenterWrite,
  useSetSelectedTickerIdWrite,
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
  useYieldFormAtomValue,
  type PersistedInvestmentSettings,
  type PersistedScenarioState,
  writePersistedAppStateByName,
  writePersistedAppState
} from '@/jotai';

export const usePortfolioPersistence = () => {
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
  const scenarioTabs = useScenarioTabsAtomValue();
  const activeScenarioId = useActiveScenarioIdAtomValue();

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
  const setScenarioTabs = useSetScenarioTabsWrite();
  const setActiveScenarioId = useSetActiveScenarioIdWrite();

  const [isPortfolioHydrated, setIsPortfolioHydrated] = useState(false);

  const makeDefaultSavedName = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  };

  const buildPortfolioState = () => ({
    tickerProfiles,
    includedTickerIds,
    weightByTickerId,
    fixedByTickerId,
    selectedTickerId
  });

  const buildInvestmentSettings = (): PersistedInvestmentSettings => ({
    initialInvestment: values.initialInvestment,
    monthlyContribution: values.monthlyContribution,
    targetMonthlyDividend: values.targetMonthlyDividend,
    investmentStartDate: values.investmentStartDate,
    durationYears: values.durationYears,
    reinvestDividends: values.reinvestDividends,
    taxRate: values.taxRate,
    reinvestTiming: values.reinvestTiming,
    dpsGrowthMode: values.dpsGrowthMode,
    showQuickEstimate,
    showSplitGraphs,
    isResultCompact,
    isYearlyAreaFillOn,
    showPortfolioDividendCenter,
    visibleYearlySeries
  });

  const buildScenariosSnapshot = () => {
    const currentPortfolio = buildPortfolioState();
    const currentInvestmentSettings = buildInvestmentSettings();

    const hasActiveScenario = scenarioTabs.some((tab) => tab.id === activeScenarioId);
    if (!hasActiveScenario) {
      const fallbackScenario: PersistedScenarioState = {
        id: DEFAULT_SCENARIO_TAB_ID,
        name: DEFAULT_SCENARIO_TAB_NAME,
        portfolio: currentPortfolio,
        investmentSettings: currentInvestmentSettings
      };
      return {
        scenarios: [fallbackScenario],
        activeScenarioId: fallbackScenario.id
      };
    }

    return {
      scenarios: scenarioTabs.map((scenario) =>
        scenario.id === activeScenarioId
          ? {
              ...scenario,
              portfolio: currentPortfolio,
              investmentSettings: currentInvestmentSettings
            }
          : scenario
      ),
      activeScenarioId
    };
  };

  const buildPayload = () => {
    const currentPortfolio = buildPortfolioState();
    const currentInvestmentSettings = buildInvestmentSettings();
    const { scenarios, activeScenarioId: persistedActiveScenarioId } = buildScenariosSnapshot();

    return {
      portfolio: currentPortfolio,
      investmentSettings: currentInvestmentSettings,
      scenarios,
      activeScenarioId: persistedActiveScenarioId
    };
  };

  useEffect(() => {
    if (import.meta.env.MODE === 'test') {
      setIsPortfolioHydrated(true);
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      try {
        const payload = await readPersistedAppState();
        if (cancelled) return;
        applyPersistedPayload(payload);
      } catch {
        // Keep current defaults/state when hydration fails.
      } finally {
        if (!cancelled) setIsPortfolioHydrated(true);
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isPortfolioHydrated) return;

    setScenarioTabs((prev) => {
      const activeIndex = prev.findIndex((tab) => tab.id === activeScenarioId);
      if (activeIndex < 0) return prev;

      const activeTab = prev[activeIndex];
      const nextPortfolio = buildPortfolioState();
      const nextInvestmentSettings = buildInvestmentSettings();
      const isSamePortfolio =
        activeTab.portfolio.tickerProfiles === nextPortfolio.tickerProfiles &&
        activeTab.portfolio.includedTickerIds === nextPortfolio.includedTickerIds &&
        activeTab.portfolio.weightByTickerId === nextPortfolio.weightByTickerId &&
        activeTab.portfolio.fixedByTickerId === nextPortfolio.fixedByTickerId &&
        activeTab.portfolio.selectedTickerId === nextPortfolio.selectedTickerId;
      const isSameInvestmentSettings =
        activeTab.investmentSettings.initialInvestment === nextInvestmentSettings.initialInvestment &&
        activeTab.investmentSettings.monthlyContribution === nextInvestmentSettings.monthlyContribution &&
        activeTab.investmentSettings.targetMonthlyDividend === nextInvestmentSettings.targetMonthlyDividend &&
        activeTab.investmentSettings.investmentStartDate === nextInvestmentSettings.investmentStartDate &&
        activeTab.investmentSettings.durationYears === nextInvestmentSettings.durationYears &&
        activeTab.investmentSettings.reinvestDividends === nextInvestmentSettings.reinvestDividends &&
        activeTab.investmentSettings.taxRate === nextInvestmentSettings.taxRate &&
        activeTab.investmentSettings.reinvestTiming === nextInvestmentSettings.reinvestTiming &&
        activeTab.investmentSettings.dpsGrowthMode === nextInvestmentSettings.dpsGrowthMode &&
        activeTab.investmentSettings.showQuickEstimate === nextInvestmentSettings.showQuickEstimate &&
        activeTab.investmentSettings.showSplitGraphs === nextInvestmentSettings.showSplitGraphs &&
        activeTab.investmentSettings.isResultCompact === nextInvestmentSettings.isResultCompact &&
        activeTab.investmentSettings.isYearlyAreaFillOn === nextInvestmentSettings.isYearlyAreaFillOn &&
        activeTab.investmentSettings.showPortfolioDividendCenter === nextInvestmentSettings.showPortfolioDividendCenter &&
        activeTab.investmentSettings.visibleYearlySeries === nextInvestmentSettings.visibleYearlySeries;

      if (isSamePortfolio && isSameInvestmentSettings) return prev;

      const next = [...prev];
      next[activeIndex] = {
        ...activeTab,
        portfolio: nextPortfolio,
        investmentSettings: nextInvestmentSettings
      };
      return next;
    });
  }, [
    activeScenarioId,
    fixedByTickerId,
    includedTickerIds,
    isPortfolioHydrated,
    isResultCompact,
    isYearlyAreaFillOn,
    selectedTickerId,
    setScenarioTabs,
    showPortfolioDividendCenter,
    showQuickEstimate,
    showSplitGraphs,
    tickerProfiles,
    values.dpsGrowthMode,
    values.durationYears,
    values.initialInvestment,
    values.investmentStartDate,
    values.monthlyContribution,
    values.reinvestDividends,
    values.reinvestTiming,
    values.targetMonthlyDividend,
    values.taxRate,
    visibleYearlySeries,
    weightByTickerId
  ]);

  useEffect(() => {
    if (!isPortfolioHydrated) return;

    const timer = window.setTimeout(() => {
      void writePersistedAppState(buildPayload());
    }, 120);

    return () => window.clearTimeout(timer);
  }, [
    fixedByTickerId,
    includedTickerIds,
    isPortfolioHydrated,
    selectedTickerId,
    showQuickEstimate,
    showSplitGraphs,
    isResultCompact,
    isYearlyAreaFillOn,
    showPortfolioDividendCenter,
    visibleYearlySeries,
    tickerProfiles,
    values.dpsGrowthMode,
    values.durationYears,
    values.initialInvestment,
    values.investmentStartDate,
    values.monthlyContribution,
    values.reinvestDividends,
    values.reinvestTiming,
    values.targetMonthlyDividend,
    values.taxRate,
    scenarioTabs,
    activeScenarioId,
    weightByTickerId
  ]);

  const saveNamedState = async (rawName: string) => {
    const savedName = rawName.trim() || makeDefaultSavedName();
    await writePersistedAppStateByName(savedName, {
      ...buildPayload(),
      savedName
    });
    return { ok: true as const, savedName };
  };

  const listSavedStateNames = async () => {
    const names = await listPersistedStateNames();
    return names;
  };

  function applyScenario(scenario: PersistedScenarioState) {
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
  }

  function applyPersistedPayload(payload: Awaited<ReturnType<typeof readPersistedAppState>>) {
    const activeScenario =
      payload.scenarios.find((scenario) => scenario.id === payload.activeScenarioId) ?? payload.scenarios[0] ?? null;
    if (!activeScenario) return;

    setScenarioTabs(payload.scenarios);
    setActiveScenarioId(activeScenario.id);
    applyScenario(activeScenario);
  }

  const loadNamedState = async (name: string) => {
    const payload = await readPersistedAppStateByName(name);
    if (!payload) {
      return { ok: false as const, message: '해당 저장 항목을 찾을 수 없습니다.' };
    }

    applyPersistedPayload(payload);
    return { ok: true as const };
  };

  const deleteNamedState = async (name: string) => {
    const deleted = await deletePersistedAppStateByName(name);
    if (!deleted) {
      return { ok: false as const, message: '해당 저장 항목을 삭제하지 못했습니다.' };
    }
    return { ok: true as const };
  };

  const downloadNamedStateAsJson = async (name: string) => {
    const payload = await readPersistedAppStateByName(name);
    if (!payload) {
      return { ok: false as const, message: '해당 저장 항목을 찾을 수 없습니다.' };
    }

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = name.trim().replace(/[\\/:*?"<>|]/g, '_');
    a.href = url;
    a.download = `${safeName || 'portfolio'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    return { ok: true as const };
  };

  const loadStateFromJsonText = async (jsonText: string) => {
    try {
      const payload = parsePersistedAppStateJson(jsonText);
      applyPersistedPayload(payload);
      if (payload.savedName) {
        await writePersistedAppStateByName(payload.savedName, {
          ...payload,
          savedName: payload.savedName
        });
      }
      return { ok: true as const };
    } catch {
      return { ok: false as const, message: 'JSON 파일 형식이 올바르지 않습니다.' };
    }
  };

  return {
    isPortfolioHydrated,
    saveNamedState,
    listSavedStateNames,
    loadNamedState,
    deleteNamedState,
    downloadNamedStateAsJson,
    loadStateFromJsonText
  };
};
