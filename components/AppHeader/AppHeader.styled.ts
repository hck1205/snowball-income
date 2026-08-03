import styled from '@emotion/styled';
import {
  color,
  headerControlsGrid,
  headerGlassSurface,
  media,
  pageHue,
  pageHueMix,
  space,
  zIndex
} from '@/shared/styles';

/**
 * 화면 맨 위 **정체성 레일**의 두께.
 *
 * 3px 인 이유는 둘이다. ①`tintscan` 의 면 판정(폭 ≥180 **AND 높이 ≥8**)에 걸리지 않는다 —
 * 헤더는 애초에 스코프 밖이지만, 같은 장치를 본문으로 옮기고 싶어질 때를 위해 값 자체를 안전한 대역에
 * 둔다. ②`HeaderInner` 의 블록 패딩(8px)보다 얇아 **어떤 글자도 덮지 않는다**.
 *
 * 🔴 8px 이상으로 올리지 마라. 그 순간 이것은 "선"이 아니라 "면"이 되고, 앱의 모든 화면에 상수로
 * 얹히는 색 면이 하나 생긴다.
 */
const HUE_RAIL_HEIGHT = '3px';

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

  /*
   * 화면 맨 위 정체성 레일 — 이 앱에서 "지금 어느 섹션인가"를 **글자를 읽기 전에** 말하는 유일한 장치다.
   *
   * 색은 페이지 hue 변수 하나(usePageHue 가 라우트마다 발행)를 읽으므로 헤더 활성 알약과 히어로가
   * 항상 같은 말을 한다 — 헤더가 자기 색표를 갖지 않는 것이 요점이다.
   *
   * 🔴 절대 배치라 **헤더 높이에 1px 도 더하지 않는다**(상한 120px, tools/dev/headerprobe.mjs).
   * 흐름에 넣으면 모든 화면의 첫 화면이 그만큼 줄어든다.
   * ⚠ 이 헤더는 backdrop-filter 로 스태킹 컨텍스트를 만들므로 이 의사요소는 헤더 밖으로 새지 않는다.
   *   pointer-events 를 끄는 이유는 레일이 브랜드 링크 상단 히트 영역을 가로채지 않게 하기 위해서다.
   */
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: ${HUE_RAIL_HEIGHT};
    background: linear-gradient(
      90deg,
      ${pageHue} 0%,
      ${pageHueMix(58, 'transparent')} 44%,
      ${pageHueMix(14, 'transparent')} 100%
    );
    pointer-events: none;
  }
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
  position: relative;
  display: flex;
  min-width: 0;

  /*
   * **매스트헤드 구분선** — 브랜드 줄과 메뉴 줄을 가른다.
   *
   * 헤더가 모든 폭에서 두 줄이 된 뒤(2026-08-02) 두 줄이 같은 무게로 붙어 있어 헤더가 "높기만 한 덩어리"로
   * 읽혔다. 선 하나를 넣으면 위는 정체(브랜드·계정), 아래는 이동(메뉴)이라는 두 층이 눈으로 갈린다.
   *
   * 🔴 row-gap 안쪽(-4px)에 절대 배치한다 — 흐름에 넣으면 헤더가 1px+패딩만큼 높아진다(상한 120px).
   * 왼쪽 끝만 페이지 hue 로 물들여 상단 레일과 같은 색이 아래에서 한 번 더 울리게 한다(비텍스트 장식).
   */
  &::before {
    content: '';
    position: absolute;
    top: calc(-1 * ${space[1]});
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, ${pageHueMix(65, 'transparent')} 0%, ${color.border} 18%, ${color.border} 100%);
    pointer-events: none;
  }
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

/**
 * 환경 설정 묶음(밝기 토글 · 더보기).
 *
 * 페이지 액션·로그인과 **같은 줄에 있지만 성격이 다르다** — 앞의 둘은 "이 화면에서 할 일"이고
 * 이 둘은 "앱을 어떻게 볼 것인가"다. 묶어 두면 좁은 폭에서 줄바꿈이 일어나도 두 개가 함께 움직여
 * 밝기 토글만 혼자 아랫줄로 떨어지는 일이 없다.
 *
 * 구분선은 640px 이상에서만 긋는다. 좁은 폭에서는 간격 자체가 4px 이라 선을 넣으면 버튼 사이가
 * 붙어 보이고, 그 폭에서는 애초에 왼쪽에 놓일 형제가 로그인 하나뿐이라 나눌 것이 없다.
 */
export const UtilityGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  flex: 0 0 auto;

  ${media.up('mobileWide')} {
    gap: ${space[2]};
    padding-left: ${space[3]};
    border-left: 1px solid ${color.border};
  }
`;
