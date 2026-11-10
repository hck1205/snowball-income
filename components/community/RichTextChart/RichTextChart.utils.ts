import type { EChartsOption } from 'echarts';
import type { RichChartData } from '@/shared/lib/richtext';
import { buildAxisStyle, buildLegendStyle, buildTooltipStyle, getChartTheme } from '@/shared/styles';

/** 축·툴팁·막대 끝 숫자 표기 — 큰 수는 억·만으로 줄인다(원 단위 그대로면 축이 읽히지 않는다). */
export const formatChartNumber = (value: number): string => {
  const abs = Math.abs(value);
  if (abs >= 100_000_000) return `${Number((value / 100_000_000).toFixed(1))}억`;
  if (abs >= 10_000) return `${Math.round(value / 10_000).toLocaleString('ko-KR')}만`;
  return Number(value.toFixed(2)).toLocaleString('ko-KR');
};

/**
 * 막대를 **가로로** 눕힐지(2026-11-10). 항목이 많거나 이름이 길면 세로 막대의 가로축 라벨이
 * 솎아져 읽히지 않는다(12개 종목 표에서 4개만 보였다) — 눕히면 이름이 세로로 한 줄씩 다 선다.
 */
export const RICH_CHART_HORIZONTAL_MIN_CATEGORIES = 7;
export const RICH_CHART_HORIZONTAL_MIN_LABEL = 7;

export const isHorizontalBar = (data: RichChartData): boolean =>
  data.kind === 'bar' &&
  (data.categories.length >= RICH_CHART_HORIZONTAL_MIN_CATEGORIES ||
    data.categories.some((label) => label.length >= RICH_CHART_HORIZONTAL_MIN_LABEL));

/** 가로 막대 한 줄 높이(px). 시리즈가 여럿이면 한 줄에 막대가 겹쳐 서므로 조금 더 준다. */
const ROW_HEIGHT = 30;
const ROW_HEIGHT_MULTI = 44;
/** 세로 차트 높이(px). */
export const RICH_CHART_HEIGHT = 240;

/** 차트 높이 — 가로 막대는 항목 수에 비례해 키운다(줄 간격이 일정해야 이름과 막대가 짝지어 읽힌다). */
export const richChartHeight = (data: RichChartData): number => {
  if (!isHorizontalBar(data)) return RICH_CHART_HEIGHT;
  const row = data.series.length > 1 ? ROW_HEIGHT_MULTI : ROW_HEIGHT;
  const legend = data.series.length > 1 ? 32 : 0;
  return data.categories.length * row + legend + 16;
};

/** 모든 값이 작은 정수(개수 같은 것)면 축 눈금을 정수로만 — "2.5곳" 같은 눈금을 막는다. */
const isCountLike = (data: RichChartData): boolean =>
  data.series.every((item) => item.values.every((value) => value === null || (Number.isInteger(value) && Math.abs(value) < 1000)));

export const buildRichChartOption = (data: RichChartData): EChartsOption => {
  const theme = getChartTheme();
  const axis = buildAxisStyle(theme);
  const isBar = data.kind === 'bar';
  const horizontal = isHorizontalBar(data);
  const multi = data.series.length > 1;
  const labelStyle = { color: theme.label, fontSize: theme.labelFontSize, fontFamily: theme.fontFamily };

  const categoryAxis = {
    type: 'category' as const,
    boundaryGap: isBar,
    data: [...data.categories],
    ...axis,
    splitLine: { show: false },
    // 가로 막대는 표와 같은 순서(위 → 아래)로 읽히게 뒤집는다.
    ...(horizontal ? { inverse: true, axisTick: { show: false }, axisLabel: { ...labelStyle, color: theme.text } } : {})
  };
  const valueAxis = {
    type: 'value' as const,
    ...axis,
    axisLine: { show: false },
    minInterval: isCountLike(data) ? 1 : undefined,
    // 가로 막대는 막대 끝에 값을 적으므로 값 축 라벨은 숨긴다(같은 숫자를 두 번 말하지 않는다).
    axisLabel: horizontal ? { show: false } : { ...labelStyle, formatter: (value: number) => formatChartNumber(value) },
    splitLine: horizontal ? { show: false } : axis.splitLine
  };

  return {
    animation: false,
    grid: horizontal
      ? { left: 8, right: 64, top: multi ? 32 : 4, bottom: 4, containLabel: true }
      : { left: 56, right: 16, top: multi ? 36 : 16, bottom: 32 },
    legend: multi ? { top: 0, left: 0, ...buildLegendStyle(theme) } : undefined,
    tooltip: {
      trigger: 'axis',
      ...buildTooltipStyle(theme),
      valueFormatter: (value: unknown) => (value === null || value === undefined ? '-' : formatChartNumber(Number(value)))
    },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis,
    series: data.series.map((item, index) => {
      const color = theme.series[index % theme.series.length];
      if (!isBar) {
        return {
          type: 'line' as const,
          name: item.name,
          data: [...item.values],
          smooth: true,
          showSymbol: false,
          connectNulls: false,
          lineStyle: { width: 2, color },
          itemStyle: { color }
        };
      }
      return {
        type: 'bar' as const,
        name: item.name,
        data: [...item.values],
        barMaxWidth: horizontal ? 18 : 40,
        itemStyle: { color, borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0] },
        // 막대 끝 값 — 가로 막대에서만(세로는 축 눈금이 같은 일을 한다).
        label: horizontal
          ? {
              show: true,
              position: 'right' as const,
              ...labelStyle,
              color: theme.text,
              formatter: (params: { value?: unknown }) => formatChartNumber(Number(params.value))
            }
          : undefined
      };
    })
  };
};
