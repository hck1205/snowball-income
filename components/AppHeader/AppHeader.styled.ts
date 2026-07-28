import styled from '@emotion/styled';
import { color, headerControlsGrid, headerGlassSurface, headerRowGap, media, space, zIndex } from '@/shared/styles';

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
 * 헤더 안쪽 — 2줄 스택: 1줄 = 브랜드 워드마크 + 컨트롤, 2줄 = 라우트 메뉴.
 *
 * 좌우 여백은 `contentGutter` 로 받는다. 그 페이지 **본문 컨테이너와 같은 값**이어야 헤더 콘텐츠와
 * 아래 패널들의 좌우 끝선이 정확히 맞는다(두 컨테이너의 max-width 가 1200 으로 같으므로).
 * 두 줄 사이 세로 간격은 통일 대상이라 공용 `headerRowGap` 을 쓴다.
 */
export const HeaderInner = styled.div<{ $gutter: string }>`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  ${headerRowGap}
  max-width: 1200px;
  margin: 0 auto;
  padding: ${space[2]} ${({ $gutter }) => $gutter};
`;

/**
 * 컨트롤 줄 — 아랫줄 `PrimaryNavLinks` 와 **같은 3컬럼 그리드**(1fr auto 1fr).
 * 1열 = 브랜드(+상태), 2열 = 가운데 슬롯(커뮤니티 검색), 3열 = 우측 컨트롤.
 * 두 줄이 같은 트랙을 쓰므로 메뉴·컨트롤의 좌우 끝선과 가운데 중심선이 맞는다. drawer↓는 flex 폴백.
 */
export const ControlsRow = styled.div`
  ${headerControlsGrid}
  gap: ${space[2]};
`;

/**
 * 1열 — 브랜드 워드마크 + 그 오른쪽 상태 표시(클라우드 동기화).
 *
 * 상태 배지는 **워드마크와 같은 줄, 바로 오른쪽**에 머문다(2026-07-29 사용자 결정). 좁은 폭에서
 * 아랫줄로 강등하던 규칙은 제거했다 — 지속 상태가 줄을 가져가면 헤더 높이가 상태마다 달라져
 * 그 아래 sticky 요소들이 함께 출렁인다. 폭 예산은 `설정 열기` 버튼이 헤더에서 빠지며 확보됐다.
 *
 * `flex-wrap` 은 최후 방어선으로 남긴다 — 어떤 상태 문구가 와도 **잘리지는 않는다**.
 */
export const LeadingSlot = styled.div`
  grid-column: 1;
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  flex-wrap: wrap;
  row-gap: ${space[1]};
`;

/**
 * 2열(가운데) — 페이지가 넣는 확장(커뮤니티 갤러리 검색). 폭 정책은 **슬롯 내용이** 소유한다
 * (검색바가 자기 clamp 폭을 갖는다) — 여기서는 트랙 위치와 가운데 정렬만 책임진다.
 */
export const CenterSlot = styled.div`
  grid-column: 2;
  justify-self: center;
  display: flex;
  justify-content: center;
  min-width: 0;
`;

/**
 * 3열 — 페이지 액션 + 공용 컨트롤(로그인 · 더보기). drawer↓ flex 폴백에서도 우측 정렬을 유지한다.
 *
 * 좁아지면 다음 줄로 접힌다(넘쳐서 잘리지 않도록). 좌측이 2줄이 되어도 우측 묶음이 세로 중앙으로
 * 따라 내려가지 않게 `align-self: flex-start` 로 첫 줄 높이에 고정한다.
 */
export const Actions = styled.div`
  grid-column: 3;
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  flex: 0 0 auto;
  margin-left: auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  row-gap: ${space[1]};

  ${media.down('mobileWide')} {
    gap: ${space[1]};
  }

  ${media.down('drawer')} {
    align-self: flex-start;
    min-height: 40px;
  }
`;
