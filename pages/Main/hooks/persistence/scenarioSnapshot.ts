import {
  DEFAULT_SCENARIO_TAB_ID,
  DEFAULT_SCENARIO_TAB_NAME,
  type PersistedInvestmentSettings,
  type PersistedScenarioState
} from '@/jotai';
import type { PortfolioPersistedState } from '@/shared/types/snowball';

export type ScenarioContent = {
  portfolio: PortfolioPersistedState;
  investmentSettings: PersistedInvestmentSettings;
};

export type ScenariosSnapshot = {
  scenarios: PersistedScenarioState[];
  activeScenarioId: string;
};

/**
 * 활성 탭에 현재 편집 중인 내용을 반영한 시나리오 목록을 만든다.
 * 활성 탭이 목록에 없으면 기본 탭 하나만 남긴다.
 */
export const buildScenariosSnapshot = (
  scenarioTabs: readonly PersistedScenarioState[],
  activeScenarioId: string,
  current: ScenarioContent
): ScenariosSnapshot => {
  const hasActiveScenario = scenarioTabs.some((tab) => tab.id === activeScenarioId);
  if (!hasActiveScenario) {
    const fallbackScenario: PersistedScenarioState = {
      id: DEFAULT_SCENARIO_TAB_ID,
      name: DEFAULT_SCENARIO_TAB_NAME,
      portfolio: current.portfolio,
      investmentSettings: current.investmentSettings
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
            portfolio: current.portfolio,
            investmentSettings: current.investmentSettings
          }
        : scenario
    ),
    activeScenarioId
  };
};

/**
 * 탭 내용이 같은지 비교한다. 포트폴리오 하위 객체와 visibleYearlySeries는 참조 동일성으로,
 * 나머지 설정 값은 값 동일성으로 비교한다(atom 값이 참조로 관리되는 전제).
 */
export const isSameScenarioContent = (a: ScenarioContent, b: ScenarioContent): boolean => {
  const isSamePortfolio =
    a.portfolio.tickerProfiles === b.portfolio.tickerProfiles &&
    a.portfolio.includedTickerIds === b.portfolio.includedTickerIds &&
    a.portfolio.weightByTickerId === b.portfolio.weightByTickerId &&
    a.portfolio.fixedByTickerId === b.portfolio.fixedByTickerId &&
    a.portfolio.selectedTickerId === b.portfolio.selectedTickerId;

  const isSameInvestmentSettings =
    a.investmentSettings.initialInvestment === b.investmentSettings.initialInvestment &&
    a.investmentSettings.monthlyContribution === b.investmentSettings.monthlyContribution &&
    a.investmentSettings.targetMonthlyDividend === b.investmentSettings.targetMonthlyDividend &&
    a.investmentSettings.investmentStartDate === b.investmentSettings.investmentStartDate &&
    a.investmentSettings.durationYears === b.investmentSettings.durationYears &&
    a.investmentSettings.reinvestDividends === b.investmentSettings.reinvestDividends &&
    a.investmentSettings.reinvestDividendPercent === b.investmentSettings.reinvestDividendPercent &&
    a.investmentSettings.taxRate === b.investmentSettings.taxRate &&
    a.investmentSettings.reinvestTiming === b.investmentSettings.reinvestTiming &&
    a.investmentSettings.dpsGrowthMode === b.investmentSettings.dpsGrowthMode &&
    a.investmentSettings.showQuickEstimate === b.investmentSettings.showQuickEstimate &&
    a.investmentSettings.showSplitGraphs === b.investmentSettings.showSplitGraphs &&
    a.investmentSettings.isResultCompact === b.investmentSettings.isResultCompact &&
    a.investmentSettings.isYearlyAreaFillOn === b.investmentSettings.isYearlyAreaFillOn &&
    a.investmentSettings.showPortfolioDividendCenter === b.investmentSettings.showPortfolioDividendCenter &&
    a.investmentSettings.visibleYearlySeries === b.investmentSettings.visibleYearlySeries;

  return isSamePortfolio && isSameInvestmentSettings;
};

/** 공유 시나리오를 같은 id의 기존 탭에 덮어쓰거나, 없으면 맨 뒤에 추가한다. */
export const mergeSharedScenarioIntoTabs = (
  tabs: readonly PersistedScenarioState[],
  sharedScenario: PersistedScenarioState
): PersistedScenarioState[] => {
  const existingSharedIndex = tabs.findIndex((scenario) => scenario.id === sharedScenario.id);
  return existingSharedIndex >= 0
    ? tabs.map((scenario, index) => (index === existingSharedIndex ? sharedScenario : scenario))
    : [...tabs, sharedScenario];
};
