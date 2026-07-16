import styled from '@emotion/styled';
import { color, font, media, radius, shadow, space, zIndex } from '@/shared/styles';

export const HeaderRoot = styled.header`
  position: sticky;
  top: 0;
  z-index: ${zIndex.dropdown - 1};
  background: ${color.surface};
  border-bottom: 1px solid ${color.border};
  box-shadow: ${shadow.e1};
`;

export const HeaderInner = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  max-width: 1200px;
  margin: 0 auto;
  padding: ${space[2]} clamp(${space[3]}, 4vw, ${space[5]});
`;

/**
 * 브랜드 표시 요소 — **비상호작용**(클릭 불가·비포커스). 커뮤니티에서 로고/워드마크는 링크가 아니다.
 * 링크가 아니므로 role/tabIndex를 부여하지 않는다(기본적으로 focusable 아님).
 */
export const Brand = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  flex: 0 0 auto;
`;

/**
 * 브랜드 로고 프레임. 메인 헤더(`HeaderLogo`)와 시각적으로 통일 — 앱 아이콘(`/app_icon.png`)을
 * 원형으로 커버 크롭한다. 브랜드 틴트 배지가 아니라 메인과 같은 "맨 원형 아이콘" 톤이다.
 */
export const BrandLogo = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
`;

export const BrandWordmark = styled.span`
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.03em;

  ${media.down('mobileWide')} {
    display: none;
  }
`;

/** 데스크톱 인라인 검색 영역 — 가운데를 채운다. */
export const SearchSlot = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  justify-content: center;

  ${media.down('drawer')} {
    display: none;
  }
`;

export const Spacer = styled.div`
  flex: 1 1 auto;
`;

export const Actions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  flex: 0 0 auto;

  /**
   * 모바일(drawer↓)에선 가운데 인라인 검색(SearchSlot)이 display:none 이 되어 flex-grow 요소가
   * 사라진다. 그러면 브랜드·뒤로·액션이 전부 왼쪽으로 뭉친다. margin-left:auto 로 액션을
   * 우측으로 밀어 브랜드(좌) ↔ 액션(우) 배치를 유지한다. (데스크톱은 SearchSlot/Spacer가
   * 공간을 채우므로 auto 여백이 0으로 접혀 영향이 없다.)
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
