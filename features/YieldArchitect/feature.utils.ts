import { z } from 'zod';
import { TARGET_MONTHLY_DIVIDENDS } from '@/shared/constants';
import type {
  Frequency,
  MonthlySnapshot,
  SimulationInput,
  SimulationOutput,
  SimulationResult,
  YieldFormValues
} from '@/shared/types';
import type { YieldValidation } from './feature.types';

const frequencySchema = z.enum(['monthly', 'quarterly', 'semiannual', 'annual']);
const reinvestTimingSchema = z.enum(['sameMonth', 'nextMonth']);
const dpsGrowthModeSchema = z.enum(['annualStep', 'monthlySmooth']);

const formSchema = z.object({
  ticker: z.string().trim().min(1, '티커를 입력하세요.'),
  initialPrice: z.number().positive('현재 주가는 0보다 커야 합니다.'),
  dividendYield: z.number().min(0, '배당률은 0 이상이어야 합니다.').max(100, '배당률은 100 이하여야 합니다.'),
  dividendGrowth: z.number().min(0, '배당 성장률은 0 이상이어야 합니다.').max(100, '배당 성장률은 100 이하여야 합니다.'),
  priceGrowth: z.number().min(-100, '주가 성장률은 -100 이상이어야 합니다.').max(100, '주가 성장률은 100 이하여야 합니다.'),
  frequency: frequencySchema,
  monthlyContribution: z.number().min(0, '월 투자금은 0 이상이어야 합니다.'),
  durationYears: z.number().int('투자 기간은 정수여야 합니다.').min(1, '투자 기간은 1년 이상이어야 합니다.').max(60, '투자 기간은 60년 이하여야 합니다.'),
  reinvestDividends: z.boolean(),
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
  priceGrowth: 5,
  frequency: 'quarterly',
  monthlyContribution: 1000000,
  durationYears: 20,
  reinvestDividends: true,
  taxRate: 15.4,
  reinvestTiming: 'sameMonth',
  dpsGrowthMode: 'annualStep'
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
    priceGrowth: values.priceGrowth,
    frequency: values.frequency
  },
  settings: {
    monthlyContribution: values.monthlyContribution,
    durationYears: values.durationYears,
    reinvestDividends: values.reinvestDividends,
    taxRate: values.taxRate,
    reinvestTiming: values.reinvestTiming,
    dpsGrowthMode: values.dpsGrowthMode
  }
});

const toMonthlyGrowthRate = (annualRate: number): number => Math.pow(1 + annualRate, 1 / 12) - 1;

const runQuickEstimate = (input: SimulationInput) => {
  const taxRate = (input.settings.taxRate ?? 0) / 100;
  const dividendYield = input.ticker.dividendYield / 100;
  const priceGrowth = input.ticker.priceGrowth / 100;
  const annualReturn = Math.max(-0.99, priceGrowth + (dividendYield * (1 - taxRate)));
  const monthlyReturn = toMonthlyGrowthRate(annualReturn);
  const totalMonths = input.settings.durationYears * 12;

  const endValue = Math.abs(monthlyReturn) < 1e-12
    ? input.settings.monthlyContribution * totalMonths
    : input.settings.monthlyContribution * ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn);

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
  const priceGrowth = input.ticker.priceGrowth / 100;

  const totalMonths = input.settings.durationYears * 12;
  const paymentsPerYear = paymentsPerYearMap[input.ticker.frequency];

  const dps0 = input.ticker.initialPrice * dividendYield;

  let shares = 0;
  let cumulativeDividend = 0;
  let totalTaxPaid = 0;
  let pendingReinvestCash = 0;

  const monthly: MonthlySnapshot[] = [];
  const yearly: SimulationResult[] = [];

  for (let m = 1; m <= totalMonths; m += 1) {
    const year = Math.floor((m - 1) / 12) + 1;
    const month = ((m - 1) % 12) + 1;
    const y = Math.floor((m - 1) / 12);

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

    if (isPayoutMonth(input.ticker.frequency, month)) {
      const grossDividend = shares * (dps / paymentsPerYear);
      taxPaid = grossDividend * taxRate;
      dividendPaid = grossDividend - taxPaid;

      if (input.settings.reinvestDividends) {
        if (input.settings.reinvestTiming === 'sameMonth') {
          shares += dividendPaid / price;
        } else {
          pendingReinvestCash += dividendPaid;
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

    if (month === 12) {
      const last12 = monthly.slice(-12);
      const annualDividend = last12.reduce((sum, row) => sum + row.dividendPaid, 0);

      yearly.push({
        year,
        totalContribution: input.settings.monthlyContribution * m,
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
      targetMonthDividend100ReachedYear: findTargetYear(yearly, TARGET_MONTHLY_DIVIDENDS.oneMillion),
      targetMonthDividend200ReachedYear: findTargetYear(yearly, TARGET_MONTHLY_DIVIDENDS.twoMillion)
    },
    quickEstimate
  };
};
