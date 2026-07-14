import { font } from './tokens';

/**
 * ECharts는 캔버스에 그리므로 `var(--sb-*)`를 해석하지 못한다.
 * 옵션을 만드는 시점에 실제 색 값으로 해석해서 넘겨준다.
 *
 * - 브라우저: `getComputedStyle(:root)`에서 현재 테마(라이트/다크)의 실제 값을 읽는다.
 * - jsdom/SSR: 변수가 없으면 빈 문자열이 오므로 라이트 값으로 폴백한다.
 *   → 테스트는 항상 결정적인 라이트 값을 얻는다.
 */

const FALLBACK = {
  axisLine: '#d8e0e8',
  splitLine: '#eef2f6',
  label: '#4a5b6b',
  sliceBorder: '#ffffff',
  text: '#14212e',
  textMuted: '#64748b',
  brand: '#2f6f93'
} as const;

const readVar = (name: string, fallback: string): string => {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return fallback;

  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value.length > 0 ? value : fallback;
};

export type ChartTheme = {
  axisLine: string;
  splitLine: string;
  label: string;
  sliceBorder: string;
  text: string;
  textMuted: string;
  brand: string;
  fontFamily: string;
  labelFontSize: number;
};

export const getChartTheme = (): ChartTheme => ({
  axisLine: readVar('--sb-chart-axis-line', FALLBACK.axisLine),
  splitLine: readVar('--sb-chart-split-line', FALLBACK.splitLine),
  label: readVar('--sb-chart-label', FALLBACK.label),
  sliceBorder: readVar('--sb-chart-slice-border', FALLBACK.sliceBorder),
  text: readVar('--sb-text', FALLBACK.text),
  textMuted: readVar('--sb-text-muted', FALLBACK.textMuted),
  brand: readVar('--sb-brand', FALLBACK.brand),
  fontFamily: font.sans,
  labelFontSize: 12
});

/** 축/그리드 공통 스타일. 눈금선은 은은하게, 축선은 거의 지운다. */
export const buildAxisStyle = (theme: ChartTheme) => ({
  axisLine: { show: true, lineStyle: { color: theme.axisLine } },
  axisTick: { show: false },
  axisLabel: {
    color: theme.label,
    fontSize: theme.labelFontSize,
    fontFamily: theme.fontFamily
  },
  splitLine: { show: true, lineStyle: { color: theme.splitLine } }
});

export const buildTooltipStyle = (theme: ChartTheme) => ({
  backgroundColor: theme.sliceBorder,
  borderColor: theme.axisLine,
  borderWidth: 1,
  padding: [8, 10] as [number, number],
  textStyle: {
    color: theme.text,
    fontSize: 12,
    fontFamily: theme.fontFamily
  },
  extraCssText: 'border-radius: 8px; box-shadow: 0 6px 20px rgba(15, 25, 35, 0.16);'
});

export const buildLegendStyle = (theme: ChartTheme) => ({
  textStyle: {
    color: theme.label,
    fontSize: theme.labelFontSize,
    fontFamily: theme.fontFamily
  },
  itemWidth: 12,
  itemHeight: 12,
  itemGap: 14,
  icon: 'roundRect' as const
});
