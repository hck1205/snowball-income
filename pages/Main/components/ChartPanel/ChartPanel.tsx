import { memo, useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { buildLineChartOption } from '@/pages/Main/utils';
import ChartPanelView from './ChartPanel.view';
import type { ChartPanelProps } from './ChartPanel.types';

function ChartPanelComponent<T>({
  title,
  titleRight,
  titleRightInline,
  rows,
  hasData = true,
  emptyMessage,
  xAxisLabel,
  yAxisLabelFormatter,
  getXValue,
  getYValue
}: ChartPanelProps<T>) {
  const chartOption = useMemo<EChartsOption>(
    () => buildLineChartOption({ rows, getXValue, getYValue, xAxisLabel, yAxisLabelFormatter }),
    [getXValue, getYValue, rows, xAxisLabel, yAxisLabelFormatter]
  );

  return (
    <ChartPanelView
      title={title}
      titleRight={titleRight}
      titleRightInline={titleRightInline}
      chartOption={chartOption}
      hasData={hasData}
      emptyMessage={emptyMessage}
    />
  );
}

const ChartPanel = memo(ChartPanelComponent) as typeof ChartPanelComponent;

export default ChartPanel;
