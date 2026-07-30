/**
 * 스크롤바 모양 — 스크롤하는 박스에 한 줄로 얹는 공용 믹스인.
 *
 * 왜 공용으로 올라왔나 (2026-07-30 사용자 신고)
 * ---------------------------------------------------------------------------
 * "박스 오른쪽에 간간히 보이는 라인이 그냥 직사각형이야" — 스크롤 가능한 박스마다 **각진 네이티브
 * 스크롤바**가 나오고 있었다. 얇고 둥근 스크롤바 레시피는 이미 있었지만 `pages/Main` 로컬 파일에
 * 살아서 소비처가 3곳뿐이었다: 페이지 간 직접 import 가 금지(.cursor/rules)라 다른 화면은
 * **구조적으로** 가져다 쓸 수 없었다. 게으름이 아니라 배치가 전파를 막은 것이라, 고칠 자리는
 * 소비처가 아니라 여기(`shared/styles`)다.
 *
 * 🔴 왜 라디우스가 여태 안 먹었나 — 두 방식을 **같이 쓰면 안 된다** (2026-07-30 실측)
 * ---------------------------------------------------------------------------
 * 구 믹스인은 표준 속성(`scrollbar-width: thin` + `scrollbar-color`)과 `::-webkit-scrollbar-*` 를
 * **함께** 선언했다. 그런데 Chromium 은 121 부터 표준 속성을 지원하면서 **표준이 지정되면 webkit
 * 의사요소 규칙을 통째로 무시**한다 — 즉 `border-radius: 999px` 가 한 번도 적용된 적이 없고,
 * 사용자가 본 것은 `scrollbar-width: thin` 이 그린 **네이티브 얇은 막대**였다. 그 막대의 모양은
 * 우리가 아니라 **OS/브라우저 테마**가 정한다(Windows 10 계열 = 화살표 버튼 달린 각진 막대,
 * Fluent = 둥근 막대) — 그래서 "왜 각졌나"를 CSS 에서 찾으면 영원히 안 나온다.
 * 헤드리스 Chrome 150 실측(200×100 박스의 `offsetWidth − clientWidth`):
 *   선언 없음 15px · 표준만 10px · webkit 만 **6px** · **둘 다 10px** · 아래 방식 **6px**
 * (확대 촬영으로 확인: 표준 경로에는 트랙 끝에 **화살표 버튼**이 그려지고, webkit 경로에는 thumb 만
 *  남는다 — 두 경로를 눈으로 구별하는 가장 쉬운 표시다.)
 *
 * 그래서 순서를 뒤집는다: **webkit 을 기본으로 두고**, 표준 속성은 `@supports` 가림 안에 넣어
 * **webkit 스크롤바를 못 꾸미는 브라우저(Firefox)만** 받게 한다.
 *
 * 🔴 그 가림을 무엇으로 쓰느냐에서 한 번 더 틀렸다 (2026-07-31)
 * ---------------------------------------------------------------------------
 * 처음엔 `@supports not selector(::-webkit-scrollbar)` 를 썼다 — "이 브라우저가 webkit 스크롤바를
 * 스타일할 수 있나"를 직접 묻는 것처럼 보여 브라우저 이름을 찍는 해킹보다 낫다고 판단했다.
 * **그런데 Firefox 가 이 선택자에 `true` 를 반환한다.** 파싱은 되지만 실제 스타일링은 안 되는데,
 * 중첩 스크롤 영역이 도달 불가능해지는 것을 막으려는 의도적 동작이다(bugzil.la/1977511).
 * 결과적으로 `not true` = false 라 **Firefox 가 폴백을 못 받고 네이티브 기본 막대로 떨어졌다** —
 * 즉 그 가드는 어느 엔진에서도 참이 아닌, 아무 효과 없는 조건이었다.
 *
 * 교훈: `@supports selector()` 는 **"파싱 가능한가"** 를 묻지 **"동작하는가"** 를 묻지 않는다.
 * WHATWG Compatibility Standard 가 알 수 없는 `-webkit-` 의사요소를 파싱상 유효로 취급하라고
 * 요구하기 때문에, webkit 접두 선택자로 엔진을 가르려는 시도는 원리적으로 실패한다.
 *
 * 그래서 **엔진 판별**로 간다(아래 `subtleScrollbar`). Chrome 150 실측:
 *   `-moz-appearance` false · `-moz-orient` false · `-webkit-appearance` **true** ·
 *   `selector(::-webkit-scrollbar)` **true**
 * 뒤 두 개는 Firefox 에서도 true 라 판별에 쓸 수 없다.
 *
 * ⚠ 기대치를 정직하게 — Firefox 는 `scrollbar-width`/`scrollbar-color` 만 지원하고 그 두 속성으로는
 * **라디우스를 제어할 수 없다**(표준 `::scrollbar` 의사요소는 아직 없다). 즉 Firefox 에서는 폭·색만
 * 따라오고 모양은 여전히 브라우저 기본이다 — "안 먹는다"고 다시 파헤치지 말 것.
 *
 * ⚠ macOS/모바일의 **오버레이 스크롤바**는 원래 스크롤 중에만 떴다가 사라진다. `::-webkit-scrollbar` 를
 * 스타일하면 그 자리를 상시 차지하는 클래식 막대로 바뀔 수 있다(플랫폼 의존). 6px 라 레이아웃 영향은
 * 작지만, "스크롤바가 항상 보인다"는 신고가 오면 여기가 출처다.
 *
 * ⚠ 스크롤바 **모양**과 `scrollbar-gutter`(자리 예약)는 별개 결정이다. 이 믹스인은 거터를 건드리지
 * 않는다 — 거터는 박스마다 "스크롤이 없을 때 비대칭 여백을 감수할 가치가 있나"로 따로 판단해 왔고
 * (`SideDrawer` 는 일부러 안 쓴다, `TickerModal` 은 `auto` 로 되돌렸다) 그 판단을 덮으면 안 된다.
 */

import { color, radius } from './tokens';

/**
 * 거의 보이지 않는 얇은 스크롤바 — 트랙 투명, 6px thumb 는 은은한 border 색, hover 시에만 살짝
 * 진해진다. 세로·가로 양쪽에 쓴다(`width`/`height` 를 함께 준다).
 *
 * 색은 반드시 세만틱 토큰이어야 한다 — 프리셋 8종 × 라이트/다크가 있어 생 색을 박으면 그 박스만
 * 팔레트를 따라오지 못한다.
 */
export const subtleScrollbar = `
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${color.border};
    border-radius: ${radius.pill};
  }
  &:hover::-webkit-scrollbar-thumb {
    background: ${color.borderStrong};
  }

  /*
   * Firefox 폴백. 표준 속성을 위와 **같이** 선언하면 Chromium 121+ 가 위 webkit 규칙을 통째로
   * 무시하므로(이 파일 상단 실측표) 반드시 Firefox 에만 닿아야 한다.
   *
   * 🔴 종전에는 '@supports not selector(::-webkit-scrollbar)' 로 갈랐는데 **그게 틀렸다**(2026-07-31).
   * Firefox 는 이 선택자에 'true' 를 반환하면서도 실제로는 그 의사요소로 스크롤바를 못 꾸민다 —
   * 중첩 스크롤 영역이 도달 불가능해지는 것을 막으려는 의도적 동작이다(bugzil.la/1977511).
   * 그래서 'not true' = false 가 되어 **Firefox 가 폴백을 못 받고 네이티브 기본 막대로 떨어졌다.**
   * 즉 이 가드는 "지원 여부"를 묻는 것처럼 보이지만 어느 엔진에서도 참이 아니었다.
   *
   * 대신 **엔진 판별**로 간다. 양쪽 브라우저에서 직접 재서 고른 조건이다:
   *   Chrome 150 : '-moz-orient' false · '-moz-appearance' false ·
   *                '-webkit-appearance' true · 'selector(::-webkit-scrollbar)' true
   *   Firefox    : '-moz-orient' **true** · '-moz-appearance' **속성 자체가 없다**
   * 뒤 두 조건은 Firefox 에서도 true 라 판별에 못 쓰고, '-moz-appearance' 는 이미 제거돼
   * **어느 엔진에서도 참이 아니다** — 그래서 'or' 로 끼워 넣지 않았다. 바로 위 문단의 사고가
   * 정확히 "어디서도 참이 아닌 조건을 남겨 둔 것"이었다. 죽은 조건을 보험처럼 두지 마라.
   *
   * ⚠ Firefox 가 언젠가 '-moz-orient' 마저 걷어내면 폴백이 조용히 꺼지고 네이티브 막대로 돌아간다 —
   * **오늘과 같은 상태**라 회귀가 아니라 우아한 퇴화다. Chromium 은 어느 경우에도 영향받지 않는다
   * (이 가드는 Chromium 에서 항상 false 이고, 그래야 위 webkit 규칙이 산다).
   */
  @supports (-moz-orient: inline) {
    scrollbar-width: thin;
    scrollbar-color: ${color.border} transparent;
  }
`;

/**
 * 스크롤바를 **의도적으로 감춘다** — 탭 줄처럼 "넘친다"를 스크롤바가 아닌 다른 신호(스냅·페이드)로
 * 이미 말하고 있고, 40px 남짓한 줄 아래에 6px 막대가 더 붙으면 칩이 잘려 보이는 자리에만 쓴다.
 *
 * 세 줄이 한 세트다: 표준(`scrollbar-width`) · 구 Edge(`-ms-overflow-style`) · WebKit 의사요소.
 * 하나라도 빠지면 어느 브라우저에서 다시 보인다. 여기서는 위 `@supports` 가림이 **필요 없다** —
 * 표준이 webkit 규칙을 무시하더라도 `scrollbar-width: none` 자체가 감추므로 결과가 같다.
 * (그래서 이 믹스인을 `subtleScrollbar` 뒤에 얹으면 Chromium 에서도 확실히 감춰진다.)
 *
 * ⚠ 감추면 **키보드·휠 이외의 스크롤 어포던스가 사라진다.** 새 박스에 그냥 갖다 붙이지 말고,
 * 넘침을 알리는 다른 장치가 있는지 먼저 확인하라.
 */
export const hiddenScrollbar = `
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;
