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
  taxRate: z.number().min(0, '세율은 0 이상이어야 합니다.').max(100, '세율은 100 이하여야 합니다.').optional()
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
  taxRate: 15.4
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
    taxRate: values.taxRate
  }
});

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

  const monthly: MonthlySnapshot[] = [];
  const yearly: SimulationResult[] = [];

  for (let m = 1; m <= totalMonths; m += 1) {
    const year = Math.floor((m - 1) / 12) + 1;
    const month = ((m - 1) % 12) + 1;
    const y = Math.floor((m - 1) / 12);

    const price = input.ticker.initialPrice * Math.pow(1 + priceGrowth, y + (month - 1) / 12);
    const dps = dps0 * Math.pow(1 + dividendGrowth, y);

    shares += input.settings.monthlyContribution / price;

    let dividendPaid = 0;
    let taxPaid = 0;

    if (isPayoutMonth(input.ticker.frequency, month)) {
      const grossDividend = shares * (dps / paymentsPerYear);
      taxPaid = grossDividend * taxRate;
      dividendPaid = grossDividend - taxPaid;

      if (input.settings.reinvestDividends) {
        shares += dividendPaid / price;
      }

      cumulativeDividend += dividendPaid;
    }

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

  return {
    monthly,
    yearly,
    summary: {
      finalAssetValue: finalYear?.assetValue ?? 0,
      finalAnnualDividend: finalYear?.annualDividend ?? 0,
      finalMonthlyDividend: finalYear?.monthlyDividend ?? 0,
      totalContribution: finalYear?.totalContribution ?? 0,
      totalNetDividend: finalYear?.cumulativeDividend ?? 0,
      targetMonthDividend100ReachedYear: findTargetYear(yearly, TARGET_MONTHLY_DIVIDENDS.oneMillion),
      targetMonthDividend200ReachedYear: findTargetYear(yearly, TARGET_MONTHLY_DIVIDENDS.twoMillion)
    }
  };
};
