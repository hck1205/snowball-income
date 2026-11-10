import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { ResponsiveEChart } from '@/components/common';
import { useEffectiveColorScheme, usePalettePresetAtomValue } from '@/jotai';
import type { RichChartData } from '@/shared/lib/richtext';
import { buildAxisStyle, buildLegendStyle, buildTooltipStyle, getChartTheme } from '@/shared/styles';
import { ChartFrame } from './RichTextChart.styled';
import type { RichTextChartProps } from './RichTextChart.types';

/** 축·툴팁 숫자 표기 — 큰 수는 억·만으로 줄인다(본문 표의 원 단위 값을 그대로 쓰면 축이 읽히지 않는다). */
const formatAxisNumber = (value: number): string => {
  const abs = Math.abs(value);
  if (abs >= 100_000_000) return `${Number((value / 100_000_000).toFixed(1))}억`;
  if (abs >= 10_000) return `${Math.round(value / 10_000).toLocaleString('ko-KR')}만`;
  return Number(value.toFixed(2)).toLocaleString('ko-KR');
};

export const buildRichChartOption = (data: RichChartData): EChartsOption => {
  const theme = getChartTheme();
  const axis = buildAxisStyle(theme);
  const isBar = data.kind === 'bar';

  return {
    animation: false,
    grid: { left: 56, right: 16, top: data.series.length > 1 ? 36 : 16, bottom: 32 },
    legend: data.series.length > 1 ? { top: 0, left: 0, ...buildLegendStyle(theme) } : undefined,
    tooltip: {
      trigger: 'axis',
      ...buildTooltipStyle(theme),
      valueFormatter: (value: unknown) => (value === null || value === undefined ? '-' : formatAxisNumber(Number(value)))
    },
    xAxis: {
      type: 'category',
      boundaryGap: isBar,
      data: [...data.categories],
      ...axis,
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      ...axis,
      axisLine: { show: false },
      axisLabel: {
        color: theme.label,
        fontSize: theme.labelFontSize,
        fontFamily: theme.fontFamily,
        formatter: (value: number) => formatAxisNumber(value)
      }
    },
    series: data.series.map((item, index) => {
      const color = theme.series[index % theme.series.length];
      return isBar
        ? { type: 'bar' as const, name: item.name, data: [...item.values], itemStyle: { color, borderRadius: [4, 4, 0, 0] } }
        : {
            type: 'line' as const,
            name: item.name,
            data: [...item.values],
            smooth: true,
            showSymbol: false,
            connectNulls: false,
            lineStyle: { width: 2, color },
            itemStyle: { color }
          };
    })
  };
};

/**
 * 본문 표(`<table data-chart>`)를 차트로 **덧그린다**(2026-11-09). 표는 그대로 남는다 — 정확한 숫자는 표가,
 * 크기 비교는 차트가 말한다. 데이터는 `parseRichChartTable` 이 표에서 읽은 것뿐이다.
 * 캔버스는 CSS 변수를 다시 읽지 않아 테마가 바뀌면 옵션을 다시 만든다(useMainComputed 와 같은 이유).
 */
export default function RichTextChart({ data }: RichTextChartProps) {
  const palettePreset = usePalettePresetAtomValue();
  const colorScheme = useEffectiveColorScheme();
  // palettePreset·colorScheme: 차트 색을 테마에서 읽는다(위 주석).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const option = useMemo(() => buildRichChartOption(data), [data, palettePreset, colorScheme]);

  return (
    <ChartFrame role="img" aria-label={`${data.series.map((item) => item.name).join(', ')} 차트 — 아래 표와 같은 값`}>
      <ResponsiveEChart option={option} />
    </ChartFrame>
  );
}
