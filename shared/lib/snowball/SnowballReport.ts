import type { DpsGrowthMode, Frequency, ReinvestTiming, SimulationOutput, SimulationResult } from '@/shared/types';
import { computeCapitalGains, findFinancialIncomeThresholdYear } from './SnowballCapitalGains';
import { toExpectedTotalReturnPercent } from './SnowballRates';
import { runScenarioPayload } from './SnowballScenarioRun';
import { findTargetYear } from './SnowballSummary';

/**
 * PDF 리포트용 시뮬레이션 요약 — **순수 함수 / 수치 모델**.
 *
 * 대시보드를 캡처한 PDF에 곁들일 "의미 있는 숫자"만 모은다. 문자열 포맷(만원·억·%·N년차 문구)은
 * 만들지 않는다 — 표기는 UI가 `formatSummaryKRW` 등 기존 포맷터로 붙인다.
 *
 * 계산 경로는 커뮤니티 요약(`buildScenarioSimSummary`)과 **완전히 동일**하다:
 * `runScenarioPayload`(payload 해석 → 티커별 `runSimulation` → 연간 합산)를 그대로 쓰고,
 * 그 위에서 **읽기만** 한다. 수식을 새로 만든 곳은 없고, 세금/양도세/금융소득 판정은
 * `SnowballCapitalGains`의 기존 순수 함수를 호출한다.
 */

export const SNOWBALL_REPORT_VERSION = 1;

/* ── 모델 ─────────────────────────────────────────────────────────────────── */

/** 리포트에 실리는 종목 한 줄. 비중은 정규화된 0..1 값이다. */
export type SnowballReportHolding = {
  ticker: string;
  /** 정규화 비중 (0..1, 전 종목 합 = 1). 앱 파이차트와 같은 규칙. */
  weight: number;
  /** 명목 배당률(%) — 사용자가 입력/큐레이션한 관측값. 세전이다. */
  dividendYieldPercent: number;
  /** 배당 성장률(%). 정합 모델에서 주가 성장률과 같은 값이다. */
  dividendGrowthPercent: number;
  /** 파생 총수익률(%) = 배당률 + 배당 성장률. 엔진이 계산에 쓰는 값이 아니라 표시용 파생값이다. */
  expectedTotalReturnPercent: number;
  frequency: Frequency;
  /** 이 종목에 배분된 초기 투자금(원) = 초기 투자금 × 비중. */
  allocatedInitialInvestment: number;
  /** 이 종목에 배분된 월 적립금(원) = 월 적립금 × 비중. */
  allocatedMonthlyContribution: number;
  /** 이 종목이 마지막 해에 낸 세후 연 배당(원). 종목별 기여도를 보여준다. */
  finalAnnualDividend: number;
  /** 이 종목의 기간 종료 시점 평가액(원). */
  finalAssetValue: number;
};

/** 지급 주기별 구성. 월별 배당 캘린더가 얼마나 고르게 채워지는지를 말해 준다. */
export type SnowballReportFrequencyMix = {
  frequency: Frequency;
  tickerCount: number;
  /** 이 주기에 속한 종목들의 비중 합 (0..1). */
  weight: number;
};

/** 사용자가 입력한 조건 그대로. PDF 첫 장의 "가정" 블록용. */
export type SnowballReportInputs = {
  /** 초기 투자금(원). */
  initialInvestment: number;
  /** 월 적립금(원). */
  monthlyContribution: number;
  /** 투자 기간(년). */
  durationYears: number;
  /** 투자 시작일 (`YYYY-MM-DD`). */
  investmentStartDate: string;
  /** 배당소득세율(%). 미입력이면 엔진과 같이 0으로 본다. */
  taxRatePercent: number;
  reinvestDividends: boolean;
  /** 재투자 비율(%). `reinvestDividends`가 false면 엔진은 이 값을 쓰지 않는다. */
  reinvestDividendPercent: number;
  /** 'sameMonth' = 지급월 즉시 매수 / 'nextMonth' = 다음 달 매수. */
  reinvestTiming: ReinvestTiming;
  /** 'annualStep' = 12개월마다 계단식 / 'monthlySmooth' = 매월 연속 성장. */
  dpsGrowthMode: DpsGrowthMode;
  /** 목표 월배당(원). 0이면 "목표 미설정"이다. */
  targetMonthlyDividend: number;
};

export type SnowballReportPortfolio = {
  tickerCount: number;
  holdings: SnowballReportHolding[];
  /** 비중 가중평균 배당률(%). 초기·월 적립금이 같은 비중으로 나뉘므로 투입금 가중평균과 같다. 세전. */
  weightedAverageDividendYieldPercent: number;
  /** 비중 가중평균 배당 성장률(%) = 가중평균 주가 성장률(정합 모델). */
  weightedAverageDividendGrowthPercent: number;
  /** 비중 가중평균 총수익률(%) = 위 둘의 합. */
  weightedAverageExpectedTotalReturnPercent: number;
  /** 실제로 존재하는 주기만, monthly → quarterly → semiannual → annual 순. */
  frequencyMix: SnowballReportFrequencyMix[];
};

export type SnowballReportOutcome = {
  /** 기간 종료 시점 평가액(원). */
  finalAssetValue: number;
  /** 누적 투입 원금(원) = 초기 + 월 적립 × 개월 수. 재투자된 배당은 포함하지 않는다. */
  totalContribution: number;
  /** 기간 전체 누적 세후 배당(원). */
  cumulativeNetDividend: number;
  /** 마지막 해의 세후 연 배당(원). */
  finalAnnualDividend: number;
  /** 마지막 해의 세후 월평균 배당(원) = 연 배당 / 12. */
  finalMonthlyAverageDividend: number;
  /** 누적 배당 ÷ 누적 투입 원금 (배). 원금 0이면 null. */
  dividendToContributionRatio: number | null;
  /** 최종 자산 ÷ 누적 투입 원금 (배). 원금 0이면 null. */
  assetToContributionRatio: number | null;
};

/**
 * 최종 자산이 어디서 왔는가. 세 값의 합은 `finalAssetValue`와 **정확히** 같다(항등식).
 *
 * 배당 성장분과 주가 성장분은 분리하지 않는다 — 정합 모델에서 두 성장률이 같은 값이라
 * 애초에 분리 가능한 개념이 아니다(엔진 주석 SnowballSimulation.ts 참조).
 */
export type SnowballReportComposition = {
  /** 내 돈으로 넣은 원금(원). */
  contribution: number;
  /** 배당으로 다시 사들인 금액의 누계(원). 재투자 OFF면 0. */
  reinvestedDividend: number;
  /** 시세 평가이익(원) = 최종 자산 − 취득원가. 손실이면 음수. */
  marketGain: number;
};

/**
 * YoC(Yield on Cost) = 그 해의 **세후** 연 배당 ÷ 그 시점까지의 누적 투입 원금.
 *
 * 스노우볼의 핵심 지표다: 같은 원금이 해가 갈수록 더 큰 배당을 낳는다는 것을 한 숫자로 보여준다.
 * 명목 배당률(`weightedAverageDividendYieldPercent`)과 달리 세후·재투자 효과가 모두 반영된 실측값이라
 * 두 값을 직접 비교하면 안 된다.
 */
export type SnowballReportYieldOnCost = {
  /** 1년차 YoC(%). 1년차 원금이 0이면 null. */
  firstYearPercent: number | null;
  /** 마지막 해 YoC(%). 원금이 0이면 null. */
  finalYearPercent: number | null;
  /** 마지막 해 − 1년차 (%p). 둘 중 하나라도 null이면 null. */
  deltaPercentagePoints: number | null;
};

export type SnowballReportTarget = {
  /** 목표 월배당(원). */
  targetMonthlyDividend: number;
  /**
   * 목표가 실제로 설정되어 있는가(> 0).
   *
   * **false면 아래 달성 필드는 전부 null이다.** `findTargetYear(rows, 0)`은 첫 행을 즉시 잡아
   * "1년차 달성"을 만들어 내므로, 목표 미설정 상태에서 달성 문구를 쓰면 거짓말이 된다
   * (OG 카드·커뮤니티 카드에서 같은 함정이 잡힌 이력).
   */
  hasTarget: boolean;
  /** 목표를 처음 달성한 n년차(1-based). 미설정/미달성이면 null. */
  reachedInYears: number | null;
  /** 위와 같은 시점의 연도 라벨(시작 연도 + 경과 연). 미설정/미달성이면 null. */
  reachedYearLabel: number | null;
  /** 마지막 해 월평균 배당 ÷ 목표 (0..1이면 미달, 1 이상이면 달성). 미설정이면 null. */
  finalProgressRatio: number | null;
};

export type SnowballReportTaxes = {
  /** 기간 전체 누적 **배당소득세**(원). 양도세는 포함하지 않는다. */
  cumulativeDividendTax: number;
  /** 취득원가(원) = 누적 투입 원금 + 실제로 재매수에 쓰인 배당금. */
  totalCostBasis: number;
  /** 평가이익(원) = 최종 자산 − 취득원가. 손실이면 음수. */
  unrealizedGain: number;
  /** 마지막 해에 전량 매도한다고 가정했을 때의 예상 양도세(원). 보유를 계속하면 내지 않는다. */
  estimatedCapitalGainsTax: number;
  /** 최종 자산 − 예상 양도세(원). */
  afterCapitalGainsTaxValue: number;
  /** 세전 연 배당이 금융소득종합과세 기준금액을 처음 넘는 n년차(1-based). 안 넘으면 null. */
  financialIncomeThresholdYear: number | null;
};

/** 마지막 12개월의 실제 배당 지급 흐름. 시간 순(오래된 달 → 마지막 달)이며 길이는 항상 12다. */
export type SnowballReportCalendarMonth = {
  /** 달력 연도. */
  year: number;
  /** 달력 월(1..12). */
  month: number;
  /** 그 달에 실제로 지급된 세후 배당 합계(원). 지급월이 아니면 0. */
  amount: number;
};

export type SnowballReport = {
  version: typeof SNOWBALL_REPORT_VERSION;
  inputs: SnowballReportInputs;
  portfolio: SnowballReportPortfolio;
  outcome: SnowballReportOutcome;
  composition: SnowballReportComposition;
  yieldOnCost: SnowballReportYieldOnCost;
  target: SnowballReportTarget;
  taxes: SnowballReportTaxes;
  /** 마지막 12개월 배당 캘린더. */
  finalYearCalendar: SnowballReportCalendarMonth[];
  /** 연도별 행(앱 표와 같은 값). 리포트가 연도별 표를 그릴 때 쓴다. */
  yearly: SimulationResult[];
};

/* ── 내부 ─────────────────────────────────────────────────────────────────── */

type SnowballReportRun = NonNullable<ReturnType<typeof runScenarioPayload>>;

const FREQUENCY_ORDER: Frequency[] = ['monthly', 'quarterly', 'semiannual', 'annual'];

const sumBy = <T>(items: T[], getValue: (item: T) => number): number =>
  items.reduce((sum, item) => sum + getValue(item), 0);

/** 분모가 0이거나 비유한이면 null. 리포트에 NaN/Infinity를 흘리지 않기 위한 유일한 나눗셈 통로다. */
const ratioOrNull = (numerator: number, denominator: number): number | null => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;

  const ratio = numerator / denominator;
  return Number.isFinite(ratio) ? ratio : null;
};

/** 비중 가중평균. `getValue`가 종목당 하나의 %값을 주면 Σ(값 × 비중)을 낸다. */
const weightedAverage = (run: SnowballReportRun, getValue: (profile: SnowballReportRun['profiles'][number]) => number): number =>
  run.profiles.reduce((sum, profile, index) => sum + (getValue(profile) * run.weights[index]), 0);

const buildFrequencyMix = (run: SnowballReportRun): SnowballReportFrequencyMix[] =>
  FREQUENCY_ORDER.map((frequency) => {
    const indexes = run.profiles.reduce<number[]>((acc, profile, index) => {
      if (profile.frequency === frequency) acc.push(index);
      return acc;
    }, []);

    return {
      frequency,
      tickerCount: indexes.length,
      weight: sumBy(indexes, (index) => run.weights[index])
    };
  }).filter((item) => item.tickerCount > 0);

const buildHoldings = (run: SnowballReportRun): SnowballReportHolding[] =>
  run.profiles.map((profile, index) => {
    const weight = run.weights[index];
    const summary = run.outputs[index].summary;

    return {
      ticker: profile.ticker,
      weight,
      dividendYieldPercent: profile.dividendYield,
      dividendGrowthPercent: profile.dividendGrowth,
      expectedTotalReturnPercent: toExpectedTotalReturnPercent(profile.dividendYield, profile.dividendGrowth),
      frequency: profile.frequency,
      allocatedInitialInvestment: run.values.initialInvestment * weight,
      allocatedMonthlyContribution: run.values.monthlyContribution * weight,
      finalAnnualDividend: summary.finalAnnualDividend,
      finalAssetValue: summary.finalAssetValue
    };
  });

/**
 * 마지막 12개월의 종목별 지급액을 달(月) 단위로 합산한다.
 * 모든 종목이 같은 시작일·같은 기간을 쓰므로 월 배열은 인덱스로 정렬돼 있다.
 */
const buildFinalYearCalendar = (outputs: SimulationOutput[]): SnowballReportCalendarMonth[] => {
  const tails = outputs.map((output) => output.monthly.slice(-12));

  return tails[0].map((row, offset) => ({
    year: row.year,
    month: row.month,
    amount: sumBy(tails, (tail) => tail[offset]?.dividendPaid ?? 0)
  }));
};

/* ── 본체 ─────────────────────────────────────────────────────────────────── */

/**
 * 시나리오 payload(`{ portfolio, investmentSettings }`) → PDF 리포트 수치 모델.
 * 계산 불가 payload는 **null** (절대 던지지 않는다) — UI는 null이면 텍스트 블록을 그리지 않는다.
 *
 * null이 되는 경우: `runScenarioPayload`가 null(구조/티커/설정 검증 실패), 또는 핵심 합계가
 * 비유한(NaN/Infinity — 손상된 가중치 등 극단 입력)일 때. 절반만 맞는 리포트를 내지 않는다.
 */
export const buildSnowballReport = (payload: unknown): SnowballReport | null => {
  const run = runScenarioPayload(payload);
  if (!run) return null;

  const { profiles, values, outputs, yearly } = run;
  const firstYear = yearly[0];
  const finalYear = yearly[yearly.length - 1];
  if (!firstYear || !finalYear) return null;

  const finalAssetValue = finalYear.assetValue;
  const totalContribution = finalYear.totalContribution;
  const cumulativeNetDividend = finalYear.cumulativeDividend;

  // 핵심 합계가 하나라도 비유한이면 리포트 전체를 포기한다 (buildScenarioSimSummary의 최종 스키마 관문과 같은 역할).
  if (![finalAssetValue, totalContribution, cumulativeNetDividend, finalYear.annualDividend].every(Number.isFinite)) {
    return null;
  }

  // 취득원가는 종목별 합. 양도세는 **합이 아니라** 합산 원가로 한 번만 계산한다
  // (기본공제 250만원은 인별 1회 — aggregatePortfolioSimulation과 같은 규칙).
  const totalCostBasis = sumBy(outputs, (output) => output.summary.totalCostBasis);
  const capitalGains = computeCapitalGains({ finalAssetValue, totalCostBasis });

  // 금융소득종합과세도 인별 합산이라 전 종목의 월별 스냅샷을 한 묶음으로 판정한다.
  // 판정 함수가 `ceil(monthIndex / 12)`로 묶으므로 종목별 배열을 이어 붙여도 연차별 합계는 동일하다.
  const thresholdYear = findFinancialIncomeThresholdYear(outputs.flatMap((output) => output.monthly));

  const hasTarget = values.targetMonthlyDividend > 0;
  const reachedYearLabel = hasTarget ? findTargetYear(yearly, values.targetMonthlyDividend) : undefined;

  const firstYearYoc = ratioOrNull(firstYear.annualDividend, firstYear.totalContribution);
  const finalYearYoc = ratioOrNull(finalYear.annualDividend, totalContribution);

  return {
    version: SNOWBALL_REPORT_VERSION,
    inputs: {
      initialInvestment: values.initialInvestment,
      monthlyContribution: values.monthlyContribution,
      durationYears: values.durationYears,
      investmentStartDate: values.investmentStartDate,
      taxRatePercent: values.taxRate ?? 0,
      reinvestDividends: values.reinvestDividends,
      reinvestDividendPercent: values.reinvestDividendPercent,
      reinvestTiming: values.reinvestTiming,
      dpsGrowthMode: values.dpsGrowthMode,
      targetMonthlyDividend: values.targetMonthlyDividend
    },
    portfolio: {
      tickerCount: profiles.length,
      holdings: buildHoldings(run),
      weightedAverageDividendYieldPercent: weightedAverage(run, (profile) => profile.dividendYield),
      weightedAverageDividendGrowthPercent: weightedAverage(run, (profile) => profile.dividendGrowth),
      weightedAverageExpectedTotalReturnPercent: weightedAverage(run, (profile) => profile.dividendYield + profile.dividendGrowth),
      frequencyMix: buildFrequencyMix(run)
    },
    outcome: {
      finalAssetValue,
      totalContribution,
      cumulativeNetDividend,
      finalAnnualDividend: finalYear.annualDividend,
      finalMonthlyAverageDividend: finalYear.monthlyDividend,
      dividendToContributionRatio: ratioOrNull(cumulativeNetDividend, totalContribution),
      assetToContributionRatio: ratioOrNull(finalAssetValue, totalContribution)
    },
    composition: {
      contribution: totalContribution,
      reinvestedDividend: totalCostBasis - totalContribution,
      marketGain: capitalGains.unrealizedGain
    },
    yieldOnCost: {
      firstYearPercent: firstYearYoc === null ? null : firstYearYoc * 100,
      finalYearPercent: finalYearYoc === null ? null : finalYearYoc * 100,
      deltaPercentagePoints:
        firstYearYoc === null || finalYearYoc === null ? null : (finalYearYoc - firstYearYoc) * 100
    },
    target: {
      targetMonthlyDividend: values.targetMonthlyDividend,
      hasTarget,
      reachedInYears: reachedYearLabel === undefined ? null : reachedYearLabel - firstYear.year + 1,
      reachedYearLabel: reachedYearLabel ?? null,
      finalProgressRatio: hasTarget ? ratioOrNull(finalYear.monthlyDividend, values.targetMonthlyDividend) : null
    },
    taxes: {
      cumulativeDividendTax: sumBy(outputs, (output) => output.summary.totalTaxPaid),
      totalCostBasis,
      unrealizedGain: capitalGains.unrealizedGain,
      estimatedCapitalGainsTax: capitalGains.estimatedCapitalGainsTax,
      afterCapitalGainsTaxValue: capitalGains.afterCapitalGainsTaxValue,
      financialIncomeThresholdYear: thresholdYear ?? null
    },
    finalYearCalendar: buildFinalYearCalendar(outputs),
    yearly
  };
};
