import { z } from 'zod';
import type { SimulationInput, YieldFormValues } from '@/shared/types';
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

/**
 * 알려진 이슈(의도적으로 유지): `investmentStartDate` 가 **모듈 로드 시각**을 캡처한다.
 * 자정을 넘겨 열려 있는 탭이나, 테스트에서 시스템 시간을 조작하는 경우 값이 어긋날 수 있다.
 * 수정은 별도 승인 후 진행한다.
 */
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
