import type { EChartsOption } from 'echarts';
import { buildAxisStyle, buildLegendStyle, buildTooltipStyle, hexToRgba } from '@/shared/styles';
import type { ChartTheme } from '@/shared/styles';
import type {
  ReportCumulativePoint,
  ReportFixitySplit,
  ReportMonthlyFlow,
  ReportNetWorthPoint,
  ReportPayerMonth,
  ReportSlice,
  ReportWeekdaySpending
} from '../../utils';

/**
 * **차트 옵션 빌더** — 순수 함수만. 컴포넌트는 이걸 그리기만 한다.
 *
 * ## 🔴 이 화면의 색 규율
 *
 * - **손익색 금지.** 지출을 빨강으로, 수입을 초록으로 칠하지 않는다. 가계부의 수입·지출은
 *   손익(P&L)이 아니다 — 월세를 냈다고 손해를 본 것이 아니다.
 * - **색 단독 채널 금지.** 어떤 계열도 색만으로 구별되지 않는다 — 범례 이름과 툴팁 숫자가
 *   언제나 함께 선다. 그래서 범례를 끄지 않는다.
 * - **하드코딩 hex 0개.** 색은 전부 `ChartTheme`(=CSS 변수)에서 온다. 프리셋·다크모드가 따라온다.
 *
 * ## ⚠ 달 이름을 축약하지 않는다
 *
 * `8월` 로 줄이면 해가 넘어갈 때 작년 8월과 올해 8월이 같은 글자가 된다. `26.08` 로 적는다.
 */

/** `2026-08` → `26.08`. 축에 들어갈 짧은 표기이되 **해를 버리지 않는다.** */
export const shortMonth = (month: string): string => {
  const [year, value] = month.split('-');
  return `${year.slice(2)}.${value}`;
};

const KRW = (value: number): string => `${Math.round(value).toLocaleString('ko-KR')}원`;

/** 축 라벨용 — 만/억 단위로 접는다. 원 단위 그대로면 축이 숫자로 뒤덮인다. */
const shortKRW = (value: number): string => {
  const abs = Math.abs(value);
  if (abs >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000) return `${Math.round(value / 10_000).toLocaleString('ko-KR')}만`;
  return `${Math.round(value)}`;
};

/**
 * 격자 여백.
 *
 * 🔴 **범례가 있는 차트는 위를 더 비운다**(2026-08-09 사용자 지적). ECharts 의 범례는 기본으로
 *    맨 위(top: 0)에 그려지는데, 격자가 32px 에서 시작하면 축 라벨과 범례가 겹친다.
 *    범례 높이(약 22px) + 숨 쉴 틈을 더해 **64px** 부터 그린다.
 * ⚠ 범례가 없는 차트에 같은 값을 쓰면 위가 휑하다 — 그래서 둘로 나눈다.
 */
const baseGrid = { left: 8, right: 8, top: 24, bottom: 8, containLabel: true } as const;

/** 범례가 있는 차트용. 🔴 위 여백이 범례를 피한다. */
const legendGrid = { left: 8, right: 8, top: 64, bottom: 8, containLabel: true } as const;

/** 범례 자체도 위에서 조금 내려 카드 제목과 붙지 않게 한다. */
const topLegend = (theme: ChartTheme) => ({ ...buildLegendStyle(theme), top: 4, type: 'scroll' as const });

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
      /* 곡선이 완만해야 여러 갈래가 겹쳐도 따라갈 수 있다. */
      lineStyle: { color: 'gradient', curveness: 0.45, opacity: 0.35 },
      label: { color: theme.label, fontSize: theme.labelFontSize },
      itemStyle: { borderWidth: 0 },
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
