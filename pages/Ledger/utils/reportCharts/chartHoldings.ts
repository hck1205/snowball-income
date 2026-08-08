/**
 * **자산 차트** — 순자산 추이(계단)와 종류별 쌓기.
 *
 * 🔴 순자산은 **계단**이다. 매끈한 선은 두 스냅샷 사이에 값이 서서히 변했다고 말하는데,
 *    우리가 아는 것은 잰 날의 값뿐이다 — 그 사이를 이으면 재지 않은 것을 잰 척하는 것이다.
 */
import type { EChartsOption } from 'echarts';
import { buildAxisStyle, buildTooltipStyle, hexToRgba } from '@/shared/styles';
import type { ChartTheme } from '@/shared/styles';

import { KRW, baseGrid, legendGrid, shortKRW, shortMonth, topLegend } from './chartShared';
import type { ReportNetWorthPoint } from '../report';

/* ── ④ 순자산 추이 ───────────────────────────────────────────────────────────── */

/**
 * 면적 선.
 *
 * 🔴 **0 에서 시작하지 않는다**(`min: 'dataMin'` 를 쓰지 않는 대신 `scale: true`) — 순자산은
 *    변화폭을 보는 값이라 0 부터 그리면 선이 납작해져 아무것도 안 보인다.
 * ⚠ 음수 순자산(부채가 더 많은 상태)도 그대로 그린다. 감추지 않는다.
 */
export const netWorthOption = (
  points: readonly ReportNetWorthPoint[],
  theme: ChartTheme
): EChartsOption => ({
  grid: baseGrid,
  tooltip: { ...buildTooltipStyle(theme), trigger: 'axis', valueFormatter: (value) => KRW(Number(value)) },
  xAxis: { ...buildAxisStyle(theme), type: 'category', data: points.map((point) => shortMonth(point.month)) },
  yAxis: {
    ...buildAxisStyle(theme),
    type: 'value',
    scale: true,
    axisLabel: { ...buildAxisStyle(theme).axisLabel, formatter: (value: number) => shortKRW(value) },
    splitLine: { lineStyle: { color: theme.splitLine } }
  },
  series: [
    {
      name: '순자산',
      type: 'line',
      smooth: true,
      showSymbol: points.length <= 24,
      data: points.map((point) => point.netWorth),
      lineStyle: { color: theme.series[0], width: 2 },
      itemStyle: { color: theme.series[0] },
      areaStyle: { color: hexToRgba(theme.series[0], 0.16) }
    }
  ]
});

/* ── ⑩ 자산 종류별 추이 (쌓은 막대) ──────────────────────────────────────────── */

/** 무엇으로 쌓여 왔나. 🔴 부채는 없다 — 순자산 선이 따로 있고, 여기 섞으면 질문이 흐려진다. */
export const holdingTrendOption = (
  trend: { readonly months: readonly string[]; readonly series: readonly { readonly label: string; readonly values: readonly number[] }[] },
  theme: ChartTheme
): EChartsOption => ({
  grid: legendGrid,
  tooltip: { ...buildTooltipStyle(theme), trigger: 'axis', valueFormatter: (value) => KRW(Number(value)) },
  legend: { ...topLegend(theme), data: trend.series.map((item) => item.label) },
  xAxis: { ...buildAxisStyle(theme), type: 'category', data: trend.months.map(shortMonth) },
  yAxis: {
    ...buildAxisStyle(theme),
    type: 'value',
    axisLabel: { ...buildAxisStyle(theme).axisLabel, formatter: (value: number) => shortKRW(value) },
    splitLine: { lineStyle: { color: theme.splitLine } }
  },
  series: trend.series.map((item, index) => ({
    name: item.label,
    type: 'bar' as const,
    stack: 'holding',
    data: [...item.values],
    itemStyle: { color: theme.series[index % theme.series.length] }
  }))
});

/* ── ⑰ 순자산 계단선 ─────────────────────────────────────────────────────────── */

/**
 * 순자산은 **계단**이다.
 *
 * 🔴 매끈한 선은 "두 스냅샷 사이에 값이 서서히 변했다"고 말하는데, 우리가 아는 것은 **잰 날의 값**
 *    뿐이다. 그 사이를 매끈하게 이으면 재지 않은 것을 잰 척하는 것이다. 계단은 "다음에 잴 때까지
 *    이 값으로 알고 있다"를 정확히 말한다.
 */
export const netWorthStepOption = (
  points: readonly ReportNetWorthPoint[],
  theme: ChartTheme
): EChartsOption => ({
  grid: baseGrid,
  tooltip: { ...buildTooltipStyle(theme), trigger: 'axis', valueFormatter: (value) => KRW(Number(value)) },
  xAxis: { ...buildAxisStyle(theme), type: 'category', data: points.map((point) => shortMonth(point.month)) },
  yAxis: {
    ...buildAxisStyle(theme),
    type: 'value',
    scale: true,
    axisLabel: { ...buildAxisStyle(theme).axisLabel, formatter: (value: number) => shortKRW(value) },
    splitLine: { lineStyle: { color: theme.splitLine } }
  },
  series: [
    {
      name: '순자산',
      type: 'line',
      step: 'end',
      showSymbol: points.length <= 24,
      data: points.map((point) => point.netWorth),
      lineStyle: { color: theme.series[0], width: 2 },
      itemStyle: { color: theme.series[0] },
      areaStyle: { color: hexToRgba(theme.series[0], 0.16) },
      markLine: {
        silent: true,
        symbol: 'none',
        label: { show: false },
        lineStyle: { color: theme.axisLine, type: 'dashed' },
        data: [{ yAxis: 0 }]
      }
    }
  ]
});
