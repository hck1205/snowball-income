import type { TickerProfile } from '@/shared/types/snowball';
import type { MonthlySnapshot, SimulationOutput, SimulationResult, YieldFormValues } from '@/shared/types';
import { getTickerDisplayName } from '@/shared/utils';
import { sumBy } from '@/shared/lib/numeric';
import { getChartTheme } from '@/shared/styles';
import {
  aggregateYearly,
  computeCapitalGains,
  findFinancialIncomeThresholdYear,
  findTargetYear,
  runSimulation,
  solveRequiredMonthlyContribution,
  toPriceGrowth
} from '@/shared/lib/snowball';
import type { YearlyCashflowByTicker } from '@/shared/lib/charts';
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

  /* 연간 합산은 커뮤니티·PDF 경로(`runScenarioPayload`)와 **같은 함수**다 — 예전엔 양쪽에 복붙돼 있었다. */
  const yearly: SimulationResult[] = aggregateYearly(outputs);

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
      /*
       * 🔴 **종목별 값의 단순 합이 맞다.** 각 종목이 자기 배당률·세율·지급주기로 계산한 월 환산액이라
       *    합치면 곧 포트폴리오의 월 환산액이다(양도세처럼 인별 공제가 끼어드는 항목이 아니다 —
       *    아래 `computeCapitalGains` 가 합산 후 한 번만 계산하는 것과 대비된다).
       */
      finalRunRateMonthlyDividend: sumBy(outputs, (output) => output.summary.finalRunRateMonthlyDividend),
      /* ISA 정산세도 종목별 합이다 — 계좌 유형이 종목마다 달라도 각자 자기 규칙으로 계산돼 있다.
         ⚠ 비과세 한도(200만원)는 **계좌당**인데 여기서는 종목마다 적용된다. 한 ISA 계좌에 여러
         종목을 담으면 실제보다 세금을 적게 잡는다 — 한도를 계좌 단위로 묶으려면 "어느 종목이 같은
         계좌인가"라는 입력이 더 필요하다(지금은 그 입력이 없다). 화면 문구가 이 한계를 밝힌다. */
      isaSettlementTax: sumBy(outputs, (output) => output.summary.isaSettlementTax),
      totalContribution: finalYear?.totalContribution ?? 0,
      totalNetDividend: finalYear?.cumulativeDividend ?? 0,
      totalTaxPaid: sumBy(outputs, (output) => output.summary.totalTaxPaid),
      /* 🔴 단일 종목 경로(`buildSummary`)와 **같은 함수**다 — 인라인으로 다시 구현하면 같은 화면에서
         "도달"과 "미도달"이 갈릴 수 있다. */
      targetMonthDividendReachedYear: findTargetYear(yearly, targetMonthlyDividend),
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

/**
 * 후보 월 적립금으로 **목표 월배당에 도달하는가**.
 *
 * 🔴 판정은 화면과 **같은 두 함수**로 한다 — `aggregateYearly` 로 합산하고 `findTargetYear` 로
 * 판정한다. 그 둘이 곧 `aggregatePortfolioSimulation` 이 `targetMonthDividendReachedYear` 를
 * 만드는 방법이다. "같은 식을 쓴다"는 약속이 아니라 **같은 코드를 부르는 것**이라, 판정 규칙이
 * 바뀌어도 역산과 화면이 갈릴 수 없다.
 *
 * 차트 옵션·색·월 시계열은 만들지 않는다. 역산은 이 판정을 15~20번 부르는데, 번들 전체를 매번
 * 다시 만들면 `getChartTheme()` 이 그만큼 DOM 을 읽는다(느리고, 답에는 아무 영향이 없다).
 */
const reachesTargetMonthlyDividend = (
  targetProfiles: WeightedTargetProfile[],
  values: YieldFormValues,
  monthlyContribution: number
): boolean => {
  const outputs = targetProfiles.map((item) =>
    runForProfile(item.profile, monthlyContribution * item.weight, values.initialInvestment * item.weight, values)
  );

  return findTargetYear(aggregateYearly(outputs), values.targetMonthlyDividend) !== undefined;
};

/**
 * 목표 월배당에 도달하는 **최소 월 적립금**. 계산할 수 없거나 어떤 금액으로도 도달할 수 없으면 `null`.
 *
 * 화면(`ResultSummaryCard` 의 목표 타일)이 `미도달` 만 말하고 끝나던 자리에 "월 얼마면 달성"을
 * 채우는 값이다. 배분·계좌·세율 같은 맥락은 여기서 묶고, 탐색 자체는 순수 함수
 * (`solveRequiredMonthlyContribution`)에 맡긴다.
 *
 * ⚠ 목표 미설정(0 이하)이면 `null` 이다 — 0 은 첫 해에 자동으로 "도달"이라 답이 언제나 0이 되어
 *   무의미하다(호출부가 "미설정"을 따로 표시한다).
 */
export const solveRequiredMonthlyContributionForPortfolio = ({
  isValid,
  includedProfiles,
  normalizedAllocation,
  values
}: SimulationInputParams): number | null => {
  if (!isValid || !(values.targetMonthlyDividend > 0)) return null;

  const targetProfiles = buildTargetProfiles({ includedProfiles, normalizedAllocation });
  if (targetProfiles.length === 0) return null;

  return solveRequiredMonthlyContribution({
    reachesTarget: (monthlyContribution) => reachesTargetMonthlyDividend(targetProfiles, values, monthlyContribution),
    // 필요한 적립금은 대개 현재 적립금이나 목표 월배당과 비슷한 자릿수다 — 거기서 시작하면 탐색이 짧다.
    probeStart: Math.max(values.monthlyContribution, values.targetMonthlyDividend)
  });
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
  /*
   * 티커별 스택 색 = 현재 프리셋의 차트 시리즈 세트 (포트폴리오 파이·범례 점과 같은 인덱스 규칙 % 8).
   * 캔버스라 var()를 못 쓰므로 빌드 시점에 해석한다 — 프리셋 전환 시 useMainComputed가
   * palettePresetAtom 의존성으로 번들을 다시 빌드해 색을 갱신한다.
   */
  const seriesColors = getChartTheme().series;
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
        color: seriesColors[index % seriesColors.length]
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
