/* -------------------------------------------------------------------------- */
/* ink — 고대비 모노크롬 (잉크)                                                  */
/* -------------------------------------------------------------------------- */

import type { ThemeTokens } from '../semantic';
import { AURORA_CHART_SERIES } from './aurora';
import { chartSeriesTokens } from './chartSeriesTokens';
import { buildAuroraGradient, buildDuotoneGradient } from './gradients';
import { COMMON_DARK, COMMON_LIGHT } from './sharedTokens';

/*
 * ink: 차트는 aurora 8색 그대로 재사용. 크롬은 완전 무채지만 데이터 구분은 ΔE가 필수라
 * 모노 8색은 물리적으로 불가 — "흑백 신문 위 컬러 인포그래픽" 정합(ink 다크 surface
 * #1a1a1a에서 전 시리즈 3:1 재검증 완료).
 */

/**
 * 8종 중 유일한 무채 — 고대비·저자극 선호와 인쇄물 감성을 커버하고, 스위처에서 "색 자체를 거의 끄는"
 * 선택지를 제공한다. **크롬은 무채**(그라데이션 = 잉크 번짐 그레이 duotone, 히어로 면도 캐스트 0,
 * 글로우 없음, 유리 거의 불투명), **차트만 유채색**(aurora 8색 재사용 — 데이터 구분은 ΔE가 필수라
 * 모노 8색은 물리적으로 불가; "흑백 신문 위 컬러 인포그래픽" 정합). 다크는 velog식 반전:
 * brand #f2f2f2 + on-brand #111111(15.9:1).
 *
 * ⚠ ink 는 **크롬 전 영역이 무채**다(차트만 유채 — aurora 8색 재사용). 세컨더리 액센트(`accent-alt`)도
 * 예외가 아니다: 아이덴티티 패스에서 잠시 그린으로 재정의했다가 ink 정체성을 지키려고 무채로 되돌렸다
 * (2026-07-28). 그래서 `Chip variant='accentAlt'` 같은 소비처는 ink 에서만 회색으로 보인다 — 의도다.
 */
export const INK_LIGHT: ThemeTokens = {
  /*
   * 🔴 **순백 캔버스**(2026-08-03 사용자 결정 — "페이지 전체 배경색이 흰색"). 구 값 연회색(#f1f1f1).
   * bg = surface = surface-raised 가 전부 흰색이 되면서 **면색이 카드의 격을 말하지 못한다** —
   * 그 일은 아래 `border`(헤어라인)·여백·그림자가 이어받았다. 무채 규율은 그대로다 — 오히려 순백이
   * 이 프리셋의 '흑백 신문' 성격에 가장 가깝다.
   */
  bg: '#ffffff',
  surface: '#ffffff',
  'surface-raised': '#ffffff',
  'surface-muted': '#f7f7f7',
  'surface-sunken': '#e8e8e8',
  'surface-hover': '#f1f1f1',

  /* 🔴 흰 캔버스의 주역. 구 1.37:1 → 새 1.44:1. */
  border: '#d7d7d7',
  'border-strong': '#767676',

  text: '#111111',
  'text-secondary': '#3d3d3d',
  'text-muted': '#595959',
  'text-inverse': '#ffffff',

  brand: '#1a1a1a',
  'brand-hover': '#000000',
  'brand-subtle': '#e8e8e8',
  'brand-subtle-hover': '#dedede',
  'brand-border': '#bdbdbd',
  'brand-text': '#1a1a1a',
  'on-brand': '#ffffff',

  accent: '#444444',
  'accent-text': '#333333',
  'accent-subtle': '#ededed',
  'accent-border': '#cfcfcf',
  /**
   * 🔴 knife-edge — 더 조정 금지. `accent`(#444444) 와의 ΔE 가 **16.37**(하한 15, 여유 1.37)이라
   * `accent-alt` 를 조금이라도 밝히거나 어둡게 하면 `contrast.test.ts` 의 MIN_ACCENT_SEPARATION 이 즉시 깨진다.
   */
  'accent-alt': '#6b6b6b',
  'accent-alt-text': '#4f4f4f',
  'accent-alt-subtle': '#f0f0f0',
  'accent-alt-border': '#d6d6d6',

  ...COMMON_LIGHT,

  overlay: 'rgba(17, 17, 17, 0.5)',
  'focus-ring': '#1a1a1a',
  'focus-shadow': 'rgba(17, 17, 17, 0.22)',

  /* 무채 섀도 — velog 라이트 3종 재사용 */
  'shadow-1': '0 1px 3px rgba(0, 0, 0, 0.05)',
  /* ⚠ e2 만 올렸다 — raised 는 테두리 없이 이 그림자 하나로 선다. */
  'shadow-2': '0 1px 2px rgba(0, 0, 0, 0.04), 0 6px 16px rgba(0, 0, 0, 0.10)',
  'shadow-3': '0 8px 24px rgba(0, 0, 0, 0.12)',

  'ribbon-stop-1': '#1a1a1a',
  'ribbon-stop-2': '#444444',
  'ribbon-stop-3': '#6b6b6b',
  'cta-stop-1': '#1a1a1a',
  'cta-stop-2': '#141414',
  'cta-stop-3': '#0d0d0d',
  'progress-track': '#e8e8e8',

  /* 잉크 번짐 */
  'gradient-aurora': buildAuroraGradient(['#1a1a1a', '#444444', '#6b6b6b']),
  'gradient-cta': buildDuotoneGradient('#1a1a1a', '#0d0d0d'),
  /*
   * 히어로 면 — **캐스트 0(무채)**. 다른 7프리셋과 달리 쿨 파스텔을 섞지 않는다:
   * 무채는 "웜톤 금지" 제약을 위반하지 않으면서 ink 정체성을 지키는 유일한 해다.
   * 대가로 bg 와의 ΔE 가 2.8 밖에 안 되니 **밴드를 fill 단독으로 세우지 말고**
   * 1px `color.border` + radius 로 경계를 함께 그려라. 최악 text-muted 5.76:1.
   */
  /* 히어로 면 — 단색. hero = surface / soft = surface-muted. */
  'gradient-hero': '#ffffff',
  'gradient-hero-soft': '#f7f7f7',
  /* 글로우 없음 = 단색 */
  /* 글로우 없음 = 단색(역할: 페이지 배경). 라이트는 순백. */
  'bg-glow': '#ffffff',
  'surface-glass': 'rgba(255, 255, 255, 0.92)',
  'surface-glass-fallback': '#ffffff',

  'chart-axis-line': '#d9d9d9',
  'chart-split-line': '#e8e8e8',
  'chart-label': '#3d3d3d',
  'chart-slice-border': '#ffffff',

  /* 차트만 유채 — aurora 세트 재사용 */
  ...chartSeriesTokens(AURORA_CHART_SERIES),

  'picker-filter': 'none'
};

export const INK_DARK: ThemeTokens = {
  bg: '#0d0d0d',
  surface: '#1a1a1a',
  'surface-raised': '#262626',
  'surface-muted': '#202020',
  'surface-sunken': '#131313',
  'surface-hover': '#2e2e2e',

  border: '#333333',
  'border-strong': '#7d7d7d',

  text: '#f2f2f2',
  'text-secondary': '#b5b5b5',
  'text-muted': '#8f8f8f',
  'text-inverse': '#0d0d0d',

  brand: '#f2f2f2',
  'brand-hover': '#ffffff',
  'brand-subtle': '#2b2b2b',
  'brand-subtle-hover': '#333333',
  'brand-border': '#555555',
  'brand-text': '#f2f2f2',
  /** 반전 라벨 — 밝은 brand(#f2f2f2) 위 #111111 = 15.9:1 */
  'on-brand': '#111111',

  accent: '#d4d4d4',
  'accent-text': '#d4d4d4',
  'accent-subtle': '#262626',
  'accent-border': '#4d4d4d',
  /** `accent`(#d4d4d4) 와의 ΔE 17.92 — 라이트만큼은 아니지만 여기도 무채 구간이라 여유가 넓지 않다. */
  'accent-alt': '#a3a3a3',
  'accent-alt-text': '#bfbfbf',
  'accent-alt-subtle': '#232323',
  'accent-alt-border': '#454545',

  ...COMMON_DARK,

  overlay: 'rgba(0, 0, 0, 0.65)',
  'focus-ring': '#f2f2f2',
  'focus-shadow': 'rgba(242, 242, 242, 0.3)',

  /* velog 다크 3종 재사용 */
  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)',
  'shadow-2': '0 2px 4px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.4)',
  'shadow-3': '0 2px 6px rgba(0, 0, 0, 0.44), 0 12px 32px rgba(0, 0, 0, 0.52)',

  'ribbon-stop-1': '#f2f2f2',
  'ribbon-stop-2': '#d4d4d4',
  'ribbon-stop-3': '#a3a3a3',
  'cta-stop-1': '#f2f2f2',
  'cta-stop-2': '#e8e8e8',
  'cta-stop-3': '#dedede',
  'progress-track': '#131313',

  'gradient-aurora': buildAuroraGradient(['#f2f2f2', '#d4d4d4', '#a3a3a3']),
  'gradient-cta': buildDuotoneGradient('#f2f2f2', '#dedede'),
  /* 히어로 면 — 라이트와 같이 캐스트 0. bg 와 ΔE 3.6 이라 경계선 필수. 최악 text-muted 5.59:1. */
  /* 히어로 면 — 단색. 다크는 면 밝기 위계를 지킨다. */
  'gradient-hero': '#1a1a1a',
  'gradient-hero-soft': '#202020',
  'bg-glow': '#0d0d0d',
  'surface-glass': 'rgba(38, 38, 38, 0.92)',
  'surface-glass-fallback': '#262626',

  'chart-axis-line': '#3a3a3a',
  'chart-split-line': '#2a2a2a',
  'chart-label': '#b5b5b5',
  'chart-slice-border': '#1a1a1a',

  ...chartSeriesTokens(AURORA_CHART_SERIES),

  'picker-filter': 'invert(0.86)'
};
