import type { ScenarioCompareColumn } from '@/pages/Main/utils';

export type CompareTableProps = {
  readonly columns: readonly ScenarioCompareColumn[];
  /** 표의 금액 표기(축약). 표시 통화를 따른다. */
  readonly money: (value: number) => string;
  /** 표 머리의 "이 탭 보기". */
  readonly onSelect: (scenarioId: string) => void;
};
