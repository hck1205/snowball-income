import { useCallback, useMemo } from 'react';
import type { SimulationResult as SimulationResultRow } from '@/shared/types';

type UseResultChartAdaptersInput = {
  targetMonthlyDividend: number;
  targetReachedYear: number | undefined;
  /** 축과 같은 포맷터를 받는다 — 원화 고정이면 달러 표시 모드에서 목표선만 단위가 어긋난다. */
  formatChartCompact: (value: number) => string;
};

/**
 * 연도별 시계열 차트 3종(월평균·자산·누적)이 공유하는 게터 + "월 평균 배당" 차트의 목표선/도달 마커.
 *
 * 게터는 인자만으로 결정되는 순수 함수라 `useCallback([])`으로 참조를 고정한다 — `ChartPanel`이
 * `memo`라 여기서 참조가 흔들리면 그 메모가 매번 깨진다. `target≤0`(미설정)이면 참조선·마커 둘 다
 * `undefined`를 돌려줘 `charts.ts`가 markLine/markPoint/y축 max 가드를 전부 생략한다.
 */
export function useResultChartAdapters({
  targetMonthlyDividend,
  targetReachedYear,
  formatChartCompact
}: UseResultChartAdaptersInput) {
  const getYear = useCallback((row: SimulationResultRow) => `${row.year}`, []);
  const getMonthlyDividend = useCallback((row: SimulationResultRow) => row.monthlyDividend, []);
  const getAssetValue = useCallback((row: SimulationResultRow) => row.assetValue, []);
  const getCumulativeDividend = useCallback((row: SimulationResultRow) => row.cumulativeDividend, []);

  const hasTarget = targetMonthlyDividend > 0;

  const monthlyDividendReferenceLine = useMemo(
    () =>
      hasTarget
        ? {
            value: targetMonthlyDividend,
            label: `목표 ${formatChartCompact(targetMonthlyDividend)}`,
            reached: targetReachedYear !== undefined
          }
        : undefined,
    [formatChartCompact, hasTarget, targetMonthlyDividend, targetReachedYear]
  );

  const monthlyDividendReachMarker = useMemo(
    () =>
      hasTarget && targetReachedYear !== undefined
        ? {
            xCategory: String(targetReachedYear),
            value: targetMonthlyDividend,
            label: `${targetReachedYear}년 도달`
          }
        : undefined,
    [hasTarget, targetMonthlyDividend, targetReachedYear]
  );

  return {
    getYear,
    getMonthlyDividend,
    getAssetValue,
    getCumulativeDividend,
    hasTarget,
    monthlyDividendReferenceLine,
    monthlyDividendReachMarker
  };
}
