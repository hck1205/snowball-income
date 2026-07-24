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
  /** 접근명 접미 — 표시 통화가 달러일 때 ' (달러 표시)'. 캔버스 축 라벨은 낭독되지 않아 이게 유일한 단서다. */
  chartLabelSuffix?: string;
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
  chartLabelSuffix?: string;
};
