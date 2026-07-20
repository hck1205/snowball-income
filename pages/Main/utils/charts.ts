import type { EChartsOption } from 'echarts';
import type { SimulationResult } from '@/shared/types';
import { formatKRW, getTickerDisplayName } from '@/shared/utils';
import {
  YEARLY_SERIES_LABEL,
  YEARLY_SERIES_ORDER,
  getYearlySeriesColor,
  type YearlySeriesKey
} from '@/shared/constants';
import { buildAxisStyle, buildLegendStyle, buildTooltipStyle, getChartTheme, hexToRgba } from '@/shared/styles';
import type { ChartTheme } from '@/shared/styles';
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

const defaultAxisValueFormatter = (value: number) => formatKRW(value);

/**
 * 오로라 area 필 (§디자인 스펙 3.2) — hero 시리즈(라인 차트 주 시리즈, 연간 차트 assetValue)에만 쓴다.
 *
 * 위→아래 수직 그라데이션: 글레이셔 애저(brand 0.30) → 오로라 teal 기운(accent 0.10) → 투명.
 * 캔버스라 `var()`를 못 쓰므로 `getChartTheme()`이 해석한 실제 색을 `hexToRgba`로 조립한다.
 * teal은 장식(투명도 ≤0.30)일 뿐 데이터 방향(상승) 의미가 아니다 — 상승/하락은 계속 up/down 램프.
 */
const buildAuroraAreaStyle = (theme: ChartTheme) => ({
  color: {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: hexToRgba(theme.brand, 0.3) },
      { offset: 0.62, color: hexToRgba(theme.accent, 0.1) },
      { offset: 1, color: hexToRgba(theme.accent, 0) }
    ]
  }
});

export const buildLineChartOption = <TRow>({
  rows,
  getXValue,
  getYValue,
  xAxisLabel,
  yAxisLabelFormatter
}: {
  rows: TRow[];
  getXValue: (row: TRow) => string;
  getYValue: (row: TRow) => number;
  xAxisLabel?: string;
  yAxisLabelFormatter?: (value: number) => string;
}): EChartsOption => {
  const formatValue = yAxisLabelFormatter ?? defaultAxisValueFormatter;
  const theme = getChartTheme();
  const axis = buildAxisStyle(theme);

  return {
    animation: false,
    grid: { left: 72, right: 20, top: 24, bottom: 40 },
    tooltip: {
      trigger: 'axis',
      ...buildTooltipStyle(theme),
      valueFormatter: (value: unknown) => formatValue(Number(value))
    },
    xAxis: {
      type: 'category',
      name: xAxisLabel,
      nameTextStyle: { color: theme.label, fontFamily: theme.fontFamily },
      boundaryGap: false,
      data: rows.map((row) => getXValue(row)),
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
    series: [
      {
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: theme.brand },
        itemStyle: { color: theme.brand },
        areaStyle: buildAuroraAreaStyle(theme),
        data: rows.map((row) => getYValue(row))
      }
    ]
  };
};

/**
 * `theme`를 넘기면 그 테마로 옵션을 만든다(미지정 = 현재 화면 테마).
 * PDF 리포트가 **화면과 같은 빌더**로 인쇄용(라이트 고정) 차트를 뽑기 위한 유일한 확장점이다.
 */
export const buildAllocationPieOption = ({
  normalizedAllocation,
  showPortfolioDividendCenter,
  finalMonthlyAverageDividend,
  theme = getChartTheme()
}: {
  normalizedAllocation: NormalizedAllocationItem[];
  showPortfolioDividendCenter: boolean;
  finalMonthlyAverageDividend: number;
  theme?: ChartTheme;
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
                  fill: theme.textMuted,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: theme.fontFamily,
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
                  fill: theme.text,
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: theme.fontFamily,
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
      ...buildTooltipStyle(theme),
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
        itemStyle: { borderColor: theme.sliceBorder, borderWidth: 2, borderRadius: 3 },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b} {d}%',
          color: theme.label,
          fontSize: 11,
          fontFamily: theme.fontFamily
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 8,
          lineStyle: { color: theme.axisLine }
        },
        data: normalizedAllocation.map(({ profile, weight }, index) => ({
          name: getTickerDisplayName(profile.ticker, profile.name),
          value: Number((weight * 100).toFixed(4)),
          /* 현재 프리셋의 시리즈 세트 — DOM 범례 점(CHART_SERIES_VARS)과 같은 인덱스 규칙(% 8) */
          itemStyle: { color: theme.series[index % theme.series.length] }
        }))
      }
    ]
  };
};

export const buildRecentCashflowBarOption = (
  recentCashflowByTicker: RecentCashflowByTicker,
  theme: ChartTheme = getChartTheme()
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
      valueFormatter: (value: unknown) => formatKRW(Number(value))
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
  };
};

export const buildYearlyResultBarOption = ({
  tableRows,
  visibleYearlySeries,
  isYearlyAreaFillOn,
  theme = getChartTheme()
}: {
  tableRows: SimulationResult[];
  visibleYearlySeries: Record<YearlySeriesKey, boolean>;
  isYearlyAreaFillOn: boolean;
  theme?: ChartTheme;
}): EChartsOption => {
  const seriesKeys = YEARLY_SERIES_ORDER.filter((key) => visibleYearlySeries[key]);
  const axis = buildAxisStyle(theme);

  return {
    animation: false,
    grid: { left: 72, right: 20, top: 52, bottom: 36 },
    tooltip: {
      trigger: 'axis',
      confine: true,
      position: tooltipPosition,
      ...buildTooltipStyle(theme),
      valueFormatter: (value: unknown) => formatKRW(Number(value))
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      top: 0,
      left: 72,
      right: 20,
      ...buildLegendStyle(theme)
    },
    xAxis: {
      type: 'category',
      data: tableRows.map((row) => `${row.year}`),
      boundaryGap: false,
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
        formatter: (value: number) => formatKRW(value)
      }
    },
    series: seriesKeys.map((key) => ({
      type: 'line',
      name: YEARLY_SERIES_LABEL[key],
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2, color: getYearlySeriesColor(theme.series, key) },
      itemStyle: { color: getYearlySeriesColor(theme.series, key) },
      /* 오로라 필은 assetValue(hero 시리즈)만 — 모든 시리즈에 깔면 겹침 영역을 읽을 수 없다. */
      areaStyle: isYearlyAreaFillOn
        ? key === 'assetValue'
          ? buildAuroraAreaStyle(theme)
          : { color: getYearlySeriesColor(theme.series, key), opacity: 0.15 }
        : undefined,
      data: tableRows.map((row) => row[key])
    }))
  };
};
