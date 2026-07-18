import { memo, useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { usePalettePresetAtomValue } from '@/jotai';
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
  /* 캔버스는 CSS 변수를 다시 읽지 않는다 — 팔레트 프리셋 전환 시 옵션을 다시 빌드해야 한다. */
  const palettePreset = usePalettePresetAtomValue();
  const chartOption = useMemo<EChartsOption>(
    () => buildLineChartOption({ rows, getXValue, getYValue, xAxisLabel, yAxisLabelFormatter }),
    [getXValue, getYValue, palettePreset, rows, xAxisLabel, yAxisLabelFormatter]
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
