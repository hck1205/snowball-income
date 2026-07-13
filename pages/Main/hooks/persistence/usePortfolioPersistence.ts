import { useEffect, useRef, useState } from 'react';
import {
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
  type PersistedAppStatePayload,
  type PersistedInvestmentSettings,
  type PersistedScenarioState,
  writePersistedAppStateByName,
  writePersistedAppState
} from '@/jotai';
import type { PortfolioPersistedState } from '@/shared/types/snowball';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { buildDownloadFileName, formatSavedNameTimestamp } from './savedName';
import { buildScenariosSnapshot, isSameScenarioContent, mergeSharedScenarioIntoTabs } from './scenarioSnapshot';
import { decodeSharedScenario, encodeSharedScenario, SHARED_SCENARIO_ID, SHARE_LENGTH_LIMIT } from './shareLink';
import { buildShareUrl, readShareCodeFromHref, stripShareParams } from './shareUrl';

const SHARED_SCENARIO_NAME = '공유된 탭';

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

  const buildPortfolioState = (): PortfolioPersistedState => ({
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

  const buildCurrentScenariosSnapshot = () =>
    buildScenariosSnapshot(scenarioTabs, activeScenarioId, {
      portfolio: buildPortfolioState(),
      investmentSettings: buildInvestmentSettings()
    });

  const buildPayload = (): PersistedAppStatePayload => {
    const currentPortfolio = buildPortfolioState();
    const currentInvestmentSettings = buildInvestmentSettings();
    const { scenarios, activeScenarioId: persistedActiveScenarioId } = buildCurrentScenariosSnapshot();

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
      const nextContent = {
        portfolio: buildPortfolioState(),
        investmentSettings: buildInvestmentSettings()
      };

      if (isSameScenarioContent(activeTab, nextContent)) return prev;

      const next = [...prev];
      next[activeIndex] = {
        ...activeTab,
        portfolio: nextContent.portfolio,
        investmentSettings: nextContent.investmentSettings
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
    const savedName = rawName.trim() || formatSavedNameTimestamp(new Date());
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

  function applyPersistedPayload(payload: PersistedAppStatePayload) {
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
    a.href = url;
    a.download = buildDownloadFileName(name);
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
    const { scenarios, activeScenarioId: currentActiveScenarioId } = buildCurrentScenariosSnapshot();
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

    const shareUrl = buildShareUrl(window.location.href, encoded);

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

    const shareCode = readShareCodeFromHref(window.location.href);
    const cleanupQuery = () => {
      window.history.replaceState({}, '', stripShareParams(window.location.href));
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

    const { scenarios } = buildCurrentScenariosSnapshot();

    const nextSharedScenario: PersistedScenarioState = {
      ...sharedScenario,
      id: SHARED_SCENARIO_ID,
      name: SHARED_SCENARIO_NAME
    };

    const nextTabs = mergeSharedScenarioIntoTabs(scenarios, nextSharedScenario);
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
