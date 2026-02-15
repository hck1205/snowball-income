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
  ResponsiveChart: ComponentType<{ option: EChartsOption; replaceMerge?: string[] }>;
};
