import type { YieldFormValues } from '@/shared/types';
import { simulationAtom, useAtomValue, useSetYieldFormWrite, useYieldFormAtomValue, validationAtom } from '@/jotai';

export const useSnowballForm = () => {
  const values = useYieldFormAtomValue();
  const setValues = useSetYieldFormWrite();
  const validation = useAtomValue(validationAtom);
  const simulation = useAtomValue(simulationAtom);

  const setField = <K extends keyof YieldFormValues>(field: K, value: YieldFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  return {
    values,
    setField,
    validation,
    simulation
  };
};
