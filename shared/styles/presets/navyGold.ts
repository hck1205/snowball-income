/* -------------------------------------------------------------------------- */
/* navy-gold — 프리미엄 (딥 네이비 + 골드, 배당=금화)                              */
/* -------------------------------------------------------------------------- */

import type { ThemeTokens } from '../semantic';
import { chartSeriesTokens, type ChartSeries } from './chartSeriesTokens';
import { buildAuroraGradient, buildDuotoneGradient } from './gradients';
import { COMMON_DARK, COMMON_LIGHT } from './sharedTokens';

/**
 * navy-gold: 시리즈 0 = 스틸 네이비(vs slate ΔE 25.64), olive → 골드 #b08a24
 * (배당=금화 메타포를 데이터에도). 골드↔오렌지 ΔE 24.51이 세트 최저 — 인덱스 1·5로 이미 거리를 벌려 뒀다.
 */
const NAVY_GOLD_CHART_SERIES: ChartSeries = [
  '#4d6ca4',
  '#c26d22',
  '#47955e',
  '#cf5f7d',
  '#8b6fc9',
  '#b08a24',
  '#9c4f92',
  '#6b7785'
];

/**
 * 라이트는 아이보리(#f7f4ec) 위 딥 네이비. 골드는 **장신구(액센트·리본·배지)에만** —
 * 골드는 흰 라벨 4.5:1을 만족하는 밝기가 없어서(예: #a07617=4.14) CTA 채움에서 배제했다
 * ("금은 장신구, 버튼은 정장"). 다크 brand는 스틸 블루 #4d6ca4(서피스 3.25:1, 흰 라벨 5.4:1)
 * — 더 어두운 "진짜 네이비"는 다크 서피스와 2.2:1로 침몰해 탈락(실측). 욕심내지 마라.
 */
export const NAVY_GOLD_LIGHT: ThemeTokens = {
  /*
   * 🔴 **순백 캔버스**(2026-08-03 사용자 결정 — "페이지 전체 배경색이 흰색"). 구 값 크림 골드 틴트(#f5efdd).
   * bg = surface = surface-raised 가 전부 흰색이 되면서 **면색이 카드의 격을 말하지 못한다** —
   * 그 일은 아래 `border`(헤어라인)·여백·그림자가 이어받았다. 이 프리셋만은 `surface` 가
   * 아이보리(#fffcf5)로 남는다 — 순백 캔버스 위 크림 카드라, 면색이 **아직 한 칸 말한다**
   * (1.03:1). 그 한 칸이 크림의 정체성이고, 격은 여전히 경계가 진다.
   * 부수 효과: 8종 중 가장 타이트하던 글로우 최악 지점(4.52:1) 제약이 통째로 사라졌다.
   */
  bg: '#ffffff',
  surface: '#fffcf5',
  'surface-raised': '#fffcf5',
  'surface-muted': '#fbf9f2',
  'surface-sunken': '#efeadd',
  'surface-hover': '#f5efdd',

  /* 🔴 흰 캔버스의 주역. 구 1.34:1(아이보리 위) → 새 1.44:1. */
  border: '#dbd4c0',
  'border-strong': '#7c7360',

  text: '#1f2430',
  'text-secondary': '#475063',
  'text-muted': '#5c6373',
  'text-inverse': '#ffffff',

  brand: '#1f3a68',
  'brand-hover': '#16294b',
  'brand-subtle': '#edf0f8',
  'brand-subtle-hover': '#dce3f0',
  'brand-border': '#b9c7de',
  'brand-text': '#274672',
  'on-brand': '#ffffff',

  /* 골드 = 장신구 전용 액센트 */
  accent: '#a07617',
  'accent-text': '#7a5a0f',
  'accent-subtle': '#f7efd8',
  'accent-border': '#dfc98e',
  /* 버건디 */
  'accent-alt': '#1c9e61',
  'accent-alt-text': '#0b7432',
  /* 틴트는 이 프리셋의 surface(아이보리)에서 파생 — 그래서 subtle 이 아이보리 기운을 갖는다 */
  'accent-alt-subtle': '#e6f2e5',
  'accent-alt-border': '#a4d6ba',

  ...COMMON_LIGHT,

  overlay: 'rgba(24, 22, 16, 0.5)',
  'focus-ring': '#1f3a68',
  'focus-shadow': 'rgba(31, 58, 104, 0.22)',

  /* 웜 섀도 — 아이보리 지면과 어울리는 갈색 틴트 */
  'shadow-1': '0 1px 2px rgba(46, 40, 24, 0.06), 0 1px 3px rgba(46, 40, 24, 0.08)',
  /* ⚠ e2 만 올렸다 — raised 는 테두리 없이 이 그림자 하나로 선다. */
  'shadow-2': '0 1px 2px rgba(46, 40, 24, 0.05), 0 6px 18px rgba(46, 40, 24, 0.13)',
  'shadow-3': '0 2px 6px rgba(46, 40, 24, 0.08), 0 12px 32px rgba(46, 40, 24, 0.18)',

  'ribbon-stop-1': '#1f3a68',
  'ribbon-stop-2': '#a07617',
  'ribbon-stop-3': '#8e3b52',
  'cta-stop-1': '#1f3a68',
  'cta-stop-2': '#1b3159',
  'cta-stop-3': '#16294b',
  'progress-track': '#efeadd',

  /* 네이비→골드→버건디 (표시용) / CTA는 네이비 duotone — 골드는 CTA 채움 금지 */
  'gradient-aurora': buildAuroraGradient(['#1f3a68', '#a07617', '#8e3b52']),
  'gradient-cta': buildDuotoneGradient('#1f3a68', '#16294b'),
  /*
   * 히어로 면 — 웜(아이보리) 프리셋이라 쿨 캐스트를 0.12/0.09 로 낮췄다("차가운 빛"이 스민 정도).
   * brand 자체가 네이비(쿨)라 블루 캐스트가 정체성과 충돌하지 않는다. 최악 text-muted 5.07:1.
   */
  /* 히어로 면 — 단색. hero = surface(아이보리) / soft = surface-muted. */
  'gradient-hero': '#fffcf5',
  'gradient-hero-soft': '#fbf9f2',
  /* 단색층만 새 bg(#f5efdd)로 — 알파 0.06/0.05 유지(글로우 최악 4.52 실측, 상한) */
  /* 🔴 상단 글로우를 걷었다. 다크 글로우는 남긴다. */
  'bg-glow': '#ffffff',
  'surface-glass': 'rgba(255, 252, 245, 0.8)',
  'surface-glass-fallback': '#fffcf5',

  'chart-axis-line': '#ded6c1',
  'chart-split-line': '#efeadd',
  'chart-label': '#475063',
  'chart-slice-border': '#fffcf5',

  ...chartSeriesTokens(NAVY_GOLD_CHART_SERIES),

  'picker-filter': 'none'
};

export const NAVY_GOLD_DARK: ThemeTokens = {
  bg: '#0a0f1e',
  surface: '#141b30',
  'surface-raised': '#1f2942',
  'surface-muted': '#182138',
  'surface-sunken': '#0f1526',
  'surface-hover': '#263250',

  border: '#2a3450',
  'border-strong': '#62708f',

  text: '#e8e9ef',
  'text-secondary': '#acb2c4',
  'text-muted': '#8e97ad',
  'text-inverse': '#0a0f1e',

  /* 스틸 블루 — 서피스 3.25:1, 흰 라벨 5.4:1 */
  brand: '#4d6ca4',
  'brand-hover': '#6283b8',
  'brand-subtle': '#1c2b4f',
  'brand-subtle-hover': '#233459',
  'brand-border': '#38517f',
  'brand-text': '#a9c0e8',
  'on-brand': '#ffffff',

  accent: '#d8b04a',
  'accent-text': '#d8b04a',
  'accent-subtle': '#2f2711',
  'accent-border': '#6e5a1e',
  'accent-alt': '#75dfa6',
  'accent-alt-text': '#75dfa6',
  'accent-alt-subtle': '#112322',
  'accent-alt-border': '#265342',

  ...COMMON_DARK,

  overlay: 'rgba(3, 6, 14, 0.68)',
  'focus-ring': '#a9c0e8',
  'focus-shadow': 'rgba(169, 192, 232, 0.3)',

  /* aurora 다크 값 재사용 */
  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)',
  'shadow-2': '0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)',
  'shadow-3': '0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)',

  'ribbon-stop-1': '#6f8fc7',
  'ribbon-stop-2': '#d8b04a',
  'ribbon-stop-3': '#cf8fa4',
  'cta-stop-1': '#4d6ca4',
  'cta-stop-2': '#435d97',
  'cta-stop-3': '#3a5488',
  'progress-track': '#0f1526',

  'gradient-aurora': buildAuroraGradient(['#6f8fc7', '#d8b04a', '#cf8fa4']),
  'gradient-cta': buildDuotoneGradient('#4d6ca4', '#3a5488'),
  /* 히어로 면 — 다크 최악 text-muted 5.40:1 / soft 5.93:1(실측). */
  /* 히어로 면 — 단색. 다크는 면 밝기 위계를 지킨다. */
  'gradient-hero': '#141b30',
  'gradient-hero-soft': '#182138',
  'bg-glow':
    'radial-gradient(1100px 600px at 18% -10%, rgba(216, 176, 74, 0.10), transparent 60%), radial-gradient(900px 520px at 82% -14%, rgba(111, 143, 199, 0.10), transparent 55%), #0a0f1e',
  'surface-glass': 'rgba(31, 41, 66, 0.85)',
  'surface-glass-fallback': '#1f2942',

  'chart-axis-line': '#2f3b5c',
  'chart-split-line': '#1e2740',
  'chart-label': '#acb2c4',
  'chart-slice-border': '#141b30',

  ...chartSeriesTokens(NAVY_GOLD_CHART_SERIES),

  'picker-filter': 'invert(0.86)'
};
