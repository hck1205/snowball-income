import { z } from 'zod';
import type {
  Frequency,
  MonthlySnapshot,
  SimulationInput,
  SimulationOutput,
  SimulationResult,
  YieldFormValues
} from '@/shared/types';
import type { YieldValidation } from '@/shared/types/snowball';

const frequencySchema = z.enum(['monthly', 'quarterly', 'semiannual', 'annual']);
const reinvestTimingSchema = z.enum(['sameMonth', 'nextMonth']);
const dpsGrowthModeSchema = z.enum(['annualStep', 'monthlySmooth']);
const dateInputSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '투자 시작 날짜를 선택하세요.');

const formSchema = z.object({
  ticker: z.string().trim().min(1, '티커를 입력하세요.'),
  initialPrice: z.number().positive('현재 주가는 0보다 커야 합니다.'),
  dividendYield: z.number().min(0, '배당률은 0 이상이어야 합니다.').max(100, '배당률은 100 이하여야 합니다.'),
  dividendGrowth: z.number().min(0, '배당 성장률은 0 이상이어야 합니다.').max(100, '배당 성장률은 100 이하여야 합니다.'),
  expectedTotalReturn: z.number().min(-100, '기대 총수익율 (CAGR)은 -100 이상이어야 합니다.').max(100, '기대 총수익율 (CAGR)은 100 이하여야 합니다.'),
  frequency: frequencySchema,
  initialInvestment: z.number().min(0, '초기 투자금은 0 이상이어야 합니다.'),
  monthlyContribution: z.number().min(0, '월 투자금은 0 이상이어야 합니다.'),
  targetMonthlyDividend: z.number().min(0, '목표 월배당은 0 이상이어야 합니다.'),
  investmentStartDate: dateInputSchema,
  durationYears: z.number().int('투자 기간은 정수여야 합니다.').min(1, '투자 기간은 1년 이상이어야 합니다.').max(60, '투자 기간은 60년 이하여야 합니다.'),
  reinvestDividends: z.boolean(),
  reinvestDividendPercent: z.number().min(0, '재투자 비율은 0 이상이어야 합니다.').max(100, '재투자 비율은 100 이하여야 합니다.'),
  taxRate: z.number().min(0, '세율은 0 이상이어야 합니다.').max(100, '세율은 100 이하여야 합니다.').optional(),
  reinvestTiming: reinvestTimingSchema,
  dpsGrowthMode: dpsGrowthModeSchema
});

const paymentsPerYearMap: Record<Frequency, number> = {
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1
};

export const defaultYieldFormValues: YieldFormValues = {
  ticker: 'SCHD',
  initialPrice: 100000,
  dividendYield: 3.5,
  dividendGrowth: 6,
  expectedTotalReturn: 8.5,
  frequency: 'quarterly',
  initialInvestment: 0,
  monthlyContribution: 1000000,
  targetMonthlyDividend: 2000000,
  investmentStartDate: new Date().toISOString().slice(0, 10),
  durationYears: 20,
  reinvestDividends: false,
  reinvestDividendPercent: 100,
  taxRate: 15.4,
  reinvestTiming: 'sameMonth',
  dpsGrowthMode: 'monthlySmooth'
};

export const validateFormValues = (values: YieldFormValues): YieldValidation => {
  const parsed = formSchema.safeParse(values);

  if (parsed.success) {
    return { isValid: true, errors: [] };
  }

  return {
    isValid: false,
    errors: parsed.error.issues.map((issue) => issue.message)
  };
};

const isPayoutMonth = (frequency: Frequency, month: number): boolean => {
  if (frequency === 'monthly') return true;
  if (frequency === 'quarterly') return month % 3 === 0;
  if (frequency === 'semiannual') return month === 6 || month === 12;
  return month === 12;
};

export const findTargetYear = (rows: SimulationResult[], monthlyTarget: number): number | undefined => {
  return rows.find((row) => row.monthlyDividend >= monthlyTarget)?.year;
};

export const toSimulationInput = (values: YieldFormValues): SimulationInput => ({
  ticker: {
    ticker: values.ticker,
    initialPrice: values.initialPrice,
    dividendYield: values.dividendYield,
    dividendGrowth: values.dividendGrowth,
    expectedTotalReturn: values.expectedTotalReturn,
    frequency: values.frequency
  },
  settings: {
    initialInvestment: values.initialInvestment,
    monthlyContribution: values.monthlyContribution,
    targetMonthlyDividend: values.targetMonthlyDividend,
    investmentStartDate: values.investmentStartDate,
    durationYears: values.durationYears,
    reinvestDividends: values.reinvestDividends,
    reinvestDividendPercent: values.reinvestDividendPercent,
    taxRate: values.taxRate,
    reinvestTiming: values.reinvestTiming,
    dpsGrowthMode: values.dpsGrowthMode
  }
});

const toMonthlyGrowthRate = (annualRate: number): number => Math.pow(1 + annualRate, 1 / 12) - 1;
const toStartDate = (value: string): Date => {
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const day = Number(dayText);
  const date = new Date(year, monthIndex, day);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(monthIndex) ||
    !Number.isFinite(day) ||
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return new Date();
  }

  return date;
};
const addMonths = (baseDate: Date, monthsToAdd: number): Date => {
  const nextDate = new Date(baseDate);
  nextDate.setMonth(baseDate.getMonth() + monthsToAdd);
  return nextDate;
};

const toDerivedPriceGrowth = (input: SimulationInput): number => {
  const expectedTotalReturn = input.ticker.expectedTotalReturn / 100;
  const dividendYield = input.ticker.dividendYield / 100;
  return Math.max(-0.99, expectedTotalReturn - dividendYield);
};

const runQuickEstimate = (input: SimulationInput) => {
  const taxRate = (input.settings.taxRate ?? 0) / 100;
  const dividendYield = input.ticker.dividendYield / 100;
  const expectedTotalReturn = input.ticker.expectedTotalReturn / 100;
  const priceGrowth = toDerivedPriceGrowth(input);
  const annualReturn = Math.max(-0.99, expectedTotalReturn - (dividendYield * taxRate));
  const monthlyReturn = toMonthlyGrowthRate(annualReturn);
  const totalMonths = input.settings.durationYears * 12;

  const monthlyContributionGrowth = Math.abs(monthlyReturn) < 1e-12
    ? input.settings.monthlyContribution * totalMonths
    : input.settings.monthlyContribution * ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn);
  const initialInvestmentGrowth = input.settings.initialInvestment * Math.pow(1 + monthlyReturn, totalMonths);
  const endValue = monthlyContributionGrowth + initialInvestmentGrowth;

  const dividendGrowth = input.ticker.dividendGrowth / 100;

  const relativeYieldGrowth = (1 + priceGrowth) <= 0 ? 1 : (1 + dividendGrowth) / (1 + priceGrowth);
  const yieldOnPriceAtEnd = Math.max(0, dividendYield * Math.pow(relativeYieldGrowth, input.settings.durationYears));
  const annualDividendApprox = endValue * yieldOnPriceAtEnd * (1 - taxRate);

  return {
    endValue,
    annualDividendApprox,
    monthlyDividendApprox: annualDividendApprox / 12,
    yieldOnPriceAtEnd
  };
};

export const runSimulation = (input: SimulationInput): SimulationOutput => {
  const taxRate = (input.settings.taxRate ?? 0) / 100;
  const dividendYield = input.ticker.dividendYield / 100;
  const dividendGrowth = input.ticker.dividendGrowth / 100;
  const priceGrowth = toDerivedPriceGrowth(input);

  const totalMonths = input.settings.durationYears * 12;
  const paymentsPerYear = paymentsPerYearMap[input.ticker.frequency];
  const startDate = toStartDate(input.settings.investmentStartDate);
  const reinvestRatio = Math.max(0, Math.min(1, input.settings.reinvestDividendPercent / 100));

  const dps0 = input.ticker.initialPrice * dividendYield;

  let shares = input.settings.initialInvestment / input.ticker.initialPrice;
  let cumulativeDividend = 0;
  let totalTaxPaid = 0;
  let pendingReinvestCash = 0;

  const monthly: MonthlySnapshot[] = [];
  const yearly: SimulationResult[] = [];

  for (let m = 1; m <= totalMonths; m += 1) {
    const elapsedMonths = m - 1;
    const elapsedYears = Math.floor(elapsedMonths / 12);
    const simulationMonth = (elapsedMonths % 12) + 1;
    const simulationYearLabel = startDate.getFullYear() + elapsedYears;
    const calendarDate = addMonths(startDate, elapsedMonths);
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth() + 1;
    const y = elapsedYears;

    const price = input.ticker.initialPrice * Math.pow(1 + priceGrowth, y + (month - 1) / 12);
    const growthExponent = input.settings.dpsGrowthMode === 'monthlySmooth'
      ? y + (month - 1) / 12
      : y;
    const dps = dps0 * Math.pow(1 + dividendGrowth, growthExponent);

    if (pendingReinvestCash > 0) {
      shares += pendingReinvestCash / price;
      pendingReinvestCash = 0;
    }

    let dividendPaid = 0;
    let taxPaid = 0;

    if (isPayoutMonth(input.ticker.frequency, simulationMonth)) {
      const grossDividend = shares * (dps / paymentsPerYear);
      taxPaid = grossDividend * taxRate;
      dividendPaid = grossDividend - taxPaid;

      if (input.settings.reinvestDividends) {
        const reinvestAmount = dividendPaid * reinvestRatio;
        if (input.settings.reinvestTiming === 'sameMonth') {
          shares += reinvestAmount / price;
        } else {
          pendingReinvestCash += reinvestAmount;
        }
      }

      cumulativeDividend += dividendPaid;
      totalTaxPaid += taxPaid;
    }

    shares += input.settings.monthlyContribution / price;

    const portfolioValue = shares * price;

    monthly.push({
      monthIndex: m,
      year,
      month,
      shares,
      price,
      dividendPerShare: dps,
      dividendPaid,
      contributionPaid: input.settings.monthlyContribution,
      taxPaid,
      portfolioValue,
      cumulativeDividend
    });

    if (simulationMonth === 12) {
      const last12 = monthly.slice(-12);
      const annualDividend = last12.reduce((sum, row) => sum + row.dividendPaid, 0);

      yearly.push({
        year: simulationYearLabel,
        totalContribution: input.settings.initialInvestment + (input.settings.monthlyContribution * m),
        assetValue: portfolioValue,
        annualDividend,
        cumulativeDividend,
        monthlyDividend: annualDividend / 12
      });
    }
  }

  const finalYear = yearly[yearly.length - 1];
  const lastPayoutRow = [...monthly].reverse().find((row) => row.dividendPaid > 0);
  const quickEstimate = runQuickEstimate(input);

  return {
    monthly,
    yearly,
    summary: {
      finalAssetValue: finalYear?.assetValue ?? 0,
      finalAnnualDividend: finalYear?.annualDividend ?? 0,
      finalMonthlyDividend: finalYear?.monthlyDividend ?? 0,
      finalMonthlyAverageDividend: finalYear?.monthlyDividend ?? 0,
      finalPayoutMonthDividend: lastPayoutRow?.dividendPaid ?? 0,
      totalContribution: finalYear?.totalContribution ?? 0,
      totalNetDividend: finalYear?.cumulativeDividend ?? 0,
      totalTaxPaid,
      targetMonthDividendReachedYear: findTargetYear(yearly, input.settings.targetMonthlyDividend)
    },
    quickEstimate
  };
};
