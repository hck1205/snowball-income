import type { ReactNode } from 'react';
import type { SimulationOutput } from '@/shared/types';
import type { ConditionStripItem } from '@/components/ConditionStrip';

export type ResultSummaryCardProps = {
  simulation: SimulationOutput;
  showQuickEstimate: boolean;
  isResultCompact: boolean;
  targetMonthlyDividend: number;
  formatResultAmount: (value: number, compact: boolean) => string;
  formatPercent: (value: number) => string;
  targetYearLabel: (year: number | undefined) => string;
  /** 계산 조건 스트립 항목 — 순수 함수(`buildConditionStripItems`) 산출물. */
  condition: ConditionStripItem[];
  /** 조건 스트립 우측 액션("조건 수정"). 페이지가 설정 진입 버튼을 만들어 넣는다. */
  conditionAction?: ReactNode;
};
