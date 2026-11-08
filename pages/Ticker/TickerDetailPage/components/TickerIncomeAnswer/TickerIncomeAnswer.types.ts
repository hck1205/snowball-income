import type { TickerIncomeAnswer as TickerIncomeAnswerModel } from '@/shared/lib/tickerIncome';

export type TickerIncomeAnswerProps = {
  readonly answer: TickerIncomeAnswerModel;
  /** "월 N 원 받으려면 얼마?" 링크를 눌렀을 때(계측은 페이지가 맡는다). */
  readonly onToTarget?: () => void;
};
