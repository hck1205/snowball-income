import type { EChartsOption } from 'echarts';
import type { ComponentType } from 'react';

export type YearlySeriesItem = {
  key: string;
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  onHelp: () => void;
};

export type YearlyResultProps = {
  items: YearlySeriesItem[];
  isFillOn: boolean;
  onToggleFill: (checked: boolean) => void;
  chartOption: EChartsOption;
  hasData?: boolean;
  emptyMessage?: string;
  /** 달러 표시 중일 때 차트 `aria-label` 에 붙는 접미 — 색·기호로만 전달되는 통화를 스크린리더에도 알린다. */
  chartLabelSuffix?: string;
  ResponsiveChart: ComponentType<{ option: EChartsOption; replaceMerge?: string[] }>;
};
