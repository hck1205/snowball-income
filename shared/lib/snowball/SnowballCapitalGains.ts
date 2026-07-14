import {
  CAPITAL_GAINS_ANNUAL_DEDUCTION,
  FINANCIAL_INCOME_TAX_THRESHOLD,
  OVERSEAS_CAPITAL_GAINS_TAX_RATE
} from '@/shared/constants/tax';
import type { MonthlySnapshot } from '@/shared/types';

/**
 * 양도소득세 / 금융소득종합과세 — **시뮬레이션 본체와 분리된** 사후 추정.
 *
 * 엔진의 월 루프는 배당소득세만 계산한다(그게 실제로 매달 원천징수되는 세금이라서).
 * 여기 있는 함수들은 그 결과를 **읽기만** 하고, 사용자가 놓치기 쉬운 두 가지를 드러낸다:
 *
 *   1. 양도소득세 — 매도 시점·매도 여부에 달렸다. 계속 보유하면 안 낸다.
 *      그래서 자산에서 자동으로 빼지 않고 "전량 매도한다면 이만큼"으로만 보여준다.
 *   2. 금융소득종합과세 — 다른 소득과 합산되므로 앱이 알 수 없다.
 *      그래서 세율을 바꾸지 않고 "임계 초과" 사실만 알린다.
 *
 * `@/shared/constants` 배럴이 아니라 `@/shared/constants/tax` 를 직접 import 하는 이유:
 * 배럴은 presets 를 거쳐 다시 `@/shared/lib/snowball` 을 import 하므로 순환이 생긴다.
 */

export type CapitalGainsParams = {
  /** 시뮬레이션 종료 시점의 평가금액. */
  finalAssetValue: number;
  /** 취득원가 = 초기 투자금 + 누적 월 적립금 + 실제로 재매수에 쓰인 배당금. */
  totalCostBasis: number;
  /** 양도세율(%). 기본값은 해외주식 22%. */
  taxRatePercent?: number;
  /** 양도소득 기본공제(원). 기본값은 연 250만원. */
  annualDeduction?: number;
};

export type CapitalGains = {
  /** 평가이익 = 평가금액 - 취득원가. 손실이면 음수. */
  unrealizedGain: number;
  /** 전량 매도 가정 시 예상 양도세. 손실이거나 공제 이하면 0. */
  estimatedCapitalGainsTax: number;
  /** 양도세를 낸 뒤 실제로 손에 쥐는 금액. */
  afterCapitalGainsTaxValue: number;
};

/**
 * 전량 매도를 가정한 양도소득세 추정.
 *
 *   과세표준 = max(0, 평가이익 - 기본공제)
 *   양도세   = 과세표준 × 세율
 *
 * 평가손실이면 세금은 0이다(이익이 없으면 양도세도 없다). 결손금 이월공제는 반영하지 않는다.
 */
export const computeCapitalGains = ({
  finalAssetValue,
  totalCostBasis,
  taxRatePercent = OVERSEAS_CAPITAL_GAINS_TAX_RATE,
  annualDeduction = CAPITAL_GAINS_ANNUAL_DEDUCTION
}: CapitalGainsParams): CapitalGains => {
  const unrealizedGain = finalAssetValue - totalCostBasis;
  const taxableGain = Math.max(0, unrealizedGain - annualDeduction);
  const estimatedCapitalGainsTax = taxableGain * (taxRatePercent / 100);

  return {
    unrealizedGain,
    estimatedCapitalGainsTax,
    afterCapitalGainsTaxValue: finalAssetValue - estimatedCapitalGainsTax
  };
};

/** 투자 시작 후 N년차(1-based)별 **세전** 배당 합계. */
export const sumGrossDividendByYearIndex = (monthly: MonthlySnapshot[]): Map<number, number> =>
  monthly.reduce((byYear, row) => {
    const yearIndex = Math.ceil(row.monthIndex / 12);
    // 금융소득종합과세 기준금액은 세전(총수입금액) 기준이므로 원천징수분(taxPaid)을 되돌려 더한다.
    const gross = row.dividendPaid + row.taxPaid;

    return byYear.set(yearIndex, (byYear.get(yearIndex) ?? 0) + gross);
  }, new Map<number, number>());

/**
 * 세전 연 배당이 금융소득종합과세 기준금액을 **처음 넘는 해**(N년차, 1-based). 넘지 않으면 undefined.
 *
 * 세후가 아니라 세전으로 비교하는 이유: 기준금액 2,000만원은 원천징수 전 총수입금액에 대한 것이다.
 * 세후로 비교하면 실제보다 늦게(또는 아예 안) 경고하게 된다.
 */
export const findFinancialIncomeThresholdYear = (
  monthly: MonthlySnapshot[],
  threshold: number = FINANCIAL_INCOME_TAX_THRESHOLD
): number | undefined => {
  const grossByYear = sumGrossDividendByYearIndex(monthly);

  return [...grossByYear.entries()]
    .sort(([left], [right]) => left - right)
    .find(([, gross]) => gross > threshold)?.[0];
};
