import { useAtom } from 'jotai';
import { useAtomValue } from 'jotai';
import type { YieldFormValues } from '@/shared/types';
import { simulationAtom, validationAtom, yieldFormAtom } from '@/features/YieldArchitect/state';

export const useYieldArchitect = () => {
  const [values, setValues] = useAtom(yieldFormAtom);
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
