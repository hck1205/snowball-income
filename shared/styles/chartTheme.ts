import { DEFAULT_THEME_PRESET, THEME_PRESETS } from './presets';
import type { PalettePresetId } from '@/shared/constants/palette';
import type { ThemeTokens } from './semantic';
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
 * 토큰 객체 → ChartTheme. `getChartTheme`과 **동일한 형태**를 만들되 DOM을 전혀 읽지 않는다.
 */
const toChartTheme = (tokens: ThemeTokens): ChartTheme => ({
  axisLine: tokens['chart-axis-line'],
  splitLine: tokens['chart-split-line'],
  label: tokens['chart-label'],
  sliceBorder: tokens['chart-slice-border'],
  text: tokens.text,
  textMuted: tokens['text-muted'],
  brand: tokens.brand,
  accent: tokens.accent,
  series: Array.from({ length: 8 }, (_unused, index) => tokens[`chart-series-${index}`]),
  fontFamily: font.sans,
  labelFontSize: 12
});

/**
 * **인쇄(PDF 리포트) 전용** 차트 테마 — 현재 프리셋의 **라이트** 토큰을 고정으로 쓴다.
 *
 * 다크 모드 사용자도 종이/PDF에서는 라이트로 나가야 잉크와 가독성이 맞는다. 이때
 * `document.documentElement.dataset.theme = 'light'` 로 강제하면 두 가지가 깨진다:
 *  1. `:root` 스코프라 화면 전체가 번쩍인다(서브트리만 라이트로 못 만든다).
 *  2. 화면 차트 옵션의 useMemo는 `palettePresetAtom`에만 의존하므로 재빌드되지 않는다
 *     → 캔버스가 다크 색 그대로 남는다(팔레트 stale-by-one 사고와 같은 구조).
 *
 * 그래서 DOM을 건드리지 않고 레지스트리에서 토큰을 **직접 읽는 순수 함수**로 만든다.
 * 알 수 없는 프리셋 id는 기본 프리셋 라이트로 폴백한다.
 */
export const getPrintChartTheme = (presetId: PalettePresetId | string): ChartTheme =>
  toChartTheme((THEME_PRESETS[presetId as PalettePresetId] ?? DEFAULT_THEME_PRESET).light);

/** 인쇄용 CSS 변수 소스가 되는 라이트 토큰 묶음. 리포트 루트에 인라인으로 주입한다. */
export const getPrintThemeTokens = (presetId: PalettePresetId | string): ThemeTokens =>
  (THEME_PRESETS[presetId as PalettePresetId] ?? DEFAULT_THEME_PRESET).light;

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
