import type { EChartsOption } from 'echarts';
import type { SimulationResult } from '@/shared/types';
import { formatKRW, getTickerDisplayName } from '@/shared/utils';
import {
  ALLOCATION_COLORS,
  YEARLY_SERIES_COLOR,
  YEARLY_SERIES_LABEL,
  YEARLY_SERIES_ORDER,
  type YearlySeriesKey
} from '@/shared/constants';
import { formatApproxKRW } from './formatters';
import type { NormalizedAllocationItem } from './portfolio';
import type { RecentCashflowByTicker } from './simulation';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const tooltipPosition = (
  point: number[],
  _params: unknown,
  _dom: unknown,
  _rect: unknown,
  size: { contentSize: number[]; viewSize: number[] }
): [number, number] => {
  const [x, y] = point;
  const [contentWidth, contentHeight] = size.contentSize;
  const [viewWidth, viewHeight] = size.viewSize;
  const xPadding = 10;
  const yPadding = 10;

  const centeredX = x - contentWidth / 2;
  const preferUpperY = y - contentHeight - 14;
  const fallbackLowerY = y + 14;
  const nextY = preferUpperY >= yPadding ? preferUpperY : fallbackLowerY;

  return [
    clamp(centeredX, xPadding, viewWidth - contentWidth - xPadding),
    clamp(nextY, yPadding, viewHeight - contentHeight - yPadding)
  ];
};

export const buildAllocationPieOption = ({
  normalizedAllocation,
  showPortfolioDividendCenter,
  finalMonthlyAverageDividend
}: {
  normalizedAllocation: NormalizedAllocationItem[];
  showPortfolioDividendCenter: boolean;
  finalMonthlyAverageDividend: number;
}): EChartsOption | null => {
  if (normalizedAllocation.length === 0) return null;

  return {
    animation: false,
    graphic: showPortfolioDividendCenter
      ? [
          {
            type: 'group',
            left: 'center',
            top: 'center',
            children: [
              {
                type: 'text',
                left: 'center',
                top: -12,
                style: {
                  text: '월배당',
                  fill: '#567285',
                  fontSize: 12,
                  fontWeight: 600,
                  align: 'center',
                  verticalAlign: 'middle'
                }
              },
              {
                type: 'text',
                left: 'center',
                top: 8,
                style: {
                  text: formatApproxKRW(finalMonthlyAverageDividend),
                  fill: '#1f3341',
                  fontSize: 13,
                  fontWeight: 700,
                  align: 'center',
                  verticalAlign: 'middle'
                }
              }
            ]
          }
        ]
      : undefined,
    tooltip: {
      trigger: 'item',
      confine: true,
      position: tooltipPosition,
      formatter: '{b}: {d}%'
    },
    series: [
      {
        type: 'pie',
        selectedMode: false,
        silent: true,
        radius: ['46%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b} {d}%',
          color: '#334a5c',
          fontSize: 11
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 8
        },
        data: normalizedAllocation.map(({ profile, weight }, index) => ({
          name: getTickerDisplayName(profile.ticker, profile.name),
          value: Number((weight * 100).toFixed(4)),
          itemStyle: { color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length] }
        }))
      }
    ]
  };
};

export const buildRecentCashflowBarOption = (recentCashflowByTicker: RecentCashflowByTicker): EChartsOption => ({
  animation: false,
  grid: { left: 72, right: 16, top: 52, bottom: 42 },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    confine: true,
    position: tooltipPosition,
    valueFormatter: (value: unknown) => formatKRW(Number(value))
  },
  legend: {
    type: 'scroll',
    orient: 'horizontal',
    top: 0,
    left: 72,
    right: 16,
    textStyle: { color: '#486073', fontSize: 12 }
  },
  xAxis: {
    type: 'category',
    data: recentCashflowByTicker.months
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: (value: number) => formatKRW(value)
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
});

export const buildYearlyResultBarOption = ({
  tableRows,
  visibleYearlySeries,
  isYearlyAreaFillOn
}: {
  tableRows: SimulationResult[];
  visibleYearlySeries: Record<YearlySeriesKey, boolean>;
  isYearlyAreaFillOn: boolean;
}): EChartsOption => {
  const seriesKeys = YEARLY_SERIES_ORDER.filter((key) => visibleYearlySeries[key]);

  return {
    animation: false,
    grid: { left: 72, right: 20, top: 52, bottom: 36 },
    tooltip: {
      trigger: 'axis',
      confine: true,
      position: tooltipPosition,
      valueFormatter: (value: unknown) => formatKRW(Number(value))
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      top: 0,
      left: 72,
      right: 20,
      textStyle: { color: '#486073', fontSize: 12 }
    },
    xAxis: {
      type: 'category',
      data: tableRows.map((row) => `${row.year}`)
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (value: number) => formatKRW(value) }
    },
    series: seriesKeys.map((key) => ({
      type: 'line',
      name: YEARLY_SERIES_LABEL[key],
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2, color: YEARLY_SERIES_COLOR[key] },
      itemStyle: { color: YEARLY_SERIES_COLOR[key] },
      areaStyle: isYearlyAreaFillOn ? { color: `${YEARLY_SERIES_COLOR[key]}22` } : undefined,
      data: tableRows.map((row) => row[key])
    }))
  };
};
