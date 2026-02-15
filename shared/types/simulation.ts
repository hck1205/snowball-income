export type Frequency = 'monthly' | 'quarterly' | 'semiannual' | 'annual';
export type ReinvestTiming = 'sameMonth' | 'nextMonth';
export type DpsGrowthMode = 'annualStep' | 'monthlySmooth';

export type TickerInput = {
  ticker: string;
  initialPrice: number;
  dividendYield: number;
  dividendGrowth: number;
  priceGrowth: number;
  frequency: Frequency;
};

export type InvestmentSettings = {
  monthlyContribution: number;
  durationYears: number;
  reinvestDividends: boolean;
  taxRate?: number;
  reinvestTiming: ReinvestTiming;
  dpsGrowthMode: DpsGrowthMode;
};

export type SimulationInput = {
  ticker: TickerInput;
  settings: InvestmentSettings;
};

export type SimulationResult = {
  year: number;
  totalContribution: number;
  assetValue: number;
  annualDividend: number;
  cumulativeDividend: number;
  monthlyDividend: number;
};

export type MonthlySnapshot = {
  monthIndex: number;
  year: number;
  month: number;
  shares: number;
  price: number;
  dividendPerShare: number;
  dividendPaid: number;
  contributionPaid: number;
  taxPaid: number;
  portfolioValue: number;
  cumulativeDividend: number;
};

export type SimulationSummary = {
  finalAssetValue: number;
  finalAnnualDividend: number;
  finalMonthlyDividend: number;
  finalMonthlyAverageDividend: number;
  finalPayoutMonthDividend: number;
  totalContribution: number;
  totalNetDividend: number;
  totalTaxPaid: number;
  targetMonthDividend100ReachedYear?: number;
  targetMonthDividend200ReachedYear?: number;
};

export type QuickEstimateOutput = {
  endValue: number;
  monthlyDividendApprox: number;
  annualDividendApprox: number;
  yieldOnPriceAtEnd: number;
};

export type SimulationOutput = {
  monthly: MonthlySnapshot[];
  yearly: SimulationResult[];
  summary: SimulationSummary;
  quickEstimate: QuickEstimateOutput;
};

export type YieldFormValues = TickerInput & InvestmentSettings;
