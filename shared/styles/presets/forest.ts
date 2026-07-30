/* -------------------------------------------------------------------------- */
/* forest — 딥 그린/세이지 (차분한 숲)                                            */
/* -------------------------------------------------------------------------- */

import type { ThemeTokens } from '../semantic';
import { chartSeriesTokens, type ChartSeries } from './chartSeriesTokens';
import { buildAuroraGradient, buildDuotoneGradient, buildHeroGradient } from './gradients';
import { COMMON_DARK, COMMON_LIGHT } from './sharedTokens';

/**
 * forest: 시리즈 0 = 포레스트 그린. 기존 green(#47955e)은 브랜드와 ΔE 충돌이라 azure로 교체.
 * 그린 vs olive 53.99 / vs slate 44.49, 다크 surface 3.32(실측).
 */
const FOREST_CHART_SERIES: ChartSeries = [
  '#2b8052',
  '#c26d22',
  '#1f7ba5',
  '#cf5f7d',
  '#8b6fc9',
  '#9a7b14',
  '#9c4f92',
  '#6b7785'
];

/**
 * 그린 brand는 success(#0f7a52)와 색상군이 겹친다 — success는 배너/상태 서피스 전용,
 * brand는 컨트롤 채움이라 사용처가 분리된다(QA 시 상태 배너·데이터 숫자 화면 우선 확인).
 * 보조는 클리셰(테라코타)를 피해 우디 브라운(#7d5a3c). 다크 brand는 흰 라벨 4.5를 만족하는
 * #2b8052(4.87)까지만 밝힌다 — #2e8757은 4.45로 탈락(실측).
 */
export const FOREST_LIGHT: ThemeTokens = {
  bg: '#eef3ec',
  surface: '#ffffff',
  'surface-raised': '#ffffff',
  'surface-muted': '#f8faf7',
  'surface-sunken': '#e4ece1',
  'surface-hover': '#eef3ec',

  border: '#d8e2d4',
  'border-strong': '#71836d',

  text: '#182218',
  'text-secondary': '#435449',
  'text-muted': '#5a6b5c',
  'text-inverse': '#ffffff',

  brand: '#2f7d4f',
  'brand-hover': '#256540',
  'brand-subtle': '#e7f3e9',
  'brand-subtle-hover': '#d4ead9',
  'brand-border': '#a9d4b4',
  'brand-text': '#256540',
  'on-brand': '#ffffff',

  /* 라임 그린 */
  accent: '#4c8b2e',
  'accent-text': '#3d7222',
  'accent-subtle': '#ecf6e3',
  'accent-border': '#bfe0a4',
  /* 우디 브라운 */
  /* brand(그린 145°)·accent(라임 95°)와 3중 그린이 되지 않게 축의 **틸 끝(174°)** 을 골랐다 */
  'accent-alt': '#129e90',
  'accent-alt-text': '#06726b',
  'accent-alt-subtle': '#e5f4f3',
  'accent-alt-border': '#a0d8d3',

  ...COMMON_LIGHT,

  overlay: 'rgba(16, 26, 18, 0.5)',
  'focus-ring': '#2f7d4f',
  'focus-shadow': 'rgba(47, 125, 79, 0.25)',

  /* 그린 틴트 섀도 */
  'shadow-1': '0 1px 2px rgba(24, 40, 26, 0.06), 0 1px 3px rgba(24, 40, 26, 0.08)',
  'shadow-2': '0 2px 4px rgba(24, 40, 26, 0.06), 0 4px 12px rgba(24, 40, 26, 0.10)',
  'shadow-3': '0 2px 6px rgba(24, 40, 26, 0.08), 0 12px 32px rgba(24, 40, 26, 0.18)',

  'ribbon-stop-1': '#2f7d4f',
  'ribbon-stop-2': '#4c8b2e',
  'ribbon-stop-3': '#7d5a3c',
  'cta-stop-1': '#2f7d4f',
  'cta-stop-2': '#2a7147',
  'cta-stop-3': '#256540',
  'progress-track': '#f8faf7',

  /* 숲의 빛: 그린→라임→우디 / CTA는 그린 duotone */
  'gradient-aurora': buildAuroraGradient(['#2f7d4f', '#4c8b2e', '#7d5a3c']),
  'gradient-cta': buildDuotoneGradient('#2f7d4f', '#256540'),
  /* 히어로 면 — 최악 text-muted 4.81:1 / soft 5.16:1(실측). */
  'gradient-hero': buildHeroGradient('#e1eef7', '#e6f5ef'),
  'gradient-hero-soft': buildHeroGradient('#eef5fb', '#f1f9f6'),
  'bg-glow':
    'radial-gradient(1200px 640px at 16% -10%, rgba(47, 125, 79, 0.05), transparent 60%), radial-gradient(1000px 560px at 84% -12%, rgba(76, 139, 46, 0.04), transparent 55%), #eef3ec',
  'surface-glass': 'rgba(255, 255, 255, 0.8)',
  'surface-glass-fallback': '#ffffff',

  'chart-axis-line': '#d3ded0',
  'chart-split-line': '#e4ece1',
  'chart-label': '#435449',
  'chart-slice-border': '#ffffff',

  ...chartSeriesTokens(FOREST_CHART_SERIES),

  'picker-filter': 'none'
};

export const FOREST_DARK: ThemeTokens = {
  /* 그린 블랙 */
  bg: '#0f1712',
  surface: '#18231b',
  'surface-raised': '#233227',
  'surface-muted': '#1d2a20',
  'surface-sunken': '#131c16',
  'surface-hover': '#2a3b2f',

  border: '#2e4033',
  'border-strong': '#64796a',

  text: '#e7efe8',
  'text-secondary': '#a9bbac',
  'text-muted': '#8ba18f',
  'text-inverse': '#0f1712',

  brand: '#2b8052',
  'brand-hover': '#3fa06a',
  'brand-subtle': '#143526',
  'brand-subtle-hover': '#1a4230',
  'brand-border': '#2f6647',
  'brand-text': '#7fd4a5',
  'on-brand': '#ffffff',

  accent: '#55c17e',
  'accent-text': '#55c17e',
  'accent-subtle': '#12301d',
  'accent-border': '#29603c',
  'accent-alt': '#6ce7d7',
  'accent-alt-text': '#6ce7d7',
  'accent-alt-subtle': '#122621',
  'accent-alt-border': '#27554d',

  ...COMMON_DARK,

  overlay: 'rgba(4, 10, 6, 0.7)',
  'focus-ring': '#7fd4a5',
  'focus-shadow': 'rgba(127, 212, 165, 0.3)',

  /* aurora 다크 값 재사용 */
  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)',
  'shadow-2': '0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)',
  'shadow-3': '0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)',

  'ribbon-stop-1': '#55c17e',
  'ribbon-stop-2': '#8fd14f',
  'ribbon-stop-3': '#c9a978',
  'cta-stop-1': '#2b8052',
  'cta-stop-2': '#27754b',
  'cta-stop-3': '#236a44',
  'progress-track': '#131c16',

  'gradient-aurora': buildAuroraGradient(['#55c17e', '#8fd14f', '#c9a978']),
  'gradient-cta': buildDuotoneGradient('#2b8052', '#236a44'),
  /* 히어로 면 — 다크 최악 text-muted 5.25:1 / soft 5.86:1(실측). */
  'gradient-hero': buildHeroGradient('#16292e', '#142e23'),
  'gradient-hero-soft': buildHeroGradient('#132122', '#12241b'),
  /* 알파 0.10/0.08 상한 — 0.12/0.10에서 text-muted 4.35로 탈락(실측, 유일한 1차 실패). 올리지 마라. */
  'bg-glow':
    'radial-gradient(1100px 600px at 18% -10%, rgba(85, 193, 126, 0.10), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(143, 209, 79, 0.08), transparent 55%), #0f1712',
  'surface-glass': 'rgba(35, 50, 39, 0.85)',
  'surface-glass-fallback': '#233227',

  'chart-axis-line': '#33473a',
  'chart-split-line': '#223026',
  'chart-label': '#a9bbac',
  'chart-slice-border': '#18231b',

  ...chartSeriesTokens(FOREST_CHART_SERIES),

  'picker-filter': 'invert(0.86)'
};
