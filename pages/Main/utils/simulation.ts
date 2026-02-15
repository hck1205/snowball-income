import type { TickerDraft, TickerProfile } from '@/shared/types/snowball';
import type { SimulationOutput, YieldFormValues } from '@/shared/types';
import { ALLOCATION_COLORS } from '@/shared/constants';
import { runSimulation } from '@/shared/lib/snowball';
import { toTickerDraft } from './ticker';
import type { NormalizedAllocationItem } from './portfolio';

type SimulatableTicker = TickerDraft | TickerProfile;

const runForProfile = (profile: SimulatableTicker, monthlyContribution: number, values: YieldFormValues): SimulationOutput =>
  runSimulation({
    ticker: {
      ticker: profile.ticker,
      initialPrice: profile.initialPrice,
      dividendYield: profile.dividendYield,
      dividendGrowth: profile.dividendGrowth,
      priceGrowth: profile.priceGrowth,
      frequency: profile.frequency
    },
    settings: {
      monthlyContribution,
      targetMonthlyDividend: values.targetMonthlyDividend,
      durationYears: values.durationYears,
      reinvestDividends: values.reinvestDividends,
      taxRate: values.taxRate,
      reinvestTiming: values.reinvestTiming,
      dpsGrowthMode: values.dpsGrowthMode
    }
  });

export const buildSimulation = ({
  isValid,
  includedProfiles,
  normalizedAllocation,
  values
}: {
  isValid: boolean;
  includedProfiles: TickerProfile[];
  normalizedAllocation: NormalizedAllocationItem[];
  values: YieldFormValues;
}): SimulationOutput | null => {
  if (!isValid) return null;

  if (includedProfiles.length === 0) {
    return runForProfile(toTickerDraft(values), values.monthlyContribution, values);
  }

  if (includedProfiles.length === 1) {
    return runForProfile(includedProfiles[0], values.monthlyContribution, values);
  }

  const outputs = normalizedAllocation.map(({ profile, weight }) => runForProfile(profile, values.monthlyContribution * weight, values));
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
      targetMonthDividendReachedYear: yearly.find((item) => item.monthlyDividend >= values.targetMonthlyDividend)?.year
    },
    quickEstimate: {
      endValue: outputs.reduce((sum, output) => sum + output.quickEstimate.endValue, 0),
      annualDividendApprox: outputs.reduce((sum, output) => sum + output.quickEstimate.annualDividendApprox, 0),
      monthlyDividendApprox: outputs.reduce((sum, output) => sum + output.quickEstimate.monthlyDividendApprox, 0),
      yieldOnPriceAtEnd: outputs.reduce((sum, output) => sum + output.quickEstimate.yieldOnPriceAtEnd, 0) / outputs.length
    }
  };
};

export type RecentCashflowByTicker = {
  months: string[];
  series: Array<{ name: string; data: number[]; color: string }>;
};

export const buildRecentCashflowByTicker = ({
  isValid,
  includedProfiles,
  normalizedAllocation,
  values
}: {
  isValid: boolean;
  includedProfiles: TickerProfile[];
  normalizedAllocation: NormalizedAllocationItem[];
  values: YieldFormValues;
}): RecentCashflowByTicker => {
  if (!isValid) return { months: [], series: [] };

  const targetProfiles =
    includedProfiles.length === 0
      ? [
          {
            profile: toTickerDraft(values),
            weight: 1
          }
        ]
      : includedProfiles.length === 1
        ? [
            {
              profile: includedProfiles[0],
              weight: 1
            }
          ]
        : normalizedAllocation.map(({ profile, weight }) => ({ profile, weight }));

  const outputs = targetProfiles.map((item) => ({
    ticker: item.profile.ticker,
    output: runForProfile(item.profile, values.monthlyContribution * item.weight, values)
  }));

  const baseMonthly = outputs[0]?.output.monthly ?? [];
  const months = baseMonthly.slice(-12).map((row) => `${row.year}-${String(row.month).padStart(2, '0')}`);
  const series = outputs.map((item, index) => ({
    name: item.ticker,
    data: item.output.monthly.slice(-12).map((row) => row.dividendPaid),
    color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]
  }));

  return { months, series };
};
