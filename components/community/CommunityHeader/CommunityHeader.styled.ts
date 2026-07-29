import styled from '@emotion/styled';
import { color, media, radius, space } from '@/shared/styles';

/**
 * 커뮤니티 헤더의 좌우 여백 — `CommunityMain`(본문 컨테이너)과 **같은 값**이어야 헤더와 본문의
 * 좌우 끝선이 맞는다. 나머지 화면은 `AppHeader` 기본값(= `FeatureLayout` 과 같은 값)을 쓴다.
 */
export const COMMUNITY_HEADER_GUTTER = `clamp(${space[3]}, 4vw, ${space[5]})`;

/**
 * 데스크톱 인라인 검색 영역 — `AppHeader` 3컬럼 그리드의 가운데(2열) 슬롯 안에 들어간다.
 * 트랙 위치·가운데 정렬은 슬롯(`CenterSlot`)이, **폭 정책은 여기가** 소유한다.
 *
 * **폭 산식이 중앙 정렬의 전제다.** `1fr auto 1fr`의 2열이 정확히 W/2에 서려면 양옆 1fr 트랙이
 * 같아야 하는데, `1fr`(=`minmax(auto,1fr)`)은 min-content 바닥이 있어 **3열 Actions의 min-content가
 * 1fr 배분량보다 크면 3열이 부풀고 검색이 왼쪽으로 밀린다**(원 신고 증상의 재발 경로).
 * 그래서 검색 폭을 "양옆에 Actions가 들어갈 자리를 항상 남기는" 값으로 묶는다.
 *
 * 산식: 트랙 가용폭 = min(1200, 100vw) − 40(헤더 좌우 여백 2×20) − 16(gap 2 × space[2]).
 * `clamp(240px, 100vw − 760px, 480px)` 대입:
 *   961px  → 240px  → 양옆 (905−240)/2 = 332px ✅ (drawer 경계 바로 위, 가장 빡빡한 지점)
 *   1100px → 340px  → 양옆 (1044−340)/2 = 352px ✅
 *   1240px → 480px  → 양옆 (1144−480)/2 = 332px ✅ (컨테이너가 1200에서 고정되므로 이후 불변)
 * 전 구간에서 Actions min-content(글쓰기 + 인증 + 더보기 ≈ 300px) 대비 여유 30px 이상 —
 * 100vw가 스크롤바를 포함하는 브라우저 오차(~15px)도 흡수한다.
 * (≤960px는 flex 폴백 + `display:none`이라 이 산식 적용 대상이 아니다.)
 */
export const SearchSlot = styled.div`
  display: flex;
  justify-content: center;
  width: clamp(240px, calc(100vw - 760px), 480px);
  min-width: 0;

  ${media.down('drawer')} {
    display: none;
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

/** 모바일 검색 펼침 바(헤더 아래 전체폭) — `AppHeader` 의 `below` 슬롯으로 들어간다. */
export const MobileSearchBar = styled.div`
  display: none;
  padding: 0 ${COMMUNITY_HEADER_GUTTER} ${space[2]};
  max-width: 1200px;
  margin: 0 auto;

  ${media.down('drawer')} {
    display: block;
  }

  & > * {
    width: 100%;
  }
`;
