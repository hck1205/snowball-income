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
  // 비중은 **그 비중이 딸려 온 allocation 에서 그대로** 들고 온다.
  // 예전에는 필터링된 배열의 인덱스로 `preset.allocations[index]` 를 읽어서, universe 에 없는 티커가
  // 하나라도 섞이면 이후 티커들의 비중이 한 칸씩 당겨졌다 (NOPE 70 / JEPI 30 → JEPI 가 70 을 받음).
  const entries = preset.allocations
    .map(({ ticker, weight }, index) => {
      const universeItem = universe[ticker];
      if (!universeItem) return null;

      const profile: TickerProfile = {
        ...universeItem,
        id: `preset-${preset.id}-${ticker.toLowerCase()}-${index + 1}`,
        name: ''
      };
      return { profile, weight: Math.max(0, weight) };
    })
    .filter((entry): entry is { profile: TickerProfile; weight: number } => entry !== null);

  if (entries.length === 0) return null;

  const profiles = entries.map((entry) => entry.profile);
  const includedIds = profiles.map((profile) => profile.id);
  const selectedProfile = profiles[0];

  // universe 에 없는 티커를 건너뛰면 합이 100 미만으로 남는다 (JEPI 만 살아남으면 30%짜리 포트폴리오).
  // 살아남은 비중끼리 비율을 유지한 채 100% 로 재정규화한다.
  // 합이 이미 100 이면 부동소수점 잡음을 만들지 않도록 그대로 둔다.
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  const normalizeWeight = (weight: number): number => {
    if (totalWeight <= 0) return 0; // 전부 0/음수면 나눌 수 없다 — 0 으로 두고 하위 배분 로직에 맡긴다.
    if (totalWeight === 100) return weight;
    return (weight * 100) / totalWeight;
  };

  const weightByTickerId = entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.profile.id] = normalizeWeight(entry.weight);
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
