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

/**
 * 컨테이너 쿼리. `container-type: inline-size`를 켜는 곳은 **5곳**이다(2026-07-28 실측):
 *
 *  | 컨테이너 | 위치 |
 *  |---|---|
 *  | `DataTable`의 TableWrap | `components/common/DataTable/DataTable.styled.ts:6` |
 *  | `PortfolioAllocation`의 범례 목록 | `components/common/PortfolioAllocation/PortfolioAllocation.styled.ts:29` |
 *  | `SideDrawerBody`(드로어 안 폼) | `components/common/SideDrawer/SideDrawer.styled.ts:179` |
 *  | 티커 상세 카드 | `pages/Ticker/TickerDetailPage/TickerDetailPage.styled.ts:199` |
 *  | 티커 허브 카드 | `pages/Ticker/TickerHubPage/TickerHubPage.styled.ts:114` |
 *
 * ⚠ `container-type`은 **레이아웃 컨테인먼트를 함께 적용**해 그 요소가 `position: fixed` 자손의
 * 컨테이닝 블록이 된다 — fixed 오버레이(드로어·토스트)를 품는 요소에는 켜지 말 것.
 * 그래서 구 `FeatureLayout`(본문 래퍼)의 컨테인먼트는 **2026-07-28 드로어 전환으로 제거됐다**
 * (되살리면 안 되는 이유는 `pages/Main/Main.shared.styled.ts`의 `FeatureLayout` 주석에 남아 있다).
 */
export const container = {
  down: (key: BreakpointKey) => `@container (max-width: ${BREAKPOINT[key]}px)`,
  between: (from: BreakpointKey, to: BreakpointKey) =>
    `@container (min-width: ${BREAKPOINT[from]}px) and (max-width: ${BREAKPOINT[to]}px)`
} as const;

/* -------------------------------------------------------------------------- */
/* 타이포                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * 서체는 **역할 4종**이다. 전부 셀프호스팅(CDN 금지 — 서드파티 요청·렌더 블로킹·오프라인 실패).
 * 폰트가 아직 안 왔을 때는 OS 한글 폰트로 우아하게 폴백한다(`font-display: swap`).
 *
 *  | 역할          | 서체                | 어디에                                        |
 *  |---------------|--------------------|-----------------------------------------------|
 *  | `sans`        | Wanted Sans        | 본문·라벨·힌트·버튼·입력 (기본값)               |
 *  | `display`     | Snowball Display   | 워드마크, 헤딩(h1~h6) — 원본은 Gmarket Sans      |
 *  | `heroNumeric` | LINE Seed Sans KR  | **화면당 1곳** — hero StatTile 값                |
 *  | `dataNumeric` | Snowball Numeric   | 그 외 모든 숫자 — StatTile default, DataTable, 칩, 차트 축·툴팁 (원본은 Inter + tabular) |
 *
 * 적재는 `main.tsx`(Wanted Sans = npm 동적 서브셋 CSS) + `shared/styles/selfHostedFonts.css`
 * (나머지 3종 = `public/fonts/` 서브셋, `tools/fonts/build.mjs` 생성물)가 맡는다.
 *
 * ⚠ **컴포넌트에서 `font-family` 문자열을 직접 쓰지 마라.** 반드시 이 토큰을 거친다.
 */
export const font = {
  sans: "'Wanted Sans Variable', 'Wanted Sans', -apple-system, BlinkMacSystemFont, system-ui, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', 'Segoe UI', Roboto, sans-serif",
  /**
   * 헤딩·워드마크.
   *
   * 1순위 `'Snowball Display'` 는 우리 자체 서브셋(`shared/styles/selfHostedFonts.css`)의 family 명이고
   * **원본은 Gmarket Sans** 다 — CSS family 명만 앱 고유명으로 두어 OFL §3 Reserved Font Name 회색지대를
   * 해소했다(2026-07-28). 파일명·저작권 고지·OFL 원문은 원본 그대로다(public/fonts/README.md).
   *
   * 원본은 Light(300)·Medium(400)·Bold(700) 세 벌뿐이고 이 앱은 **Bold 한 벌만** 싣는다(헤딩 실측이
   * 600/700/800 뿐 — tools/fonts/build.mjs 주석 참고). 그래서 display 로 그린 글자는 굵기를 무엇으로
   * 요청하든 Bold 로 보인다.
   *
   * **판단(2026-07-28 — 현 상태 수용)**: 위계는 굵기가 아니라 **크기**로 만든다. `weight` 를 600·700·800 중
   * 무엇으로 적든 헤딩은 같은 굵기로 렌더되지만, 굵기 범위를 실제로 넓히려면 헤딩 일부를 `sans` 로
   * 내려야 하고 그러면 같은 화면의 헤딩끼리 서체가 갈려 더 나쁘다. 헤딩 굵기를 "고쳐야 할 버그"로 보지 마라.
   */
  display:
    "'Snowball Display', 'Wanted Sans Variable', 'Wanted Sans', -apple-system, BlinkMacSystemFont, system-ui, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif",
  /**
   * 그 화면의 주인공 숫자 **한 곳**에만. 두 곳에 쓰면 위계가 죽는다(`StatTile.types.ts` hero 규칙과 동일).
   * 서브셋이 숫자·통화기호·단위 한글만 담고 있어 그 밖의 글자는 자동으로 sans 로 떨어진다(의도).
   */
  heroNumeric:
    "'LINE Seed Sans KR', 'Wanted Sans Variable', 'Wanted Sans', -apple-system, BlinkMacSystemFont, system-ui, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif",
  /**
   * hero 를 제외한 모든 숫자. `numeric`(tabular-nums)과 **함께** 쓴다 — Inter 의 기본 숫자는 비례폭이고
   * `tnum` 을 켜야 자릿수가 정렬된다.
   *
   * ⚠ Inter 에는 한글 글리프가 없다 — 표 안 "3종"·"미정" 같은 한글이 본문 서체로 폴백되게 순서를 고정한다.
   *
   * 1순위 `'Snowball Numeric'` 은 우리 자체 서브셋(`shared/styles/selfHostedFonts.css`)의 family 명이다
   * (원본 Inter, opsz 16 고정 · ₩ 포함 단일 파일). 이름 충돌은 **해소 완료**(2026-07-28) — 예전 이름
   * `'Inter Variable'` 은 npm `@fontsource-variable/inter` 가 등록하는 이름과 같아서, 누군가 그 패키지를
   * 설치·import 하면 unicode-range 분할된 다른 `@font-face` 세트가 같은 이름으로 끼어들어 CSS 순서에 따라
   * 우리 서브셋이 밀리고 최적화가 **조용히 무효화**됐다(tsc·테스트·대비 게이트 어느 것도 못 잡는 사고).
   * 이름을 갈라 그 경로 자체를 없앴으니 family 명을 다시 원본 이름으로 되돌리지 마라.
   *
   * 2순위의 맨몸 `Inter` 는 **사용자 OS 에 설치된 Inter** 를 쓰는 폴백이라 충돌과 무관하다 — 유지한다.
   */
  dataNumeric:
    "'Snowball Numeric', Inter, 'Wanted Sans Variable', 'Wanted Sans', -apple-system, BlinkMacSystemFont, system-ui, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif",
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
   * 본문 흐름 안의 sticky 액션(시뮬레이터 설정 도크) — 스크롤하면 결과 카드 **위로** 지나가야 한다.
   *
   * 콘텐츠 지역 층(1~2)보다 높고 `dropdown`(20)보다 낮다. 명시하지 않으면 DOM 순서상 **뒤에 오는**
   * 카드(`position: relative` 를 쓰는 것들)가 이 버튼을 덮는다. 헤더(30)보다 낮아 스크롤 시
   * 헤더 뒤로 들어가고, 드로어 계열(55~60)보다 낮아 드로어가 열리면 그 아래에 깔린다.
   */
  stickyAction: 10,
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
