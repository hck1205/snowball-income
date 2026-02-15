import type { EChartsOption } from 'echarts';

export type ChartPanelProps<T> = {
  title: string;
  rows: T[];
  xAxisLabel?: string;
  yAxisLabelFormatter?: (value: number) => string;
  getXValue: (row: T) => string;
  getYValue: (row: T) => number;
};

export type ChartPanelViewProps = {
  title: string;
  chartOption: EChartsOption;
};
