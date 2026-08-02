import { color, media, shadow, space } from './tokens';

/**
 * ── 헤더 공통 레시피 ────────────────────────────────────────────────────────────
 *
 * 앱의 헤더는 **`components/AppHeader` 한 벌뿐이다**(2026-07-29 통합 — 그전에는 시뮬레이터·커뮤니티·
 * 티커 셸이 같은 형태를 세 곳에 복제하고 있었다). 아래 레시피들은 그 한 벌이 쓰는 조각이고,
 * 헤더를 다시 손으로 조립하지 못하게 `test/shared/appHeaderSingleSource.test.ts` 가 잠근다.
 * 안쪽 컨테이너의 좌우 여백만 각 페이지 본문 컨테이너에 맞춰 소비처가 정한다(`AppHeader` 의 `contentGutter`).
 */

/**
 * 헤더 실제 높이를 담는 CSS 변수 이름. `AppHeader` 가 마운트/리사이즈마다 실측해
 * `document.documentElement` 에 발행한다.
 *
 * 헤더 아래에 붙는 sticky 요소(티커 상세 목차 바 · 시뮬레이터 설정 도크)는 **높이를 하드코딩하지 말고**
 * 이 변수를 쓴다. 예전에는 티커 셸이 `--tk-header-h: 88px` 로 헤더 높이를 *확정*해 두고 있었는데,
 * 헤더가 한 줄에서 두 줄로 바뀔 때마다 그 숫자가 조용히 낡아 목차 바와 헤더 사이에 빈 띠가 생기거나
 * 헤더 두 번째 줄이 잘렸다(56 → 80 → 88px 로 세 번 고쳐 쓴 이력). 실측이라 다시는 어긋나지 않는다.
 */
export const APP_HEADER_HEIGHT_VAR = '--sb-app-header-h';

/**
 * 위 변수를 CSS 길이로 쓰는 형태. 폴백 88px 은 **JS 가 아직 실측을 발행하지 못한 첫 페인트에서만**
 * 쓰인다 — 실측치는 한 줄 모드(≥1024) 64px 대, 두 줄 모드(≤1023) 90px 대다. 그 사이의 보수적인
 * 값을 남겨 둔다(작게 잡으면 sticky 요소가 헤더 뒤로 숨고, 크게 잡으면 빈 띠가 한 프레임 보인다).
 */
export const appHeaderHeight = `var(${APP_HEADER_HEIGHT_VAR}, 88px)`;

/**
 * 상단 브랜드 틴트 서피스(불투명) — 글래스의 **폴백/기반 레이어**.
 *
 * 무채색 대신 은은한 brand 색조를 위→아래로 흘린다. 전부 테마 토큰이라 팔레트/다크 정합이 유지된다.
 *
 * ⚠ **여기에 `backdrop-filter`를 넣지 말 것** — 이 변형의 존재 이유가 "블러 없는 안전판"이다.
 * `backdrop-filter`가 `none`이 아닌 요소는 `filter`/`transform`과 마찬가지로
 * **absolute/fixed 자손의 컨테이닝 블록**이 되고(Filter Effects L2) **새 스태킹 컨텍스트**도 만든다.
 * 그래서 `position: fixed` 자손(예: 드로어 토글)을 품는 컨테이너에는 아래 글래스 변형을 쓰면 안 된다.
 * 층위 규칙은 `tokens.ts`의 `zIndex` 주석 참고.
 */
export const headerSolidSurface = `
  background: linear-gradient(180deg, ${color.brandSubtle}, ${color.surfaceGlassFallback} 68%);
  box-shadow: ${shadow.e1};
`;

/**
 * 위 기본형 + 서리유리 승격(§4.7) — **sticky 오버레이 전용**(소비처: 커뮤니티 헤더 · 시뮬레이터 헤더).
 *
 * 불투명 폴백을 먼저 깔고 `backdrop-filter` 지원 브라우저에서만 반투명 글래스로 올린다.
 *
 * 쓸 수 있는 조건 2가지 — 둘 다 만족해야 한다.
 * 1. **`position: fixed` 자손이 없을 것.** 블러 요소가 그 자손의 컨테이닝 블록이 되어 화면 밖으로
 *    밀려난다. 시뮬레이터 헤더는 드로어 토글을 헤더 밖 본문 흐름으로 옮겨 이 조건을 만들었다.
 * 2. **자체 `z-index`로 층위를 확정할 것**(`zIndex.headerSurface`). 블러가 만드는 스태킹 컨텍스트에
 *    헤더 안 팝오버(`z-index: dropdown`)가 갇히므로, 헤더 자신이 dropdown보다 높은 층에 서야 한다.
 */
export const headerGlassSurface = `
  ${headerSolidSurface}

  @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
    background: linear-gradient(180deg, ${color.brandSubtle}, ${color.surfaceGlass} 68%);
    -webkit-backdrop-filter: blur(14px) saturate(1.35);
    backdrop-filter: blur(14px) saturate(1.35);
  }
`;

/**
 * 헤더 안쪽 레이아웃 — **한 장의 그리드가 두 모드를 다 그린다.**
 *
 * 슬롯 3개는 이름(`grid-area`)으로 자리를 잡는다. 그래서 슬롯 내용이 화면마다 달라져도 나머지 자리가
 * 밀리지 않는다 — 예전에 `1fr auto 1fr` 3컬럼에서 채움용 `Spacer` div 를 두던 이유가 이것이었다.
 *
 *   **모든 폭에서 두 줄** (2026-08-02 사용자 결정)
 *     `brand │ actions`
 *     `nav ───── 전폭 ─────`
 *
 * 🔴 **한 줄 모드를 되살리지 마라.** 2026-07-29~08-02 동안은 ≥1024 에서 `brand │ nav │ actions` 한 줄이었다.
 * 그 배치의 전제는 "메뉴가 남는 폭에 들어간다"였는데, 메뉴가 8개가 되면서 그 전제가 깨졌다 —
 * 1280 실측으로 브랜드↔컨트롤 사이 트랙이 902px 인데 메뉴가 이미 753px 을 쓰고 있었고, ≤1024 에서는
 * 넘쳐서 가로 스크롤 뒤로 숨었다. **스크롤로 숨는 메뉴는 사용자에게 아무 신호를 주지 않는다**
 * (pitfalls 2026-07-31 NavScroller 실측). 전폭 줄을 주면 8개가 스크롤 없이 다 보인다.
 *
 * ⚠ 대가를 알고 고른 것이다: 헤더가 ≥1024 에서 **64px → 약 104px** 로 높아진다. 그만큼 첫 화면이
 * 줄어든다. 되돌리려면 이 레시피를 `grid-template-columns: auto minmax(0, 1fr) auto` +
 * `grid-template-areas: 'brand nav actions'` 로 되돌리고, `tools/dev/headerprobe.mjs` 의 높이 상한도
 * 함께 되돌려라(둘은 한 쌍이다).
 *
 * ⚠ 구 `center` 트랙(커뮤니티 갤러리 검색)은 **2026-07-31 에 삭제됐다.** 그 자리는 한 줄 모드에서
 * 내비와 폭을 다퉈 1024px 갤러리에서 메뉴 6개 중 **3개가 스크롤 뒤로 밀리고** 검색 입력은 72px 이
 * 됐다(실측). 검색이 본문 툴바로 내려가면서 그 트랙도 함께 없앴다 — 되살리지 마라.
 *
 * 🔴 왜 flex 가 아니라 grid 인가 — flex 에서 `flex: 1` 슬롯의 중앙은 "컨테이너의 중앙"이 아니라
 * "남은 공간의 중앙"이다. 예전 헤더의 가운데 검색이 우측 액션 폭의 절반만큼 왼쪽으로 밀려 있던
 * 사용자 신고가 그 결과였다(2026-07-20). 트랙을 이름으로 고정하면 그 어긋남이 원리적으로 안 생긴다.
 *
 * ⚠ 세로 간격은 **두 줄 모드에만** 있다(`row-gap`). 한 줄 모드에서 세로 여백을 더하려면
 * `HeaderInner` 의 블록 패딩을 만져라 — 그것이 헤더 높이의 단일 조절점이다.
 */
export const headerControlsGrid = `
  display: grid;
  align-items: center;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'brand actions'
    'nav nav';
  column-gap: ${space[3]};
  row-gap: ${space[2]};

  ${media.down('headerStack')} {
    column-gap: ${space[2]};
  }
`;
