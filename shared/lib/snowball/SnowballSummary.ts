import type { MonthlySnapshot, SimulationResult, SimulationSummary } from '@/shared/types';

export const findTargetYear = (rows: SimulationResult[], monthlyTarget: number): number | undefined => {
  return rows.find((row) => row.monthlyDividend >= monthlyTarget)?.year;
};

export const sumDividendPaid = (rows: MonthlySnapshot[]): number =>
  rows.reduce((sum, row) => sum + row.dividendPaid, 0);

export const findLastPayoutMonth = (monthly: MonthlySnapshot[]): MonthlySnapshot | undefined =>
  [...monthly].reverse().find((row) => row.dividendPaid > 0);

export type YearlyRowParams = {
  /** 연간 행 라벨 (시작 연도 기준) */
  year: number;
  /** 해당 시점까지 경과한 월 수 */
  monthIndex: number;
  initialInvestment: number;
  monthlyContribution: number;
  assetValue: number;
  cumulativeDividend: number;
  /** 직전 12개월 스냅샷 (현재 월 포함) */
  recentMonths: MonthlySnapshot[];
};

export const buildYearlyRow = ({
  year,
  monthIndex,
  initialInvestment,
  monthlyContribution,
  assetValue,
  cumulativeDividend,
  recentMonths
}: YearlyRowParams): SimulationResult => {
  const annualDividend = sumDividendPaid(recentMonths);

  return {
    year,
    totalContribution: initialInvestment + (monthlyContribution * monthIndex),
    assetValue,
    annualDividend,
    cumulativeDividend,
    monthlyDividend: annualDividend / 12
  };
};

export type SummaryParams = {
  monthly: MonthlySnapshot[];
  yearly: SimulationResult[];
  totalTaxPaid: number;
  targetMonthlyDividend: number;
};

/**
 * 단일 종목 시뮬레이션과 포트폴리오 합산 결과 양쪽에서 재사용 가능한 summary 조립기.
 * (합산 쪽은 종목별 totalTaxPaid 를 미리 더해서 넘기면 된다.)
 */
export const buildSummary = ({
  monthly,
  yearly,
  totalTaxPaid,
  targetMonthlyDividend
}: SummaryParams): SimulationSummary => {
  const finalYear = yearly[yearly.length - 1];
  const lastPayoutRow = findLastPayoutMonth(monthly);

  return {
    finalAssetValue: finalYear?.assetValue ?? 0,
    finalAnnualDividend: finalYear?.annualDividend ?? 0,
    // finalMonthlyAverageDividend = 마지막 해 연 배당 / 12. (예전에는 같은 값이 finalMonthlyDividend
    // 라는 이름으로 한 번 더 들어 있었으나, 어떤 화면도 읽지 않는 중복 필드라 제거했다.)
    finalMonthlyAverageDividend: finalYear?.monthlyDividend ?? 0,
    finalPayoutMonthDividend: lastPayoutRow?.dividendPaid ?? 0,
    totalContribution: finalYear?.totalContribution ?? 0,
    totalNetDividend: finalYear?.cumulativeDividend ?? 0,
    totalTaxPaid,
    targetMonthDividendReachedYear: findTargetYear(yearly, targetMonthlyDividend)
  };
};
