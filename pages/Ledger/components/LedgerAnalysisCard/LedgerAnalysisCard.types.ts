import type { LedgerAnalysisModel } from '../../utils';

export type LedgerAnalysisCardProps = {
  model: LedgerAnalysisModel;
  /** 지금 보고 있는 달의 이름(`2026년 8월`). 구획의 기준 기간을 문장으로 밝히는 데 쓴다. */
  monthLabel: string;
};
