/**
 * 시맨틱 토큰 — 디자인 시스템의 2계층.
 *
 * 프리미티브 램프(`primitives.ts`)에 **역할**을 부여한다. 화면/컴포넌트는 오직 이 계층만 쓴다.
 * "이건 무슨 색인가"가 아니라 "이건 무슨 역할인가"로 사고하게 만드는 게 목적이다.
 *
 * 구조:
 *  - `LIGHT_THEME` / `DARK_THEME` : 역할 → 실제 hex. **유일한 진실 공급원**.
 *      globalStyles가 이걸로 `--sb-*` 변수를 찍고, 대비 검증 스크립트도 이걸 그대로 읽는다.
 *      (예전에는 globalStyles 안에 hex가 하드코딩돼 있어서 검증이 불가능했다)
 *  - `color` : 컴포넌트가 쓰는 `var(--sb-*)` 참조.
 *
 * ECharts는 캔버스라 `var()`를 못 읽는다 → `chartTheme.ts`가 런타임에 실제 값으로 해석한다.
 */

import { palette } from './primitives';

const { brand, neutral, up, down, positive, warning, danger } = palette;

/** 역할 이름 → CSS 변수 이름. `--sb-` 접두사는 생성 시점에 붙인다. */
export type ThemeTokens = Record<string, string>;

export const LIGHT_THEME: ThemeTokens = {
  /* 서피스 — 낮은 곳(sunken) → 기본(base) → 떠 있는 곳(raised) */
  bg: neutral[50],
  surface: neutral[0],
  'surface-raised': neutral[0],
  'surface-muted': neutral[25],
  'surface-sunken': neutral[100],
  'surface-hover': neutral[50],

  /* 경계 — border는 장식(카드 윤곽), border-strong은 컨트롤 경계(3:1 필요) */
  border: neutral[150],
  'border-strong': neutral[450],

  /* 텍스트 — 3단 위계. 셋 다 모든 서피스 위에서 4.5:1을 넘긴다. */
  text: neutral[900],
  'text-secondary': neutral[600],
  'text-muted': neutral[500],
  'text-inverse': neutral[0],

  /* 브랜드 */
  brand: brand[600],
  'brand-hover': brand[700],
  'brand-subtle': brand[50],
  'brand-subtle-hover': brand[100],
  'brand-border': brand[200],
  'brand-text': brand[700],
  'on-brand': neutral[0],

  /* 데이터(숫자) 방향성 — 한국 증권 관례: 상승 적색 / 하락 청색 */
  'data-positive': up.light,
  'data-positive-surface': up.soft,
  'data-negative': down.light,
  'data-negative-surface': down.soft,

  /* 상태 */
  success: positive.light,
  'success-surface': positive.soft,
  warning: warning.light,
  'warning-surface': warning.soft,
  danger: danger.light,
  'danger-surface': danger.soft,
  'danger-border': danger.softBorder,

  /* 크롬 */
  overlay: 'rgba(16, 29, 41, 0.45)',
  'focus-ring': brand[500],
  'focus-shadow': 'rgba(31, 123, 165, 0.28)',

  /* 엘리베이션 — 라이트는 그림자가 위계를 만든다 */
  'shadow-1': '0 1px 2px rgba(15, 25, 35, 0.04), 0 1px 3px rgba(15, 25, 35, 0.06)',
  'shadow-2': '0 2px 4px rgba(15, 25, 35, 0.04), 0 4px 12px rgba(15, 25, 35, 0.08)',
  'shadow-3': '0 2px 6px rgba(15, 25, 35, 0.06), 0 12px 32px rgba(15, 25, 35, 0.14)',

  /* 차트 크롬 (chartTheme.ts가 읽어간다) */
  'chart-axis-line': neutral[200],
  'chart-split-line': neutral[100],
  'chart-label': neutral[600],
  'chart-slice-border': neutral[0],

  /* input[type=date] 피커 아이콘 */
  'picker-filter': 'none'
};

export const DARK_THEME: ThemeTokens = {
  /**
   * 다크에서는 그림자가 거의 안 보인다. 대신 **서피스가 밝아질수록 위로 뜬다**는
   * 머티리얼 규칙으로 위계를 만든다: sunken(950) < base(900) < raised(850).
   */
  bg: neutral[950],
  surface: neutral[900],
  'surface-raised': neutral[850],
  'surface-muted': '#1b232d',
  'surface-sunken': '#121922',
  'surface-hover': '#202a35',

  border: '#2a3542',
  /** 다크 컨트롤 경계 — 다크 서피스 대비 3.06:1 (WCAG 1.4.11) */
  'border-strong': '#5c6a7a',

  text: '#e6edf3',
  'text-secondary': '#a7b4c2',
  'text-muted': '#8b98a6',
  'text-inverse': neutral[950],

  /**
   * 다크의 brand는 라이트보다 밝게 올린다. brand[600]을 어두운 배경에 그대로 쓰면
   * 배경과 붙어버려서 버튼이 눌리는 물건으로 안 보인다.
   * brand[500](#1f7ba5)은 흰 라벨 대비 4.73:1 로 AA를 넘긴다.
   */
  brand: brand[500],
  'brand-hover': brand[400],
  'brand-subtle': '#12303f',
  'brand-subtle-hover': '#173d50',
  'brand-border': '#2c5871',
  'brand-text': brand[300],
  'on-brand': neutral[0],

  'data-positive': up.dark,
  'data-positive-surface': up.softDark,
  'data-negative': down.dark,
  'data-negative-surface': down.softDark,

  success: positive.dark,
  'success-surface': positive.softDark,
  warning: warning.dark,
  'warning-surface': warning.softDark,
  danger: danger.dark,
  'danger-surface': danger.softDark,
  'danger-border': danger.softDarkBorder,

  overlay: 'rgba(3, 8, 13, 0.66)',
  'focus-ring': brand[300],
  'focus-shadow': 'rgba(136, 194, 222, 0.3)',

  'shadow-1': '0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.24)',
  'shadow-2': '0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.36)',
  'shadow-3': '0 2px 6px rgba(0, 0, 0, 0.36), 0 12px 32px rgba(0, 0, 0, 0.48)',

  'chart-axis-line': '#33404e',
  'chart-split-line': '#232d39',
  'chart-label': '#a7b4c2',
  'chart-slice-border': neutral[900],

  'picker-filter': 'invert(0.86)'
};

/** 테마 맵 → `--sb-a: b;` CSS 선언 문자열. globalStyles가 쓴다. */
export const toCssVars = (theme: ThemeTokens): string =>
  Object.entries(theme)
    .map(([key, value]) => `--sb-${key}: ${value};`)
    .join('\n  ');

/* -------------------------------------------------------------------------- */
/* 컴포넌트가 쓰는 참조                                                          */
/* -------------------------------------------------------------------------- */

export const color = {
  bg: 'var(--sb-bg)',
  surface: 'var(--sb-surface)',
  surfaceRaised: 'var(--sb-surface-raised)',
  surfaceMuted: 'var(--sb-surface-muted)',
  surfaceSunken: 'var(--sb-surface-sunken)',
  surfaceHover: 'var(--sb-surface-hover)',

  border: 'var(--sb-border)',
  borderStrong: 'var(--sb-border-strong)',

  text: 'var(--sb-text)',
  textSecondary: 'var(--sb-text-secondary)',
  textMuted: 'var(--sb-text-muted)',
  textInverse: 'var(--sb-text-inverse)',

  brand: 'var(--sb-brand)',
  brandHover: 'var(--sb-brand-hover)',
  brandSubtle: 'var(--sb-brand-subtle)',
  brandSubtleHover: 'var(--sb-brand-subtle-hover)',
  brandBorder: 'var(--sb-brand-border)',
  brandText: 'var(--sb-brand-text)',
  onBrand: 'var(--sb-on-brand)',

  dataPositive: 'var(--sb-data-positive)',
  dataPositiveSurface: 'var(--sb-data-positive-surface)',
  dataNegative: 'var(--sb-data-negative)',
  dataNegativeSurface: 'var(--sb-data-negative-surface)',

  success: 'var(--sb-success)',
  successSurface: 'var(--sb-success-surface)',
  warning: 'var(--sb-warning)',
  warningSurface: 'var(--sb-warning-surface)',
  danger: 'var(--sb-danger)',
  dangerSurface: 'var(--sb-danger-surface)',
  dangerBorder: 'var(--sb-danger-border)',

  overlay: 'var(--sb-overlay)',
  focusRing: 'var(--sb-focus-ring)',
  focusShadow: 'var(--sb-focus-shadow)'
} as const;

/** 엘리베이션. 라이트=그림자, 다크=서피스 밝기가 실제 위계를 만든다. */
export const elevation = {
  1: 'var(--sb-shadow-1)',
  2: 'var(--sb-shadow-2)',
  3: 'var(--sb-shadow-3)'
} as const;
