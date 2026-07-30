/**
 * 배당 지급 주기.
 *
 * `'none'` 은 **배당을 지급하지 않는 종목**(예: 성장주 ANET)을 뜻한다. "데이터가 아직 없다"가
 * 아니라 "지급 자체가 없다" — 주기를 물을 수 없는 상태다. 이 값을 만나는 코드는:
 *   - 계산: 지급월이 없다(`isPayoutMonth` 는 항상 false, 연 지급 횟수는 0).
 *   - 표시: "분기"·"연 1회" 같은 주기 라벨 대신 **"배당 없음"** 을 쓴다.
 *
 * 유니온에 값을 더한 이유: `Record<Frequency, …>` 로 된 지급횟수표·라벨표가 컴파일 시점에
 * 깨지므로, 주기를 소비하는 모든 코드가 무배당을 어떻게 다룰지 **한 번은 반드시 결정**하게 된다.
 * (별도 불리언 플래그였다면 아무도 읽지 않아도 컴파일이 통과한다.)
 *
 * ⚠ 하위 호환: 유니온을 **넓히기만** 했다. 이미 저장·공유된 `'quarterly'` 등 네 값은 그대로 통과한다.
 */
export type Frequency = 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'none';
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
  /** 누적 **배당소득세**. 양도세는 여기 포함되지 않는다(아래 estimatedCapitalGainsTax 참고). */
  totalTaxPaid: number;
  targetMonthDividendReachedYear?: number;

  /* --- 양도소득세 (전량 매도 가정) — 시뮬레이션 본체에는 반영되지 않는 별도 추정 --- */

  /** 취득원가 = 초기 투자금 + 누적 월 적립금 + 재매수에 실제로 쓰인 배당금. */
  totalCostBasis: number;
  /** 평가이익 = finalAssetValue - totalCostBasis. 손실이면 음수. */
  unrealizedGain: number;
  /** 마지막 해에 전량 매도한다고 가정했을 때의 예상 양도세. 보유를 계속하면 내지 않는다. */
  estimatedCapitalGainsTax: number;
  /** finalAssetValue - estimatedCapitalGainsTax. */
  afterCapitalGainsTaxValue: number;
  /** 세전 연 배당이 금융소득종합과세 기준금액을 처음 넘는 해(N년차, 1-based). 안 넘으면 undefined. */
  financialIncomeThresholdYear?: number;
};

/**
 * 달력 연·월 한 쌍 (month 는 1..12).
 * (컴포넌트 로컬 타입 `MonthlyCashflow.utils`의 `CalendarMonth`(month/total/items)와는 **다른 것**이다.)
 */
export type YearMonth = {
  year: number;
  month: number;
};

/**
 * 포트폴리오 **전체**를 달력 연·월 단위로 합산한 한 점 — `SimulationResult`(연 해상도)의 월 해상도 대응물.
 *
 * 종목별 `MonthlySnapshot` 중 **합산이 의미 있는 값만** 담는다.
 * (shares/price/dividendPerShare 는 종목마다 단위가 달라 더할 수 없으므로 제외한다.)
 */
export type PortfolioMonthlyPoint = {
  /** 투자 시작 후 N개월째 (1-based) */
  monthIndex: number;
  /** 달력 연도 */
  year: number;
  /** 달력 월 (1..12) */
  month: number;
  /** 그 달에 지급된 **세후** 배당 합계 (엔진의 dividendPaid 가 이미 세후다) */
  dividendPaid: number;
  contributionPaid: number;
  /** 그 달에 원천징수된 배당소득세 합계 */
  taxPaid: number;
  portfolioValue: number;
  /** 시작부터 그 달까지 누적된 세후 배당 */
  cumulativeDividend: number;
};

/** 월 해상도 목표 도달 시점. */
export type TargetMonthReached = YearMonth & {
  /** 투자 시작 후 N개월째 (1-based) */
  monthIndex: number;
  /** 도달 판정에 쓴 값 = 직전 12개월 세후 배당합 ÷ 12 */
  monthlyDividend: number;
};

/**
 * `currentMonthlyDividend` 의 계산 방식.
 * - `trailing12m`: 기준 시점 직전 12개월 세후 배당합 ÷ 12 (정상 경로)
 * - `firstYearAverage`: 12개월 미경과(또는 기준 시점이 투자 시작 전)라 1년차 월평균으로 폴백
 */
export type CurrentMonthlyDividendMode = 'trailing12m' | 'firstYearAverage';

/** "오늘" 기준 현재 예상 월배당 (세후). */
export type CurrentMonthlyDividend = {
  /** 세후 월배당 (원). 항상 12로 나눈 값이라 연 해상도 monthlyDividend 와 같은 정의 계열이다. */
  amount: number;
  mode: CurrentMonthlyDividendMode;
  /** `mode === 'firstYearAverage'` 와 동치 — UI 힌트 카피 분기용. */
  isFallback: boolean;
  /** 평균 창의 **마지막 달**(포함). 시계열이 비어 있으면 undefined. */
  asOf?: YearMonth;
  /** 창에 실제로 들어간 개월 수 (분모는 언제나 12다 — 연 해상도와 같은 정의). */
  monthsCovered: number;
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
