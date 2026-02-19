import type { EChartsOption } from 'echarts';
import type { ReactNode } from 'react';

export type ChartPanelProps<T> = {
  title: string;
  titleRight?: ReactNode;
  titleRightInline?: boolean;
  rows: T[];
  hasData?: boolean;
  emptyMessage?: string;
  xAxisLabel?: string;
  yAxisLabelFormatter?: (value: number) => string;
  getXValue: (row: T) => string;
  getYValue: (row: T) => number;
};

export type ChartPanelViewProps = {
  title: string;
  titleRight?: ReactNode;
  titleRightInline?: boolean;
  chartOption: EChartsOption;
  hasData: boolean;
  emptyMessage?: string;
};
