import { LIGHT_THEME } from './semantic';
import { font } from './tokens';

/**
 * ECharts는 캔버스에 그리므로 `var(--sb-*)`를 해석하지 못한다.
 * 옵션을 만드는 시점에 실제 색 값으로 해석해서 넘겨준다.
 *
 * - 브라우저: `getComputedStyle(:root)`에서 현재 테마(라이트/다크)의 실제 값을 읽는다.
 * - jsdom/SSR: 변수가 없으면 빈 문자열이 오므로 라이트 값으로 폴백한다.
 *   → 테스트는 항상 결정적인 라이트 값을 얻는다.
 *
 * 폴백은 `LIGHT_THEME`에서 직접 가져온다. 예전엔 hex를 복사해 둬서 토큰을 바꿔도 폴백은
 * 옛날 색 그대로였다(테스트만 통과하는 유령 값).
 */

const FALLBACK = {
  axisLine: LIGHT_THEME['chart-axis-line'],
  splitLine: LIGHT_THEME['chart-split-line'],
  label: LIGHT_THEME['chart-label'],
  sliceBorder: LIGHT_THEME['chart-slice-border'],
  text: LIGHT_THEME.text,
  textMuted: LIGHT_THEME['text-muted'],
  brand: LIGHT_THEME.brand
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

/**
 * 축/그리드 공통 스타일.
 *
 * 데이터 잉크 비율(Tufte): 격자·축선은 **데이터를 읽는 데 필요한 만큼만** 남긴다.
 *  - 축선(axisLine)은 끈다. 격자선이 이미 스케일을 말하고 있어서 중복이다.
 *  - 눈금(axisTick)도 끈다 — 라벨이 눈금 역할을 한다.
 *  - 격자선(splitLine)만 아주 옅게 남긴다. 이게 값을 가늠하는 유일한 보조선이다.
 */
export const buildAxisStyle = (theme: ChartTheme) => ({
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: {
    color: theme.label,
    fontSize: theme.labelFontSize,
    fontFamily: theme.fontFamily
  },
  splitLine: { show: true, lineStyle: { color: theme.splitLine } }
});

export const buildTooltipStyle = (theme: ChartTheme) => ({
  /**
   * 툴팁 배경은 카드 서피스(`sliceBorder`가 곧 surface 값이다)라 다크에서도 자동으로 따라온다.
   * 그림자는 elevation 3과 같은 무게로 맞춘다.
   */
  backgroundColor: theme.sliceBorder,
  borderColor: theme.axisLine,
  borderWidth: 1,
  padding: [10, 12] as [number, number],
  textStyle: {
    color: theme.text,
    fontSize: 12,
    fontFamily: theme.fontFamily
  },
  extraCssText: 'border-radius: 12px; box-shadow: 0 12px 32px rgba(15, 25, 35, 0.18); backdrop-filter: blur(2px);'
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
