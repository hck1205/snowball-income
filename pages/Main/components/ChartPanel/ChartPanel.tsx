import { memo, useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { formatKRW } from '@/shared/utils';
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
    () => ({
      animation: false,
      grid: { left: 72, right: 20, top: 24, bottom: 40 },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value: unknown) =>
          (yAxisLabelFormatter ?? ((numberValue: number) => formatKRW(numberValue)))(Number(value))
      },
      xAxis: {
        type: 'category',
        name: xAxisLabel,
        data: rows.map((row) => getXValue(row))
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => (yAxisLabelFormatter ?? ((numberValue: number) => formatKRW(numberValue)))(value)
        }
      },
      series: [
        {
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: '#2f6f93' },
          itemStyle: { color: '#2f6f93' },
          areaStyle: { color: '#2f6f9320' },
          data: rows.map((row) => getYValue(row))
        }
      ]
    }),
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
