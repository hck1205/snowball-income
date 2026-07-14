import type { TickerProfile } from '@/shared/types/snowball';
import type { MonthlySnapshot, SimulationOutput, SimulationResult, YieldFormValues } from '@/shared/types';
import { ALLOCATION_COLORS } from '@/shared/constants';
import { getTickerDisplayName } from '@/shared/utils';
import { computeCapitalGains, findFinancialIncomeThresholdYear, runSimulation, toPriceGrowth } from '@/shared/lib/snowball';
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
  /** 정합 모델의 단일 성장률: 주가 성장률 === 배당 성장률. */
  growthRate: number;
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

const sumBy = <T>(items: T[], getValue: (item: T) => number): number =>
  items.reduce((sum, item) => sum + getValue(item), 0);

/**
 * 종목별 시뮬레이션을 포트폴리오 한 줄로 합산한다.
 *
 * `price` / `dividendPerShare` 는 종목마다 다르므로 그대로 합칠 수 없다. 예전에는 `...row` 스프레드로
 * 0번 티커의 값이 그대로 새어 들어와 `shares * price !== portfolioValue` 였다.
 * 지금은 **가치가중 평균가**(portfolioValue / shares)와 **주식수가중 평균 DPS**로 채워서
 *   shares * price          === portfolioValue
 *   shares * dividendPerShare === 포트폴리오 연간 배당 런레이트(세전)
 * 두 항등식이 성립한다.
 */
const aggregatePortfolioSimulation = (outputs: SimulationOutput[], targetMonthlyDividend: number): SimulationOutput => {
  const base = outputs[0];
  const monthly: MonthlySnapshot[] = base.monthly.map((row, index) => {
    const merged = outputs.map((output) => output.monthly[index]);
    const shares = sumBy(merged, (item) => item.shares);
    const portfolioValue = sumBy(merged, (item) => item.portfolioValue);
    const annualDividendRunRate = sumBy(merged, (item) => item.shares * item.dividendPerShare);

    return {
      monthIndex: row.monthIndex,
      year: row.year,
      month: row.month,
      shares,
      price: shares > 0 ? portfolioValue / shares : 0,
      dividendPerShare: shares > 0 ? annualDividendRunRate / shares : 0,
      dividendPaid: sumBy(merged, (item) => item.dividendPaid),
      contributionPaid: sumBy(merged, (item) => item.contributionPaid),
      taxPaid: sumBy(merged, (item) => item.taxPaid),
      portfolioValue,
      cumulativeDividend: sumBy(merged, (item) => item.cumulativeDividend)
    };
  });

  const yearly: SimulationResult[] = base.yearly.map((row, index) => {
    const merged = outputs.map((output) => output.yearly[index]);
    const annualDividend = sumBy(merged, (item) => item.annualDividend);

    return {
      year: row.year,
      totalContribution: sumBy(merged, (item) => item.totalContribution),
      assetValue: sumBy(merged, (item) => item.assetValue),
      annualDividend,
      cumulativeDividend: sumBy(merged, (item) => item.cumulativeDividend),
      monthlyDividend: annualDividend / 12
    };
  });

  const finalYear = yearly[yearly.length - 1];
  const lastPayout = [...monthly].reverse().find((item) => item.dividendPaid > 0);

  const finalAssetValue = finalYear?.assetValue ?? 0;
  const totalCostBasis = sumBy(outputs, (output) => output.summary.totalCostBasis);

  return {
    monthly,
    yearly,
    summary: {
      finalAssetValue,
      finalAnnualDividend: finalYear?.annualDividend ?? 0,
      finalMonthlyAverageDividend: finalYear?.monthlyDividend ?? 0,
      finalPayoutMonthDividend: lastPayout?.dividendPaid ?? 0,
      totalContribution: finalYear?.totalContribution ?? 0,
      totalNetDividend: finalYear?.cumulativeDividend ?? 0,
      totalTaxPaid: sumBy(outputs, (output) => output.summary.totalTaxPaid),
      targetMonthDividendReachedYear: yearly.find((item) => item.monthlyDividend >= targetMonthlyDividend)?.year,
      totalCostBasis,
      /**
       * 양도세는 **종목별 세금의 합이 아니다**. 기본공제 250만원은 인별로 1회만 적용되므로
       * (종목마다 250만원씩 공제하면 세금이 과소계상된다) 합산된 평가금액/취득원가로 한 번만 계산한다.
       * 종목 간 손익통산도 이렇게 해야 자연스럽게 반영된다.
       */
      ...computeCapitalGains({ finalAssetValue, totalCostBasis }),
      // 금융소득종합과세도 인별 합산이므로, 합쳐진 월별 배당(세전)으로 판정한다.
      financialIncomeThresholdYear: findFinancialIncomeThresholdYear(monthly)
    },
    quickEstimate: {
      endValue: outputs.reduce((sum, output) => sum + output.quickEstimate.endValue, 0),
      annualDividendApprox: outputs.reduce((sum, output) => sum + output.quickEstimate.annualDividendApprox, 0),
      monthlyDividendApprox: outputs.reduce((sum, output) => sum + output.quickEstimate.monthlyDividendApprox, 0),
      yieldOnPriceAtEnd: (() => {
        const totalEndValue = outputs.reduce((sum, output) => sum + output.quickEstimate.endValue, 0);
        if (totalEndValue <= 0) return 0;

        return outputs.reduce(
          (sum, output) => sum + (output.quickEstimate.endValue * output.quickEstimate.yieldOnPriceAtEnd),
          0
        ) / totalEndValue;
      })()
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

/**
 * Year-over-year growth rate between the first two projection rows.
 * Returns null when there is nothing to compare or the base value is not positive.
 */
export const computeAnnualGrowthRate = <TRow>(rows: readonly TRow[], getValue: (row: TRow) => number): number | null => {
  if (rows.length < 2) return null;

  const baseValue = getValue(rows[0]);
  if (!(baseValue > 0)) return null;

  return getValue(rows[1]) / baseValue - 1;
};

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
    growthRate: toPriceGrowth(item.profile.dividendGrowth)
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

  /**
   * 투자 종료 후 구간: 적립도 재투자도 없이 배당을 **인출**하는 가정이다.
   * 따라서 자산은 주가 성장률로만 자란다. 정합 모델에서는 `priceGrowth === dividendGrowth` 이므로
   * 자산과 배당이 같은 비율로 성장한다 (배당수익률 불변).
   *
   * 예전에는 자산을 `expectedTotalReturn`, 배당을 `dividendGrowth` 로 따로 굴려서 배당을 두 번 셌다
   * (인출한 배당이 자산 성장률에도 계속 포함됐다).
   */
  const annualDividendWeightSum = sumBy(outputs, (item) => item.output.summary.finalAnnualDividend);
  const effectiveDividendGrowthRate =
    annualDividendWeightSum > 0
      ? sumBy(outputs, (item) => item.growthRate * item.output.summary.finalAnnualDividend) / annualDividendWeightSum
      : 0;
  const assetValueWeightSum = sumBy(outputs, (item) => item.output.summary.finalAssetValue);
  const effectiveAssetGrowthRate =
    assetValueWeightSum > 0
      ? sumBy(outputs, (item) => item.growthRate * item.output.summary.finalAssetValue) / assetValueWeightSum
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
