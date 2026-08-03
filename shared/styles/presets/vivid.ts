/* -------------------------------------------------------------------------- */
/* vivid — 비비드 핀테크 (경쾌·활기)                                              */
/* -------------------------------------------------------------------------- */

import type { ThemeTokens } from '../semantic';
import { chartSeriesTokens, type ChartSeries } from './chartSeriesTokens';
import { buildAuroraGradient, buildCtaGradient } from './gradients';
import { COMMON_DARK, COMMON_LIGHT } from './sharedTokens';

/** vivid: 시리즈 0 = 일렉트릭 블루(vs violet ΔE 39.94), green → 민트 #00997e(vs olive ΔE 66.16). */
const VIVID_CHART_SERIES: ChartSeries = [
  '#2d5bf5',
  '#c26d22',
  '#00997e',
  '#cf5f7d',
  '#8b6fc9',
  '#9a7b14',
  '#9c4f92',
  '#6b7785'
];

/**
 * 라벤더 화이트 + 일렉트릭 블루 + 민트/퍼플. AA 조정:
 *  - #3d6bff는 흰 라벨 4.43:1 미달 → 라이트 brand #2d5bf5(5.35:1).
 *  - #00c9a7·#7c5cff는 라이트에서 미달 → 라이트용 #00997e(표시 3.58)/#007a64(텍스트 5.29),
 *    #7c5cff는 표시(4.34≥3)로만, 텍스트는 #5b3de6(6.44).
 * 다크 글로우 알파는 **0.12/0.10 상한** — 0.16/0.14에서 text-muted가 글로우 최악 지점
 * 4.27:1로 탈락했다(실측). 현 값 기준 4.92:1.
 */
export const VIVID_LIGHT: ThemeTokens = {
  /*
   * 🔴 **순백 캔버스**(2026-08-03 사용자 결정 — "페이지 전체 배경색이 흰색"). 구 값 라벤더 틴트(#eef0ff).
   * bg = surface = surface-raised 가 전부 흰색이 되면서 **면색이 카드의 격을 말하지 못한다** —
   * 그 일은 아래 `border`(헤어라인)·여백·그림자가 이어받았다. 라벤더는 `surface-hover`·brand 축에 남는다.
   * 부수 효과: border-strong on bg 3.56 · 글로우 최악 4.72 제약이 둘 다 풀렸다.
   */
  bg: '#ffffff',
  surface: '#ffffff',
  'surface-raised': '#ffffff',
  'surface-muted': '#fafbff',
  'surface-sunken': '#e9edfc',
  'surface-hover': '#eef0ff',

  /* 🔴 흰 캔버스의 주역. 구 1.30:1 → 새 1.44:1. */
  border: '#d1d7eb',
  'border-strong': '#737e9d',

  text: '#171c33',
  'text-secondary': '#454f6e',
  'text-muted': '#57627f',
  'text-inverse': '#ffffff',

  brand: '#2d5bf5',
  'brand-hover': '#1e46d6',
  'brand-subtle': '#e8eeff',
  'brand-subtle-hover': '#d6e0ff',
  'brand-border': '#b3c6ff',
  'brand-text': '#2447cf',
  'on-brand': '#ffffff',

  accent: '#00997e',
  'accent-text': '#007a64',
  'accent-subtle': '#dcfaf3',
  'accent-border': '#86e8d3',
  'accent-alt': '#0aa155',
  'accent-alt-text': '#03772c',
  'accent-alt-subtle': '#e4f5ec',
  'accent-alt-border': '#9dd9bb',

  ...COMMON_LIGHT,

  overlay: 'rgba(23, 26, 51, 0.5)',
  'focus-ring': '#2d5bf5',
  'focus-shadow': 'rgba(45, 91, 245, 0.25)',

  /* 살짝 컬러 섀도 — 경쾌함의 디테일 */
  'shadow-1': '0 1px 2px rgba(23, 26, 51, 0.06), 0 1px 3px rgba(23, 26, 51, 0.08)',
  /* ⚠ e2 만 올렸다 — raised 는 테두리 없이 이 그림자 하나로 선다. */
  'shadow-2': '0 1px 2px rgba(45, 91, 245, 0.06), 0 6px 18px rgba(23, 26, 51, 0.13)',
  'shadow-3': '0 4px 10px rgba(45, 91, 245, 0.08), 0 12px 32px rgba(23, 26, 51, 0.18)',

  'ribbon-stop-1': '#2d5bf5',
  'ribbon-stop-2': '#00997e',
  'ribbon-stop-3': '#7c5cff',
  'cta-stop-1': '#2d5bf5',
  'cta-stop-2': '#007a64',
  'cta-stop-3': '#5b3de6',
  'progress-track': '#e9edfc',

  'gradient-aurora': buildAuroraGradient(['#2d5bf5', '#00997e', '#7c5cff']),
  'gradient-cta': buildCtaGradient(['#2d5bf5', '#007a64', '#5b3de6']),
  /* 히어로 면 — 채도 강한 프리셋이라 캐스트를 라이트 0.16/0.13 으로 잡았다. 최악 text-muted 4.98:1. */
  /* 히어로 면 — 단색. hero = surface / soft = surface-muted. */
  'gradient-hero': '#ffffff',
  'gradient-hero-soft': '#fafbff',
  /* 단색층만 새 bg(#eef0ff)로 — 알파 0.07/0.06은 유지 가능(글로우 최악 4.72 실측) */
  /* 🔴 상단 글로우를 걷었다. 다크 글로우는 남긴다. */
  'bg-glow': '#ffffff',
  'surface-glass': 'rgba(255, 255, 255, 0.8)',
  'surface-glass-fallback': '#ffffff',

  'chart-axis-line': '#d6ddf2',
  'chart-split-line': '#e9edfc',
  'chart-label': '#454f6e',
  'chart-slice-border': '#ffffff',

  ...chartSeriesTokens(VIVID_CHART_SERIES),

  'picker-filter': 'none'
};

export const VIVID_DARK: ThemeTokens = {
  /* 딥 인디고 */
  bg: '#101223',
  surface: '#1a1e38',
  'surface-raised': '#262b4f',
  'surface-muted': '#202544',
  'surface-sunken': '#151831',
  'surface-hover': '#2d335c',

  border: '#313a63',
  'border-strong': '#6d7aa8',

  text: '#eaedfb',
  'text-secondary': '#aeb6d9',
  'text-muted': '#929cc4',
  'text-inverse': '#101223',

  brand: '#3d63f2',
  'brand-hover': '#2e51d8',
  'brand-subtle': '#1b2a5c',
  'brand-subtle-hover': '#223471',
  'brand-border': '#3a4d99',
  'brand-text': '#9db4ff',
  'on-brand': '#ffffff',

  accent: '#00c9a7',
  'accent-text': '#00c9a7',
  'accent-subtle': '#0e3330',
  'accent-border': '#16665a',
  'accent-alt': '#61f299',
  'accent-alt-text': '#61f299',
  'accent-alt-subtle': '#132423',
  'accent-alt-border': '#285441',

  ...COMMON_DARK,

  overlay: 'rgba(5, 7, 20, 0.68)',
  'focus-ring': '#9db4ff',
  'focus-shadow': 'rgba(157, 180, 255, 0.3)',

  /* aurora 다크 값 재사용 — 다크 그림자는 프리셋 개성 요소가 아니다 */
  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)',
  'shadow-2': '0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)',
  'shadow-3': '0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)',

  'ribbon-stop-1': '#6a8aff',
  'ribbon-stop-2': '#00c9a7',
  'ribbon-stop-3': '#9d86ff',
  'cta-stop-1': '#3d63f2',
  'cta-stop-2': '#00806a',
  'cta-stop-3': '#6a4df0',
  'progress-track': '#151831',

  'gradient-aurora': buildAuroraGradient(['#6a8aff', '#00c9a7', '#9d86ff']),
  'gradient-cta': buildCtaGradient(['#3d63f2', '#00806a', '#6a4df0']),
  /* 히어로 면 — 다크 최악 text-muted 5.43:1 / soft 6.10:1(실측). */
  /* 히어로 면 — 단색. 다크는 면 밝기 위계를 지킨다. */
  'gradient-hero': '#1a1e38',
  'gradient-hero-soft': '#202544',
  /* 알파 0.12/0.10 상한 — 0.16에서 text-muted 4.27:1 탈락 실측. 올리지 마라. */
  'bg-glow':
    'radial-gradient(1100px 600px at 18% -10%, rgba(0, 201, 167, 0.12), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(157, 134, 255, 0.10), transparent 55%), #101223',
  'surface-glass': 'rgba(38, 43, 79, 0.85)',
  'surface-glass-fallback': '#262b4f',

  'chart-axis-line': '#343c68',
  'chart-split-line': '#232849',
  'chart-label': '#aeb6d9',
  'chart-slice-border': '#1a1e38',

  ...chartSeriesTokens(VIVID_CHART_SERIES),

  'picker-filter': 'invert(0.86)'
};
