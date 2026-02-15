import { atom } from 'jotai/vanilla';
import { HELP_CONTENT, type HelpKey } from '@/shared/constants';
import { useAtomValue } from '@/jotai/atom';
import { activeHelpAtom } from '../ui';
import { fixedByTickerIdAtom, includedTickerIdsAtom, tickerProfilesAtom, weightByTickerIdAtom } from '../portfolio';

export const currentHelpAtom = atom((get) => {
  const activeHelp = get(activeHelpAtom);
  if (!activeHelp) return null;
  if (!(activeHelp in HELP_CONTENT)) return null;
  return HELP_CONTENT[activeHelp as HelpKey];
});

export const includedProfilesAtom = atom((get) => {
  const tickerProfiles = get(tickerProfilesAtom);
  const includedTickerIds = get(includedTickerIdsAtom);
  return tickerProfiles.filter((profile) => includedTickerIds.includes(profile.id));
});

export const normalizedAllocationAtom = atom((get) => {
  const includedProfiles = get(includedProfilesAtom);
  const weightByTickerId = get(weightByTickerIdAtom);

  if (includedProfiles.length === 0) return [];

  const rawWeights = includedProfiles.map((profile) => Math.max(0, weightByTickerId[profile.id] ?? 1));
  const rawWeightSum = rawWeights.reduce((sum, value) => sum + value, 0);
  const normalizedWeights =
    rawWeightSum === 0 ? includedProfiles.map(() => 1 / includedProfiles.length) : rawWeights.map((weight) => weight / rawWeightSum);

  return includedProfiles.map((profile, index) => ({ profile, weight: normalizedWeights[index] }));
});

export const allocationPercentByTickerIdAtom = atom((get) =>
  get(normalizedAllocationAtom).reduce<Record<string, number>>((acc, item) => {
    acc[item.profile.id] = Number((item.weight * 100).toFixed(1));
    return acc;
  }, {})
);

export const allocationPercentExactByTickerIdAtom = atom((get) =>
  get(normalizedAllocationAtom).reduce<Record<string, number>>((acc, item) => {
    acc[item.profile.id] = item.weight * 100;
    return acc;
  }, {})
);

export const adjustableTickerCountAtom = atom((get) => {
  const fixedByTickerId = get(fixedByTickerIdAtom);
  return get(includedProfilesAtom).filter((profile) => !fixedByTickerId[profile.id]).length;
});

export const useCurrentHelpAtomValue = () => useAtomValue(currentHelpAtom);
export const useIncludedProfilesAtomValue = () => useAtomValue(includedProfilesAtom);
export const useNormalizedAllocationAtomValue = () => useAtomValue(normalizedAllocationAtom);
export const useAllocationPercentByTickerIdAtomValue = () => useAtomValue(allocationPercentByTickerIdAtom);
export const useAllocationPercentExactByTickerIdAtomValue = () => useAtomValue(allocationPercentExactByTickerIdAtom);
export const useAdjustableTickerCountAtomValue = () => useAtomValue(adjustableTickerCountAtom);
