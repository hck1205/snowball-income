import type { TickerProfile } from '@/shared/types/snowball';
import type { SimulationOutput, YieldFormValues } from '@/shared/types';
import { ALLOCATION_COLORS } from '@/shared/constants';
import { getTickerDisplayName } from '@/shared/utils';
import { runSimulation } from '@/shared/lib/snowball';
import type { NormalizedAllocationItem } from './portfolio';

const runForProfile = (
  profile: TickerProfile,
  monthlyContribution: number,
  initialInvestment: number,
  values: YieldFormValues
): SimulationOutput =>
  runSimulation({
    ticker: {
      ticker: profile.ticker,
      initialPrice: profile.initialPrice,
      dividendYield: profile.dividendYield,
      dividendGrowth: profile.dividendGrowth,
      expectedTotalReturn: profile.expectedTotalReturn,
      frequency: profile.frequency
    },
    settings: {
      initialInvestment,
      monthlyContribution,
      targetMonthlyDividend: values.targetMonthlyDividend,
      investmentStartDate: values.investmentStartDate,
      durationYears: values.durationYears,
      reinvestDividends: values.reinvestDividends,
      reinvestDividendPercent: values.reinvestDividendPercent,
      taxRate: values.taxRate,
      reinvestTiming: values.reinvestTiming,
      dpsGrowthMode: values.dpsGrowthMode
    }
  });

type SimulationInputParams = {
  isValid: boolean;
  includedProfiles: TickerProfile[];
  normalizedAllocation: NormalizedAllocationItem[];
  values: YieldFormValues;
  postInvestmentProjectionYears?: number;
};

type WeightedTargetProfile = {
  profile: TickerProfile;
  weight: number;
};

type ProfileSimulationOutput = {
  ticker: string;
  name: string;
  output: SimulationOutput;
  dividendGrowthRate: number;
  expectedTotalReturnRate: number;
};

const buildTargetProfiles = ({
  includedProfiles,
  normalizedAllocation
}: Pick<SimulationInputParams, 'includedProfiles' | 'normalizedAllocation'>): WeightedTargetProfile[] => {
  if (includedProfiles.length === 0) return [];

  if (includedProfiles.length === 1) {
    return [
      {
        profile: includedProfiles[0],
        weight: 1
      }
    ];
  }

  return normalizedAllocation.map(({ profile, weight }) => ({ profile, weight }));
};

const aggregatePortfolioSimulation = (outputs: SimulationOutput[], targetMonthlyDividend: number): SimulationOutput => {
  const base = outputs[0];
  const monthly = base.monthly.map((row, index) => {
    const merged = outputs.map((output) => output.monthly[index]);
    return {
      ...row,
      shares: merged.reduce((sum, item) => sum + item.shares, 0),
      dividendPaid: merged.reduce((sum, item) => sum + item.dividendPaid, 0),
      contributionPaid: merged.reduce((sum, item) => sum + item.contributionPaid, 0),
      taxPaid: merged.reduce((sum, item) => sum + item.taxPaid, 0),
      portfolioValue: merged.reduce((sum, item) => sum + item.portfolioValue, 0),
      cumulativeDividend: merged.reduce((sum, item) => sum + item.cumulativeDividend, 0)
    };
  });

  const yearly = base.yearly.map((row, index) => {
    const merged = outputs.map((output) => output.yearly[index]);
    const annualDividend = merged.reduce((sum, item) => sum + item.annualDividend, 0);
    return {
      ...row,
      totalContribution: merged.reduce((sum, item) => sum + item.totalContribution, 0),
      assetValue: merged.reduce((sum, item) => sum + item.assetValue, 0),
      annualDividend,
      cumulativeDividend: merged.reduce((sum, item) => sum + item.cumulativeDividend, 0),
      monthlyDividend: annualDividend / 12
    };
  });

  const finalYear = yearly[yearly.length - 1];
  const lastPayout = [...monthly].reverse().find((item) => item.dividendPaid > 0);

  return {
    monthly,
    yearly,
    summary: {
      finalAssetValue: finalYear?.assetValue ?? 0,
      finalAnnualDividend: finalYear?.annualDividend ?? 0,
      finalMonthlyDividend: finalYear?.monthlyDividend ?? 0,
      finalMonthlyAverageDividend: finalYear?.monthlyDividend ?? 0,
      finalPayoutMonthDividend: lastPayout?.dividendPaid ?? 0,
      totalContribution: finalYear?.totalContribution ?? 0,
      totalNetDividend: finalYear?.cumulativeDividend ?? 0,
      totalTaxPaid: outputs.reduce((sum, output) => sum + output.summary.totalTaxPaid, 0),
      targetMonthDividendReachedYear: yearly.find((item) => item.monthlyDividend >= targetMonthlyDividend)?.year
    },
    quickEstimate: {
      endValue: outputs.reduce((sum, output) => sum + output.quickEstimate.endValue, 0),
      annualDividendApprox: outputs.reduce((sum, output) => sum + output.quickEstimate.annualDividendApprox, 0),
      monthlyDividendApprox: outputs.reduce((sum, output) => sum + output.quickEstimate.monthlyDividendApprox, 0),
      yieldOnPriceAtEnd: outputs.reduce((sum, output) => sum + output.quickEstimate.yieldOnPriceAtEnd, 0) / outputs.length
    }
  };
};

export const buildSimulation = ({
  isValid,
  includedProfiles,
  normalizedAllocation,
  values
}: SimulationInputParams): SimulationOutput | null => {
  const bundle = buildSimulationBundle({
    isValid,
    includedProfiles,
    normalizedAllocation,
    values
  });
  return bundle.simulation;
};

export type RecentCashflowByTicker = {
  months: string[];
  series: Array<{ name: string; data: number[]; color: string }>;
};

export type YearlyCashflowByTicker = {
  years: number[];
  byYear: Record<string, RecentCashflowByTicker & { totalDividend: number }>;
};

export type PostInvestmentDividendProjectionRow = {
  year: number;
  monthlyDividend: number;
  annualDividend: number;
  assetValue: number;
};

const DEFAULT_POST_INVESTMENT_PROJECTION_YEARS = 10;
export const MIN_POST_INVESTMENT_PROJECTION_YEARS = 5;

export const buildSimulationBundle = ({
  isValid,
  includedProfiles,
  normalizedAllocation,
  values,
  postInvestmentProjectionYears = DEFAULT_POST_INVESTMENT_PROJECTION_YEARS
}: SimulationInputParams): {
  simulation: SimulationOutput | null;
  yearlyCashflowByTicker: YearlyCashflowByTicker;
  postInvestmentDividendProjectionRows: PostInvestmentDividendProjectionRow[];
} => {
  if (!isValid) {
    return {
      simulation: null,
      yearlyCashflowByTicker: { years: [], byYear: {} },
      postInvestmentDividendProjectionRows: []
    };
  }

  const targetProfiles = buildTargetProfiles({ includedProfiles, normalizedAllocation });
  if (targetProfiles.length === 0) {
    return {
      simulation: null,
      yearlyCashflowByTicker: { years: [], byYear: {} },
      postInvestmentDividendProjectionRows: []
    };
  }

  const outputs: ProfileSimulationOutput[] = targetProfiles.map((item) => ({
    ticker: item.profile.ticker,
    name: item.profile.name,
    output: runForProfile(item.profile, values.monthlyContribution * item.weight, values.initialInvestment * item.weight, values),
    dividendGrowthRate: item.profile.dividendGrowth / 100,
    expectedTotalReturnRate: item.profile.expectedTotalReturn / 100
  }));

  const simulation =
    outputs.length === 1 ? outputs[0].output : aggregatePortfolioSimulation(outputs.map((item) => item.output), values.targetMonthlyDividend);

  const baseMonthly = outputs[0]?.output.monthly ?? [];
  const years = Array.from(new Set(baseMonthly.map((row) => row.year))).sort((left, right) => left - right);
  const byYear = years.reduce<YearlyCashflowByTicker['byYear']>((acc, year) => {
    const months = Array.from({ length: 12 }, (_v, index) => `${index + 1}월`);
    const series = outputs.map((item, index) => {
      const monthlyMap = item.output.monthly.reduce<Record<number, number>>((map, row) => {
        if (row.year !== year) return map;
        map[row.month] = row.dividendPaid;
        return map;
      }, {});

      return {
        name: getTickerDisplayName(item.ticker, item.name),
        data: Array.from({ length: 12 }, (_m, monthIndex) => monthlyMap[monthIndex + 1] ?? 0),
        color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]
      };
    });

    const totalDividend = series.reduce((sum, item) => sum + item.data.reduce((innerSum, value) => innerSum + value, 0), 0);
    acc[String(year)] = { months, series, totalDividend };
    return acc;
  }, {});

  const finalYear = simulation.yearly[simulation.yearly.length - 1];
  const baseAnnualDividend = finalYear?.annualDividend ?? 0;
  const baseAssetValue = finalYear?.assetValue ?? 0;
  const baseYear = finalYear?.year ?? null;
  const annualDividendWeightSum = outputs.reduce((sum, item) => sum + item.output.summary.finalAnnualDividend, 0);
  const effectiveDividendGrowthRate =
    annualDividendWeightSum > 0
      ? outputs.reduce(
          (sum, item) => sum + item.dividendGrowthRate * item.output.summary.finalAnnualDividend,
          0
        ) / annualDividendWeightSum
      : 0;
  const assetValueWeightSum = outputs.reduce((sum, item) => sum + item.output.summary.finalAssetValue, 0);
  const effectiveAssetGrowthRate =
    assetValueWeightSum > 0
      ? outputs.reduce(
          (sum, item) => sum + item.expectedTotalReturnRate * item.output.summary.finalAssetValue,
          0
        ) / assetValueWeightSum
      : 0;
  const postInvestmentDividendProjectionRows =
    baseYear === null
      ? []
      : Array.from({ length: Math.max(MIN_POST_INVESTMENT_PROJECTION_YEARS, Math.floor(postInvestmentProjectionYears)) + 1 }, (_v, yearOffset) => {
          const annualDividend = baseAnnualDividend * Math.pow(1 + effectiveDividendGrowthRate, yearOffset);
          const assetValue = baseAssetValue * Math.pow(1 + effectiveAssetGrowthRate, yearOffset);
          return {
            year: baseYear + yearOffset,
            annualDividend,
            monthlyDividend: annualDividend / 12,
            assetValue
          };
        });

  return {
    simulation,
    yearlyCashflowByTicker: { years, byYear },
    postInvestmentDividendProjectionRows
  };
};
