import type { PortfolioPersistedState } from '@/shared/types/snowball';
import type { YearlySeriesKey } from '@/shared/constants';
import type { YieldFormValues } from '@/shared/types';

export type PersistedInvestmentSettings = {
  initialInvestment: number;
  monthlyContribution: number;
  targetMonthlyDividend: number;
  investmentStartDate: string;
  durationYears: number;
  reinvestDividends: boolean;
  taxRate?: number;
  reinvestTiming: YieldFormValues['reinvestTiming'];
  dpsGrowthMode: YieldFormValues['dpsGrowthMode'];
  showQuickEstimate: boolean;
  showSplitGraphs: boolean;
  isResultCompact: boolean;
  isYearlyAreaFillOn: boolean;
  showPortfolioDividendCenter: boolean;
  visibleYearlySeries: Record<YearlySeriesKey, boolean>;
};

export type PersistedAppStatePayload = {
  portfolio: PortfolioPersistedState;
  investmentSettings: PersistedInvestmentSettings;
  savedName?: string;
};
