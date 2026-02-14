import { atom } from 'jotai';
import type { YieldFormValues } from '@/shared/types';
import { defaultYieldFormValues } from '../feature.utils';

export const yieldFormAtom = atom<YieldFormValues>(defaultYieldFormValues);
