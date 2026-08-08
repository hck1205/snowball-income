/**
 * **구성·리듬 차트** — 도넛, 가로 막대, 항목 추이, 요일, 선버스트, 레이더, 흐름도, 달력.
 *
 * 🔴 조각이 많으면 읽을 수 없다 — 상위만 남기고 나머지를 `기타 N개` 로 접되, **접었다는
 *    사실을 이름이 말한다.**
 */
import type { EChartsOption } from 'echarts';
import { buildAxisStyle, buildLegendStyle, buildTooltipStyle, hexToRgba } from '@/shared/styles';
import type { ChartTheme } from '@/shared/styles';

import { KRW, baseGrid, legendGrid, shortKRW, shortMonth, topLegend } from './chartShared';
import type { ReportSlice, ReportWeekdaySpending } from '../report';

/* ── ② 구성(도넛) ────────────────────────────────────────────────────────────── */

/**
 * 도넛.
 *
 * ⚠ 조각이 많으면 읽을 수 없다 — 상위 `limit` 만 남기고 나머지를 `기타` 로 접는다.
 *   🔴 접었다는 사실을 숨기지 않는다: 이름이 `기타 N개` 라 몇 개가 묶였는지 보인다.
 */
export const donutOption = (
  slices: readonly ReportSlice[],
  theme: ChartTheme,
  limit = 7
): EChartsOption => {
  const head = slices.slice(0, limit);
  const tail = slices.slice(limit);
  const data = [
    ...head.map((slice) => ({ name: slice.label, value: slice.value })),
    ...(tail.length > 0
      ? [{ name: `기타 ${tail.length}개`, value: tail.reduce((total, slice) => total + slice.value, 0) }]
      : [])
  ];

  return {
    tooltip: {
      ...buildTooltipStyle(theme),
      trigger: 'item',
      valueFormatter: (value) => KRW(Number(value))
    },
    /*
     * 🔴 범례가 **아래**다. 도넛은 조각 이름을 안에 못 쓰므로(좁은 폭에서 겹친다) 범례가 이름을
     *    지는데, 그것이 그림과 붙으면 둘 다 읽기 나빠진다 — 중심을 위로 올려 사이를 벌린다.
     */
    legend: { ...buildLegendStyle(theme), type: 'scroll', bottom: 0, itemGap: 12 },
    series: [
      {
        type: 'pie',
        radius: ['44%', '66%'],
        center: ['50%', '40%'],
        /* 🔴 조각 위에 이름을 얹지 않는다 — 좁은 폭에서 겹쳐 읽을 수 없다. 범례가 이름을 진다. */
        label: { show: false },
        labelLine: { show: false },
        itemStyle: { borderColor: theme.sliceBorder, borderWidth: 2 },
        data,
        color: theme.series
      }
    ]
  };
};

/* ── ⑥ 가로 막대 (결제수단 등) ───────────────────────────────────────────────── */

/** 이름이 길어 세로 축에 두는 편이 읽기 좋은 값들. */
export const horizontalBarOption = (
  slices: readonly ReportSlice[],
  theme: ChartTheme,
  limit = 8
): EChartsOption => {
  /* 🔴 가로 막대는 **아래에서 위로** 커진다 — 큰 것이 위에 오게 뒤집어 넣는다. */
  const shown = [...slices.slice(0, limit)].reverse();
  return {
    grid: { ...baseGrid, top: 8 },
    tooltip: { ...buildTooltipStyle(theme), trigger: 'axis', valueFormatter: (value) => KRW(Number(value)) },
    xAxis: {
      ...buildAxisStyle(theme),
      type: 'value',
      axisLabel: { ...buildAxisStyle(theme).axisLabel, formatter: (value: number) => shortKRW(value) },
      splitLine: { lineStyle: { color: theme.splitLine } }
    },
    yAxis: { ...buildAxisStyle(theme), type: 'category', data: shown.map((slice) => slice.label) },
    series: [
      {
        type: 'bar',
        data: shown.map((slice) => slice.value),
        itemStyle: { color: theme.series[0], borderRadius: [0, 4, 4, 0] }
      }
    ]
  };
};

/* ── ⑧ 항목별 추이 (쌓은 면) ─────────────────────────────────────────────────── */

/**
 * 상위 항목이 달마다 어떻게 움직였나.
 *
 * 🔴 **쌓아서** 그린다 — 총 지출의 높이와 그 안의 몫을 한 그림에서 본다. 겹쳐 그리면(비쌓기)
 *    총액이 사라지고, 파이는 총액 변화를 못 보여 준다. 이 둘 사이를 메우는 그림이다.
 */
export const categoryTrendOption = (
  trend: { readonly months: readonly string[]; readonly series: readonly { readonly label: string; readonly values: readonly number[] }[] },
  theme: ChartTheme
): EChartsOption => ({
  grid: legendGrid,
  tooltip: { ...buildTooltipStyle(theme), trigger: 'axis', valueFormatter: (value) => KRW(Number(value)) },
  legend: { ...topLegend(theme), data: trend.series.map((item) => item.label) },
  xAxis: {
    ...buildAxisStyle(theme),
    type: 'category',
    boundaryGap: false,
    data: trend.months.map(shortMonth)
  },
  yAxis: {
    ...buildAxisStyle(theme),
    type: 'value',
    axisLabel: { ...buildAxisStyle(theme).axisLabel, formatter: (value: number) => shortKRW(value) },
    splitLine: { lineStyle: { color: theme.splitLine } }
  },
  series: trend.series.map((item, index) => ({
    name: item.label,
    type: 'line' as const,
    stack: 'category',
    smooth: true,
    showSymbol: false,
    data: [...item.values],
    lineStyle: { width: 1, color: theme.series[index % theme.series.length] },
    itemStyle: { color: theme.series[index % theme.series.length] },
    areaStyle: { color: hexToRgba(theme.series[index % theme.series.length], 0.55) }
  }))
});

/* ── ⑨ 요일별 소비 리듬 ──────────────────────────────────────────────────────── */

/**
 * 요일별 **하루 평균** 지출.
 *
 * 🔴 합계가 아니라 평균이다 — 기록 구간에 따라 월요일이 5번, 화요일이 4번일 수 있어 합계로
 *    세우면 그 차이가 소비 습관처럼 보인다(집계 쪽 `weekdaySpending` 머리말).
 * ⚠ 기록이 없는 요일은 막대가 0 이다. 그건 "그날 안 썼다"가 아니라 "그날 기록이 없다"라
 *   툴팁이 날 수를 함께 말한다.
 */
export const weekdayOption = (
  spending: readonly ReportWeekdaySpending[],
  theme: ChartTheme
): EChartsOption => ({
  grid: { ...baseGrid, top: 16 },
  tooltip: {
    ...buildTooltipStyle(theme),
    trigger: 'axis',
    formatter: (params: unknown) => {
      const list = params as { dataIndex: number }[];
      const point = spending[list[0]?.dataIndex ?? 0];
      if (!point) return '';
      return `${point.label}요일<br/>하루 평균 ${KRW(point.average)}<br/>기록이 있던 날 ${point.days}일`;
    }
  },
  xAxis: { ...buildAxisStyle(theme), type: 'category', data: spending.map((point) => point.label) },
  yAxis: {
    ...buildAxisStyle(theme),
    type: 'value',
    axisLabel: { ...buildAxisStyle(theme).axisLabel, formatter: (value: number) => shortKRW(value) },
    splitLine: { lineStyle: { color: theme.splitLine } }
  },
  series: [
    {
      type: 'bar',
      data: spending.map((point) => point.average),
      itemStyle: { color: theme.series[2], borderRadius: [4, 4, 0, 0] }
    }
  ]
});

/* ── ⑪ 돈의 흐름 (생키) ──────────────────────────────────────────────────────── */

/**
 * 수입원 → 들어온 돈 → 지출·저축·남은 돈.
 *
 * 🔴 이 화면에서 가장 많은 것을 한 번에 말하는 그림이다 — 파이는 지출 안의 비율만, 막대는 달별
 *    크기만 보여 주는데 흐름도는 **번 돈이 어떻게 쪼개졌나**를 통째로 보여 준다.
 * ⚠ 마디 라벨을 왼쪽·오른쪽으로 갈라 놓는다. 전부 오른쪽이면 마지막 열의 글자가 캔버스 밖으로 나간다.
 */
export const sankeyOption = (
  data: { readonly nodes: readonly { readonly name: string }[]; readonly links: readonly { readonly source: string; readonly target: string; readonly value: number }[] },
  theme: ChartTheme
): EChartsOption => ({
  tooltip: {
    ...buildTooltipStyle(theme),
    trigger: 'item',
    triggerOn: 'mousemove',
    valueFormatter: (value) => KRW(Number(value))
  },
  series: [
    {
      type: 'sankey',
      left: 8,
      right: 96,
      top: 12,
      bottom: 12,
      data: data.nodes.map((node) => ({ name: node.name })),
      links: data.links.map((link) => ({ ...link })),
      emphasis: { focus: 'adjacency' },
      /*
       * 🔴 **색을 진하게**(2026-08-09 사용자 요청). 처음엔 opacity 0.35 였는데 갈래가 흐릿해
       *    어디로 얼마가 갔는지 눈으로 따라가기 어려웠다. 0.62 로 올리고 마디에 테두리를 줘
       *    갈래와 마디가 또렷이 갈린다.
       * ⚠ `gradient` 는 **양 끝 마디 색을 이어** 칠한다 — 그래서 마디 색이 진해야 갈래도 진하다.
       */
      lineStyle: { color: 'gradient', curveness: 0.45, opacity: 0.62 },
      label: { color: theme.label, fontSize: theme.labelFontSize, fontWeight: 600 },
      itemStyle: { borderWidth: 2, borderColor: theme.sliceBorder },
      /* 마디마다 다른 색을 돌려 쓴다 — 갈래가 여덟을 넘으면 색이 반복되지만 위치가 구별을 돕는다. */
      levels: [
        { depth: 0, itemStyle: { color: theme.series[0] } },
        { depth: 1, itemStyle: { color: theme.series[2] } }
      ],
      color: theme.series
    }
  ]
});

/* ── ⑫ 일별 지출 (캘린더 히트맵) ─────────────────────────────────────────────── */

/**
 * 한 해의 지출 리듬.
 *
 * 🔴 **기록이 있는 날만 칠한다.** 안 쓴 날과 안 적은 날을 0 으로 같게 칠하면 달력이 온통 한 색이
 *    되어 실제로 안 쓴 날의 뜻이 사라진다(집계 쪽 `dailySpending` 이 이미 그렇게 준다).
 * ⚠ 색 눈금(`visualMap`)을 반드시 보여 준다 — 색 진하기가 유일한 채널인 그림이라, 눈금이 없으면
 *   "진한 게 얼마인지"를 알 방법이 없다.
 */
export const calendarOption = (
  year: string,
  daily: readonly { readonly date: string; readonly amount: number }[],
  theme: ChartTheme
): EChartsOption => {
  const rows = daily.filter((point) => point.date.startsWith(year));
  const max = rows.reduce((most, point) => Math.max(most, point.amount), 0);

  return {
    tooltip: {
      ...buildTooltipStyle(theme),
      formatter: (params: unknown) => {
        const point = params as { value: [string, number] };
        return `${point.value[0]}<br/>${KRW(point.value[1])}`;
      }
    },
    visualMap: {
      min: 0,
      max: max || 1,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemWidth: 12,
      itemHeight: 90,
      textStyle: { color: theme.label, fontSize: theme.labelFontSize },
      formatter: (value: unknown) => shortKRW(Number(value)),
      inRange: { color: [hexToRgba(theme.series[0], 0.12), theme.series[0]] }
    },
    calendar: {
      top: 24,
      left: 32,
      right: 16,
      cellSize: ['auto', 14],
      range: year,
      itemStyle: { color: 'transparent', borderColor: theme.splitLine, borderWidth: 1 },
      splitLine: { show: false },
      yearLabel: { show: false },
      monthLabel: { color: theme.label, fontSize: theme.labelFontSize },
      dayLabel: { color: theme.label, fontSize: theme.labelFontSize, firstDay: 1 }
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: rows.map((point) => [point.date, point.amount])
      }
    ]
  };
};

/* ── ⑬ 항목 → 상세항목 (선버스트) ───────────────────────────────────────────── */

/**
 * 두 층 구성.
 *
 * 🔴 도넛은 한 층만 말한다 — `식비` 가 크다는 것까지는 알아도 그 안에서 무엇이 컸는지는 못 본다.
 *    시트가 이미 두 층을 갖고 있으므로 버릴 이유가 없다.
 * ⚠ 안쪽 고리에만 이름을 쓴다. 바깥까지 쓰면 좁은 폭에서 글자가 서로를 덮는다 — 바깥은 툴팁이 말한다.
 */
export const sunburstOption = (
  nodes: readonly { readonly name: string; readonly value: number; readonly children?: readonly { readonly name: string; readonly value: number }[] }[],
  theme: ChartTheme
): EChartsOption => ({
  tooltip: { ...buildTooltipStyle(theme), trigger: 'item', valueFormatter: (value) => KRW(Number(value)) },
  series: [
    {
      type: 'sunburst',
      radius: ['18%', '90%'],
      center: ['50%', '50%'],
      sort: undefined,
      data: nodes.map((node) => ({
        name: node.name,
        value: node.value,
        children: node.children?.map((child) => ({ name: child.name, value: child.value }))
      })),
      levels: [
        {},
        {
          r0: '18%',
          r: '52%',
          label: { rotate: 'tangential', color: theme.label, fontSize: theme.labelFontSize, minAngle: 18 },
          itemStyle: { borderWidth: 2, borderColor: theme.sliceBorder }
        },
        {
          r0: '52%',
          r: '90%',
          /* 🔴 바깥 고리는 글자를 쓰지 않는다 — 좁은 폭에서 서로를 덮는다. 툴팁이 이름을 진다. */
          label: { show: false },
          itemStyle: { borderWidth: 1, borderColor: theme.sliceBorder, opacity: 0.75 }
        }
      ],
      color: theme.series
    }
  ]
});

/* ── ⑮ 레이더 (이번 달 vs 평소) ─────────────────────────────────────────────── */

/**
 * 어느 축이 튀었나.
 *
 * 🔴 추이 그래프는 항목별로 따로 봐야 하는데 레이더는 **한 그림에서 튀는 축**을 찾게 해 준다.
 * ⚠ 두 겹을 다 채우면 아래 겹이 안 보인다 — 이번 달만 옅게 채우고 평소는 선으로 둔다.
 */
export const radarOption = (
  axes: readonly { readonly label: string; readonly max: number; readonly latest: number; readonly average: number }[],
  theme: ChartTheme
): EChartsOption => ({
  tooltip: { ...buildTooltipStyle(theme), valueFormatter: (value) => KRW(Number(value)) },
  legend: { ...buildLegendStyle(theme), top: 0, data: ['이번 달', '평소'] },
  radar: {
    center: ['50%', '56%'],
    radius: '62%',
    indicator: axes.map((axis) => ({ name: axis.label, max: axis.max })),
    axisName: { color: theme.label, fontSize: theme.labelFontSize },
    splitLine: { lineStyle: { color: theme.splitLine } },
    splitArea: { show: false },
    axisLine: { lineStyle: { color: theme.splitLine } }
  },
  series: [
    {
      type: 'radar',
      data: [
        {
          name: '이번 달',
          value: axes.map((axis) => Math.round(axis.latest)),
          lineStyle: { color: theme.series[0], width: 2 },
          itemStyle: { color: theme.series[0] },
          areaStyle: { color: hexToRgba(theme.series[0], 0.22) }
        },
        {
          name: '평소',
          value: axes.map((axis) => Math.round(axis.average)),
          lineStyle: { color: theme.series[3], width: 2, type: 'dashed' },
          itemStyle: { color: theme.series[3] },
          /* 🔴 평소는 채우지 않는다 — 두 겹을 다 채우면 아래가 안 보인다. */
          areaStyle: undefined
        }
      ]
    }
  ]
});

/* ── ⑲ 가로 쌓은 막대 (bar-y-category-stack) ────────────────────────────────── */

/**
 * 이름이 긴 축을 세로에 두고 **가로로 쌓는다.**
 *
 * 🔴 결제수단·계좌처럼 **이름이 길고 개수가 적은** 축에 맞다. 세로 막대에 두면 이름이 기울어지거나
 *    잘리는데, 가로로 두면 그대로 읽힌다.
 * ⚠ 쌓기는 **한 축이 여러 조각으로 나뉠 때만** 뜻이 있다. 조각이 하나뿐이면 그냥 가로 막대다
 *   (`horizontalBarOption`).
 */
export const stackedHorizontalOption = (
  params: {
    readonly categories: readonly string[];
    readonly series: readonly { readonly label: string; readonly values: readonly number[] }[];
  },
  theme: ChartTheme
): EChartsOption => ({
  grid: legendGrid,
  tooltip: {
    ...buildTooltipStyle(theme),
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    valueFormatter: (value) => KRW(Number(value))
  },
  legend: { ...topLegend(theme), data: params.series.map((item) => item.label) },
  xAxis: {
    ...buildAxisStyle(theme),
    type: 'value',
    axisLabel: { ...buildAxisStyle(theme).axisLabel, formatter: (value: number) => shortKRW(value) },
    splitLine: { lineStyle: { color: theme.splitLine } }
  },
  /* 🔴 가로 막대는 아래에서 위로 쌓인다 — 큰 것이 위에 오게 뒤집어 넣는다. */
  yAxis: { ...buildAxisStyle(theme), type: 'category', data: [...params.categories].reverse() },
  series: params.series.map((item, index) => ({
    name: item.label,
    type: 'bar' as const,
    stack: 'total',
    data: [...item.values].reverse(),
    itemStyle: { color: theme.series[index % theme.series.length] }
  }))
});

/* ── ⑳ 로즈 파이 (pie-roseType) ─────────────────────────────────────────────── */

/**
 * 각도 + **반지름** 두 채널을 쓰는 파이.
 *
 * 🔴 **주기(cycle)가 있는 값에만 쓴다** — 여기서는 요일이다. 일곱 조각이 한 바퀴를 도는 것이
 *    한 주가 도는 것과 같아서, 그림 모양 자체가 "리듬"을 말한다.
 * ⚠ 일반 구성(항목별 지출)에는 쓰지 않는다. 로즈는 반지름까지 값에 묶어 **면적이 값에 비례하지
 *   않으므로**, 크기를 눈으로 비교해야 하는 자리에서는 도넛보다 부정확하다.
 * ⚠ 하루 평균을 쓴다 — 합계로 그리면 요일마다 날 수가 달라 그 차이가 리듬처럼 보인다.
 */
export const roseOption = (
  spending: readonly ReportWeekdaySpending[],
  theme: ChartTheme
): EChartsOption => ({
  tooltip: {
    ...buildTooltipStyle(theme),
    trigger: 'item',
    formatter: (params: unknown) => {
      const point = params as { dataIndex: number };
      const row = spending[point.dataIndex];
      if (!row) return '';
      return `${row.label}요일<br/>하루 평균 ${KRW(row.average)}<br/>기록이 있던 날 ${row.days}일`;
    }
  },
  legend: { ...buildLegendStyle(theme), bottom: 0, type: 'scroll' },
  series: [
    {
      type: 'pie',
      radius: ['16%', '72%'],
      center: ['50%', '44%'],
      roseType: 'area',
      itemStyle: { borderRadius: 4, borderColor: theme.sliceBorder, borderWidth: 2 },
      label: { show: false },
      labelLine: { show: false },
      data: spending.map((row) => ({ name: `${row.label}요일`, value: Math.round(row.average) })),
      color: theme.series
    }
  ]
});
