import { atom } from 'jotai';
import { runSimulation, toSimulationInput, validateFormValues } from '../feature.utils';
import { yieldFormAtom } from './atoms';

export const validationAtom = atom((get) => validateFormValues(get(yieldFormAtom)));

export const simulationAtom = atom((get) => {
  const validation = get(validationAtom);

  if (!validation.isValid) {
    return null;
  }

  return runSimulation(toSimulationInput(get(yieldFormAtom)));
});
