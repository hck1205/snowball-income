import type {
  MonthlySnapshot,
  SimulationInput,
  SimulationOutput,
  SimulationResult,
  SimulationSummary,
  YieldFormValues
} from '@/shared/types';

export type YieldValidation = {
  isValid: boolean;
  errors: string[];
};

export type YieldFeatureState = {
  values: YieldFormValues;
  validation: YieldValidation;
  simulation: SimulationOutput | null;
};

export type {
  MonthlySnapshot,
  SimulationInput,
  SimulationOutput,
  SimulationResult,
  SimulationSummary,
  YieldFormValues
};
