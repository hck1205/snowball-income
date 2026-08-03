/* -------------------------------------------------------------------------- */
/* sunset — 웜 코랄/앰버 (노을)                                                  */
/* -------------------------------------------------------------------------- */

import type { ThemeTokens } from '../semantic';
import { chartSeriesTokens, type ChartSeries } from './chartSeriesTokens';
import { buildAuroraGradient, buildDuotoneGradient } from './gradients';
import { COMMON_DARK, COMMON_LIGHT } from './sharedTokens';

/**
 * sunset: 시리즈 0 = 코랄(주인공). 기존 orange(#c26d22)는 코랄과 ΔE 충돌이라
 * azure(#1f7ba5, 구 브랜드색)로 교체. 코랄 vs rose 49.12 / vs olive 40.65, 다크 surface 3.19(실측).
 */
const SUNSET_CHART_SERIES: ChartSeries = [
  '#bc4c0f',
  '#1f7ba5',
  '#47955e',
  '#cf5f7d',
  '#8b6fc9',
  '#9a7b14',
  '#9c4f92',
  '#6b7785'
];

/**
 * 코랄은 상승 적색(#d92d20)과 인접한 난색 — brand를 주황 쪽(#bc4c0f)으로 밀어 hue를 분리했고,
 * 숫자에는 data-positive/negative 토큰만 쓰는 기존 규율이 방어한다. **CTA는 코랄 duotone** —
 * 로즈마젠타를 넣으면 danger 버튼과 혼동될 리본이 된다. 다크는 밝은 코랄이 흰 라벨을 못 이기므로
 * (#e05c2a도 3.66) velog 다크와 같은 어두운 라벨 반전(on-brand #1e1410, 7.77:1).
 */
export const SUNSET_LIGHT: ThemeTokens = {
  /*
   * 🔴 **순백 캔버스**(2026-08-03 사용자 결정 — "페이지 전체 배경색이 흰색"). 구 값 웜 크림(#fbf1e8).
   * bg = surface = surface-raised 가 전부 흰색이 되면서 **면색이 카드의 격을 말하지 못한다** —
   * 그 일은 아래 `border`(헤어라인)·여백·그림자가 이어받았다. 웜 크림은 `surface-hover`·`surface-sunken` 과
   * 코랄/앰버 축에 남는다.
   */
  bg: '#ffffff',
  surface: '#ffffff',
  'surface-raised': '#ffffff',
  'surface-muted': '#fdf8f3',
  'surface-sunken': '#f6e9dd',
  'surface-hover': '#fbf1e8',

  /* 🔴 흰 캔버스의 주역. 구 1.33:1 → 새 1.44:1. */
  border: '#e8d4c1',
  'border-strong': '#8a7a68',

  text: '#2b2118',
  'text-secondary': '#5c4c3d',
  'text-muted': '#6d5c4a',
  'text-inverse': '#ffffff',

  brand: '#bc4c0f',
  'brand-hover': '#9c3f0c',
  'brand-subtle': '#fdf0e3',
  'brand-subtle-hover': '#fbe3cd',
  'brand-border': '#f3c9a4',
  'brand-text': '#a03f0c',
  'on-brand': '#ffffff',

  /* 앰버 */
  accent: '#b06a05',
  'accent-text': '#96610a',
  'accent-subtle': '#fdeed6',
  'accent-border': '#edcb92',
  /* 로즈마젠타 — B채널로 상승 적색과 분리 */
  /* 웜 크림 위에서 튀지 않게 축의 채도를 8종 중 가장 낮게(0.48) 잡았다 */
  'accent-alt': '#389f6b',
  'accent-alt-text': '#1e7640',
  'accent-alt-subtle': '#e9f4ef',
  'accent-alt-border': '#afd9c4',

  ...COMMON_LIGHT,

  overlay: 'rgba(30, 20, 16, 0.5)',
  'focus-ring': '#bc4c0f',
  'focus-shadow': 'rgba(188, 76, 15, 0.25)',

  /* 웜 섀도 */
  'shadow-1': '0 1px 2px rgba(58, 38, 20, 0.06), 0 1px 3px rgba(58, 38, 20, 0.08)',
  /* ⚠ e2 만 올렸다 — raised 는 테두리 없이 이 그림자 하나로 선다. */
  'shadow-2': '0 1px 2px rgba(58, 38, 20, 0.05), 0 6px 18px rgba(58, 38, 20, 0.13)',
  'shadow-3': '0 2px 6px rgba(58, 38, 20, 0.08), 0 12px 32px rgba(58, 38, 20, 0.18)',

  'ribbon-stop-1': '#bc4c0f',
  'ribbon-stop-2': '#b06a05',
  'ribbon-stop-3': '#b83280',
  'cta-stop-1': '#bc4c0f',
  'cta-stop-2': '#ae470f',
  'cta-stop-3': '#a04a10',
  /* sunken이 아니라 muted — sunken(#f6e9dd) 위에서는 리본 stop 3:1이 무너져 승격(실측) */
  'progress-track': '#fdf8f3',

  'gradient-aurora': buildAuroraGradient(['#bc4c0f', '#b06a05', '#b83280']),
  'gradient-cta': buildDuotoneGradient('#bc4c0f', '#a04a10'),
  /*
   * 히어로 면 — 8종 중 쿨 캐스트가 가장 약하다(0.10/0.08). 웜 크림이 정체성이라
   * 여기서 캐스트를 올리면 프리셋이 다른 프리셋처럼 보인다. 최악 text-muted 5.68:1.
   */
  /*
   * 히어로 면 — 단색. 구 값은 **노을 프리셋인데 하늘색**(#e9f3f9→#eef8f5)이었다 —
   * grape 와 함께, 히어로 램프가 프리셋 축이 아니라 옛 브랜드 축이었다는 결정적 증거다.
   */
  'gradient-hero': '#ffffff',
  'gradient-hero-soft': '#fdf8f3',
  /* 🔴 상단 글로우를 걷었다. 다크 글로우는 남긴다. */
  'bg-glow': '#ffffff',
  'surface-glass': 'rgba(255, 255, 255, 0.8)',
  'surface-glass-fallback': '#ffffff',

  'chart-axis-line': '#ecdcc8',
  'chart-split-line': '#f6e9dd',
  'chart-label': '#5c4c3d',
  'chart-slice-border': '#ffffff',

  ...chartSeriesTokens(SUNSET_CHART_SERIES),

  'picker-filter': 'none'
};

export const SUNSET_DARK: ThemeTokens = {
  /* 딥 웜 브라운 */
  bg: '#1e1410',
  surface: '#2a1f19',
  'surface-raised': '#372b23',
  'surface-muted': '#30251e',
  'surface-sunken': '#241a15',
  'surface-hover': '#3f322a',

  border: '#45362c',
  'border-strong': '#8a7a6c',

  text: '#f2ebe4',
  'text-secondary': '#cbbcae',
  'text-muted': '#a8988a',
  'text-inverse': '#1e1410',

  brand: '#ff8a5c',
  'brand-hover': '#ffa075',
  'brand-subtle': '#40251c',
  'brand-subtle-hover': '#4b2d22',
  'brand-border': '#7a4630',
  'brand-text': '#ffb08e',
  /** 어두운 라벨 반전 — 밝은 코랄(#ff8a5c) 위 #1e1410 = 7.77:1 (velog 다크와 같은 패턴) */
  'on-brand': '#1e1410',

  accent: '#f5b942',
  'accent-text': '#f5b942',
  'accent-subtle': '#3b2c12',
  'accent-border': '#7d5f24',
  'accent-alt': '#7bd9a2',
  'accent-alt-text': '#7bd9a2',
  'accent-alt-subtle': '#182419',
  'accent-alt-border': '#2d5439',

  ...COMMON_DARK,

  overlay: 'rgba(12, 6, 4, 0.7)',
  'focus-ring': '#ffb08e',
  'focus-shadow': 'rgba(255, 176, 142, 0.3)',

  /* aurora 다크 값 재사용 */
  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)',
  'shadow-2': '0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)',
  'shadow-3': '0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)',

  'ribbon-stop-1': '#ff8a5c',
  'ribbon-stop-2': '#f5b942',
  'ribbon-stop-3': '#ee85a8',
  'cta-stop-1': '#ff8a5c',
  'cta-stop-2': '#f6a04b',
  'cta-stop-3': '#f5b942',
  'progress-track': '#241a15',

  'gradient-aurora': buildAuroraGradient(['#ff8a5c', '#f5b942', '#ee85a8']),
  /* 어두운 라벨(on-brand #1e1410) 전제의 밝은 CTA duotone */
  'gradient-cta': buildDuotoneGradient('#ff8a5c', '#f5b942'),
  /* 히어로 면 — 웜 다크 위 최소 캐스트. 최악 text-muted 5.42:1 / soft 5.91:1(실측). */
  /* 히어로 면 — 단색. 다크는 면 밝기 위계를 지킨다. */
  'gradient-hero': '#2a1f19',
  'gradient-hero-soft': '#30251e',
  /* 다크 글로우 알파 0.10/0.08 상한(사전 계산으로 0.12에서 감쇄). 글로우 최악 위 text-muted 4.63. */
  'bg-glow':
    'radial-gradient(1100px 600px at 18% -10%, rgba(255, 138, 92, 0.10), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(245, 185, 66, 0.08), transparent 55%), #1e1410',
  'surface-glass': 'rgba(55, 43, 35, 0.85)',
  'surface-glass-fallback': '#372b23',

  'chart-axis-line': '#4a3a2e',
  'chart-split-line': '#362a21',
  'chart-label': '#cbbcae',
  'chart-slice-border': '#2a1f19',

  ...chartSeriesTokens(SUNSET_CHART_SERIES),

  'picker-filter': 'invert(0.86)'
};
