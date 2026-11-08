import {
  useActiveScenarioIdAtomValue,
  useFixedByTickerIdAtomValue,
  useIncludedTickerIdsAtomValue,
  useIsResultCompactAtomValue,
  useIsYearlyAreaFillOnAtomValue,
  useReinvestPercentByTickerIdAtomValue,
  useReinvestTargetByTickerIdAtomValue,
  useScenarioTabsAtomValue,
  useSelectedTickerIdAtomValue,
  useShowPortfolioDividendCenterAtomValue,
  useShowQuickEstimateAtomValue,
  useShowSplitGraphsAtomValue,
  useTickerProfilesAtomValue,
  useVisibleYearlySeriesAtomValue,
  useWeightByTickerIdAtomValue,
  useYieldFormAtomValue,
  type PersistedInvestmentSettings
} from '@/jotai';
import type { PortfolioPersistedState } from '@/shared/types/snowball';
import { buildScenariosSnapshot } from './scenarioSnapshot';

/**
 * 지금 화면의 **워크스페이스**(포트폴리오 · 투자 설정 · 시나리오 탭 스냅샷)를 조립하는 함수들(2026-11-09).
 *
 * `usePortfolioPersistence` 안에 있던 것을 **글자 그대로** 옮겼다. 저장(자동 저장·클라우드)과 공유 링크가
 * 같은 조립을 써야 하는데, 공유 버튼이 저장 훅을 한 번 더 부르면 하이드레이션·자동 저장 효과가 두 번 돈다.
 * 이 훅은 **읽기만** 한다(효과·쓰기 없음) — 몇 군데서 불러도 안전하다.
 *
 * ⚠ 반환 함수는 **그 렌더의 값**을 닫아 둔다(옮기기 전과 같은 의미). 호출 시점의 최신값이 필요하면 다시 렌더된
 *   훅의 함수를 써야 한다.
 */
export const useWorkspaceSnapshot = () => {
  const tickerProfiles = useTickerProfilesAtomValue();
  const includedTickerIds = useIncludedTickerIdsAtomValue();
  const weightByTickerId = useWeightByTickerIdAtomValue();
  const fixedByTickerId = useFixedByTickerIdAtomValue();
  const reinvestPercentByTickerId = useReinvestPercentByTickerIdAtomValue();
  const reinvestTargetByTickerId = useReinvestTargetByTickerIdAtomValue();
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

  const buildPortfolioState = (): PortfolioPersistedState => ({
    tickerProfiles,
    includedTickerIds,
    weightByTickerId,
    fixedByTickerId,
    selectedTickerId,
    reinvestPercentByTickerId,
    reinvestTargetByTickerId
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

  return { buildPortfolioState, buildInvestmentSettings, buildCurrentScenariosSnapshot };
};
