import type { PortfolioPersistedState } from '@/shared/types/snowball';
import type { YieldFormValues } from '@/shared/types';

export type PersistedInvestmentSettings = {
  monthlyContribution: number;
  targetMonthlyDividend: number;
  durationYears: number;
  reinvestDividends: boolean;
  taxRate?: number;
  reinvestTiming: YieldFormValues['reinvestTiming'];
  dpsGrowthMode: YieldFormValues['dpsGrowthMode'];
  showQuickEstimate: boolean;
  showSplitGraphs: boolean;
};

export type PersistedAppStatePayload = {
  portfolio: PortfolioPersistedState;
  investmentSettings: PersistedInvestmentSettings;
  savedName?: string;
};
