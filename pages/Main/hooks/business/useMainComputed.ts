import { useMemo } from 'react';
import { YEARLY_SERIES_HELP_KEY, YEARLY_SERIES_LABEL, YEARLY_SERIES_ORDER, type YearlySeriesKey } from '@/shared/constants';
import type { YieldFormValues } from '@/shared/types';
import { useIncludedProfilesAtomValue, useNormalizedAllocationAtomValue, useSetActiveHelpWrite, useSetVisibleYearlySeriesWrite } from '@/jotai';
import {
  buildAllocationPieOption,
  buildRecentCashflowBarOption,
  buildSimulationBundle,
  buildYearlyResultBarOption
} from '@/pages/Main/utils';

type UseMainComputedParams = {
  isValid: boolean;
  values: YieldFormValues;
  showPortfolioDividendCenter: boolean;
  visibleYearlySeries: Record<YearlySeriesKey, boolean>;
  isYearlyAreaFillOn: boolean;
};

export const useMainComputed = ({
  isValid,
  values,
  showPortfolioDividendCenter,
  visibleYearlySeries,
  isYearlyAreaFillOn
}: UseMainComputedParams) => {
  const includedProfiles = useIncludedProfilesAtomValue();
  const normalizedAllocation = useNormalizedAllocationAtomValue();
  const setVisibleYearlySeries = useSetVisibleYearlySeriesWrite();
  const setActiveHelp = useSetActiveHelpWrite();

  const { simulation, yearlyCashflowByTicker, postInvestmentDividendProjectionRows } = useMemo(
    () =>
      buildSimulationBundle({
        isValid,
        includedProfiles,
        normalizedAllocation,
        values
      }),
    [includedProfiles, isValid, normalizedAllocation, values]
  );

  const tableRows = useMemo(() => simulation?.yearly ?? [], [simulation]);
  const allocationPieOption = useMemo(
    () =>
      buildAllocationPieOption({
        normalizedAllocation,
        showPortfolioDividendCenter,
        finalMonthlyAverageDividend: simulation?.summary.finalMonthlyAverageDividend ?? 0
      }),
    [normalizedAllocation, showPortfolioDividendCenter, simulation?.summary.finalMonthlyAverageDividend]
  );
  const defaultCashflowYear = yearlyCashflowByTicker.years[yearlyCashflowByTicker.years.length - 1] ?? null;
  const defaultCashflowByYear =
    defaultCashflowYear === null ? { months: [], series: [] } : yearlyCashflowByTicker.byYear[String(defaultCashflowYear)] ?? { months: [], series: [] };
  const recentCashflowBarOption = useMemo(() => buildRecentCashflowBarOption(defaultCashflowByYear), [defaultCashflowByYear]);
  const yearlyResultBarOption = useMemo(
    () =>
      buildYearlyResultBarOption({
        tableRows,
        visibleYearlySeries,
        isYearlyAreaFillOn
      }),
    [isYearlyAreaFillOn, tableRows, visibleYearlySeries]
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
