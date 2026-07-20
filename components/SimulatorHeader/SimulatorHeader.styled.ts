import styled from '@emotion/styled';
import { color, headerControlsGrid, headerGlassSurface, space, zIndex } from '@/shared/styles';

/**
 * 시뮬레이터 헤더 — 커뮤니티 헤더(`components/community/CommunityHeader` HeaderRoot)와 **형태까지 동일**한
 * 화면 최상단 전폭 sticky 글래스 바. 아래 hairline 하나로만 콘텐츠와 분리한다(카드 아님).
 *
 * 예전에는 이 헤더가 `FeatureLayout`(max-width 1200) 안의 카드였고, sticky·backdrop-filter를 둘 다
 * 금지하고 있었다. 이유는 **헤더가 모바일 드로어 토글을 자손으로 품고 있었기 때문**이다:
 *  - `backdrop-filter` 요소는 fixed 자손의 컨테이닝 블록이 된다(Filter Effects L2)
 *    → floating 토글(`DrawerToggleButton[data-floating='true']`)이 화면 밖에 그려졌다.
 *  - sticky면 토글 승격을 판정하는 IntersectionObserver 앵커가 뷰포트를 영영 벗어나지 않는다
 *    → floating 토글이 뜨지 않았다(모바일 설정 진입 회귀).
 *
 * **토글과 그 앵커를 헤더 밖(`MobileMenuDrawer` 콘텐츠 흐름 최상단)으로 옮기면서 두 제약이 함께 풀렸다.**
 * 이제 헤더에는 fixed 자손이 없고, 커뮤니티와 같은 글래스 승격이 안전하다.
 *
 * 층위는 `zIndex.headerSurface`(30) — `dropdown`(20)보다 **높아야** 한다. 이 헤더는 sticky+z-index와
 * backdrop-filter로 스태킹 컨텍스트를 만들므로 안에 사는 팝오버(더보기 ⋯ / AuthControl / 테마)의
 * `z-index: dropdown`은 헤더 층위 밖으로 나가지 못한다. 드로어 계열(54~60)보다는 낮아 드로어가 헤더를 덮는다.
 */
export const HeaderRoot = styled.header`
  position: sticky;
  top: 0;
  z-index: ${zIndex.headerSurface};
  ${headerGlassSurface}
  border-bottom: 1px solid ${color.borderStrong};
`;

/**
 * 헤더 안쪽 — 2줄 스택: 1줄 = 전역 nav(로고+메뉴), 2줄 = 컨트롤(클라우드 상태 · 로그인 · 더보기).
 *
 * ⚠ 좌우 패딩은 커뮤니티 `HeaderInner`(`clamp(space[3],4vw,space[5])`)가 아니라 **바로 아래 오는
 * `FeatureLayout`의 인라인 패딩과 같은 값**을 쓴다. 두 컨테이너의 max-width가 같으므로(1200)
 * 이 값이 같아야 헤더 콘텐츠와 아래 패널들의 **좌우 끝선이 정확히 맞는다**. 커뮤니티는 자기 본문
 * 컨테이너에 맞춘 값이라 헤더끼리 숫자를 통일하면 오히려 각자의 본문과 어긋난다.
 */
export const HeaderInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: ${space[2]};
  max-width: 1200px;
  margin: 0 auto;
  padding: ${space[2]} clamp(12px, 2vw, 20px);
`;

/**
 * 헤더 2번째 줄 — 1줄째 `PrimaryNav`와 **같은 3컬럼 그리드**(1fr auto 1fr).
 * 1열 = 클라우드 동기화 상태, 2열은 비워 두고(커뮤니티는 여기에 검색이 온다), 3열 = 우측 컨트롤.
 * 두 줄이 같은 트랙을 쓰므로 메뉴·컨트롤의 좌우 끝선이 맞는다. drawer↓는 flex 폴백.
 */
export const ControlsRow = styled.div`
  ${headerControlsGrid}
  gap: ${space[2]};
`;

/**
 * 컨트롤 줄 1열 — 모바일 설정 드로어 토글 + 클라우드 동기화 상태. 내용이 없어도 트랙 자리는 그리드가 잡는다.
 *
 * 드로어 토글이 **여기 정적으로** 사는 것이 중요하다: 헤더가 sticky라 항상 화면에 있으므로
 * 예전의 `position: fixed` 플로팅 승격(+ IntersectionObserver sentinel)이 통째로 불필요해졌다.
 * 토글이 fixed가 아니게 되면서 헤더의 `backdrop-filter`가 만드는 컨테이닝 블록 문제도 사라졌다.
 */
export const LeadingSlot = styled.div`
  grid-column: 1;
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
`;

/** 컨트롤 줄 3열 — 로그인·더보기 등. drawer↓ flex 폴백에서도 우측 정렬을 유지한다. */
export const Actions = styled.div`
  grid-column: 3;
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  flex: 0 0 auto;
  margin-left: auto;
  /* 좁아지면 버튼들이 다음 줄로 내려간다(넘쳐서 잘리지 않도록). 우측 정렬 유지. */
  flex-wrap: wrap;
  justify-content: flex-end;
  row-gap: ${space[1]};
`;
