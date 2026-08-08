/**
 * **흐름 차트** — 달마다의 수입·지출, 누적, 고정/변동, 주체, 폭포, 저축률.
 *
 * 🔴 **손익색 금지.** 지출을 빨강으로 수입을 초록으로 칠하지 않는다 — 가계부의 수입·지출은
 *    손익(P&L)이 아니다. 월세를 냈다고 손해를 본 것이 아니다.
 */
import type { EChartsOption } from 'echarts';
import { buildAxisStyle, buildTooltipStyle, hexToRgba } from '@/shared/styles';
import type { ChartTheme } from '@/shared/styles';

import { KRW, baseGrid, legendGrid, shortKRW, shortMonth, topLegend } from './chartShared';
import type {
  ReportCumulativePoint,
  ReportFixitySplit,
  ReportMonthlyFlow,
  ReportPayerMonth
} from '../report';

/* ── ① 월별 현금흐름 ─────────────────────────────────────────────────────────── */

/**
 * 수입·지출 막대 + 저축률 선.
 *
 * 🔴 저축률이 `null` 인 달은 **점을 찍지 않는다**(`null` 을 그대로 넘긴다) — 0% 로 찍으면
 *    "수입이 없어서"가 "다 써서"로 읽힌다. ECharts 는 `null` 을 끊어진 선으로 그린다.
 */
export const monthlyFlowOption = (
  flows: readonly ReportMonthlyFlow[],
  theme: ChartTheme
): EChartsOption => ({
  grid: legendGrid,
  tooltip: {
    ...buildTooltipStyle(theme),
    trigger: 'axis',
    valueFormatter: undefined
  },
  legend: { ...topLegend(theme), data: ['수입', '지출', '저축률'] },
  xAxis: {
    ...buildAxisStyle(theme),
    type: 'category',
    data: flows.map((flow) => shortMonth(flow.month))
  },
  yAxis: [
    {
      ...buildAxisStyle(theme),
      type: 'value',
      axisLabel: { ...buildAxisStyle(theme).axisLabel, formatter: (value: number) => shortKRW(value) },
      splitLine: { lineStyle: { color: theme.splitLine } }
    },
    {
      ...buildAxisStyle(theme),
      type: 'value',
      /* 🔴 저축률 축은 −100%~100% 로 고정하지 않는다 — 실제 값이 벗어나면 선이 잘린다. */
      axisLabel: { ...buildAxisStyle(theme).axisLabel, formatter: (value: number) => `${Math.round(value * 100)}%` },
      splitLine: { show: false }
    }
  ],
  series: [
    {
      name: '수입',
      type: 'bar',
      data: flows.map((flow) => flow.income),
      itemStyle: { color: theme.series[0], borderRadius: [4, 4, 0, 0] },
      tooltip: { valueFormatter: (value) => KRW(Number(value)) }
    },
    {
      name: '지출',
      type: 'bar',
      data: flows.map((flow) => flow.expense),
      itemStyle: { color: theme.series[1], borderRadius: [4, 4, 0, 0] },
      tooltip: { valueFormatter: (value) => KRW(Number(value)) }
    },
    {
      name: '저축률',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      /* 🔴 `null` 은 그대로 넘긴다 — 잴 수 없는 달은 선이 끊긴다. */
      data: flows.map((flow) => flow.savingRate),
      connectNulls: false,
      lineStyle: { color: theme.series[2], width: 2 },
      itemStyle: { color: theme.series[2] },
      tooltip: {
        valueFormatter: (value) => (value === null || value === undefined ? '잴 수 없음' : `${Math.round(Number(value) * 100)}%`)
      }
    }
  ]
});

/* ── ③ 고정비·변동비 추이 ────────────────────────────────────────────────────── */

/** 쌓은 막대. 고정비가 아래에 깔린다 — 바뀌지 않는 것이 바닥이라는 뜻이 그림에 들어간다. */
export const fixityOption = (
  trend: readonly ReportFixitySplit[],
  theme: ChartTheme
): EChartsOption => ({
  grid: legendGrid,
  tooltip: { ...buildTooltipStyle(theme), trigger: 'axis', valueFormatter: (value) => KRW(Number(value)) },
  legend: { ...topLegend(theme), data: ['고정비', '변동비'] },
  xAxis: { ...buildAxisStyle(theme), type: 'category', data: trend.map((point) => shortMonth(point.month)) },
  yAxis: {
    ...buildAxisStyle(theme),
    type: 'value',
    axisLabel: { ...buildAxisStyle(theme).axisLabel, formatter: (value: number) => shortKRW(value) },
    splitLine: { lineStyle: { color: theme.splitLine } }
  },
  series: [
    {
      name: '고정비',
      type: 'bar',
      stack: 'expense',
      data: trend.map((point) => point.fixed),
      itemStyle: { color: theme.series[0] }
    },
    {
      name: '변동비',
      type: 'bar',
      stack: 'expense',
      data: trend.map((point) => point.variable),
      itemStyle: { color: theme.series[3], borderRadius: [4, 4, 0, 0] }
    }
  ]
});

/* ── ⑤ 주체별 추이 ───────────────────────────────────────────────────────────── */

/** 사람마다 막대 하나. 🔴 쌓지 않는다 — 누가 더 썼나를 보는 그림이라 나란히 서야 비교된다. */
export const payerOption = (
  trend: readonly ReportPayerMonth[],
  payers: readonly string[],
  theme: ChartTheme
): EChartsOption => ({
  grid: legendGrid,
  tooltip: { ...buildTooltipStyle(theme), trigger: 'axis', valueFormatter: (value) => KRW(Number(value)) },
  legend: { ...topLegend(theme), data: [...payers] },
  xAxis: { ...buildAxisStyle(theme), type: 'category', data: trend.map((point) => shortMonth(point.month)) },
  yAxis: {
    ...buildAxisStyle(theme),
    type: 'value',
    axisLabel: { ...buildAxisStyle(theme).axisLabel, formatter: (value: number) => shortKRW(value) },
    splitLine: { lineStyle: { color: theme.splitLine } }
  },
  series: payers.map((payer, index) => ({
    name: payer,
    type: 'bar' as const,
    data: trend.map((point) => point.byPayer.get(payer) ?? 0),
    itemStyle: { color: theme.series[index % theme.series.length], borderRadius: [4, 4, 0, 0] }
  }))
});

/* ── ⑦ 누적 순현금 ───────────────────────────────────────────────────────────── */

/**
 * 쌓인 남은 돈.
 *
 * 🔴 **0 기준선을 그린다.** 누계가 음수로 내려간 구간은 "쓴 것이 번 것보다 많았다"는 사실이고,
 *    기준선이 없으면 그 순간이 눈에 안 띈다.
 * ⚠ `scale: true` 로 0 부터 그리지 않는다 — 변화폭을 보는 그림이라 0 부터면 선이 납작해진다.
 */
export const cumulativeOption = (
  points: readonly ReportCumulativePoint[],
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
      name: '누적',
      type: 'line',
      smooth: true,
      showSymbol: points.length <= 24,
      data: points.map((point) => point.cumulative),
      lineStyle: { color: theme.series[0], width: 2 },
      itemStyle: { color: theme.series[0] },
      areaStyle: { color: hexToRgba(theme.series[0], 0.14) },
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

/* ── ⑭ 폭포 (한 달의 수입 → 지출 → 남은 돈) ─────────────────────────────────── */

/**
 * 수입에서 시작해 항목마다 깎이고 무엇이 남았는지.
 *
 * 🔴 **투명 받침 + 실제 막대** 두 계열로 만든다(ECharts 의 폭포 관용구). 받침은 툴팁·범례에서
 *    빠져야 한다 — 안 빼면 "받침"이라는 없는 항목이 사용자에게 보인다.
 * ⚠ 남은 돈이 음수인 달은 받침이 0 이고 막대만 선다. 그 사실은 화면의 문장이 말한다.
 */
export const waterfallOption = (
  steps: readonly { readonly label: string; readonly base: number; readonly size: number; readonly direction: 'up' | 'down' | 'total'; readonly value: number }[],
  theme: ChartTheme
): EChartsOption => ({
  grid: { ...baseGrid, top: 24 },
  tooltip: {
    ...buildTooltipStyle(theme),
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: (params: unknown) => {
      const list = params as { dataIndex: number }[];
      const step = steps[list[0]?.dataIndex ?? 0];
      if (!step) return '';
      const sign = step.value < 0 ? '−' : '';
      return `${step.label}<br/>${sign}${KRW(Math.abs(step.value))}`;
    }
  },
  xAxis: {
    ...buildAxisStyle(theme),
    type: 'category',
    data: steps.map((step) => step.label),
    axisLabel: { ...buildAxisStyle(theme).axisLabel, interval: 0, rotate: steps.length > 5 ? 30 : 0 }
  },
  yAxis: {
    ...buildAxisStyle(theme),
    type: 'value',
    axisLabel: { ...buildAxisStyle(theme).axisLabel, formatter: (value: number) => shortKRW(value) },
    splitLine: { lineStyle: { color: theme.splitLine } }
  },
  series: [
    {
      /* 🔴 투명 받침 — 툴팁·범례에서 빠진다. */
      name: '받침',
      type: 'bar',
      stack: 'waterfall',
      silent: true,
      itemStyle: { color: 'transparent' },
      emphasis: { itemStyle: { color: 'transparent' } },
      tooltip: { show: false },
      data: steps.map((step) => step.base)
    },
    {
      name: '금액',
      type: 'bar',
      stack: 'waterfall',
      data: steps.map((step) => ({
        value: step.size,
        itemStyle: {
          color:
            step.direction === 'up'
              ? theme.series[0]
              : step.direction === 'total'
                ? theme.series[2]
                : theme.series[1],
          borderRadius: [4, 4, 0, 0]
        }
      }))
    }
  ]
});

/* ── ⑯ 고정비 비중 (100% 비율 막대) ─────────────────────────────────────────── */

/**
 * 지출을 100 으로 놓고 고정비가 차지하는 몫.
 *
 * 🔴 절대 금액 쌓기(`fixityOption`)는 **총액이 커지면 비중이 그대로여도 커 보인다.** 이 그림은
 *    총액을 지우고 **비중만** 남겨, 씀씀이가 커진 것과 고정비가 늘어난 것을 갈라 준다.
 * ⚠ 지출이 없던 달은 비중이 없다 — 그 달은 아예 뺀다(0% 로 그리면 "고정비가 없다"로 읽힌다).
 */
export const fixityRatioOption = (
  trend: readonly ReportFixitySplit[],
  theme: ChartTheme
): EChartsOption => {
  const shown = trend.filter((point) => point.fixedRatio !== null);
  return {
    grid: legendGrid,
    tooltip: {
      ...buildTooltipStyle(theme),
      trigger: 'axis',
      valueFormatter: (value) => `${Math.round(Number(value) * 100)}%`
    },
    legend: { ...topLegend(theme), data: ['고정비', '변동비'] },
    xAxis: { ...buildAxisStyle(theme), type: 'category', data: shown.map((point) => shortMonth(point.month)) },
    yAxis: {
      ...buildAxisStyle(theme),
      type: 'value',
      max: 1,
      axisLabel: { ...buildAxisStyle(theme).axisLabel, formatter: (value: number) => `${Math.round(value * 100)}%` },
      splitLine: { lineStyle: { color: theme.splitLine } }
    },
    series: [
      {
        name: '고정비',
        type: 'bar',
        stack: 'ratio',
        data: shown.map((point) => point.fixedRatio ?? 0),
        itemStyle: { color: theme.series[0] }
      },
      {
        name: '변동비',
        type: 'bar',
        stack: 'ratio',
        data: shown.map((point) => 1 - (point.fixedRatio ?? 0)),
        itemStyle: { color: theme.series[3], borderRadius: [4, 4, 0, 0] }
      }
    ]
  };
};

/* ── ⑱ 저축률 게이지 ─────────────────────────────────────────────────────────── */

/**
 * 최근 달 저축률 하나만 크게.
 *
 * 🔴 **눈금에 좋고 나쁨을 칠하지 않는다.** "30% 이상이면 초록" 같은 구간을 그으면 그건 조언이고,
 *    적정 저축률은 그 사람의 사정이다 — 눈금은 한 색이고 바늘 위치만 사실을 말한다.
 * ⚠ 음수 저축률(번 것보다 쓴 달)도 그린다. 하한을 0 으로 자르면 그 달이 0% 로 보인다.
 */
export const savingGaugeOption = (rate: number, theme: ChartTheme): EChartsOption => {
  const min = Math.min(0, Math.floor(rate * 10) / 10);
  return {
    series: [
      {
        type: 'gauge',
        center: ['50%', '58%'],
        radius: '92%',
        startAngle: 200,
        endAngle: -20,
        min,
        max: 1,
        splitNumber: 5,
        progress: { show: true, width: 14, itemStyle: { color: theme.series[0] } },
        axisLine: { lineStyle: { width: 14, color: [[1, theme.splitLine]] } },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: theme.label,
          fontSize: theme.labelFontSize,
          distance: 18,
          formatter: (value: number) => `${Math.round(value * 100)}%`
        },
        detail: {
          valueAnimation: false,
          offsetCenter: [0, '-8%'],
          color: theme.label,
          fontSize: 28,
          fontWeight: 700,
          formatter: (value: number) => `${Math.round(value * 100)}%`
        },
        data: [{ value: rate }]
      }
    ]
  };
};
