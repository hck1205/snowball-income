/**
 * 시맨틱 토큰 — 디자인 시스템의 2계층.
 *
 * 프리미티브 램프(`primitives.ts`)에 **역할**을 부여한다. 화면/컴포넌트는 오직 이 계층만 쓴다.
 * "이건 무슨 색인가"가 아니라 "이건 무슨 역할인가"로 사고하게 만드는 게 목적이다.
 *
 * 구조:
 *  - 역할 → 실제 hex 맵의 **유일한 진실 공급원은 `presets.ts`의 `THEME_PRESETS`**
 *    (4프리셋 × light/dark). globalStyles가 이걸로 `--sb-*` 변수를 찍고,
 *    대비 검증 테스트(contrast.test.ts)도 같은 값을 그대로 읽는다.
 *  - `LIGHT_THEME` / `DARK_THEME` : **하위 호환 별칭** — aurora 프리셋의 light/dark.
 *    (프리셋 도입 전의 단일 테마가 aurora였다. 신규 코드는 `THEME_PRESETS`를 쓴다.)
 *  - `color` : 컴포넌트가 쓰는 `var(--sb-*)` 참조. 프리셋이 바뀌어도 이름(역할)은 그대로다.
 *
 * ECharts는 캔버스라 `var()`를 못 읽는다 → `chartTheme.ts`가 런타임에 실제 값으로 해석한다.
 */

import { THEME_PRESETS } from './presets';

/** 역할 이름 → CSS 변수 이름. `--sb-` 접두사는 생성 시점에 붙인다. */
export type ThemeTokens = Record<string, string>;

/** @deprecated 하위 호환 별칭 (= `THEME_PRESETS.aurora.light`). 신규 코드는 `THEME_PRESETS`를 쓴다. */
export const LIGHT_THEME: ThemeTokens = THEME_PRESETS.aurora.light;

/** @deprecated 하위 호환 별칭 (= `THEME_PRESETS.aurora.dark`). 신규 코드는 `THEME_PRESETS`를 쓴다. */
export const DARK_THEME: ThemeTokens = THEME_PRESETS.aurora.dark;

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

  /*
   * 오로라 액센트 — 크롬 전용. 숫자 데이터에 금지(숫자는 dataPositive/dataNegative만).
   * accent(틸) = 성장·복리·달성 / accent-alt(그린) = 목표·추천·프로모.
   */
  accent: 'var(--sb-accent)',
  accentText: 'var(--sb-accent-text)',
  accentSubtle: 'var(--sb-accent-subtle)',
  accentBorder: 'var(--sb-accent-border)',
  accentAlt: 'var(--sb-accent-alt)',
  accentAltText: 'var(--sb-accent-alt-text)',
  accentAltSubtle: 'var(--sb-accent-alt-subtle)',
  accentAltBorder: 'var(--sb-accent-alt-border)',

  /*
   * 아이덴티티(쿨 블루 hue 200) — **전 프리셋 공통**. 워드마크와 같은 급의 "제품 자신"이라
   * 스킨(프리셋)을 따라가지 않는다. 히어로 리본·아이콘 배지 채움(identity), 히어로/빈 상태
   * 틴트 면(identitySubtle), 그 면의 1px 경계(identityBorder), 면 위 라벨(identityText).
   *
   * ⚠ identity 채움 위에 **텍스트 금지**(다크에서 흰 라벨 2.79:1). 아이콘·리본 같은 비텍스트만.
   * ⚠ brand(액션·인터랙션 축)와 값이 겹칠 수 있지만 역할이 다르다 — 누를 수 있는 것에는
   *   brand 를, "이 제품이다"라고 말하는 장식 면에는 identity 를 쓴다.
   * 근거·실측 수치는 presets/sharedTokens.ts 의 IDENTITY_LIGHT/IDENTITY_DARK 주석.
   */
  identity: 'var(--sb-identity)',
  identitySubtle: 'var(--sb-identity-subtle)',
  identityBorder: 'var(--sb-identity-border)',
  identityText: 'var(--sb-identity-text)',

  /*
   * 브랜드 패널 — 🔴 **금색이 합법인 유일한 조합**이다(2026-08-03 D3).
   * 금색은 밝은 면 위에서 1.83:1 이라 `onPanelGold` 는 반드시 `panel` 면 위에서만 쓴다.
   * 범용 `gold` 토큰은 일부러 없다 — 이름이 사용 조건을 강제한다(근거: presets/sharedTokens.ts).
   */
  panel: 'var(--sb-panel)',
  onPanel: 'var(--sb-on-panel)',
  onPanelMuted: 'var(--sb-on-panel-muted)',
  onPanelGold: 'var(--sb-on-panel-gold)',

  /*
   * 워드마크("Hungry Hippo") — 전 프리셋 공통. 토큰 이름의 `snow`/`income` 은 구 제품명에서
   * 온 식별자다(값·의미는 앞 낱말=브랜드 램프 / 뒷 낱말=틸→그린). `background-clip: text` 전용이고
   * solid 는 그 폴백(@supports 미지원·forced-colors·print)이다. 다른 용도로 쓰지 마라.
   */
  gradientWordmarkSnow: 'var(--sb-gradient-wordmark-snow)',
  gradientWordmarkIncome: 'var(--sb-gradient-wordmark-income)',
  wordmarkSnowSolid: 'var(--sb-wordmark-snow-solid)',
  wordmarkIncomeSolid: 'var(--sb-wordmark-income-solid)',

  /* 오로라 시그니처 — 그라데이션·글로우·글래스 (CSS 값 전체 문자열) */
  gradientAurora: 'var(--sb-gradient-aurora)',
  gradientCta: 'var(--sb-gradient-cta)',
  /*
   * 파스텔 히어로 — **면 배경 전용**(PageHero·EmptyState·프로모 카드). 버튼·리본에 금지.
   * gradientCta(버튼 채움) / gradientAurora(리본·장식)와 교차 사용하지 않는 세 번째 계열이다.
   */
  gradientHero: 'var(--sb-gradient-hero)',
  gradientHeroSoft: 'var(--sb-gradient-hero-soft)',
  bgGlow: 'var(--sb-bg-glow)',
  surfaceGlass: 'var(--sb-surface-glass)',
  surfaceGlassFallback: 'var(--sb-surface-glass-fallback)',
  progressTrack: 'var(--sb-progress-track)',

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
