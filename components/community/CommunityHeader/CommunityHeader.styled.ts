import styled from '@emotion/styled';
import { color, headerControlsGrid, headerGlassSurface, media, radius, space, zIndex } from '@/shared/styles';

/**
 * sticky 오버레이 서피스 → 서리유리 레시피(§4.7, `headerGlassSurface` 공유).
 * 커뮤니티는 화면 상단 **전폭 바**라 아래쪽 hairline 하나로 콘텐츠와 분리한다.
 *
 * 층위는 `zIndex.headerSurface`(30) — **`dropdown`(20)보다 높다.** 이 헤더는 sticky+z-index와
 * backdrop-filter로 스태킹 컨텍스트를 두 겹 만들므로, 안에 사는 팝오버(더보기 ⋯ 메뉴·AuthControl·
 * PrecisionSearch)의 `z-index: dropdown`은 **헤더 층위 밖으로 나가지 못한다**. 예전 값
 * `dropdown - 1`(=19)은 "헤더는 드롭다운 아래"라는 의도였지만 그 드롭다운들이 전부 헤더 자손이라
 * 전제가 성립하지 않았고, 결과적으로 메뉴 전체가 19에 갇혀 있었다(토큰 주석 참고).
 */
export const HeaderRoot = styled.header`
  position: sticky;
  top: 0;
  z-index: ${zIndex.headerSurface};
  ${headerGlassSurface}
  border-bottom: 1px solid ${color.borderStrong};
`;

/** 헤더 안쪽 — 2줄 스택: 1줄 = 전역 nav(로고+메뉴), 2줄 = 컨트롤(뒤로·검색·액션). */
export const HeaderInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: ${space[2]};
  max-width: 1200px;
  margin: 0 auto;
  padding: ${space[2]} clamp(${space[3]}, 4vw, ${space[5]});
`;

/**
 * 헤더 2번째 줄 — 뒤로가기(1열) · 가운데 검색(2열) · 우측 액션(3열).
 * 1줄째 `PrimaryNav`와 **같은 3컬럼 그리드**라 검색의 중심선이 메뉴의 중심선과 정확히 일치한다.
 */
export const ControlsRow = styled.div`
  ${headerControlsGrid}
  gap: ${space[3]};
`;

/**
 * 1열 — "← 목록". 목록 화면(갤러리/게시판 인덱스)에선 렌더되지 않지만, 그리드가 1열 자리를
 * 그대로 잡아 주므로 가운데 검색은 어느 라우트에서도 같은 x좌표에 선다.
 */
export const BackSlot = styled.div`
  grid-column: 1;
  justify-self: start;
  display: inline-flex;
  align-items: center;
  min-width: 0;
`;

/**
 * 데스크톱 인라인 검색 영역 — 그리드 2열의 정중앙.
 *
 * **폭 산식이 중앙 정렬의 전제다.** `1fr auto 1fr`의 2열이 정확히 W/2에 서려면 양옆 1fr 트랙이
 * 같아야 하는데, `1fr`(=`minmax(auto,1fr)`)은 min-content 바닥이 있어 **3열 Actions의 min-content가
 * 1fr 배분량보다 크면 3열이 부풀고 검색이 왼쪽으로 밀린다**(원 신고 증상의 재발 경로).
 * 그래서 검색 폭을 "양옆에 Actions가 들어갈 자리를 항상 남기는" 값으로 묶는다.
 *
 * 산식: 트랙 가용폭 = min(1200, 100vw) − 48(HeaderInner 좌우 패딩) − 24(gap ${'2 × space[3]'}).
 * 양옆 1fr = (가용폭 − 검색폭) / 2 ≥ Actions min-content(글쓰기 + 인증 + 더보기 ≈ 300px)를 만족해야 한다.
 * `clamp(240px, 100vw − 760px, 480px)` 대입:
 *   961px  → 240px  → 양옆 (889−240)/2 = 324px ✅ (drawer 경계 바로 위, 가장 빡빡한 지점)
 *   1100px → 340px  → 양옆 (1028−340)/2 = 344px ✅
 *   1240px → 480px  → 양옆 (1128−480)/2 = 324px ✅ (컨테이너가 1200에서 고정되므로 이후 불변)
 * 전 구간에서 여유 24px 이상 — 100vw가 스크롤바를 포함하는 브라우저 오차(~15px)도 흡수한다.
 * (≤960px는 flex 폴백 + `display:none`이라 이 산식 적용 대상이 아니다.)
 */
export const SearchSlot = styled.div`
  grid-column: 2;
  justify-self: center;
  display: flex;
  justify-content: center;
  width: clamp(240px, calc(100vw - 760px), 480px);
  min-width: 0;

  ${media.down('drawer')} {
    display: none;
  }
`;

export const Actions = styled.div`
  grid-column: 3;
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  flex: 0 0 auto;

  /**
   * 모바일(drawer↓)에선 그리드가 flex로 폴백하고 가운데 인라인 검색(SearchSlot)도 display:none 이라
   * flex-grow 요소가 사라진다. 그러면 뒤로·액션이 전부 왼쪽으로 뭉친다. margin-left:auto 로 액션을
   * 우측으로 밀어 좌 ↔ 우 배치를 유지한다. (데스크톱은 그리드라 3열 justify-self:end 가 담당.)
   */
  ${media.down('drawer')} {
    margin-left: auto;
  }
`;

/** 데스크톱에서만 라벨 노출(모바일은 아이콘). */
export const DesktopOnly = styled.span`
  ${media.down('drawer')} {
    display: none;
  }
`;

/** 모바일에서만 노출되는 검색 토글 아이콘 버튼. */
export const MobileSearchToggle = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${radius.md};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.textSecondary};
  cursor: pointer;

  ${media.down('drawer')} {
    display: inline-flex;
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/** 모바일 검색 펼침 바(헤더 아래 전체폭). */
export const MobileSearchBar = styled.div`
  display: none;
  padding: 0 clamp(${space[3]}, 4vw, ${space[5]}) ${space[2]};
  max-width: 1200px;
  margin: 0 auto;

  ${media.down('drawer')} {
    display: block;
  }

  & > * {
    width: 100%;
  }
`;
