import type { YieldFormValues } from '@/shared/types';
import { defaultYieldFormValues } from '@/shared/lib/snowball';
import type { PortfolioPersistedState, TickerDraft, TickerProfile } from '@/shared/types/snowball';
import { atomState, useAtomValue, useAtomWrite } from '@/jotai/atom';

const toTickerDraft = (values: {
  ticker: string;
  initialPrice: number;
  dividendYield: number;
  dividendGrowth: number;
  priceGrowth: number;
  frequency: YieldFormValues['frequency'];
}): TickerDraft => ({
  ticker: values.ticker,
  initialPrice: values.initialPrice,
  dividendYield: values.dividendYield,
  dividendGrowth: values.dividendGrowth,
  priceGrowth: values.priceGrowth,
  frequency: values.frequency
});

export const EMPTY_PORTFOLIO_STATE: PortfolioPersistedState = {
  tickerProfiles: [],
  includedTickerIds: [],
  weightByTickerId: {},
  fixedByTickerId: {},
  selectedTickerId: null
};

export const tickerProfilesAtom = atomState<TickerProfile[]>(EMPTY_PORTFOLIO_STATE.tickerProfiles);
export const selectedTickerIdAtom = atomState<string | null>(EMPTY_PORTFOLIO_STATE.selectedTickerId);
export const includedTickerIdsAtom = atomState<string[]>(EMPTY_PORTFOLIO_STATE.includedTickerIds);
export const weightByTickerIdAtom = atomState<Record<string, number>>(EMPTY_PORTFOLIO_STATE.weightByTickerId);
export const fixedByTickerIdAtom = atomState<Record<string, boolean>>(EMPTY_PORTFOLIO_STATE.fixedByTickerId);
export const tickerDraftAtom = atomState<TickerDraft>(toTickerDraft(defaultYieldFormValues));

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
