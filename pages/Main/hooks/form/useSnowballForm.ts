import { useCallback } from 'react';
import type { YieldFormValues } from '@/shared/types';
import { simulationAtom, useAtomValue, useSetYieldFormWrite, useYieldFormAtomValue, validationAtom } from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

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
      trackEvent(eventName, {
        field_name: String(field),
        value: typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' ? value : null
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
