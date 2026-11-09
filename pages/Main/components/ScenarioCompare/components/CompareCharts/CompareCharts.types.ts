import type { ScenarioCompareColumn } from '@/pages/Main/utils';

export type CompareChartsProps = {
  readonly columns: readonly ScenarioCompareColumn[];
  /** 툴팁 금액(정밀). 표시 통화를 따른다. */
  readonly formatValue: (value: number) => string;
  /** 축 라벨 금액(축약). 표시 통화를 따른다. */
  readonly formatCompact: (value: number) => string;
};
