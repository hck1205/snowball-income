import { useEffect, useState } from 'react';
import {
  deletePersistedAppStateByName,
  listPersistedStateNames,
  parsePersistedAppStateJson,
  readPersistedAppStateByName,
  readPersistedAppState,
  useFixedByTickerIdAtomValue,
  useIncludedTickerIdsAtomValue,
  useSelectedTickerIdAtomValue,
  useSetFixedByTickerIdWrite,
  useSetIncludedTickerIdsWrite,
  useSetSelectedTickerIdWrite,
  useSetShowQuickEstimateWrite,
  useSetShowSplitGraphsWrite,
  useSetTickerProfilesWrite,
  useSetWeightByTickerIdWrite,
  useSetYieldFormWrite,
  useShowQuickEstimateAtomValue,
  useShowSplitGraphsAtomValue,
  useTickerProfilesAtomValue,
  useWeightByTickerIdAtomValue,
  useYieldFormAtomValue,
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

  const setTickerProfiles = useSetTickerProfilesWrite();
  const setIncludedTickerIds = useSetIncludedTickerIdsWrite();
  const setWeightByTickerId = useSetWeightByTickerIdWrite();
  const setFixedByTickerId = useSetFixedByTickerIdWrite();
  const setSelectedTickerId = useSetSelectedTickerIdWrite();
  const setShowQuickEstimate = useSetShowQuickEstimateWrite();
  const setShowSplitGraphs = useSetShowSplitGraphsWrite();
  const setYieldFormValues = useSetYieldFormWrite();

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

  const buildPayload = () => ({
    portfolio: {
      tickerProfiles,
      includedTickerIds,
      weightByTickerId,
      fixedByTickerId,
      selectedTickerId
    },
    investmentSettings: {
      monthlyContribution: values.monthlyContribution,
      targetMonthlyDividend: values.targetMonthlyDividend,
      durationYears: values.durationYears,
      reinvestDividends: values.reinvestDividends,
      taxRate: values.taxRate,
      reinvestTiming: values.reinvestTiming,
      dpsGrowthMode: values.dpsGrowthMode,
      showQuickEstimate,
      showSplitGraphs
    }
  });

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const payload = await readPersistedAppState();
      if (cancelled) return;
      setTickerProfiles(payload.portfolio.tickerProfiles);
      setIncludedTickerIds(payload.portfolio.includedTickerIds);
      setWeightByTickerId(payload.portfolio.weightByTickerId);
      setFixedByTickerId(payload.portfolio.fixedByTickerId);
      setSelectedTickerId(payload.portfolio.selectedTickerId);
      setYieldFormValues((prev) => ({
        ...prev,
        monthlyContribution: payload.investmentSettings.monthlyContribution,
        targetMonthlyDividend: payload.investmentSettings.targetMonthlyDividend,
        durationYears: payload.investmentSettings.durationYears,
        reinvestDividends: payload.investmentSettings.reinvestDividends,
        taxRate: payload.investmentSettings.taxRate,
        reinvestTiming: payload.investmentSettings.reinvestTiming,
        dpsGrowthMode: payload.investmentSettings.dpsGrowthMode
      }));
      setShowQuickEstimate(payload.investmentSettings.showQuickEstimate);
      setShowSplitGraphs(payload.investmentSettings.showSplitGraphs);
      setIsPortfolioHydrated(true);
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [
    setFixedByTickerId,
    setIncludedTickerIds,
    setSelectedTickerId,
    setShowQuickEstimate,
    setShowSplitGraphs,
    setTickerProfiles,
    setWeightByTickerId,
    setYieldFormValues
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
    tickerProfiles,
    values.dpsGrowthMode,
    values.durationYears,
    values.monthlyContribution,
    values.reinvestDividends,
    values.reinvestTiming,
    values.targetMonthlyDividend,
    values.taxRate,
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

  const applyPersistedPayload = (payload: Awaited<ReturnType<typeof readPersistedAppState>>) => {
    setTickerProfiles(payload.portfolio.tickerProfiles);
    setIncludedTickerIds(payload.portfolio.includedTickerIds);
    setWeightByTickerId(payload.portfolio.weightByTickerId);
    setFixedByTickerId(payload.portfolio.fixedByTickerId);
    setSelectedTickerId(payload.portfolio.selectedTickerId);
    setYieldFormValues((prev) => ({
      ...prev,
      monthlyContribution: payload.investmentSettings.monthlyContribution,
      targetMonthlyDividend: payload.investmentSettings.targetMonthlyDividend,
      durationYears: payload.investmentSettings.durationYears,
      reinvestDividends: payload.investmentSettings.reinvestDividends,
      taxRate: payload.investmentSettings.taxRate,
      reinvestTiming: payload.investmentSettings.reinvestTiming,
      dpsGrowthMode: payload.investmentSettings.dpsGrowthMode
    }));
    setShowQuickEstimate(payload.investmentSettings.showQuickEstimate);
    setShowSplitGraphs(payload.investmentSettings.showSplitGraphs);
  };

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
