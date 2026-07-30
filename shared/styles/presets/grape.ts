/* -------------------------------------------------------------------------- */
/* grape — 퍼플/라일락 (포도알 모노크로매틱)                                       */
/* -------------------------------------------------------------------------- */

import type { ThemeTokens } from '../semantic';
import { chartSeriesTokens, type ChartSeries } from './chartSeriesTokens';
import { buildAuroraGradient, buildDuotoneGradient, buildHeroGradient } from './gradients';
import { COMMON_DARK, COMMON_LIGHT } from './sharedTokens';

/**
 * grape: 시리즈 0 = 퍼플. 기존 violet(#8b6fc9)은 브랜드와 ΔE 충돌이라 azure로 교체(인덱스 4).
 * 퍼플 vs plum 41.33 / vs azure 67.48 / vs rose 69.34(실측).
 */
const GRAPE_CHART_SERIES: ChartSeries = [
  '#7a53da',
  '#c26d22',
  '#47955e',
  '#cf5f7d',
  '#1f7ba5',
  '#9a7b14',
  '#9c4f92',
  '#6b7785'
];

/**
 * 퍼플(brand) + 오키드(accent) + 인디고(accent-alt)의 인접색 조화.
 * 다크 brand #7a53da는 흰 라벨 5.15와 surface 3.19를 동시에 만족하는 지점 —
 * #8a68e8은 라벨 4.01로 탈락(실측). knife-edge라 더 어둡게 조정 금지.
 */
export const GRAPE_LIGHT: ThemeTokens = {
  bg: '#f3effa',
  surface: '#ffffff',
  'surface-raised': '#ffffff',
  'surface-muted': '#faf8fd',
  'surface-sunken': '#eae3f5',
  'surface-hover': '#f3effa',

  border: '#e0d7ef',
  'border-strong': '#7f7694',

  text: '#221c33',
  'text-secondary': '#4f4768',
  'text-muted': '#635b7a',
  'text-inverse': '#ffffff',

  brand: '#7048c8',
  'brand-hover': '#5c39ab',
  'brand-subtle': '#f1ecfc',
  'brand-subtle-hover': '#e5dcf8',
  'brand-border': '#cbb8ef',
  'brand-text': '#5c39ab',
  'on-brand': '#ffffff',

  /* 오키드 */
  accent: '#a136b8',
  'accent-text': '#872d99',
  'accent-subtle': '#f9ecfb',
  'accent-border': '#e3b8ea',
  /* 인디고 */
  'accent-alt': '#1ca063',
  'accent-alt-text': '#0c7633',
  'accent-alt-subtle': '#e6f5ee',
  'accent-alt-border': '#a4d9c1',

  ...COMMON_LIGHT,

  overlay: 'rgba(28, 19, 41, 0.5)',
  'focus-ring': '#7048c8',
  'focus-shadow': 'rgba(112, 72, 200, 0.25)',

  /* 퍼플 틴트 섀도 */
  'shadow-1': '0 1px 2px rgba(34, 24, 58, 0.06), 0 1px 3px rgba(34, 24, 58, 0.08)',
  'shadow-2': '0 2px 4px rgba(34, 24, 58, 0.06), 0 4px 12px rgba(34, 24, 58, 0.10)',
  'shadow-3': '0 2px 6px rgba(34, 24, 58, 0.08), 0 12px 32px rgba(34, 24, 58, 0.18)',

  'ribbon-stop-1': '#7048c8',
  'ribbon-stop-2': '#a136b8',
  'ribbon-stop-3': '#4956d4',
  'cta-stop-1': '#7048c8',
  'cta-stop-2': '#653fbb',
  'cta-stop-3': '#5c39ab',
  'progress-track': '#eae3f5',

  'gradient-aurora': buildAuroraGradient(['#7048c8', '#a136b8', '#4956d4']),
  'gradient-cta': buildDuotoneGradient('#7048c8', '#5c39ab'),
  /* 히어로 면 — 최악 text-muted 5.27:1 / soft 5.75:1(실측). */
  'gradient-hero': buildHeroGradient('#deecf6', '#e6f5ef'),
  'gradient-hero-soft': buildHeroGradient('#edf5fa', '#f1f9f6'),
  'bg-glow':
    'radial-gradient(1200px 640px at 16% -10%, rgba(112, 72, 200, 0.05), transparent 60%), radial-gradient(1000px 560px at 84% -12%, rgba(161, 54, 184, 0.05), transparent 55%), #f3effa',
  'surface-glass': 'rgba(255, 255, 255, 0.8)',
  'surface-glass-fallback': '#ffffff',

  'chart-axis-line': '#ddd3ee',
  'chart-split-line': '#eae3f5',
  'chart-label': '#4f4768',
  'chart-slice-border': '#ffffff',

  ...chartSeriesTokens(GRAPE_CHART_SERIES),

  'picker-filter': 'none'
};

export const GRAPE_DARK: ThemeTokens = {
  /* 딥 바이올렛 */
  bg: '#171126',
  surface: '#221a3a',
  'surface-raised': '#2f2551',
  'surface-muted': '#281f45',
  'surface-sunken': '#1c1530',
  'surface-hover': '#372c5e',

  border: '#3a2f60',
  'border-strong': '#7a6fa0',

  text: '#ece8f8',
  'text-secondary': '#b4abd1',
  'text-muted': '#9a90bc',
  'text-inverse': '#171126',

  brand: '#7a53da',
  'brand-hover': '#8f6cf0',
  'brand-subtle': '#2c2156',
  'brand-subtle-hover': '#352966',
  'brand-border': '#4d3f8a',
  'brand-text': '#bba8f5',
  'on-brand': '#ffffff',

  accent: '#d478e8',
  'accent-text': '#d478e8',
  'accent-subtle': '#3a1f42',
  'accent-border': '#713d80',
  'accent-alt': '#6fe4a6',
  'accent-alt-text': '#6fe4a6',
  'accent-alt-subtle': '#162225',
  'accent-alt-border': '#2a5345',

  ...COMMON_DARK,

  overlay: 'rgba(10, 6, 20, 0.7)',
  'focus-ring': '#bba8f5',
  'focus-shadow': 'rgba(187, 168, 245, 0.3)',

  /* aurora 다크 값 재사용 */
  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)',
  'shadow-2': '0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)',
  'shadow-3': '0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)',

  'ribbon-stop-1': '#a184f2',
  'ribbon-stop-2': '#d478e8',
  'ribbon-stop-3': '#8f9bff',
  'cta-stop-1': '#7a53da',
  'cta-stop-2': '#714cd0',
  'cta-stop-3': '#6845c6',
  'progress-track': '#1c1530',

  'gradient-aurora': buildAuroraGradient(['#a184f2', '#d478e8', '#8f9bff']),
  'gradient-cta': buildDuotoneGradient('#7a53da', '#6845c6'),
  /* 히어로 면 — 다크 최악 text-muted 5.00:1 / soft 5.58:1(실측). velog 다크 다음으로 얇다. */
  'gradient-hero': buildHeroGradient('#1d2541', '#1b2934'),
  'gradient-hero-soft': buildHeroGradient('#1a1c35', '#191e2e'),
  /* 다크 글로우 알파 0.10/0.08 상한(사전 계산으로 0.12에서 감쇄) */
  'bg-glow':
    'radial-gradient(1100px 600px at 18% -10%, rgba(161, 132, 242, 0.10), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(212, 120, 232, 0.08), transparent 55%), #171126',
  'surface-glass': 'rgba(47, 37, 81, 0.85)',
  'surface-glass-fallback': '#2f2551',

  'chart-axis-line': '#423767',
  'chart-split-line': '#2b2150',
  'chart-label': '#b4abd1',
  'chart-slice-border': '#221a3a',

  ...chartSeriesTokens(GRAPE_CHART_SERIES),

  'picker-filter': 'invert(0.86)'
};
