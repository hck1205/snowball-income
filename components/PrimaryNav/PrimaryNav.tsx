import { useInRouterContext } from 'react-router-dom';
// per-icon named import(트리셰이킹) → 엔트리에는 이 세 아이콘만 실린다(CommunityNavLink·ThemePresetSwitcher와 동일 패턴).
import { LayoutGrid, LineChart, MessageSquare } from 'lucide-react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { isCommunityEnabled } from '@/shared/lib/supabase';
import {
  Brand,
  BrandFallback,
  BrandLogo,
  BrandLogoImage,
  BrandWordmark,
  Nav,
  NavItem,
  NavItems,
  NavLabel
} from './PrimaryNav.styled';
import type { PrimaryNavProps } from './PrimaryNav.types';

const n = COMMUNITY_COPY.nav;

/**
 * 전역 주요 nav — 모든 페이지 상단(시뮬레이터·커뮤니티 헤더)에 주입되는 공유 컴포넌트.
 *
 *   [로고 + 앱이름] → 하나의 `<Link to="/">`(홈)  +  라우트 링크: 시뮬레이터(/)·갤러리(/community)·게시판(/community/board)
 *
 * ⚠ 엔트리 번들 격리: 이 컴포넌트는 시뮬레이터 헤더를 통해 **엔트리 번들에 들어간다.** 그래서
 *   `@/components/community` 배럴·CommunityIcons·supabase-js·Tiptap을 끌어오는 모듈을 import하지 않는다.
 *   아이콘은 lucide-react에서 per-icon으로 직접 가져오고, `isCommunityEnabled`(env 상수)만 데이터 레이어에서 읽는다.
 *   커뮤니티 비활성 배포(isCommunityEnabled=false)에선 갤러리/게시판 링크를 렌더하지 않는다(앱은 그대로 동작).
 *
 * 활성 표시는 react-router `NavLink`가 담당한다(`aria-current="page"` + `.active`).
 * `/`만 `end`(exact) — 안 그러면 모든 경로에서 시뮬레이터가 활성이 된다.
 * 갤러리(`/community/portfolio`)·게시판(`/community/board`)은 **`end` 없음**: 상세(`/portfolio/:id`)·
 * 글쓰기(`/portfolio/write`)·수정(`/portfolio/:id/edit`) 같은 하위 경로에서도 자기 섹션 탭이 활성으로 남는다
 * (routes.tsx의 자식 라우트 참고). 두 섹션은 형제 세그먼트라 서로를 활성화하지 않는다.
 */
export default function PrimaryNav({ brandAs = 'span' }: PrimaryNavProps) {
  const inRouter = useInRouterContext();
  // 워드마크를 두 줄로 스택("Snowball" / "Income"). 사이의 공백 텍스트로 접근명 "Snowball Income"을 유지한다.
  const [brandFirst, ...brandRestWords] = n.brand.split(' ');

  const brandInner = (
    <>
      <BrandLogo>
        {/* 워드마크가 브랜드명을 읽어주므로 로고 이미지는 장식(alt="") — 메인/커뮤니티 헤더 선례와 동일. */}
        <BrandLogoImage src="/app_icon.png" alt="" width={28} height={28} />
      </BrandLogo>
      <BrandWordmark as={brandAs}>
        {brandFirst}
        {' '}
        <br />
        {brandRestWords.join(' ')}
      </BrandWordmark>
    </>
  );

  // Router 컨텍스트가 없는 렌더(일부 단위 테스트/비라우터 임베드)에선 Link/NavLink가 컨텍스트를 요구해
  // 죽는다(구 CommunityNavLink의 방어와 동일 취지). 브랜드만 비링크로 폴백해 앱을 죽이지 않는다.
  // 프로덕션은 루트가 RouterProvider라 항상 아래 전체 nav를 렌더한다.
  if (!inRouter) {
    return (
      <Nav aria-label={n.primaryLabel}>
        <BrandFallback>{brandInner}</BrandFallback>
      </Nav>
    );
  }

  return (
    <Nav aria-label={n.primaryLabel}>
      <Brand to="/">{brandInner}</Brand>

      <NavItems>
        <NavItem to="/" end aria-label={n.simulator}>
          <LineChart size={16} strokeWidth={1.8} aria-hidden focusable={false} />
          <NavLabel>{n.simulator}</NavLabel>
        </NavItem>
        {isCommunityEnabled ? (
          <>
            <NavItem to="/community/portfolio" aria-label={n.gallery}>
              <LayoutGrid size={16} strokeWidth={1.8} aria-hidden focusable={false} />
              {/* 다른 항목과 동일하게 한 줄 라벨(사용자 요청 — 구 2줄 스택 NavLabelStacked 폐기). */}
              <NavLabel>{n.gallery}</NavLabel>
            </NavItem>
            <NavItem to="/community/board" aria-label={n.board}>
              <MessageSquare size={16} strokeWidth={1.8} aria-hidden focusable={false} />
              <NavLabel>{n.board}</NavLabel>
            </NavItem>
          </>
        ) : null}
      </NavItems>
    </Nav>
  );
}
