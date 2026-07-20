import styled from '@emotion/styled';
import { Link, NavLink } from 'react-router-dom';
import { color, font, media, radius, shadow, space } from '@/shared/styles';

/**
 * 전역 nav 랜드마크 — 브랜드 링크 + 라우트 링크를 한 줄로. 좁아지면 라벨이 접혀 아이콘만 남는다.
 *
 * 레이아웃 = **3컬럼 그리드 `1fr auto 1fr`**: 브랜드가 1열(좌측 고정), 라우트 링크가 2열(가운데),
 * 3열은 빈 채로 남겨 브랜드/우측 컨트롤의 폭 변화와 무관하게 메뉴가 **헤더 가로폭의 시각적 중앙**에
 * 고정된다(flex + margin auto 방식은 브랜드 폭에 따라 중앙이 흔들린다).
 * 두 헤더 모두 이 nav를 세로 스택(column, align-items:stretch)의 자식으로 두므로 nav가 헤더 폭을
 * 그대로 차지한다 — 그래서 grid 중앙이 곧 헤더 중앙이다.
 *
 * 좁은 화면(drawer↓)에선 가운데 정렬이 브랜드를 밀어 압박하므로 **기존 flex 흐름으로 폴백**한다.
 */
export const Nav = styled.nav`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: ${space[3]};
  min-width: 0;

  ${media.down('drawer')} {
    display: flex;
    align-items: center;
  }
`;

/** 브랜드(로고+워드마크) 공통 레이아웃 — 링크(Brand)와 비링크 폴백(BrandFallback)이 공유한다. */
const brandLayout = `
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  flex: 0 0 auto;
  /* 그리드 1열에서 좌측 고정 — stretch되면 클릭 영역이 빈 공간까지 넓어진다. */
  justify-self: start;
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
  /* 그리드 2열의 정중앙에 놓는다(Nav 주석 참고). drawer↓ flex 폴백에선 무시된다. */
  justify-self: center;
  /* 라우트 링크 사이를 넉넉히 벌린다(요구사항 — 너무 붙어있지 않게). */
  gap: ${space[4]};
  min-width: 0;

  /* 좁은 화면에선 넓은 간격이 브랜드/컨트롤을 밀어내므로 원래 간격으로 되돌린다. */
  ${media.down('drawer')} {
    gap: ${space[3]};
  }
`;

/**
 * ── 활성 표기 스타일(현재 페이지) — **A안: 브랜드 채움 pill** ────────────────────────────────
 *
 * 활성 표기를 한 블록에 모아 둔다(다른 안으로 갈아끼울 때 여기만 바꾸면 된다 — 대안 B/C는 핸드오프 참고).
 * A안 = 브랜드 색으로 꽉 채운 pill + 살짝 뜬 그림자. 라벨/아이콘은 반드시 `color.onBrand`
 * (브랜드 채움 위 라벨 규칙 — velog·sunset·ink 다크에서 흰색 하드코딩은 대비가 깨진다).
 * 아이콘은 `currentColor`(lucide 기본)라 색이 자동으로 따라온다.
 */
const navItemActiveStyle = `
  background: ${color.brand};
  color: ${color.onBrand};
  font-weight: ${font.weight.bold};
  box-shadow: ${shadow.e1};
`;

/**
 * 라우트 링크(NavLink). 활성 라우트에서 react-router가 `aria-current="page"`와 `.active`를 붙인다.
 * 좁은 화면(mobileWide↓)에선 라벨을 접어 아이콘 버튼이 된다 — 이름은 NavItem의 `aria-label`이 준다.
 */
export const NavItem = styled(NavLink)`
  /* 활성 인디케이터(::after)를 쓰는 대안 안(B/C)을 위해 좌표계를 미리 잡아 둔다. */
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: ${space[1]} ${space[3]};
  min-height: 32px;
  border-radius: ${radius.sm};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 120ms ease, color 120ms ease, box-shadow 120ms ease;

  &:hover {
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  /* 활성(현재 페이지) — 위 navItemActiveStyle 한 블록이 정본. */
  &.active,
  &[aria-current='page'] {
    ${navItemActiveStyle}
  }

  /* 활성 항목 위 hover가 비활성 hover 규칙에 덮이지 않도록(동일 특이도 → 뒤에 선언). */
  &.active:hover,
  &[aria-current='page']:hover {
    background: ${color.brandHover};
    color: ${color.onBrand};
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
