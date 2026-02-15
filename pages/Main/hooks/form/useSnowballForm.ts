import { useCallback } from 'react';
import type { YieldFormValues } from '@/shared/types';
import { simulationAtom, useAtomValue, useSetYieldFormWrite, useYieldFormAtomValue, validationAtom } from '@/jotai';

export const useSnowballForm = () => {
  const values = useYieldFormAtomValue();
  const setValues = useSetYieldFormWrite();
  const validation = useAtomValue(validationAtom);
  const simulation = useAtomValue(simulationAtom);

  const setField = useCallback(
    <K extends keyof YieldFormValues>(field: K, value: YieldFormValues[K]) => {
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
