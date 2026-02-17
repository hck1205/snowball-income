import type { YieldFormValues } from '@/shared/types';
import { defaultYieldFormValues } from '@/shared/lib/snowball';
import type { PortfolioPersistedState, TickerDraft, TickerProfile } from '@/shared/types/snowball';
import type { PersistedInvestmentSettings, PersistedScenarioState } from '@/jotai/snowball/types';
import { atomState, useAtomValue, useAtomWrite } from '@/jotai/atom';

const toTickerDraft = (values: {
  ticker: string;
  name?: string;
  initialPrice: number;
  dividendYield: number;
  dividendGrowth: number;
  expectedTotalReturn: number;
  frequency: YieldFormValues['frequency'];
}): TickerDraft => ({
  ticker: values.ticker,
  name: values.name ?? '',
  initialPrice: values.initialPrice,
  dividendYield: values.dividendYield,
  dividendGrowth: values.dividendGrowth,
  expectedTotalReturn: values.expectedTotalReturn,
  frequency: values.frequency
});

export const EMPTY_PORTFOLIO_STATE: PortfolioPersistedState = {
  tickerProfiles: [],
  includedTickerIds: [],
  weightByTickerId: {},
  fixedByTickerId: {},
  selectedTickerId: null
};

export const MAX_SCENARIO_TABS = 10;
export const DEFAULT_SCENARIO_TAB_ID = 'default-tab';
export const DEFAULT_SCENARIO_TAB_NAME = '기본 탭';

export const EMPTY_INVESTMENT_SETTINGS: PersistedInvestmentSettings = {
  initialInvestment: defaultYieldFormValues.initialInvestment,
  monthlyContribution: defaultYieldFormValues.monthlyContribution,
  targetMonthlyDividend: defaultYieldFormValues.targetMonthlyDividend,
  investmentStartDate: defaultYieldFormValues.investmentStartDate,
  durationYears: defaultYieldFormValues.durationYears,
  reinvestDividends: defaultYieldFormValues.reinvestDividends,
  taxRate: defaultYieldFormValues.taxRate,
  reinvestTiming: defaultYieldFormValues.reinvestTiming,
  dpsGrowthMode: defaultYieldFormValues.dpsGrowthMode,
  showQuickEstimate: false,
  showSplitGraphs: false,
  isResultCompact: false,
  isYearlyAreaFillOn: true,
  showPortfolioDividendCenter: false,
  visibleYearlySeries: {
    totalContribution: true,
    assetValue: true,
    annualDividend: false,
    monthlyDividend: false,
    cumulativeDividend: false
  }
};

export const DEFAULT_SCENARIO_TABS: PersistedScenarioState[] = [
  {
    id: DEFAULT_SCENARIO_TAB_ID,
    name: DEFAULT_SCENARIO_TAB_NAME,
    portfolio: EMPTY_PORTFOLIO_STATE,
    investmentSettings: EMPTY_INVESTMENT_SETTINGS
  }
];

export const tickerProfilesAtom = atomState<TickerProfile[]>(EMPTY_PORTFOLIO_STATE.tickerProfiles);
export const selectedTickerIdAtom = atomState<string | null>(EMPTY_PORTFOLIO_STATE.selectedTickerId);
export const includedTickerIdsAtom = atomState<string[]>(EMPTY_PORTFOLIO_STATE.includedTickerIds);
export const weightByTickerIdAtom = atomState<Record<string, number>>(EMPTY_PORTFOLIO_STATE.weightByTickerId);
export const fixedByTickerIdAtom = atomState<Record<string, boolean>>(EMPTY_PORTFOLIO_STATE.fixedByTickerId);
export const tickerDraftAtom = atomState<TickerDraft>(toTickerDraft(defaultYieldFormValues));
export const scenarioTabsAtom = atomState<PersistedScenarioState[]>(DEFAULT_SCENARIO_TABS);
export const activeScenarioIdAtom = atomState<string>(DEFAULT_SCENARIO_TAB_ID);

export const useTickerProfilesAtomValue = () => useAtomValue(tickerProfilesAtom);
export const useSetTickerProfilesWrite = () => useAtomWrite(tickerProfilesAtom);
export const useSelectedTickerIdAtomValue = () => useAtomValue(selectedTickerIdAtom);
export const useSetSelectedTickerIdWrite = () => useAtomWrite(selectedTickerIdAtom);
export const useIncludedTickerIdsAtomValue = () => useAtomValue(includedTickerIdsAtom);
export const useSetIncludedTickerIdsWrite = () => useAtomWrite(includedTickerIdsAtom);
export const useWeightByTickerIdAtomValue = () => useAtomValue(weightByTickerIdAtom);
export const useSetWeightByTickerIdWrite = () => useAtomWrite(weightByTickerIdAtom);
export const useFixedByTickerIdAtomValue = () => useAtomValue(fixedByTickerIdAtom);
export const useSetFixedByTickerIdWrite = () => useAtomWrite(fixedByTickerIdAtom);
export const useTickerDraftAtomValue = () => useAtomValue(tickerDraftAtom);
export const useSetTickerDraftWrite = () => useAtomWrite(tickerDraftAtom);
export const useScenarioTabsAtomValue = () => useAtomValue(scenarioTabsAtom);
export const useSetScenarioTabsWrite = () => useAtomWrite(scenarioTabsAtom);
export const useActiveScenarioIdAtomValue = () => useAtomValue(activeScenarioIdAtom);
export const useSetActiveScenarioIdWrite = () => useAtomWrite(activeScenarioIdAtom);
