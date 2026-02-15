import type { TickerProfile } from '@/shared/types/snowball';

export type NormalizedAllocationItem = {
  profile: TickerProfile;
  weight: number;
};

export const getIncludedProfiles = (tickerProfiles: TickerProfile[], includedTickerIds: string[]): TickerProfile[] =>
  tickerProfiles.filter((profile) => includedTickerIds.includes(profile.id));

export const buildNormalizedAllocation = (
  includedProfiles: TickerProfile[],
  weightByTickerId: Record<string, number>
): NormalizedAllocationItem[] => {
  if (includedProfiles.length === 0) return [];

  const rawWeights = includedProfiles.map((profile) => Math.max(0, weightByTickerId[profile.id] ?? 1));
  const rawWeightSum = rawWeights.reduce((sum, value) => sum + value, 0);
  const normalizedWeights =
    rawWeightSum === 0 ? includedProfiles.map(() => 1 / includedProfiles.length) : rawWeights.map((weight) => weight / rawWeightSum);

  return includedProfiles.map((profile, index) => ({ profile, weight: normalizedWeights[index] }));
};

export const buildAllocationPercentMaps = (normalizedAllocation: NormalizedAllocationItem[]) =>
  normalizedAllocation.reduce(
    (acc, item) => {
      acc.allocationPercentByTickerId[item.profile.id] = Number((item.weight * 100).toFixed(1));
      acc.allocationPercentExactByTickerId[item.profile.id] = item.weight * 100;
      return acc;
    },
    {
      allocationPercentByTickerId: {} as Record<string, number>,
      allocationPercentExactByTickerId: {} as Record<string, number>
    }
  );

export const countAdjustableTickers = (includedProfiles: TickerProfile[], fixedByTickerId: Record<string, boolean>): number =>
  includedProfiles.filter((profile) => !fixedByTickerId[profile.id]).length;
