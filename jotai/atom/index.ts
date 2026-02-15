import { useAtomValue as useJotaiAtomValue, useSetAtom } from 'jotai/react';
import type { Atom, WritableAtom } from 'jotai/vanilla';
import { atomWithReset, useResetAtom } from 'jotai/utils';

export const atomState = <T>(initialValue: T) => atomWithReset<T>(initialValue);

export const useAtomValue = <T>(targetAtom: Atom<T>) => useJotaiAtomValue(targetAtom);

export const useAtomWrite = <Value, Args extends unknown[], Result>(targetAtom: WritableAtom<Value, Args, Result>) =>
  useSetAtom(targetAtom);

export const useAtomReset = (targetAtom: Parameters<typeof useResetAtom>[0]) => useResetAtom(targetAtom);
