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
  initialPrice: number;
  dividendYield: number;
  dividendGrowth: number;
  priceGrowth: number;
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
