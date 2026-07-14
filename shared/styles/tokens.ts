/**
 * 디자인 토큰.
 *
 * 색은 CSS custom property(`--sb-*`)를 가리키는 `var()` 문자열로 노출한다.
 * - Emotion `ThemeProvider`를 쓰지 않는 이유: 기존 코드에 Provider가 전혀 없고,
 *   공용 컴포넌트 테스트가 Provider 없이 단독 렌더된다(`theme`이 비어 크래시).
 *   CSS 변수는 Provider가 필요 없고 `prefers-color-scheme` 다크 전환도 리렌더 없이 동작한다.
 * - 캔버스(ECharts)는 `var()`를 읽지 못하므로 실제 hex가 필요하다 → `CHART_SERIES` / `chartTheme.ts` 참고.
 */

/* -------------------------------------------------------------------------- */
/* 브레이크포인트 — 기존 코드에 흩어져 있던 값을 그대로 토큰화 (변경 금지)          */
/* -------------------------------------------------------------------------- */

export const BREAKPOINT = {
  /** 알로케이션 범례 2줄 접힘 */
  mobile: 560,
  /** 설정 입력 2열 전환 시작 */
  mobileWide: 640,
  /** 프리셋 카드 1열 전환 */
  tabletSm: 760,
  /** 데이터 테이블 카드형 전환 */
  tablet: 820,
  /** 모바일 드로어 on/off 경계 */
  drawer: 960,
  /** 좌/우 2단 → 1단 전환 */
  layout: 980
} as const;

export type BreakpointKey = keyof typeof BREAKPOINT;

export const media = {
  down: (key: BreakpointKey) => `@media (max-width: ${BREAKPOINT[key]}px)`,
  up: (key: BreakpointKey) => `@media (min-width: ${BREAKPOINT[key] + 1}px)`
} as const;

/** ContentLayout이 `container-type: inline-size`라서 컨테이너 쿼리도 함께 쓴다. */
export const container = {
  down: (key: BreakpointKey) => `@container (max-width: ${BREAKPOINT[key]}px)`,
  between: (from: BreakpointKey, to: BreakpointKey) =>
    `@container (min-width: ${BREAKPOINT[from]}px) and (max-width: ${BREAKPOINT[to]}px)`
} as const;

/* -------------------------------------------------------------------------- */
/* 색 — var() 참조                                                             */
/* -------------------------------------------------------------------------- */

export const color = {
  bg: 'var(--sb-bg)',
  surface: 'var(--sb-surface)',
  surfaceMuted: 'var(--sb-surface-muted)',
  surfaceSunken: 'var(--sb-surface-sunken)',
  surfaceHover: 'var(--sb-surface-hover)',

  border: 'var(--sb-border)',
  borderStrong: 'var(--sb-border-strong)',

  text: 'var(--sb-text)',
  textSecondary: 'var(--sb-text-secondary)',
  textMuted: 'var(--sb-text-muted)',

  brand: 'var(--sb-brand)',
  brandHover: 'var(--sb-brand-hover)',
  brandSubtle: 'var(--sb-brand-subtle)',
  brandSubtleHover: 'var(--sb-brand-subtle-hover)',
  brandBorder: 'var(--sb-brand-border)',
  brandText: 'var(--sb-brand-text)',
  onBrand: 'var(--sb-on-brand)',

  success: 'var(--sb-success)',
  warning: 'var(--sb-warning)',
  danger: 'var(--sb-danger)',
  dangerSurface: 'var(--sb-danger-surface)',
  dangerBorder: 'var(--sb-danger-border)',

  overlay: 'var(--sb-overlay)',
  focusRing: 'var(--sb-focus-ring)',
  focusShadow: 'var(--sb-focus-shadow)'
} as const;

/* -------------------------------------------------------------------------- */
/* 타이포                                                                       */
/* -------------------------------------------------------------------------- */

export const font = {
  /**
   * 외부 CDN 폰트를 쓰지 않는다(성능·프라이버시). Pretendard가 설치/셀프호스팅된 환경에서는
   * 그대로 쓰고, 아니면 OS 한글 폰트로 우아하게 폴백한다.
   * 기존 코드는 'Pretendard Variable'만 선언하고 실제로 로드하지 않아 무조건 폴백되고 있었다.
   */
  sans: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', 'Segoe UI', Roboto, sans-serif",
  size: {
    '2xs': '11px',
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '15px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px'
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  leading: {
    tight: 1.25,
    snug: 1.4,
    normal: 1.5,
    relaxed: 1.6
  },
  /** 금액/퍼센트가 표에서 자릿수 정렬되도록. 금융 앱의 핵심 디테일. */
  numeric: "font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1;"
} as const;

/* -------------------------------------------------------------------------- */
/* 간격 (4px 스케일) / 라운드 / 그림자 / 모션                                     */
/* -------------------------------------------------------------------------- */

export const space = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  10: '40px',
  12: '48px'
} as const;

export const radius = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  pill: '999px'
} as const;

export const shadow = {
  e1: 'var(--sb-shadow-1)',
  e2: 'var(--sb-shadow-2)',
  e3: 'var(--sb-shadow-3)'
} as const;

export const motion = {
  fast: '150ms',
  base: '200ms',
  ease: 'cubic-bezier(0.2, 0, 0, 1)'
} as const;

/** 터치 타겟 최소 44x44 (WCAG 2.5.5 / iOS HIG). */
export const TOUCH_TARGET = '44px';

export const zIndex = {
  drawerBackdrop: 55,
  drawerToggle: 54,
  drawer: 60,
  dropdown: 20,
  tooltip: 2000,
  modal: 2147483000,
  skipLink: 2147483647
} as const;

/* -------------------------------------------------------------------------- */
/* 차트 시리즈 팔레트 (캔버스용 raw hex — var() 사용 불가)                        */
/* -------------------------------------------------------------------------- */

/**
 * 기존 팔레트는 네온톤(#4cc9f0, #70e000, #ffd166 …)과 flat-UI 2014 계열(#c0392b, #f39c12)이
 * 섞여 있어 가장 낡아 보이던 지점이었다. 채도를 낮추고 라이트/다크 양쪽에서 서로 구분되는
 * 8색 카테고리 팔레트로 교체한다. 개수·순서만 유지하면 되므로 로직 영향은 없다.
 *
 * 모든 색은 라이트(#ffffff)·다크(#161d26) 서피스 양쪽에서 대비 3:1 이상이다
 * (WCAG 1.4.11 non-text contrast). 캔버스는 테마별로 색을 바꿀 수 없으므로 한 세트로 둘 다 만족시킨다.
 */
export const CHART_SERIES = [
  '#3b82c4',
  '#c26d22',
  '#48a06b',
  '#d1607a',
  '#8b6fc9',
  '#2c8b9b',
  '#9a7b14',
  '#7a8a99'
] as const;
