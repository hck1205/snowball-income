import { color, media, shadow, space } from './tokens';

/**
 * ── 헤더 공통 레시피 ────────────────────────────────────────────────────────────
 *
 * 커뮤니티 헤더(`components/community/CommunityHeader`)와 시뮬레이터 헤더
 * (`components/SimulatorHeader`)가 **같은 시각 언어**를 갖도록 실제로 중복되던 것만 뽑았다.
 * 두 헤더는 이제 형태까지 같다(화면 최상단 전폭 sticky 글래스 바 + 아래 hairline).
 * 안쪽 컨테이너의 max-width/패딩만 각 페이지 본문 컨테이너에 맞춰 소비처가 소유한다.
 */

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
 * 헤더 두 줄(1줄=전역 nav, 2줄=컨트롤/검색) 사이의 **세로 간격**.
 *
 * 두 헤더가 같은 값을 써야 "메뉴 ↔ 필터" 사이 리듬이 화면 간에 일치한다(시각 통일이 목표).
 * 소비처는 `HeaderInner`(세로 스택)의 gap으로만 쓴다 — 줄 안쪽 가로 gap은 각자 소유.
 *
 * 모바일(drawer↓)은 **항상 데스크톱보다 한 단계 좁게** 유지한다. 헤더는 `position: sticky`라 상시
 * 뷰포트를 차지하고, 좁은 화면에서는 아래로 모바일 검색 바가 한 줄 더 붙는 경우도 있어서다.
 * (space 스케일이 4px 단위라 "증가폭 절반"은 표현할 수 없다 — 대신 한 스텝 차이를 불변식으로 둔다.)
 */
export const headerRowGap = `
  gap: ${space[5]};

  ${media.down('drawer')} {
    gap: ${space[4]};
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
