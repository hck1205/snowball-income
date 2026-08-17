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
  /**
   * **헤더가 로고 그림까지 세울 수 없는 폭.** `media.down('mobileNarrow')` = 379px 이하.
   *
   * 🔴 이 값은 짐작이 아니라 **계산**이다(2026-08-09, 사용자 신고: 로그아웃 상태에서 워드마크가
   * 로그인 버튼과 겹친다). 헤더 액션은 오른쪽 정렬이라 뷰포트 폭 W 에 대해
   * `actions.left = W − 137`(액션 125 + 우패딩 12)이고, 워드마크 오른쪽 끝은 `229` 로 고정이다
   * (좌패딩 12 + 메뉴 40 + 간격 8 + 로고 40 + 간격 16 + 워드마크 113). 따라서
   *
   *     W − 137 < 229  →  **W < 366 에서 겹친다**
   *
   * 실측이 이걸 확인해 준다 — 320px 46px 겹침 · 360px 6px 겹침 · 390px 24px 여유.
   * 경계를 366 이 아니라 **380** 으로 잡은 것은 14px 의 여유를 두기 위해서다(웹폰트가 늦게 와
   * 폴백으로 그려지면 워드마크가 조금 넓어진다).
   *
   * ⚠ 이 겹침은 **문서 가로 넘침이 0** 이라 기존 오버플로 가드에 안 걸렸다. 순수하게 격자 안에서
   *   두 칸이 포개진 것이다. 그래서 `headerprobe` 에 브랜드↔액션 겹침 검사를 따로 넣었다.
   */
  mobileNarrow: 379,
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
  layout: 980,
  /**
   * 앱 헤더 1줄 ↔ 2줄 전환. **`media.up('headerStack')` = 1024px 이상 = 한 줄**이고,
   * `media.down('headerStack')` = 1023px 이하 = 브랜드 줄 + 메뉴 줄 2단이다.
   *
   * 값이 유일하게 홀수인 이유: 이 경계만 "데스크톱 쪽 시작점(1024)"으로 정해졌다
   * (내비 높이 상한 80px 규칙 — 두 줄 헤더는 데스크톱에서 117px 이었다).
   * 나머지 키처럼 "작은 쪽의 max-width" 로 표현하면 1023 이 된다.
   */
  headerStack: 1023,
  /**
   * **바깥 여백에 무언가를 세울 수 있는 폭.** `media.up('outerRail')` = 1384px 이상.
   *
   * 근거(실측): 본문 카드는 max-width 1200 에 좌우 여백 20 이라 실폭 1160 이다. 커뮤니티 상세의
   * 반응 레일은 72px + gap(최대 40) = **112px** 을 카드 왼쪽 **바깥**에 요구한다.
   * 좌여백 = (뷰포트 − 1160) / 2 이므로 112px 을 확보하려면 1160 + 224 = **1384** 가 필요하다.
   * 실측: 1600px 에서 좌여백 213px(충분) · 1280px 에서 53px(부족 — 레일이 x=-39 로 화면 밖으로 나갔다).
   *
   * ⚠ 이 값은 카드 폭(1200)에 묶여 있다. 콘텐츠 폭을 바꾸면 여기도 함께 다시 계산하라.
   */
  outerRail: 1383
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
 *  | 티커 상세 카드 | `pages/Ticker/TickerDetailPage/styled/hero.ts` 의 Hero |
 *  | 티커 허브 카드 | `pages/Ticker/TickerHubPage/styled/` 의 카드 모듈 |
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

/* -------------------------------------------------------------------------- */
/* 면의 종류별 기하 — brand 면 / data 면                                         */
/* -------------------------------------------------------------------------- */

/**
 * **고르는 면(brand)** 의 기하. `SurfaceKind` 의 정의는 `shared/styles/surfaces.ts` 가 소유하고,
 * 여기는 그 면이 쓰는 **치수**만 둔다(반경 파생은 `PICK_RADIUS` — 순환 import 를 피해 저쪽에 있다).
 *
 * 실측 기준(2026-08-03): 이 레포의 카드 패딩은 이미 다섯 종류였다 —
 * 공용 Card 16~20 · GoalCard 16~28 · PageHero 20~32 · EmptyState 20~28 · TickerHub 24~40.
 * 여섯 번째를 만드는 게 아니라, **고르는 카드가 공유할 한 벌**을 정한다.
 */
export const PICK = {
  /**
   * 공용 `Card`(16~20)보다 **2px 좁다.** 컬러 캡이 카드 머리의 세로를 먹으므로 바디를 그만큼 조여야
   * 카드 전체 높이가 data 카드와 같은 대역에 남는다(격자에 두 종류가 섞이면 줄 높이가 어긋난다).
   */
  pad: 'clamp(14px, 1.6vw, 18px)',
  /**
   * 카드 사이 간격. **`space[3]`(12px 고정)보다 넓다** — 부상 그림자(`elevation[2]`, blur 12px)가
   * 12px 간격에서는 옆 카드에 닿아 "카드가 서로를 더럽히는" 것으로 보인다. 현행 프리셋 보드가
   * 정확히 그 상태다(2026-08-03 실측).
   */
  gap: 'clamp(12px, 1.4vw, 16px)',
  /**
   * 안쪽 컨트롤 반경 — brand 면의 바깥 반경은 여기서 역산된다(`PICK_RADIUS`).
   * data 면(`DATA_SURFACE.radiusAnchor` = 8px)보다 **한 단 크다**: 같은 화면에 두 면이 섞였을 때
   * 반경이 "고르는 것 / 읽는 것"을 거드는 신호가 되게 한다.
   */
  radiusAnchor: RADIUS_SCALE.lg,
  /**
   * 틴트 캡(`cap="tint"`)의 높이 3단. **8px 이상이므로 `tintscan` 이 면으로 센다** —
   * 격자 부모에 `data-tint-cluster="pick-grid"` 를 달지 않으면 예산(화면당 2면)이 즉시 터진다.
   */
  capHeight: { sm: '48px', md: '64px', lg: '88px' },
  /**
   * 레일 캡(`cap="rail"`)의 두께.
   *
   * 🔴 **8px 이상으로 올리지 마라.** `tintscan` 의 면 하한이 높이 8px 이다 — 8px 이 되는 순간
   * 이 띠는 "선"에서 "면"으로 바뀌어 라우트 예산을 먹는다. 6px 은 그 하한 바로 아래이면서
   * 저해상도에서도 색이 읽히는 값이다(4px 오로라 리본은 색만 겨우 보인다).
   */
  railHeight: '6px',
  /** 캡 안 글리프 배지 한 변. 폭 <180px 이라 그 자체로는 면으로 세어지지 않는다. */
  glyphSize: '40px',
  /**
   * 큰 글리프 한 변 — **글리프가 아이콘이 아니라 사진일 때**만 쓴다(`cap.glyphSize: 'lg'`).
   *
   * 왜 따로 두는가: 40px 은 선 아이콘·이니셜의 크기다. 같은 자리에 인물 사진을 넣으면 얼굴이
   * 무엇인지 알아볼 수 없어 사진을 쓴 의미가 사라진다(2026-08-05 대가 화면 실측 → 사용자 지시로 확대).
   *
   * 🔴 **180px 미만을 유지하라.** 그 이상은 `tintscan` 이 이 배지를 색면으로 세기 시작해 라우트
   * 예산(화면당 2면)을 먹는다 — 배지는 `color-mix` 배경을 깔고 있어 판정 대상이 된다.
   * ⚠ 카드 최소 열 폭(260px)의 절반을 넘기지 마라. 넘기면 좁은 폭에서 사진이 카드를 지배한다.
   */
  glyphSizeLg: '128px'
} as const;

/**
 * **읽는 면(data)** 의 기하. 숫자가 사는 면이라 **여기 값은 바꾸지 않는다** — 이 대역은
 * 공용 `Card` 가 이미 쓰고 있고, 개편의 목표는 data 면을 흔드는 게 아니라 brand 면을 세우는 것이다.
 *
 * 🔴 `pad` 는 `components/common/Card/Card.styled.ts` 의 `CARD_PADDING` 과 **같은 값이어야 한다.**
 * 공용 Card 가 자기 파일에서 단일 원천으로 갖고 있으므로 여기서 가져다 쓰게 만들지 않았고
 * (그 파일의 소유권을 빼앗지 않는다), 대신 `shared/styles/geometry.test.ts` 가 두 값을 대조한다.
 * 이 상수는 **공용 Card 를 쓰지 않는 새 data 면**이 같은 대역에 앉게 하려고 있다.
 */
export const DATA_SURFACE = {
  pad: 'clamp(16px, 1.8vw, 20px)',
  radiusAnchor: RADIUS_SCALE.sm
} as const;

/** `elevation`의 별칭. 기존 호출부가 `shadow.e1`로 쓰고 있어 유지한다. */
export const shadow = {
  e1: 'var(--sb-shadow-1)',
  e2: 'var(--sb-shadow-2)',
  e3: 'var(--sb-shadow-3)'
} as const;

/**
 * 모션 토큰.
 *
 * ## 이징을 고르는 순서 (표준 — 새 전환을 쓸 때 여기서 고른다)
 * | 상황 | 토큰 |
 * |---|---|
 * | 진입·퇴장(나타남/사라짐) | `ease` (ease-out 계열 — 빠르게 시작해 부드럽게 멈춘다) |
 * | 화면 **안에서 이동**(자리 옮김·펼침) | `easeInOut` |
 * | 호버·누름 같은 상태 피드백 | `ease` |
 * | 사이드 드로어 | `easeDrawer` |
 *
 * ## 지속시간
 * 누름 100–160ms · 팝오버 125–200ms · 드로어 200–500ms. **UI 전환은 300ms 미만**이 원칙이고
 * `slow`(450ms)는 드로어/진행률처럼 거리를 실제로 이동하는 것에만 쓴다.
 */
export const motion = {
  fast: '150ms',
  base: '200ms',
  /** 오케스트레이션된 순간 전용(진행률 바 채움 등). 상태 피드백에는 fast/base를 쓴다. */
  slow: '450ms',
  /**
   * 퇴장 = 진입의 60%. 사라지는 것은 이미 사용자의 관심 밖이라 진입과 같은 시간을 쓰면 느리게 느껴진다.
   * (`base` 200ms 진입 ↔ 이 값 120ms 퇴장.)
   */
  exit: '120ms',
  ease: 'cubic-bezier(0.2, 0, 0, 1)',
  /**
   * 화면 **안에서 이동**하는 것 전용. 양끝이 느리고 가운데가 빠르다 —
   * 나타나거나 사라지지 않고 자리만 옮기는 요소에 쓴다.
   */
  easeInOut: 'cubic-bezier(0.77, 0, 0.175, 1)',
  /** 사이드 드로어 전용 곡선. 손가락이 놓은 듯 초반이 빠르고 끝이 길게 감속한다. */
  easeDrawer: 'cubic-bezier(0.32, 0.72, 0, 1)'
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
  /**
   * **드로어 위에 겹치는 드로어**(설정 드로어 → 티커 생성 드로어, 2026-08-11)의 층.
   *
   * 🔴 딤·스크림이 `drawer`(60)보다 **높아야** 한다. 낮으면 아래 드로어 패널이 딤 위로 올라와
   *    "덮었는데 덮이지 않은" 화면이 된다 — 겹친 층이 앞선 층을 가리는 것이 이 두 값의 존재 이유다.
   * ⚠ 3층은 만들지 않는다. 필요해지면 숫자를 더 늘리기 전에 **동선을 의심하라**(드로어 위 드로어
   *   위 드로어는 뒤로가기·Escape 로 빠져나오기 어려운 화면이다).
   */
  drawerStackedBackdrop: 61,
  drawerStacked: 62,
  dropdown: 20,
  /**
   * 스크롤하면 헤더 아래에 붙는 **바**(시뮬레이터 결과 보드의 시나리오 탭 줄) — 2026-08-17 신설.
   *
   * 🔴 `stickyAction`(10)보다 **낮아야 한다.** 둘이 같은 값이던 동안 이 바가 고정된 "투자 설정"
   * 버튼을 **삼켰다**: 같은 층에서는 DOM 순서가 승자를 정하고, 보드는 히어로보다 뒤에 오며 이 바는
   * 불투명 배경을 갖는다. 실측(1280): 버튼 fixed top=113 · 바 105~158 → `elementFromPoint` 가
   * 버튼 중앙에서 바를 집었다(= 버튼이 완전히 가려져 "고정이 안 된다"로 보였다).
   * 콘텐츠 카드 층(1~2)보다는 높아 결과 카드 위로 지나간다.
   */
  stickyBar: 9,
  /**
   * 본문 흐름 안의 sticky 액션(시뮬레이터 설정 도크) — 스크롤하면 결과 카드 **위로** 지나가야 한다.
   *
   * 콘텐츠 지역 층(1~2)보다 높고 `dropdown`(20)보다 낮다. 명시하지 않으면 DOM 순서상 **뒤에 오는**
   * 카드(`position: relative` 를 쓰는 것들)가 이 버튼을 덮는다. 헤더(30)보다 낮아 스크롤 시
   * 헤더 뒤로 들어가고, 드로어 계열(55~60)보다 낮아 드로어가 열리면 그 아래에 깔린다.
   * ⚠ 위 `stickyBar`(9)보다 높게 유지하라 — 고정된 바 **위에** 떠야 한다.
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

/**
 * 아이콘 규격 — lucide 아이콘의 **크기 계단과 굵기**.
 *
 * 2026-07-29 실측: `size` 97곳이 12·14·15·16·18·20·24 로 흩어져 있었고(그중 15px 은 계단 밖),
 * `strokeWidth` 는 42곳에만 있어 **나머지 55곳이 lucide 기본값 2** 로 그려졌다. 같은 줄에 굵기가
 * 다른 아이콘이 섞이면 화면이 정돈돼 보이지 않는다.
 *
 * `stroke` 를 1.8 로 두는 이유: 2 는 작은 크기(14~16px)에서 획이 뭉쳐 보이고, 이 앱의 한글 본문
 * 굵기와도 어울리지 않는다. 굵기는 **크기와 무관하게 고정**한다 — 크기별로 바꾸면 같은 아이콘이
 * 자리마다 달라 보인다.
 *
 * ⚠ 예외를 둘 때는 그 자리에 이유를 적어라. 현재 유일한 예외는 `ThemePresetSwitcher` 의 선택
 * 체크마크(2.4)다 — 선택 상태는 굵어야 한 눈에 읽힌다.
 */
export const ICON = {
  /** 배지 안 초소형(좋아요 수·시뮬 배지). */
  xs: 12,
  /** 촘촘한 자리(칩·메타 줄). */
  sm: 14,
  /** 본문·버튼 안 기본 글리프. **대부분 이 값이다**(70/97). */
  md: 16,
  /** 헤더·메뉴의 누를 것(검색·더보기·닫기·펼침). 본문보다 한 단 크게 잡아 손이 가게 한다. */
  lg: 18,
  /** 히어로 배지·섹션 머리 등 강조. */
  xl: 20,
  /** 아이콘 단독 버튼(글자 없이 아이콘만 어포던스일 때). */
  xxl: 24,
  /** 획 굵기 — 크기와 무관하게 고정. */
  stroke: 1.8
} as const;

/** 위 계단의 크기 값만 모은 집합 — 가드 테스트가 "이 밖의 숫자를 쓰지 않았는가"를 본다. */
export const ICON_SIZES: readonly number[] = [ICON.xs, ICON.sm, ICON.md, ICON.lg, ICON.xl, ICON.xxl];
