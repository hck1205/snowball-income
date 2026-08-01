import { memo, useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { useEffectiveColorScheme, usePalettePresetAtomValue } from '@/jotai';
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
  chartLabelSuffix,
  getXValue,
  getYValue,
  referenceLine,
  reachMarker
}: ChartPanelProps<T>) {
  /* 캔버스는 CSS 변수를 다시 읽지 않는다 — 테마 두 축(색 프리셋·밝기) 어느 쪽이 바뀌어도 옵션을 다시 빌드해야 한다. */
  const palettePreset = usePalettePresetAtomValue();
  const colorScheme = useEffectiveColorScheme();
  const chartOption = useMemo<EChartsOption>(
    () => buildLineChartOption({ rows, getXValue, getYValue, xAxisLabel, yAxisLabelFormatter, referenceLine, reachMarker }),
    [colorScheme, getXValue, getYValue, palettePreset, rows, xAxisLabel, yAxisLabelFormatter, referenceLine, reachMarker]
  );

  return (
    <ChartPanelView
      title={title}
      titleRight={titleRight}
      titleRightInline={titleRightInline}
      chartOption={chartOption}
      hasData={hasData}
      emptyMessage={emptyMessage}
      chartLabelSuffix={chartLabelSuffix}
    />
  );
}

const ChartPanel = memo(ChartPanelComponent) as typeof ChartPanelComponent;

export default ChartPanel;
