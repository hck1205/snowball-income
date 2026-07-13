import type { Frequency } from '@/shared/types';
import type { TickerDraft, TickerProfile } from '@/shared/types/snowball';

export type PortfolioPresetAllocation = {
  ticker: string;
  weight: number;
};

export type PortfolioPresetDefinition = {
  id: string;
  title: string;
  allocations: readonly PortfolioPresetAllocation[];
  /** Human readable label such as '약 40~50만원'. */
  expectedMonthlyDividend: string;
  monthlyContributionValue: number;
  durationYearsValue: number;
  targetMonthlyDividendValue: number;
};

export type PresetFormPatch = {
  ticker: string;
  initialPrice: number;
  dividendYield: number;
  dividendGrowth: number;
  expectedTotalReturn: number;
  frequency: Frequency;
  initialInvestment: number;
  monthlyContribution: number;
  targetMonthlyDividend: number;
  durationYears: number;
};

export type PresetPortfolio = {
  profiles: TickerProfile[];
  includedIds: string[];
  selectedTickerId: string | null;
  weightByTickerId: Record<string, number>;
  fixedByTickerId: Record<string, boolean>;
  scenarioName: string;
  formPatch: PresetFormPatch;
};

/**
 * Reads the lower bound of a Korean "만원" range label as a plain KRW amount.
 * '약 40~50만원' -> 400000. Falls back when no leading number is present.
 */
export const parseApproxManwonLowerBound = (expectedMonthlyDividend: string, fallback: number): number => {
  const normalized = expectedMonthlyDividend.replace(/,/g, '');
  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return fallback;

  const lowerBoundInManwon = Number(match[1]);
  if (!Number.isFinite(lowerBoundInManwon) || lowerBoundInManwon < 0) return fallback;

  return Math.floor(lowerBoundInManwon * 10_000);
};

/**
 * Turns a portfolio preset into the full state a scenario needs.
 * Returns null when none of the preset tickers exist in the given universe.
 */
export const buildPresetPortfolio = ({
  preset,
  universe
}: {
  preset: PortfolioPresetDefinition;
  universe: Readonly<Record<string, TickerDraft>>;
}): PresetPortfolio | null => {
  const profiles = preset.allocations
    .map(({ ticker }, index) => {
      const universeItem = universe[ticker];
      if (!universeItem) return null;

      const profile: TickerProfile = {
        ...universeItem,
        id: `preset-${preset.id}-${ticker.toLowerCase()}-${index + 1}`,
        name: ''
      };
      return profile;
    })
    .filter((profile): profile is TickerProfile => profile !== null);

  if (profiles.length === 0) return null;

  const includedIds = profiles.map((profile) => profile.id);
  const selectedProfile = profiles[0];

  // NOTE: indexes into `allocations` by the *filtered* profile index, mirroring the original
  // implementation. See report — weights shift when a preset ticker is missing from the universe.
  const weightByTickerId = profiles.reduce<Record<string, number>>((acc, profile, index) => {
    const rawWeight = preset.allocations[index]?.weight ?? 0;
    acc[profile.id] = Math.max(0, rawWeight);
    return acc;
  }, {});
  const fixedByTickerId = profiles.reduce<Record<string, boolean>>((acc, profile) => {
    acc[profile.id] = false;
    return acc;
  }, {});

  return {
    profiles,
    includedIds,
    selectedTickerId: includedIds[0] ?? null,
    weightByTickerId,
    fixedByTickerId,
    scenarioName: preset.title,
    formPatch: {
      ticker: selectedProfile.ticker,
      initialPrice: selectedProfile.initialPrice,
      dividendYield: selectedProfile.dividendYield,
      dividendGrowth: selectedProfile.dividendGrowth,
      expectedTotalReturn: selectedProfile.expectedTotalReturn,
      frequency: selectedProfile.frequency,
      initialInvestment: 0,
      monthlyContribution: preset.monthlyContributionValue,
      targetMonthlyDividend: parseApproxManwonLowerBound(preset.expectedMonthlyDividend, preset.targetMonthlyDividendValue),
      durationYears: preset.durationYearsValue
    }
  };
};
