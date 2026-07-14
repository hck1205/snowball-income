export type Frequency = 'monthly' | 'quarterly' | 'semiannual' | 'annual';
export type ReinvestTiming = 'sameMonth' | 'nextMonth';
export type DpsGrowthMode = 'annualStep' | 'monthlySmooth';

export type TickerInput = {
  ticker: string;
  initialPrice: number;
  dividendYield: number;
  /** 배당 성장률(%). 정합 모델에서 주가 성장률과 같은 값이다. 음수 허용(커버드콜의 NAV 침식). */
  dividendGrowth: number;
  /**
   * 기대 총수익률(%). **파생 표시값** — 엔진은 이 값을 계산에 쓰지 않는다.
   * 진실은 `dividendYield + dividendGrowth` 이며, 저장/공유 데이터 호환을 위해 필드만 남아 있다.
   */
  expectedTotalReturn: number;
  frequency: Frequency;
};

export type InvestmentSettings = {
  initialInvestment: number;
  monthlyContribution: number;
  targetMonthlyDividend: number;
  investmentStartDate: string;
  durationYears: number;
  reinvestDividends: boolean;
  reinvestDividendPercent: number;
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
  /** 마지막 해의 연 배당 / 12. */
  finalMonthlyAverageDividend: number;
  /** 마지막 실제 지급월에 지급된 금액. */
  finalPayoutMonthDividend: number;
  totalContribution: number;
  totalNetDividend: number;
  totalTaxPaid: number;
  targetMonthDividendReachedYear?: number;
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
