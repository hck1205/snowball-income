import styled from '@emotion/styled';
import { color, headerControlsGrid, headerGlassSurface, media, space, zIndex } from '@/shared/styles';

/**
 * 앱 전역 헤더 — 화면 최상단 전폭 sticky 글래스 바. 아래 hairline 하나로만 콘텐츠와 분리한다(카드 아님).
 *
 * 예전에는 이 형태가 **세 곳에 복제**돼 있었다(시뮬레이터 · 커뮤니티 · 티커 셸). 같은 값을 세 파일에
 * 유지하는 동안 컨트롤 줄 유무 · 고정 높이 · 여백이 조금씩 갈렸고, 한 화면에서 고친 것이 다른
 * 화면에 반영되지 않았다. 2026-07-29 에 이 파일 한 벌로 합쳤다.
 *
 * 층위는 `zIndex.headerSurface`(30) — `dropdown`(20)보다 **높아야** 한다. 이 헤더는 sticky+z-index와
 * backdrop-filter로 스태킹 컨텍스트를 만들므로 안에 사는 팝오버(더보기 ⋯ / AuthControl / 테마)의
 * `z-index: dropdown`은 헤더 층위 밖으로 나가지 못한다. 드로어 계열(55~60)보다는 낮아 드로어가 헤더를 덮는다.
 *
 * ⚠ 이 요소는 `backdrop-filter` 를 쓴다 → **`position: fixed` 자손을 두면 안 된다**(블러 요소가 그
 * 자손의 컨테이닝 블록이 되어 화면 밖으로 밀린다, Filter Effects L2). 헤더 안의 팝오버는 전부 absolute다.
 */
export const HeaderRoot = styled.header`
  position: sticky;
  top: 0;
  z-index: ${zIndex.headerSurface};
  ${headerGlassSurface}
  border-bottom: 1px solid ${color.borderStrong};
`;

/**
 * 헤더 안쪽 — 슬롯 3개(브랜드 · 메뉴 · 컨트롤)를 담는 **단일 그리드**.
 * 배치 규칙(≥1024 한 줄 / ≤1023 두 줄)은 공용 `headerControlsGrid` 레시피가 소유한다.
 *
 * 좌우 여백은 `contentGutter` 로 받는다. 그 페이지 **본문 컨테이너와 같은 값**이어야 헤더 콘텐츠와
 * 아래 패널들의 좌우 끝선이 정확히 맞는다(두 컨테이너의 max-width 가 1200 으로 같으므로).
 *
 * 🔴 **헤더 높이의 단일 조절점은 여기 블록 패딩이다.** 상한은 전 폭 120px 이다
 * (2026-08-02 부터 헤더가 모든 폭에서 두 줄이 됐다 — `headerControlsGrid` 주석의 근거 참고).
 * 값을 키우기 전에 `tools/dev/headerprobe.mjs` 로 실측하라 — 이 숫자는 짐작이 아니라 측정으로
 * 정한 것이고, 회귀도 그 스크립트가 잡는다. 헤더가 높아진 만큼 모든 화면의 첫 화면이 줄어든다.
 *
 * ⚠ 넓은 폭에서 세로 패딩을 좁은 폭보다 **작게** 준다. 두 줄이 된 만큼 총 높이가 늘었으므로
 * 여백까지 그대로 두면 헤더가 필요 이상으로 두꺼워진다.
 */
export const HeaderInner = styled.div<{ $gutter: string }>`
  ${headerControlsGrid}
  max-width: 1200px;
  margin: 0 auto;
  padding: ${space[2]} ${({ $gutter }) => $gutter};
`;

/**
 * 브랜드 워드마크 + 그 오른쪽 상태 표시(클라우드 동기화).
 *
 * 상태 배지는 **워드마크와 같은 줄, 바로 오른쪽**에 머문다(2026-07-29 사용자 결정). 좁은 폭에서
 * 아랫줄로 강등하던 규칙은 제거했다 — 지속 상태가 줄을 가져가면 헤더 높이가 상태마다 달라져
 * 그 아래 sticky 요소들이 함께 출렁인다.
 *
 * `flex-wrap` 은 최후 방어선으로 남긴다 — 어떤 상태 문구가 와도 **잘리지는 않는다**.
 */
export const LeadingSlot = styled.div`
  grid-area: brand;
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  flex-wrap: wrap;
  row-gap: ${space[1]};
`;

/**
 * 라우트 메뉴 자리. 한 줄 모드에선 브랜드와 컨트롤 사이의 **남는 폭 전부**(트랙이 `minmax(0, 1fr)`),
 * 두 줄 모드에선 아랫줄 전폭이다.
 *
 * 🔴 `min-width: 0` 이 없으면 안쪽 스크롤러가 min-content(메뉴 6개를 다 편 폭)로 버텨 **문서가 넓어진다**
 * — 증상은 "모바일에서 상단 메뉴가 잘린다"로 엉뚱하게 나타난다(뷰포트 폭인 sticky 헤더가 가로 스크롤에
 * 밀려 나간다). 트랙의 `minmax(0, 1fr)` 과 **둘 다** 있어야 막힌다.
 */
export const NavSlot = styled.div`
  grid-area: nav;
  display: flex;
  min-width: 0;
`;

/**
 * 페이지 액션 + 공용 컨트롤(테마 · 로그인 · 더보기). 두 모드 모두 오른쪽 끝에 붙는다.
 *
 * 좁아지면 다음 줄로 접힌다(넘쳐서 잘리지 않도록). 좌측이 2줄이 되어도 우측 묶음이 세로 중앙으로
 * 따라 내려가지 않게 두 줄 모드에서는 첫 줄 높이에 고정한다.
 */
export const Actions = styled.div`
  grid-area: actions;
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  row-gap: ${space[1]};

  ${media.down('mobileWide')} {
    gap: ${space[1]};
  }

  ${media.down('drawer')} {
    align-self: flex-start;
  }
`;
