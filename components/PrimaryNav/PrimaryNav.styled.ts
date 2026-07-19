import styled from '@emotion/styled';
import { Link, NavLink } from 'react-router-dom';
import { color, font, media, radius, space } from '@/shared/styles';

/** 전역 nav 랜드마크 — 브랜드 링크 + 라우트 링크를 한 줄로. 좁아지면 라벨이 접혀 아이콘만 남는다. */
export const Nav = styled.nav`
  display: inline-flex;
  align-items: center;
  gap: ${space[3]};
  min-width: 0;
`;

/** 브랜드(로고+워드마크) 공통 레이아웃 — 링크(Brand)와 비링크 폴백(BrandFallback)이 공유한다. */
const brandLayout = `
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  flex: 0 0 auto;
`;

/** [로고 + 앱이름]을 감싸는 홈(`/`) 링크. 링크 하나로 로고와 워드마크를 함께 클릭 대상으로. */
export const Brand = styled(Link)`
  ${brandLayout}
  text-decoration: none;
  border-radius: ${radius.sm};

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/**
 * Router 컨텍스트가 없는 렌더(일부 단위 테스트/비라우터 임베드)용 브랜드 폴백 — 비링크 span.
 * 프로덕션은 루트가 RouterProvider라 항상 링크(Brand)를 쓴다.
 */
export const BrandFallback = styled.span`
  ${brandLayout}
`;

/** 앱 아이콘 원형 프레임 — 메인/커뮤니티 헤더의 로고와 시각 통일. */
export const BrandLogo = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
`;

export const BrandLogoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

/**
 * 브랜드 워드마크("Snowball Income"). `as='h1'`(메인)이면 랜드마크 제목을 겸하므로 margin을 0으로 리셋한다.
 * 워드마크는 유지하되(요구사항) 자간을 조여 로고처럼 읽히게 한다.
 */
export const BrandWordmark = styled.span`
  margin: 0;
  color: ${color.text};
  /* "Snowball / Income" 두 줄 — 28px 로고 높이에 맞춰 축소(2줄 × ~13px × 1.05 ≈ 28px). */
  font-size: 13px;
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  line-height: 1.05;
  white-space: nowrap;
  text-align: left;
`;

export const NavItems = styled.div`
  display: inline-flex;
  align-items: center;
  /* 라우트 링크 사이를 넉넉히 벌린다(요구사항 — 너무 붙어있지 않게). */
  gap: ${space[3]};
  min-width: 0;
`;

/**
 * 긴 라벨("포트폴리오 갤러리")을 2줄로 접되 font-size를 줄여, 1줄 항목("게시판")과 같은 항목 높이를 유지한다.
 * 접근명은 NavItem의 aria-label이 담당한다(여기 span 2개는 시각 표시용).
 */
export const NavLabelStacked = styled.span`
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 0.72em;
  line-height: 1.05;
  white-space: nowrap;

  ${media.down('mobileWide')} {
    display: none;
  }
`;

/**
 * 라우트 링크(NavLink). 활성 라우트에서 react-router가 `aria-current="page"`와 `.active`를 붙인다.
 * 좁은 화면(mobileWide↓)에선 라벨을 접어 아이콘 버튼이 된다 — 이름은 NavItem의 `aria-label`이 준다.
 */
export const NavItem = styled(NavLink)`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: ${space[1]} ${space[2]};
  min-height: 32px;
  border-radius: ${radius.sm};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 120ms ease, color 120ms ease;

  &:hover {
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  &.active,
  &[aria-current='page'] {
    background: ${color.brandSubtle};
    color: ${color.brandText};
    font-weight: ${font.weight.semibold};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/** 라우트 링크 라벨 — 좁은 화면에선 숨겨 아이콘만 남긴다(aria-label이 이름을 유지). */
export const NavLabel = styled.span`
  ${media.down('mobileWide')} {
    display: none;
  }
`;
