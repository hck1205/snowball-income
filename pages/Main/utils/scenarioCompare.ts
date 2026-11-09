import type { PersistedScenarioState } from '@/jotai';
import { validateFormValues } from '@/shared/lib/snowball';
import { formatOgHoldingsLine, toOgCardHoldings, toYieldFormValues } from './ogCard';
import { buildNormalizedAllocation, getIncludedProfiles } from './portfolio';
import { buildSimulationBundle, solveRequiredMonthlyContributionForPortfolio } from './simulation';

/**
 * **시나리오 탭 비교**의 계산 계층(순수, 2026-11-09).
 *
 * ## 왜
 * 실사용자가 탭을 14분 동안 83번 오가며 조건을 비교했다(GA 11/8). 탭은 한 번에 하나만 보이니 비교는
 * 사람의 기억에 기대고 있었다. 탭마다 조건·결과·연도별 추이를 한 화면에 나란히 놓는다.
 *
 * ## 🔴 화면과 같은 숫자
 * 탭 하나의 결과는 메인 화면(`useMainComputed`)과 **같은 함수**(`buildSimulationBundle`)로, **같은 입력**
 * (포함 종목·정규화 비중·투자 설정·종목별 재투자 비율/목적지)으로 만든다. 공유 카드(`buildOgCardModel`)는
 * 종목별 재투자를 넣지 않지만, 여기는 넣는다 — 비교표의 지금 탭 숫자가 화면과 다르면 표 전체를 믿을 수 없다.
 * "목표까지 필요한 월 적립"도 화면의 목표 타일과 같은 역산(`solveRequiredMonthlyContributionForPortfolio`)이다.
 * 수익률은 리포트(`SnowballReport` 의 assetToContributionRatio)와 같은 정의 — 최종 자산 ÷ 총 납입 − 1.
 *
 * ⚠ 계산이 성립하지 않는 탭(포함 종목 0·입력 오류)은 `result: null` 이다. 0 으로 채우지 않는다.
 */

/** 연도별 추이 한 점. `yearIndex` 는 1부터(탭마다 시작일이 달라 달력 연도로는 겹쳐 그릴 수 없다). */
export type ScenarioComparePoint = {
  readonly yearIndex: number;
  readonly assetValue: number;
  readonly monthlyDividend: number;
};

export type ScenarioCompareResult = {
  readonly finalAssetValue: number;
  /** 마지막 해 월평균 배당(세후) — 결과 이미지·리포트·공유 카드와 같은 정의. */
  readonly finalMonthlyDividend: number;
  /** 마지막으로 실제 지급된 배당(세후). 분기 배당 종목이면 한 분기치라 월평균보다 크게 보일 수 있다. */
  readonly finalPayoutDividend: number;
  readonly totalNetDividend: number;
  readonly totalTaxPaid: number;
  /** 초기 투자금 + 적립금 합계. */
  readonly totalContribution: number;
  /** 최종 자산 − 총 납입. */
  readonly gain: number;
  /** 최종 자산 ÷ 총 납입 − 1. 납입이 0 이면 null. */
  readonly gainRate: number | null;
  /** 목표 월배당 도달 연차. 목표가 없거나 못 닿으면 `null`. */
  readonly targetReachedYear: number | null;
  /** 목표에 **못 닿을 때만** — 닿으려면 필요한 월 적립금. 목표 없음·이미 도달·역산 불가면 `null`. */
  readonly requiredMonthlyContribution: number | null;
  readonly yearly: readonly ScenarioComparePoint[];
};

export type ScenarioCompareColumn = {
  readonly id: string;
  readonly name: string;
  readonly isActive: boolean;
  /** "SCHD 50% · JEPI 30% 외 2개". 종목이 없으면 빈 문자열. */
  readonly holdingsLine: string;
  readonly tickerCount: number;
  readonly initialInvestment: number;
  readonly monthlyContribution: number;
  readonly durationYears: number;
  readonly targetMonthlyDividend: number;
  readonly investmentStartDate: string;
  /** 배당 재투자 비율(%). 재투자를 끄면 0. */
  readonly reinvestPercent: number;
  /** 입력한 배당소득세율(%). 비워 두면 `null` — 엔진이 종목 상장지로 정한다(미국 15 / 국내 15.4). */
  readonly taxRatePercent: number | null;
  readonly result: ScenarioCompareResult | null;
};

export const buildScenarioCompareColumn = (
  scenario: PersistedScenarioState,
  isActive: boolean
): ScenarioCompareColumn => {
  const { portfolio, investmentSettings } = scenario;
  const values = toYieldFormValues(investmentSettings);
  const includedProfiles = getIncludedProfiles(portfolio.tickerProfiles, portfolio.includedTickerIds);
  const normalizedAllocation = buildNormalizedAllocation(includedProfiles, portfolio.weightByTickerId);
  const { holdings, hiddenHoldingCount } = toOgCardHoldings(normalizedAllocation);

  const base = {
    id: scenario.id,
    name: scenario.name,
    isActive,
    holdingsLine: includedProfiles.length > 0 ? formatOgHoldingsLine(holdings, hiddenHoldingCount) : '',
    tickerCount: includedProfiles.length,
    initialInvestment: values.initialInvestment,
    monthlyContribution: values.monthlyContribution,
    durationYears: values.durationYears,
    targetMonthlyDividend: values.targetMonthlyDividend,
    investmentStartDate: values.investmentStartDate,
    reinvestPercent: values.reinvestDividends ? values.reinvestDividendPercent : 0,
    taxRatePercent: typeof values.taxRate === 'number' ? values.taxRate : null
  };

  if (includedProfiles.length === 0 || !validateFormValues(values).isValid) return { ...base, result: null };

  const input = {
    isValid: true,
    includedProfiles,
    normalizedAllocation,
    values,
    reinvestPercentByTickerId: portfolio.reinvestPercentByTickerId,
    reinvestTargetByTickerId: portfolio.reinvestTargetByTickerId
  };
  const { simulation } = buildSimulationBundle(input);
  if (!simulation) return { ...base, result: null };

  const { summary } = simulation;
  const hasTarget = values.targetMonthlyDividend > 0;
  const targetReachedYear = hasTarget ? (summary.targetMonthDividendReachedYear ?? null) : null;

  return {
    ...base,
    result: {
      finalAssetValue: summary.finalAssetValue,
      finalMonthlyDividend: summary.finalMonthlyAverageDividend,
      finalPayoutDividend: summary.finalPayoutMonthDividend,
      totalNetDividend: summary.totalNetDividend,
      totalTaxPaid: summary.totalTaxPaid,
      totalContribution: summary.totalContribution,
      gain: summary.finalAssetValue - summary.totalContribution,
      gainRate: summary.totalContribution > 0 ? summary.finalAssetValue / summary.totalContribution - 1 : null,
      targetReachedYear,
      // 화면의 목표 타일과 같은 규칙: 못 미칠 때만 역산한다.
      requiredMonthlyContribution:
        hasTarget && targetReachedYear === null ? solveRequiredMonthlyContributionForPortfolio(input) : null,
      yearly: simulation.yearly.map((row, index) => ({
        yearIndex: index + 1,
        assetValue: row.assetValue,
        monthlyDividend: row.monthlyDividend
      }))
    }
  };
};

export const buildScenarioComparison = (
  scenarios: readonly PersistedScenarioState[],
  activeScenarioId: string | null
): ScenarioCompareColumn[] => scenarios.map((scenario) => buildScenarioCompareColumn(scenario, scenario.id === activeScenarioId));

/** 비교 가능한 결과 지표와 "좋은 방향". */
export const SCENARIO_COMPARE_DIRECTION = {
  finalAssetValue: 'higher',
  finalMonthlyDividend: 'higher',
  finalPayoutDividend: 'higher',
  totalNetDividend: 'higher',
  totalTaxPaid: 'lower',
  totalContribution: 'neutral',
  gain: 'higher',
  gainRate: 'higher',
  targetReachedYear: 'lower',
  requiredMonthlyContribution: 'lower'
} as const satisfies Record<string, 'higher' | 'lower' | 'neutral'>;

export type ScenarioCompareMetric = keyof typeof SCENARIO_COMPARE_DIRECTION;

/**
 * 한 지표에서 **가장 좋은 값**을 가진 탭 id 들(동점이면 여럿). 결과가 둘 이상 있어야 의미가 있다 —
 * 하나뿐이면 빈 집합(혼자 1등은 비교가 아니다). 방향이 `neutral`(총 납입)이면 언제나 빈 집합이다.
 *
 * ⚠ "좋다"는 숫자의 방향일 뿐 권유가 아니다 — 최종 자산이 크면 대개 넣은 돈도 크다. 그래서 화면은 넣은 돈을
 *   같은 표에 함께 보여 준다.
 */
export const findBestColumnIds = (
  columns: readonly ScenarioCompareColumn[],
  metric: ScenarioCompareMetric
): Set<string> => {
  const direction = SCENARIO_COMPARE_DIRECTION[metric];
  if (direction === 'neutral') return new Set();

  const scored = columns
    .map((column) => ({ id: column.id, value: column.result?.[metric] ?? null }))
    .filter((item): item is { id: string; value: number } => typeof item.value === 'number' && Number.isFinite(item.value));
  if (scored.length < 2) return new Set();

  const lowerIsBetter = direction === 'lower';
  const best = scored.reduce((acc, item) => (lowerIsBetter ? Math.min(acc, item.value) : Math.max(acc, item.value)), scored[0]!.value);
  /* 비율은 0.01%p, 금액은 원 단위로 동점을 본다(화면이 그보다 잘게 보여 주지 않는다). */
  const key = (value: number) => (metric === 'gainRate' ? Math.round(value * 10_000) : Math.round(value));
  return new Set(scored.filter((item) => key(item.value) === key(best)).map((item) => item.id));
};
