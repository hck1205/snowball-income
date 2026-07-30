import { useMemo } from 'react';
import { buildConditionStripItems } from '@/components/ConditionStrip';
import type { ConditionStripInput, ConditionStripItem } from '@/components/ConditionStrip';

type UseConditionStripItemsInput = Omit<ConditionStripInput, 'formatAmount'> & {
  /** 결과 숫자와 **같은 표시 통화 포맷터**. compact 로 재사용한다(전용 포맷터를 새로 만들지 않는다). */
  formatResultAmount: (won: number, compact: boolean) => string;
};

/**
 * "이 결과의 계산 조건" 스트립 항목. 조립은 순수 함수(`buildConditionStripItems`)가 하고,
 * 여기서는 폼 값을 그 계약에 맞게 넘기는 메모만 갖는다 — 컨테이너에서 뗀 이유는 관심사 하나
 * (폼 값 → 스트립 문구)만 갖게 하기 위해서다.
 */
export function useConditionStripItems({
  durationYears,
  monthlyContribution,
  initialInvestment,
  taxRatePercent,
  reinvestDividends,
  reinvestDividendPercent,
  targetMonthlyDividend,
  includedTickerCount,
  showQuickEstimate,
  formatResultAmount
}: UseConditionStripItemsInput): ConditionStripItem[] {
  return useMemo(
    () =>
      buildConditionStripItems({
        durationYears,
        monthlyContribution,
        initialInvestment,
        taxRatePercent,
        reinvestDividends,
        reinvestDividendPercent,
        targetMonthlyDividend,
        includedTickerCount,
        showQuickEstimate,
        formatAmount: (won: number) => formatResultAmount(won, true)
      }),
    [
      durationYears,
      formatResultAmount,
      includedTickerCount,
      initialInvestment,
      monthlyContribution,
      reinvestDividendPercent,
      reinvestDividends,
      showQuickEstimate,
      targetMonthlyDividend,
      taxRatePercent
    ]
  );
}
