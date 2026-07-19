import { useMemo } from 'react';
import { YEARLY_SERIES_HELP_KEY, YEARLY_SERIES_LABEL, YEARLY_SERIES_ORDER, type YearlySeriesKey } from '@/shared/constants';
import type { YieldFormValues } from '@/shared/types';
import {
  useIncludedProfilesAtomValue,
  useNormalizedAllocationAtomValue,
  usePalettePresetAtomValue,
  useSetActiveHelpWrite,
  useSetVisibleYearlySeriesWrite
} from '@/jotai';
import {
  buildAllocationPieOption,
  buildRecentCashflowBarOption,
  buildSimulationBundle,
  buildYearlyResultBarOption
} from '@/pages/Main/utils';

type UseMainComputedParams = {
  isValid: boolean;
  values: YieldFormValues;
  visibleYearlySeries: Record<YearlySeriesKey, boolean>;
  isYearlyAreaFillOn: boolean;
  postInvestmentProjectionYears: number;
};

export const useMainComputed = ({
  isValid,
  values,
  visibleYearlySeries,
  isYearlyAreaFillOn,
  postInvestmentProjectionYears
}: UseMainComputedParams) => {
  const includedProfiles = useIncludedProfilesAtomValue();
  const normalizedAllocation = useNormalizedAllocationAtomValue();
  const setVisibleYearlySeries = useSetVisibleYearlySeriesWrite();
  const setActiveHelp = useSetActiveHelpWrite();
  /*
   * 캔버스(ECharts)는 CSS 변수를 다시 읽지 않는다 — 팔레트 프리셋이 바뀌면 차트 옵션을
   * 다시 빌드해야 옛 색이 남지 않는다. 그래서 아래 차트 옵션 useMemo들의 의존성에
   * palettePreset을 넣는다 (빌더 내부의 getChartTheme()이 새 프리셋 값을 읽는다).
   */
  const palettePreset = usePalettePresetAtomValue();

  const { simulation, yearlyCashflowByTicker, postInvestmentDividendProjectionRows } = useMemo(
    () =>
      buildSimulationBundle({
        isValid,
        includedProfiles,
        normalizedAllocation,
        values,
        postInvestmentProjectionYears
      }),
    // palettePreset: 실지급 배당 스택 색이 번들 데이터에 박히므로(simulation.ts) 프리셋 전환 시 재빌드
    [includedProfiles, isValid, normalizedAllocation, palettePreset, postInvestmentProjectionYears, values]
  );

  const tableRows = useMemo(() => simulation?.yearly ?? [], [simulation]);
  const allocationPieOption = useMemo(
    () =>
      buildAllocationPieOption({
        normalizedAllocation,
        // 배당 중앙표시 토글을 없애고 파이 중앙에 월배당을 항상 노출한다(사용자 요청).
        showPortfolioDividendCenter: true,
        finalMonthlyAverageDividend: simulation?.summary.finalMonthlyAverageDividend ?? 0
      }),
    [normalizedAllocation, palettePreset, simulation?.summary.finalMonthlyAverageDividend]
  );
  const defaultCashflowYear = yearlyCashflowByTicker.years[yearlyCashflowByTicker.years.length - 1] ?? null;
  const defaultCashflowByYear =
    defaultCashflowYear === null ? { months: [], series: [] } : yearlyCashflowByTicker.byYear[String(defaultCashflowYear)] ?? { months: [], series: [] };
  const recentCashflowBarOption = useMemo(
    () => buildRecentCashflowBarOption(defaultCashflowByYear),
    [defaultCashflowByYear, palettePreset]
  );
  const yearlyResultBarOption = useMemo(
    () =>
      buildYearlyResultBarOption({
        tableRows,
        visibleYearlySeries,
        isYearlyAreaFillOn
      }),
    [isYearlyAreaFillOn, palettePreset, tableRows, visibleYearlySeries]
  );
  const yearlySeriesItems = useMemo(
    () =>
      YEARLY_SERIES_ORDER.map((key) => ({
        key,
        label: YEARLY_SERIES_LABEL[key],
        checked: visibleYearlySeries[key],
        onToggle: (checked: boolean) => setVisibleYearlySeries((prev) => ({ ...prev, [key]: checked })),
        onHelp: () => setActiveHelp(YEARLY_SERIES_HELP_KEY[key])
      })),
    [setActiveHelp, setVisibleYearlySeries, visibleYearlySeries]
  );

  return {
    simulation,
    tableRows,
    allocationPieOption,
    recentCashflowBarOption,
    yearlyCashflowByTicker,
    postInvestmentDividendProjectionRows,
    yearlyResultBarOption,
    yearlySeriesItems
  };
};
