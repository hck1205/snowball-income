import type { YieldFormValues } from '@/shared/types';
import { defaultYieldFormValues } from '@/shared/lib/snowball';
import { atomState, useAtomValue, useAtomWrite } from '@/jotai/atom';

export const yieldFormAtom = atomState<YieldFormValues>(defaultYieldFormValues);

export const useYieldFormAtomValue = () => useAtomValue(yieldFormAtom);
export const useSetYieldFormWrite = () => useAtomWrite(yieldFormAtom);
