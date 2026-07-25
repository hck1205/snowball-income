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
  /** 목표선(markLine) — "월 평균 배당" 인스턴스에서만 전달. `value>0`일 때만 렌더된다. */
  referenceLine?: { value: number; label: string; reached: boolean };
  /** 도달 마커(markPoint) — 도달 연도가 있을 때만 전달. */
  reachMarker?: { xCategory: string; value: number; label: string };
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
