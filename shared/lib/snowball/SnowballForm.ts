import { z } from 'zod';
import type { SimulationInput, YieldFormValues } from '@/shared/types';
import type { YieldValidation } from '@/shared/types/snowball';
import { toExpectedTotalReturnPercent } from './SnowballRates';

const frequencySchema = z.enum(['monthly', 'quarterly', 'semiannual', 'annual']);
const reinvestTimingSchema = z.enum(['sameMonth', 'nextMonth']);
const dpsGrowthModeSchema = z.enum(['annualStep', 'monthlySmooth']);
const dateInputSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '투자 시작 날짜를 선택하세요.');

const formSchema = z.object({
  ticker: z.string().trim().min(1, '티커를 입력하세요.'),
  initialPrice: z.number().positive('현재 주가는 0보다 커야 합니다.'),
  dividendYield: z.number().min(0, '배당률은 0 이상이어야 합니다.').max(100, '배당률은 100 이하여야 합니다.'),
  // 음수 허용: 커버드콜 ETF의 NAV 침식/분배금 감소를 정직하게 표현하는 유일한 방법이다.
  // (정합 모델에서 dividendGrowth 는 주가 성장률이기도 하다.)
  dividendGrowth: z.number().min(-100, '배당 성장률은 -100 이상이어야 합니다.').max(100, '배당 성장률은 100 이하여야 합니다.'),
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
  // 정합 모델 전환: 기존 기본값(dy 3.5 / dg 6 / etr 8.5)은 dy + dg !== etr 로 자기모순이었다.
  // 마이그레이션 규칙(dy·etr 보존, dg 재계산)을 그대로 적용해 dg = 8.5 - 3.5 = 5 로 맞춘다.
  dividendGrowth: 5,
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
    // 파생 표시값이므로 폼에 남아 있는 값을 믿지 않고 항상 다시 계산한다 (엔진은 쓰지 않는다).
    expectedTotalReturn: toExpectedTotalReturnPercent(values.dividendYield, values.dividendGrowth),
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
