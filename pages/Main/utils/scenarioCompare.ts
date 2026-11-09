import type { PersistedScenarioState } from '@/jotai';
import { validateFormValues } from '@/shared/lib/snowball';
import { formatOgHoldingsLine, toOgCardHoldings, toYieldFormValues } from './ogCard';
import { buildNormalizedAllocation, getIncludedProfiles } from './portfolio';
import { buildSimulationBundle } from './simulation';

/**
 * **시나리오 탭 비교**의 계산 계층(순수, 2026-11-09).
 *
 * ## 왜
 * 실사용자가 탭을 14분 동안 83번 오가며 조건을 비교했다(GA 11/8). 탭은 한 번에 하나만 보이니 비교는
 * 사람의 기억에 기대고 있었다. 탭마다 핵심 결과를 한 표에 나란히 놓는다.
 *
 * ## 🔴 화면과 같은 숫자
 * 탭 하나의 결과는 메인 화면(`useMainComputed`)과 **같은 함수**(`buildSimulationBundle`)로, **같은 입력**
 * (포함 종목·정규화 비중·투자 설정·종목별 재투자 비율/목적지)으로 만든다. 공유 카드(`buildOgCardModel`)는
 * 종목별 재투자를 넣지 않지만, 여기는 넣는다 — 비교표의 지금 탭 숫자가 화면과 다르면 표 전체를 믿을 수 없다.
 *
 * ⚠ 계산이 성립하지 않는 탭(포함 종목 0·입력 오류)은 `result: null` 이다. 0 으로 채우지 않는다.
 */

export type ScenarioCompareResult = {
  readonly finalAssetValue: number;
  /** 마지막 해 월평균 배당(세후) — 결과 이미지·리포트·공유 카드와 같은 정의. */
  readonly finalMonthlyDividend: number;
  readonly totalNetDividend: number;
  readonly totalContribution: number;
  /** 목표 월배당 도달 연차. 목표가 없거나 못 닿으면 `null`. */
  readonly targetReachedYear: number | null;
};

export type ScenarioCompareColumn = {
  readonly id: string;
  readonly name: string;
  readonly isActive: boolean;
  /** "SCHD 50% · JEPI 30% 외 2개". 종목이 없으면 빈 문자열. */
  readonly holdingsLine: string;
  readonly initialInvestment: number;
  readonly monthlyContribution: number;
  readonly durationYears: number;
  readonly targetMonthlyDividend: number;
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
    initialInvestment: values.initialInvestment,
    monthlyContribution: values.monthlyContribution,
    durationYears: values.durationYears,
    targetMonthlyDividend: values.targetMonthlyDividend
  };

  if (includedProfiles.length === 0 || !validateFormValues(values).isValid) return { ...base, result: null };

  const { simulation } = buildSimulationBundle({
    isValid: true,
    includedProfiles,
    normalizedAllocation,
    values,
    reinvestPercentByTickerId: portfolio.reinvestPercentByTickerId,
    reinvestTargetByTickerId: portfolio.reinvestTargetByTickerId
  });
  if (!simulation) return { ...base, result: null };

  const { summary } = simulation;
  return {
    ...base,
    result: {
      finalAssetValue: summary.finalAssetValue,
      finalMonthlyDividend: summary.finalMonthlyAverageDividend,
      totalNetDividend: summary.totalNetDividend,
      totalContribution: summary.totalContribution,
      targetReachedYear: values.targetMonthlyDividend > 0 ? (summary.targetMonthDividendReachedYear ?? null) : null
    }
  };
};

export const buildScenarioComparison = (
  scenarios: readonly PersistedScenarioState[],
  activeScenarioId: string | null
): ScenarioCompareColumn[] => scenarios.map((scenario) => buildScenarioCompareColumn(scenario, scenario.id === activeScenarioId));

export type ScenarioCompareMetric = Exclude<keyof ScenarioCompareResult, 'totalContribution'>;

/**
 * 한 지표에서 **가장 좋은 값**을 가진 탭 id 들(동점이면 여럿). 결과가 둘 이상 있어야 의미가 있다 —
 * 하나뿐이면 빈 집합(혼자 1등은 비교가 아니다).
 *
 * 목표 도달 연차는 **작을수록** 좋고, 나머지는 클수록 좋다. ⚠ "좋다"는 숫자의 방향일 뿐 권유가 아니다 —
 * 최종 자산이 크면 대개 넣은 돈도 크다. 그래서 화면은 넣은 돈(초기·월 적립)을 같은 표에 함께 보여 준다.
 */
export const findBestColumnIds = (
  columns: readonly ScenarioCompareColumn[],
  metric: ScenarioCompareMetric
): Set<string> => {
  const scored = columns
    .map((column) => ({ id: column.id, value: column.result?.[metric] ?? null }))
    .filter((item): item is { id: string; value: number } => typeof item.value === 'number' && Number.isFinite(item.value));
  if (scored.length < 2) return new Set();

  const lowerIsBetter = metric === 'targetReachedYear';
  const best = scored.reduce((acc, item) => (lowerIsBetter ? Math.min(acc, item.value) : Math.max(acc, item.value)), scored[0]!.value);
  /* 금액은 부동소수라 원 단위 반올림으로 동점을 본다(화면도 원 미만을 보여 주지 않는다). */
  return new Set(scored.filter((item) => Math.round(item.value) === Math.round(best)).map((item) => item.id));
};
