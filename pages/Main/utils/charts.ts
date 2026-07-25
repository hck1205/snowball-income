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
import { tooltipPosition } from '@/shared/lib/charts';
import { formatApproxKRW } from './formatters';
import type { NormalizedAllocationItem } from './portfolio';

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
  yAxisLabelFormatter,
  referenceLine,
  reachMarker
}: {
  rows: TRow[];
  getXValue: (row: TRow) => string;
  getYValue: (row: TRow) => number;
  xAxisLabel?: string;
  yAxisLabelFormatter?: (value: number) => string;
  /** 목표선(markLine). `value>0`일 때만 그린다. `reached`로 도달(success)/미도달(warning) 색을 가른다. */
  referenceLine?: { value: number; label: string; reached: boolean };
  /** 도달 마커(markPoint). 도달 연도가 있을 때만 전달한다. */
  reachMarker?: { xCategory: string; value: number; label: string };
}): EChartsOption => {
  const formatValue = yAxisLabelFormatter ?? defaultAxisValueFormatter;
  const theme = getChartTheme();
  const axis = buildAxisStyle(theme);

  /* 목표선/도달마커/y축 max 가드는 모두 target>0(목표 설정됨)일 때만. target≤0이면 전부 생략. */
  const hasTarget = referenceLine !== undefined && referenceLine.value > 0;
  const dataMax = rows.reduce((max, row) => Math.max(max, getYValue(row)), 0);
  const yAxisMax = hasTarget ? Math.max(dataMax, referenceLine!.value) * 1.1 : undefined;

  /* 모바일(≤480px)에서는 도달 markPoint 라벨을 숨기고 심볼만 남긴다(공간 절약). jsdom엔 matchMedia가
   * 없어 라벨이 보이는 쪽으로 폴백한다 — 이 분기는 실브라우저 확인 항목. */
  const isNarrowViewport =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 480px)').matches;

  const markLine =
    hasTarget && referenceLine
      ? {
          silent: true,
          symbol: 'none' as const,
          lineStyle: {
            type: 'dashed' as const,
            width: 2,
            color: referenceLine.reached ? theme.success : theme.warning
          },
          label: {
            formatter: referenceLine.label,
            position: 'insideEndTop' as const,
            color: referenceLine.reached ? theme.success : theme.warning,
            fontFamily: theme.fontFamily,
            fontSize: 11
          },
          data: [{ yAxis: referenceLine.value }]
        }
      : undefined;

  const markPoint =
    hasTarget && reachMarker
      ? {
          symbol: 'pin' as const,
          symbolSize: 44,
          itemStyle: { color: theme.success },
          label: {
            show: !isNarrowViewport,
            formatter: reachMarker.label,
            color: theme.onBrand,
            fontSize: 10,
            fontFamily: theme.fontFamily
          },
          data: [{ name: reachMarker.label, xAxis: reachMarker.xCategory, yAxis: reachMarker.value }]
        }
      : undefined;

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
      max: yAxisMax,
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
        data: rows.map((row) => getYValue(row)),
        markLine,
        markPoint
      }
    ]
  };
};

/**
 * `theme`를 넘기면 그 테마로 옵션을 만든다(미지정 = 현재 화면 테마).
 * PDF 리포트가 **화면과 같은 빌더**로 인쇄용(라이트 고정) 차트를 뽑기 위한 유일한 확장점이다.
 *
 * `formatCompact`도 같은 관례다 — 미지정이면 현행 원화 축약 표기(`formatApproxKRW`)라
 * 기존 호출부(PDF 파이프라인 포함)는 무변경으로 산다. 표시 통화 토글이 켜지면 대시보드만
 * 달러 포맷터를 주입한다(리포트는 원화 고정).
 */
export const buildAllocationPieOption = ({
  normalizedAllocation,
  showPortfolioDividendCenter,
  finalMonthlyAverageDividend,
  theme = getChartTheme(),
  formatCompact = formatApproxKRW
}: {
  normalizedAllocation: NormalizedAllocationItem[];
  showPortfolioDividendCenter: boolean;
  finalMonthlyAverageDividend: number;
  theme?: ChartTheme;
  formatCompact?: (value: number) => string;
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
                  text: formatCompact(finalMonthlyAverageDividend),
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

export const buildYearlyResultBarOption = ({
  tableRows,
  visibleYearlySeries,
  isYearlyAreaFillOn,
  theme = getChartTheme(),
  /* 미지정 = 현행 원화(기존 호출부·PDF 파이프라인 무변경). */
  formatValue = formatKRW
}: {
  tableRows: SimulationResult[];
  visibleYearlySeries: Record<YearlySeriesKey, boolean>;
  isYearlyAreaFillOn: boolean;
  theme?: ChartTheme;
  formatValue?: (value: number) => string;
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
      valueFormatter: (value: unknown) => formatValue(Number(value))
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
        formatter: (value: number) => formatValue(value)
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
