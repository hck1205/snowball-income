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
import { useIsLoggedInAtomValue } from '@/jotai/community';
import { isCommunityEnabled } from '@/shared/lib/supabase';
import { removeScenarioTab, reorderTabs } from '@/pages/Main/utils';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

const makeScenarioId = () => `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const sanitizeScenarioName = (rawName: string) => rawName.trim();
const SHARED_SCENARIO_ID = 'shared-tab';

/**
 * 비로그인 사용자가 만들 수 있는 시나리오 탭 상한 — 로그인 유도 + 블렌드 과다 증식 억제.
 * 로그인하면 상한이 `MAX_SCENARIO_TABS`(10)로 풀린다.
 */
export const FREE_SCENARIO_TAB_LIMIT = 1;

/** 탭 생성 시도의 결과. `login-required`면 생성하지 말고 로그인 유도 프롬프트를 띄운다. */
export type ScenarioTabCreateOutcome = 'created' | 'limit-reached' | 'login-required';

/**
 * 탭 생성 게이트 판정 — **순수 함수**(React·atom 비의존, 결정론 테스트).
 *
 * - 하드 상한(maxTabs=10)에 도달 → `limit-reached`(로그인 여부 무관, "+" 버튼 자체가 사라진다).
 * - **로그인 가능 배포(isCommunityEnabled)** 에서 **비로그인** + 무료 상한(1개)에 도달 → `login-required`
 *   (2번째 탭부터 로그인 유도). 로그인하면 이 가지를 안 타 하드 상한까지 자유롭게 만든다.
 * - **로그인 불가 배포(isCommunityEnabled=false)** → 게이트 없이 하드 상한까지 허용(안 그러면 2번째 탭을
 *   영영 못 만든다).
 */
export const evaluateScenarioTabCreation = (params: {
  tabCount: number;
  maxTabs: number;
  isCommunityEnabled: boolean;
  isLoggedIn: boolean;
}): 'allowed' | 'limit-reached' | 'login-required' => {
  if (params.tabCount >= params.maxTabs) return 'limit-reached';
  if (params.isCommunityEnabled && !params.isLoggedIn && params.tabCount >= FREE_SCENARIO_TAB_LIMIT) {
    return 'login-required';
  }
  return 'allowed';
};

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
  const isLoggedIn = useIsLoggedInAtomValue();

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

  const createScenarioTab = useCallback((): ScenarioTabCreateOutcome => {
    const gate = evaluateScenarioTabCreation({
      tabCount: tabs.length,
      maxTabs: MAX_SCENARIO_TABS,
      isCommunityEnabled,
      isLoggedIn,
    });
    // 하드 상한이면 조용히 막고(버튼도 숨겨져 있음), 로그인 게이트면 생성하지 말고 신호만 반환한다
    // (호출부가 로그인 유도 프롬프트를 띄운다 — 무음으로 막지 않는다).
    if (gate !== 'allowed') return gate;

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
    return 'created';
  }, [
    applyScenario,
    isLoggedIn,
    prepareTabsWithActiveSnapshot,
    setActiveScenarioId,
    setScenarioTabs,
    tabs.length,
  ]);

  const deleteScenarioTab = useCallback((scenarioId: string) => {
    if (tabs.length <= 1) return false;

    const removal = removeScenarioTab({
      tabs: prepareTabsWithActiveSnapshot(),
      deletingId: scenarioId,
      activeId: activeScenarioId
    });
    if (!removal) return false;

    const { tabs: remainingTabs, nextActiveTab } = removal;

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

      let promotedScenarioId: string | null = null;
      setScenarioTabs((prev) =>
        prev.map((tab) => {
          if (tab.id !== scenarioId) return tab;
          if (scenarioId !== SHARED_SCENARIO_ID) return { ...tab, name: nextName };

          let nextId = makeScenarioId();
          while (prev.some((item) => item.id === nextId)) {
            nextId = makeScenarioId();
          }
          promotedScenarioId = nextId;
          return { ...tab, id: nextId, name: nextName };
        })
      );
      if (promotedScenarioId && activeScenarioId === scenarioId) {
        setActiveScenarioId(promotedScenarioId);
      }
      trackEvent(ANALYTICS_EVENT.SCENARIO_TAB_ACTION, {
        action: 'rename',
        scenario_id: promotedScenarioId ?? scenarioId
      });
      return true;
    },
    [activeScenarioId, setActiveScenarioId, setScenarioTabs]
  );

  const reorderScenarioTabs = useCallback(
    (fromScenarioId: string, toScenarioId: string) => {
      const reorderedTabs = reorderTabs(prepareTabsWithActiveSnapshot(), fromScenarioId, toScenarioId);
      if (!reorderedTabs) return false;

      setScenarioTabs(reorderedTabs);
      trackEvent(ANALYTICS_EVENT.SCENARIO_TAB_ACTION, {
        action: 'reorder',
        scenario_id: fromScenarioId
      });
      return true;
    },
    [prepareTabsWithActiveSnapshot, setScenarioTabs]
  );

  return {
    tabs,
    activeScenarioId,
    activeScenarioName: activeTab?.name ?? '',
    // 하드 상한 미만이면 "+"를 보인다. 로그인 게이트(비로그인 2번째 탭)여도 "+"는 보이되, 누르면
    // createScenarioTab이 'login-required'를 반환해 호출부가 프롬프트를 띄운다(막지 않고 유도).
    canCreateTab: tabs.length < MAX_SCENARIO_TABS,
    /** 비로그인+로그인 가능 배포에서 이미 무료 상한(1개)에 도달 → 다음 생성은 로그인 유도로 이어진다. */
    requiresLoginToCreateTab:
      isCommunityEnabled && !isLoggedIn && tabs.length >= FREE_SCENARIO_TAB_LIMIT,
    canDeleteTab: tabs.length > 1,
    selectScenarioTab,
    createScenarioTab,
    renameScenarioTab,
    deleteScenarioTab,
    reorderScenarioTabs
  };
};
