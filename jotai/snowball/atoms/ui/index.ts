import type { PresetTickerKey, YearlySeriesKey } from '@/shared/constants';
import type { TickerModalMode } from '@/shared/types/snowball';
import { atomState, useAtomValue, useAtomWrite } from '@/jotai/atom';

export const activeHelpAtom = atomState<string | null>(null);
export const isTickerModalOpenAtom = atomState(false);
export const isConfigDrawerOpenAtom = atomState(false);
export const tickerModalModeAtom = atomState<TickerModalMode>('create');
export const editingTickerIdAtom = atomState<string | null>(null);
export const showQuickEstimateAtom = atomState(false);
export const visibleYearlySeriesAtom = atomState<Record<YearlySeriesKey, boolean>>({
  totalContribution: true,
  assetValue: true,
  annualDividend: false,
  monthlyDividend: false,
  cumulativeDividend: false
});
export const isYearlyAreaFillOnAtom = atomState(true);
export const isResultCompactAtom = atomState(false);
export const showSplitGraphsAtom = atomState(false);
export const showPortfolioDividendCenterAtom = atomState(true);
export const selectedPresetAtom = atomState<'custom' | PresetTickerKey>('custom');

export const useActiveHelpAtomValue = () => useAtomValue(activeHelpAtom);
export const useSetActiveHelpWrite = () => useAtomWrite(activeHelpAtom);
export const useIsTickerModalOpenAtomValue = () => useAtomValue(isTickerModalOpenAtom);
export const useSetIsTickerModalOpenWrite = () => useAtomWrite(isTickerModalOpenAtom);
export const useIsConfigDrawerOpenAtomValue = () => useAtomValue(isConfigDrawerOpenAtom);
export const useSetIsConfigDrawerOpenWrite = () => useAtomWrite(isConfigDrawerOpenAtom);
export const useTickerModalModeAtomValue = () => useAtomValue(tickerModalModeAtom);
export const useSetTickerModalModeWrite = () => useAtomWrite(tickerModalModeAtom);
export const useEditingTickerIdAtomValue = () => useAtomValue(editingTickerIdAtom);
export const useSetEditingTickerIdWrite = () => useAtomWrite(editingTickerIdAtom);
export const useShowQuickEstimateAtomValue = () => useAtomValue(showQuickEstimateAtom);
export const useSetShowQuickEstimateWrite = () => useAtomWrite(showQuickEstimateAtom);
export const useVisibleYearlySeriesAtomValue = () => useAtomValue(visibleYearlySeriesAtom);
export const useSetVisibleYearlySeriesWrite = () => useAtomWrite(visibleYearlySeriesAtom);
export const useIsYearlyAreaFillOnAtomValue = () => useAtomValue(isYearlyAreaFillOnAtom);
export const useSetIsYearlyAreaFillOnWrite = () => useAtomWrite(isYearlyAreaFillOnAtom);
export const useIsResultCompactAtomValue = () => useAtomValue(isResultCompactAtom);
export const useSetIsResultCompactWrite = () => useAtomWrite(isResultCompactAtom);
export const useShowSplitGraphsAtomValue = () => useAtomValue(showSplitGraphsAtom);
export const useSetShowSplitGraphsWrite = () => useAtomWrite(showSplitGraphsAtom);
export const useShowPortfolioDividendCenterAtomValue = () => useAtomValue(showPortfolioDividendCenterAtom);
export const useSetShowPortfolioDividendCenterWrite = () => useAtomWrite(showPortfolioDividendCenterAtom);
export const useSelectedPresetAtomValue = () => useAtomValue(selectedPresetAtom);
export const useSetSelectedPresetWrite = () => useAtomWrite(selectedPresetAtom);
