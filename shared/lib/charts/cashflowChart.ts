import type { EChartsOption } from 'echarts';
import { formatKRW } from '@/shared/utils';
import { buildAxisStyle, buildLegendStyle, buildTooltipStyle, getChartTheme } from '@/shared/styles';
import type { ChartTheme } from '@/shared/styles';
import { tooltipPosition } from './tooltipPosition';

/**
 * 월별 실지급 배당 스택 막대의 **입력 계약**. 시뮬레이션 번들(pages)이 만들고,
 * 대시보드 차트·캘린더 카드·PDF 리포트가 함께 읽는다 — 그래서 pages 가 아니라 여기가 소유자다.
 */
export type RecentCashflowByTicker = {
  months: string[];
  series: Array<{ name: string; data: number[]; color: string }>;
};

export type YearlyCashflowByTicker = {
  years: number[];
  byYear: Record<string, RecentCashflowByTicker & { totalDividend: number }>;
};

export const buildRecentCashflowBarOption = (
  recentCashflowByTicker: RecentCashflowByTicker,
  theme: ChartTheme = getChartTheme(),
  /* 미지정 = 현행 원화(기존 호출부·PDF 파이프라인 무변경). 표시 통화 토글만 달러 포맷터를 주입한다. */
  formatValue: (value: number) => string = formatKRW
): EChartsOption => {
  const axis = buildAxisStyle(theme);

  return {
    animation: false,
    grid: { left: 72, right: 16, top: 52, bottom: 42 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      confine: true,
      position: tooltipPosition,
      ...buildTooltipStyle(theme),
      valueFormatter: (value: unknown) => formatValue(Number(value))
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      top: 0,
      left: 72,
      right: 16,
      ...buildLegendStyle(theme)
    },
    xAxis: {
      type: 'category',
      data: recentCashflowByTicker.months,
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
        formatter: (value: number) => formatValue(value)
      }
    },
    series: recentCashflowByTicker.series.map((item) => ({
      type: 'bar',
      name: item.name,
      stack: 'total',
      data: item.data,
      barMaxWidth: 24,
      itemStyle: {
        color: item.color
      }
    }))
  };
};
