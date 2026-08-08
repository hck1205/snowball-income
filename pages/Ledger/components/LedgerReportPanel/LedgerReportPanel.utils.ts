import type { EChartsOption } from 'echarts';
import { buildAxisStyle, buildLegendStyle, buildTooltipStyle, hexToRgba } from '@/shared/styles';
import type { ChartTheme } from '@/shared/styles';
import type {
  ReportFixitySplit,
  ReportMonthlyFlow,
  ReportNetWorthPoint,
  ReportPayerMonth,
  ReportSlice
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

const baseGrid = { left: 8, right: 8, top: 32, bottom: 8, containLabel: true } as const;

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
  grid: baseGrid,
  tooltip: {
    ...buildTooltipStyle(theme),
    trigger: 'axis',
    valueFormatter: undefined
  },
  legend: { ...buildLegendStyle(theme), data: ['수입', '지출', '저축률'] },
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
    legend: { ...buildLegendStyle(theme), type: 'scroll', bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        center: ['50%', '44%'],
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
  grid: baseGrid,
  tooltip: { ...buildTooltipStyle(theme), trigger: 'axis', valueFormatter: (value) => KRW(Number(value)) },
  legend: { ...buildLegendStyle(theme), data: ['고정비', '변동비'] },
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
  grid: baseGrid,
  tooltip: { ...buildTooltipStyle(theme), trigger: 'axis', valueFormatter: (value) => KRW(Number(value)) },
  legend: { ...buildLegendStyle(theme), data: [...payers] },
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
