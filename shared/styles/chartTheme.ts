import { DEFAULT_THEME_PRESET } from './presets';
import { hexToRgb } from './contrast';
import { font } from './tokens';

/**
 * ECharts는 캔버스에 그리므로 `var(--sb-*)`를 해석하지 못한다.
 * 옵션을 만드는 시점에 실제 색 값으로 해석해서 넘겨준다.
 *
 * - 브라우저: `getComputedStyle(:root)`에서 현재 프리셋·테마(라이트/다크)의 실제 값을 읽는다.
 * - jsdom/SSR: 변수가 없으면 빈 문자열이 오므로 **기본 프리셋(velog) 라이트**로 폴백한다.
 *   → 테스트는 항상 결정적인 값을 얻는다 (= 앱의 실제 기본 화면과 동일).
 *
 * 폴백은 프리셋 레지스트리에서 직접 가져온다. 예전엔 hex를 복사해 둬서 토큰을 바꿔도 폴백은
 * 옛날 색 그대로였다(테스트만 통과하는 유령 값).
 *
 * ⚠ 캔버스는 CSS 변수를 다시 읽지 않는다 — **프리셋(또는 OS 라이트/다크) 전환 시 차트 옵션을
 * 다시 빌드해야 한다.** 옵션을 만드는 useMemo 의존성에 `palettePresetAtom` 값을 넣는 것으로 해결한다
 * (useMainComputed / ChartPanel / MonthlyCashflow 참고).
 */

const FALLBACK_TOKENS = DEFAULT_THEME_PRESET.light;

const FALLBACK = {
  axisLine: FALLBACK_TOKENS['chart-axis-line'],
  splitLine: FALLBACK_TOKENS['chart-split-line'],
  label: FALLBACK_TOKENS['chart-label'],
  sliceBorder: FALLBACK_TOKENS['chart-slice-border'],
  text: FALLBACK_TOKENS.text,
  textMuted: FALLBACK_TOKENS['text-muted'],
  brand: FALLBACK_TOKENS.brand,
  accent: FALLBACK_TOKENS.accent,
  series: Array.from({ length: 8 }, (_, index) => FALLBACK_TOKENS[`chart-series-${index}`])
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
  /** 액센트 — area gradient의 꼬리 색(장식). 데이터 방향 의미 아님. */
  accent: string;
  /**
   * 카테고리 시리즈 8색 (`--sb-chart-series-0..7`) — 현재 프리셋의 세트.
   * 파이 조각·시리즈 라인 등 캔버스 색은 전부 여기서 가져간다(구 `CHART_SERIES` 대체).
   */
  series: string[];
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
  accent: readVar('--sb-accent', FALLBACK.accent),
  series: FALLBACK.series.map((fallback, index) => readVar(`--sb-chart-series-${index}`, fallback)),
  fontFamily: font.sans,
  labelFontSize: 12
});

/**
 * `#rrggbb`(축약형 #rgb 포함) → `rgba(r, g, b, a)` 문자열.
 *
 * 캔버스(ECharts) 그라데이션 colorStops 용이다 — 캔버스는 `var()`도, hex+별도 알파도
 * 못 받으므로 rgba 문자열로 조립해야 한다. `getChartTheme()`이 돌려주는 실제 hex와
 * 함께 쓴다 (예: `hexToRgba(theme.brand, 0.3)`).
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

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
   * 그림자는 elevation 3 토큰을 그대로 쓴다 — 캔버스와 달리 툴팁은 HTML DOM 요소라
   * `var()`가 해석되고, 새 쿨 틴트(rgba(13, 32, 58, …))·다크 값도 자동 승계된다.
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
  extraCssText: 'border-radius: 12px; box-shadow: var(--sb-shadow-3); backdrop-filter: blur(2px);'
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
