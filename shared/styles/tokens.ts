/**
 * 토큰 파사드.
 *
 * 디자인 시스템은 2계층이다:
 *   `primitives.ts` (원시 램프/스케일)  →  `semantic.ts` (역할)  →  화면
 *
 * 이 파일은 두 계층을 화면이 쓰기 편한 형태로 묶어 다시 내보내고,
 * 색이 아닌 나머지 토큰(브레이크포인트·타이포·간격·모션·z-index)을 정의한다.
 *
 * 색이 `var(--sb-*)` 문자열인 이유:
 * - Emotion `ThemeProvider`를 쓰지 않는다. 공용 컴포넌트 테스트가 Provider 없이 단독 렌더되기 때문에
 *   `theme`이 비어 크래시한다. CSS 변수는 Provider가 필요 없고, `prefers-color-scheme` 다크 전환도
 *   리렌더 없이 동작한다.
 * - 캔버스(ECharts)는 `var()`를 읽지 못하므로 실제 hex가 필요하다 → `getChartTheme().series`(chartTheme.ts) 참고.
 */

import { FONT_SIZE_SCALE, FONT_WEIGHT_SCALE, LEADING_SCALE, RADIUS_SCALE, SPACE_SCALE } from './primitives';

export { palette } from './primitives';
export { color, elevation, DARK_THEME, LIGHT_THEME, toCssVars } from './semantic';
export type { ThemeTokens } from './semantic';

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
/* 타이포                                                                       */
/* -------------------------------------------------------------------------- */

export const font = {
  /**
   * Pretendard를 npm으로 셀프호스팅한다(`main.tsx`에서 동적 서브셋 CSS를 import).
   * CDN을 쓰지 않는 이유: 서드파티 요청(프라이버시) + 렌더 블로킹 + 오프라인 실패.
   * 폰트가 아직 안 왔을 때는 OS 한글 폰트로 우아하게 폴백한다(`font-display: swap`).
   */
  sans: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', 'Segoe UI', Roboto, sans-serif",
  size: FONT_SIZE_SCALE,
  weight: FONT_WEIGHT_SCALE,
  leading: LEADING_SCALE,
  /** 금액/퍼센트가 표에서 자릿수 정렬되도록. 금융 앱의 핵심 디테일. */
  numeric: "font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1;"
} as const;

/* -------------------------------------------------------------------------- */
/* 간격 (4px 스케일) / 라운드 / 그림자 / 모션                                     */
/* -------------------------------------------------------------------------- */

export const space = SPACE_SCALE;

export const radius = RADIUS_SCALE;

/** `elevation`의 별칭. 기존 호출부가 `shadow.e1`로 쓰고 있어 유지한다. */
export const shadow = {
  e1: 'var(--sb-shadow-1)',
  e2: 'var(--sb-shadow-2)',
  e3: 'var(--sb-shadow-3)'
} as const;

export const motion = {
  fast: '150ms',
  base: '200ms',
  /** 오케스트레이션된 순간 전용(진행률 바 채움 등). 상태 피드백에는 fast/base를 쓴다. */
  slow: '450ms',
  ease: 'cubic-bezier(0.2, 0, 0, 1)'
} as const;

/** 터치 타겟 최소 44x44 (WCAG 2.5.5 / iOS HIG). */
export const TOUCH_TARGET = '44px';

/**
 * 층위 스케일 — 낮은 층부터: 콘텐츠 지역 층(시나리오 탭 1~2) < `dropdown`(헤더 팝오버) <
 * `headerSurface`(팝오버를 품는 헤더 자신) < 드로어 계열 < `tooltip` < `modal` < `skipLink`.
 *
 * ⚠ **숫자만으로는 층위가 결정되지 않는다.** `z-index`는 같은 스태킹 컨텍스트 안에서만 비교된다 —
 * 팝오버의 조상(예: 헤더)이 스태킹 컨텍스트를 만들면 그 안의 `dropdown`(20)은 **조상의 층위로 눌려**
 * 조상보다 뒤에 오는 형제(예: `ScenarioTabButton`의 z-index 1~2)에게 가려진다.
 * 스태킹 컨텍스트를 만드는 것: `position`+`z-index`(auto 아님), `transform`, `filter`,
 * **`backdrop-filter`**, `will-change`, `contain: layout|paint`, `isolation: isolate`, `opacity < 1`.
 * 그래서 팝오버를 품는 헤더에는 이런 속성을 함부로 얹지 않는다(`shared/styles/headerSurface.ts` 참고).
 */
export const zIndex = {
  drawerBackdrop: 55,
  drawer: 60,
  dropdown: 20,
  /**
   * 헤더 서피스 층 — **팝오버를 품는 헤더 자신**의 층위.
   *
   * 반드시 `dropdown`보다 **높아야** 한다. 헤더가 스태킹 컨텍스트(sticky+z-index, backdrop-filter…)를
   * 만들면 그 안의 드롭다운(`dropdown`=20)은 헤더 층위 밖으로 못 나가므로, 헤더를 드롭다운보다
   * 낮게 두면 "헤더는 드롭다운 아래"라는 의도가 오히려 **드롭다운을 콘텐츠 아래로 끌어내린다**.
   * 드로어 계열(55~60)보다는 낮게 유지해 모바일 드로어가 헤더를 덮는 순서를 지킨다.
   * (구 `drawerToggle`(54)은 드로어 토글이 헤더 안 정적 버튼이 되면서 삭제됐다 — fixed 승격 없음.)
   */
  headerSurface: 30,
  tooltip: 2000,
  modal: 2147483000,
  skipLink: 2147483647
} as const;

/* -------------------------------------------------------------------------- */
/* 차트 시리즈 팔레트                                                            */
/* -------------------------------------------------------------------------- */

/**
 * 8색 카테고리 팔레트. 두 개의 제약을 **동시에** 만족해야 한다 (`contrast.test.ts`가 강제):
 *  1. 캔버스는 테마별로 색을 못 바꾼다 → 한 세트로 라이트·다크 surface 양쪽에서 대비 3:1 이상
 *     (WCAG 1.4.11 non-text contrast).
 *  2. 시리즈끼리 지각적으로 구분 → 모든 쌍 ΔE ≥ 20.
 *
 * 왜 ΔE 25가 아니라 20인가: 위 1번이 색을 **중간 명도 띠**에 가둔다. 그 좁은 공간 안에서
 * 저채도 8색을 뽑으면 25는 물리적으로 불가능하고, 억지로 밀어내면 네온(#e024e0 류)이 된다.
 *
 * 팔레트 프리셋 도입 후에는 프리셋마다 자기 세트를 갖는다(`--sb-chart-series-0..7`,
 * `presets.ts`). 캔버스(옵션 빌드)는 **`getChartTheme().series`** 를, DOM(범례 점 등)은
 * 아래 `CHART_SERIES_VARS`를 쓴다 — 그래야 프리셋 전환을 따라간다.
 */

/**
 * @deprecated aurora 프리셋 고정 세트 — 프리셋 전환을 따라가지 **않는다**.
 * 캔버스는 `getChartTheme().series`, DOM은 `CHART_SERIES_VARS`를 쓴다.
 * (기존 import·jsdom 결정성 하위 호환을 위해 값 그대로 유지)
 */
export { AURORA_CHART_SERIES as CHART_SERIES } from './presets';

/**
 * DOM 전용 차트 시리즈 참조 (`var(--sb-chart-series-N)`) — 범례 점 등 HTML 요소에서 쓴다.
 * CSS 변수라 프리셋 전환·다크 전환을 리렌더 없이 따라간다. 캔버스(ECharts)에는 못 쓴다.
 */
export const CHART_SERIES_VARS: readonly string[] = Array.from(
  { length: 8 },
  (_, index) => `var(--sb-chart-series-${index})`
);
