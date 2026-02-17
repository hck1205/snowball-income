import type {
  Frequency,
  SimulationOutput,
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

export type TickerProfile = {
  id: string;
  ticker: string;
  name: string;
  initialPrice: number;
  dividendYield: number;
  dividendGrowth: number;
  expectedTotalReturn: number;
  frequency: Frequency;
};

export type TickerDraft = Omit<TickerProfile, 'id'>;

export type TickerModalMode = 'create' | 'edit';

export type PortfolioPersistedState = {
  tickerProfiles: TickerProfile[];
  includedTickerIds: string[];
  weightByTickerId: Record<string, number>;
  fixedByTickerId: Record<string, boolean>;
  selectedTickerId: string | null;
};

export type ScenarioTabState = {
  id: string;
  name: string;
  portfolio: PortfolioPersistedState;
};
