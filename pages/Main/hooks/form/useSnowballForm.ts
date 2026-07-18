import { useCallback } from 'react';
import type { YieldFormValues } from '@/shared/types';
import { simulationAtom, useAtomValue, useSetYieldFormWrite, useYieldFormAtomValue, validationAtom } from '@/jotai';
import { ANALYTICS_EVENT, bucketValue, trackEvent } from '@/shared/lib/analytics';

/**
 * 연속값 설정의 버킷 경계(저카디널리티 `value_bucket`용, docs/analytics/ga4-plan.md §0.5).
 * 금액은 원(KRW), 기간은 년, 세율은 %. 여기 없는 필드(토글·문자열)는 버킷을 붙이지 않는다.
 * 원값(`value`)은 그대로 유지하고 버킷만 추가로 실어 분포 분석을 돕는다.
 */
const VALUE_BUCKET_EDGES: Partial<Record<keyof YieldFormValues, readonly number[]>> = {
  initialInvestment: [10_000_000, 50_000_000, 100_000_000, 300_000_000, 500_000_000],
  monthlyContribution: [300_000, 500_000, 1_000_000, 2_000_000, 5_000_000],
  targetMonthlyDividend: [500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000],
  durationYears: [5, 10, 20, 30, 40],
  taxRate: [10, 15.4, 20, 30]
};

export const useSnowballForm = () => {
  const values = useYieldFormAtomValue();
  const setValues = useSetYieldFormWrite();
  const validation = useAtomValue(validationAtom);
  const simulation = useAtomValue(simulationAtom);

  const setField = useCallback(
    <K extends keyof YieldFormValues>(field: K, value: YieldFormValues[K]) => {
      const eventName =
        field === 'reinvestDividends'
        || field === 'reinvestTiming'
        || field === 'dpsGrowthMode'
          ? ANALYTICS_EVENT.TOGGLE_CHANGED
          : ANALYTICS_EVENT.INVESTMENT_SETTING_CHANGED;
      const edges = VALUE_BUCKET_EDGES[field];
      trackEvent(eventName, {
        field_name: String(field),
        value: typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' ? value : null,
        // 연속값 설정에만 저카디널리티 버킷 라벨을 덧붙인다(원값은 유지 — 파라미터 보강).
        ...(edges && typeof value === 'number' ? { value_bucket: bucketValue(value, edges) } : null)
      });
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    [setValues]
  );

  return {
    values,
    setField,
    validation,
    simulation
  };
};
