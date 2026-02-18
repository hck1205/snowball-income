import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_SCENARIO_TAB_ID,
  DEFAULT_SCENARIO_TAB_NAME,
  MAX_SCENARIO_TABS,
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
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import {
  decodeSharedScenario,
  encodeSharedScenario,
  SHARE_LENGTH_LIMIT,
  SHARE_QUERY_PARAM,
  SHARE_SCHEMA_VERSION,
  SHARE_VERSION_QUERY_PARAM
} from './shareLink';

const makeScenarioId = () => `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const makeUniqueScenarioName = (existing: PersistedScenarioState[], baseName: string): string => {
  const trimmedBase = baseName.trim() || '공유 탭';
  if (!existing.some((scenario) => scenario.name === trimmedBase)) return trimmedBase;

  let index = 2;
  while (existing.some((scenario) => scenario.name === `${trimmedBase} (${index})`)) {
    index += 1;
  }
  return `${trimmedBase} (${index})`;
};

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
  const hasAppliedShareLinkRef = useRef(false);

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
        const hasPortfolio = payload.scenarios.some((scenario) => scenario.portfolio.tickerProfiles.length > 0);
        if (hasPortfolio) {
          trackEvent(ANALYTICS_EVENT.RETURN_VISIT, {
            has_saved_portfolio: true,
            scenario_count: payload.scenarios.length
          });
        }
      } catch {
        // Keep current defaults/state when hydration fails.
        trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
          operation: 'hydrate_persisted_state'
        });
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
        activeTab.investmentSettings.reinvestDividendPercent === nextInvestmentSettings.reinvestDividendPercent &&
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
    values.reinvestDividendPercent,
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
    values.reinvestDividendPercent,
    values.reinvestTiming,
    values.targetMonthlyDividend,
    values.taxRate,
    scenarioTabs,
    activeScenarioId,
    weightByTickerId
  ]);

  const saveNamedState = async (rawName: string) => {
    trackEvent(ANALYTICS_EVENT.STATE_SAVE_STARTED, {
      source: 'quick_action_save'
    });
    const savedName = rawName.trim() || makeDefaultSavedName();
    await writePersistedAppStateByName(savedName, {
      ...buildPayload(),
      savedName
    });
    trackEvent(ANALYTICS_EVENT.STATE_SAVE_COMPLETED, {
      saved_name: savedName
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
    trackEvent(ANALYTICS_EVENT.STATE_LOAD_STARTED, {
      source: 'saved_list',
      saved_name: name
    });
    const payload = await readPersistedAppStateByName(name);
    if (!payload) {
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'load_named_state',
        source: 'saved_list'
      });
      return { ok: false as const, message: '해당 저장 항목을 찾을 수 없습니다.' };
    }

    applyPersistedPayload(payload);
    trackEvent(ANALYTICS_EVENT.STATE_LOAD_COMPLETED, {
      source: 'saved_list',
      saved_name: name
    });
    return { ok: true as const };
  };

  const deleteNamedState = async (name: string) => {
    const deleted = await deletePersistedAppStateByName(name);
    if (!deleted) {
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'delete_named_state'
      });
      return { ok: false as const, message: '해당 저장 항목을 삭제하지 못했습니다.' };
    }
    trackEvent(ANALYTICS_EVENT.STATE_DELETE_COMPLETED, {
      saved_name: name
    });
    return { ok: true as const };
  };

  const downloadNamedStateAsJson = async (name: string) => {
    const payload = await readPersistedAppStateByName(name);
    if (!payload) {
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'download_named_state_json'
      });
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

    trackEvent(ANALYTICS_EVENT.STATE_DOWNLOAD_COMPLETED, {
      saved_name: name
    });

    return { ok: true as const };
  };

  const loadStateFromJsonText = async (jsonText: string) => {
    trackEvent(ANALYTICS_EVENT.STATE_LOAD_STARTED, {
      source: 'json_import'
    });
    try {
      const payload = parsePersistedAppStateJson(jsonText);
      applyPersistedPayload(payload);
      if (payload.savedName) {
        await writePersistedAppStateByName(payload.savedName, {
          ...payload,
          savedName: payload.savedName
        });
      }
      trackEvent(ANALYTICS_EVENT.JSON_STATE_IMPORTED, {
        has_saved_name: Boolean(payload.savedName)
      });
      trackEvent(ANALYTICS_EVENT.STATE_LOAD_COMPLETED, {
        source: 'json_import'
      });
      return { ok: true as const };
    } catch {
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'load_state_from_json'
      });
      return { ok: false as const, message: 'JSON 파일 형식이 올바르지 않습니다.' };
    }
  };

  const createShareLink = async () => {
    const { scenarios, activeScenarioId: currentActiveScenarioId } = buildScenariosSnapshot();
    const activeScenario = scenarios.find((scenario) => scenario.id === currentActiveScenarioId) ?? null;
    if (!activeScenario) {
      return {
        ok: false as const,
        message: '공유할 탭을 찾을 수 없습니다.'
      };
    }

    const encoded = encodeSharedScenario(activeScenario);
    if (encoded.length > SHARE_LENGTH_LIMIT) {
      return {
        ok: false as const,
        message: `공유 데이터가 너무 큽니다. (현재 ${encoded.length}자, 최대 ${SHARE_LENGTH_LIMIT}자)`
      };
    }

    const url = new URL(window.location.href);
    url.searchParams.set(SHARE_QUERY_PARAM, encoded);
    url.searchParams.set(SHARE_VERSION_QUERY_PARAM, String(SHARE_SCHEMA_VERSION));
    const shareUrl = url.toString();

    try {
      await navigator.clipboard.writeText(shareUrl);
      return { ok: true as const, url: shareUrl, copied: true as const };
    } catch {
      return { ok: true as const, url: shareUrl, copied: false as const };
    }
  };

  useEffect(() => {
    if (!isPortfolioHydrated) return;
    if (hasAppliedShareLinkRef.current) return;
    hasAppliedShareLinkRef.current = true;

    const url = new URL(window.location.href);
    const shareCode = url.searchParams.get(SHARE_QUERY_PARAM);
    const cleanupQuery = () => {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete(SHARE_QUERY_PARAM);
      cleanUrl.searchParams.delete(SHARE_VERSION_QUERY_PARAM);
      window.history.replaceState({}, '', cleanUrl.toString());
    };

    if (!shareCode) return;

    const sharedScenario = decodeSharedScenario(shareCode);
    if (!sharedScenario) {
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'apply_share_link',
        reason: 'decode_failed'
      });
      cleanupQuery();
      return;
    }

    const { scenarios } = buildScenariosSnapshot();
    if (scenarios.length >= MAX_SCENARIO_TABS) {
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'apply_share_link',
        reason: 'max_tabs_reached'
      });
      cleanupQuery();
      return;
    }

    const nextSharedScenario: PersistedScenarioState = {
      ...sharedScenario,
      id: makeScenarioId(),
      name: makeUniqueScenarioName(scenarios, '공유된 탭')
    };

    const nextTabs = [...scenarios, nextSharedScenario];
    setScenarioTabs(nextTabs);
    setActiveScenarioId(nextSharedScenario.id);
    applyScenario(nextSharedScenario);
    cleanupQuery();
  }, [isPortfolioHydrated]);

  return {
    isPortfolioHydrated,
    saveNamedState,
    listSavedStateNames,
    loadNamedState,
    deleteNamedState,
    downloadNamedStateAsJson,
    loadStateFromJsonText,
    createShareLink
  };
};
