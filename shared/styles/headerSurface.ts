import { color, media, shadow } from './tokens';

/**
 * ── 헤더 공통 레시피 ────────────────────────────────────────────────────────────
 *
 * 커뮤니티 헤더(`components/community/CommunityHeader`)와 시뮬레이터 헤더
 * (`pages/Main/Main.shared.styled` Header)가 **같은 시각 언어**를 갖도록 실제로 중복되던 것만 뽑았다.
 * 테두리 형태·모서리·sticky 여부는 배치 맥락이 달라(전폭 바 ↔ max-width 컨테이너 안 카드)
 * 각 헤더가 계속 소유한다.
 */

/**
 * 상단 브랜드 틴트 서피스(불투명) — 두 헤더가 공유하는 **기본형**.
 *
 * 무채색 대신 은은한 brand 색조를 위→아래로 흘린다. 전부 테마 토큰이라 팔레트/다크 정합이 유지된다.
 *
 * ⚠ **여기에 `backdrop-filter`를 넣지 말 것.** `backdrop-filter`가 `none`이 아닌 요소는
 * `filter`/`transform`과 마찬가지로 **absolute/fixed 자손의 컨테이닝 블록**이 된다(Filter Effects L2).
 * 시뮬레이터 헤더는 모바일 floating 드로어 토글(`DrawerToggleButton[data-floating='true']`,
 * `position: fixed`)을 자손으로 품고 있어, 헤더에 블러가 걸리면 그 토글의 `top/left`가 뷰포트가 아니라
 * **스크롤 아웃된 헤더 박스** 기준이 되어 화면 밖에 그려진다(= 모바일 설정 진입 불가).
 *
 * 같은 속성이 **새 스태킹 컨텍스트**도 만든다 — 그러면 헤더 안 더보기(⋯) 드롭다운의
 * `z-index: dropdown(20)`이 헤더 안에 갇혀, 헤더보다 뒤에 오는 형제인 시나리오 탭
 * (`ScenarioTabButton` z-index 1~2)에게 **가려진다**. 층위 규칙은 `tokens.ts`의 `zIndex` 주석 참고.
 *
 * 그래서 글래스 승격은 아래 `headerGlassSurface`로 분리해, 팝오버를 품지 않는 조건이 아니라
 * **자체 z-index로 층위를 이미 확정한 커뮤니티 헤더에서만** 쓴다(HeaderRoot가 sticky + z-index 보유).
 */
export const headerSolidSurface = `
  background: linear-gradient(180deg, ${color.brandSubtle}, ${color.surfaceGlassFallback} 68%);
  box-shadow: ${shadow.e1};
`;

/**
 * 위 기본형 + 서리유리 승격(§4.7) — **sticky 오버레이 전용**(현재 소비처: 커뮤니티 헤더).
 *
 * 불투명 폴백을 먼저 깔고 `backdrop-filter` 지원 브라우저에서만 반투명 글래스로 올린다.
 * 블러의 시각 효과는 "뒤로 콘텐츠가 지나갈 때"만 생기므로, 함께 스크롤되는 헤더(시뮬레이터)에는
 * 효과가 사실상 0이면서 위 컨테이닝 블록 부작용만 남는다 — 그런 헤더는 `headerSolidSurface`를 쓴다.
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
 * 헤더 2번째 줄(컨트롤) 레이아웃 — `PrimaryNav`의 `Nav`와 **동일한** 3컬럼 그리드.
 *
 * 두 줄이 같은 트랙 구조(`1fr auto 1fr`)를 쓰기 때문에 2열의 중심 x좌표가 구조적으로 일치한다.
 * flex + `margin-left:auto` 방식은 좌/우 요소 폭에 따라 가운데가 흔들려(우측 액션 폭의 절반만큼
 * 왼쪽으로 밀림) 1줄째 메뉴와 중심선이 어긋났다 — 그 회귀를 막는 것이 이 레시피의 존재 이유다.
 *
 * ⚠ 이 정렬은 헤더가 세로 스택(`flex-direction: column; align-items: stretch`)이라 두 줄 모두
 * 헤더 폭 전체를 차지하는 덕분에만 성립한다. 부모를 flex row로 되돌리면 조용히 무너진다.
 *
 * 좁은 화면(drawer↓)에선 `Nav`와 똑같이 **flex 흐름으로 폴백**한다(가운데 정렬이 좌우를 압박하므로).
 * 폴백에서 `grid-column`/`justify-self`는 무시되고 각 슬롯의 flex 규칙이 배치를 맡는다.
 *
 * gap은 헤더마다 리듬이 달라 소비처가 정한다.
 */
export const headerControlsGrid = `
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-width: 0;

  ${media.down('drawer')} {
    display: flex;
    align-items: center;
  }
`;
