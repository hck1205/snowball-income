import type { Frequency, ReinvestTiming } from '@/shared/types';
import { clamp01 } from './SnowballRates';

export const paymentsPerYearMap: Record<Frequency, number> = {
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1
};

/**
 * 지급월 판정.
 *
 * `simulationMonth` 는 달력월이 아니라 **투자 시작 후 N개월째**(1..12)다.
 * 따라서 quarterly 는 시작 후 3/6/9/12개월째, semiannual 은 6/12개월째, annual 은 12개월째에 지급한다.
 */
export const isPayoutMonth = (frequency: Frequency, simulationMonth: number): boolean => {
  if (frequency === 'monthly') return true;
  if (frequency === 'quarterly') return simulationMonth % 3 === 0;
  if (frequency === 'semiannual') return simulationMonth === 6 || simulationMonth === 12;

  return simulationMonth === 12;
};

export type MonthlyPayoutParams = {
  shares: number;
  /** 1주당 연간 배당금 — 내부에서 paymentsPerYear 로 나눠 1회 지급분을 구한다. */
  annualDps: number;
  paymentsPerYear: number;
  /** 0..1 비율 (퍼센트 아님) */
  taxRate: number;
};

export type MonthlyPayout = {
  gross: number;
  tax: number;
  net: number;
};

export const computeMonthlyPayout = ({
  shares,
  annualDps,
  paymentsPerYear,
  taxRate
}: MonthlyPayoutParams): MonthlyPayout => {
  const gross = shares * (annualDps / paymentsPerYear);
  const tax = gross * taxRate;

  return { gross, tax, net: gross - tax };
};

export type ReinvestmentParams = {
  /** 세후 배당금 */
  netDividend: number;
  price: number;
  enabled: boolean;
  /** 0..1 비율. 범위를 벗어나면 clamp 한다. */
  ratio: number;
  timing: ReinvestTiming;
};

export type ReinvestmentPlan = {
  /** 이번 달에 즉시 매수하는 주식 수 */
  sharesToBuyNow: number;
  /** 다음 달로 이월되는 현금 */
  cashToCarry: number;
};

export const planReinvestment = ({
  netDividend,
  price,
  enabled,
  ratio,
  timing
}: ReinvestmentParams): ReinvestmentPlan => {
  if (!enabled) return { sharesToBuyNow: 0, cashToCarry: 0 };

  const reinvestAmount = netDividend * clamp01(ratio);

  return timing === 'sameMonth'
    ? { sharesToBuyNow: reinvestAmount / price, cashToCarry: 0 }
    : { sharesToBuyNow: 0, cashToCarry: reinvestAmount };
};
