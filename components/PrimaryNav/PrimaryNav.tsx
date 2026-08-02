import { useInRouterContext } from 'react-router-dom';
// per-icon named import(트리셰이킹) → 엔트리에는 이 아이콘들만 실린다(CommunityNavLink·ThemePresetSwitcher와 동일 패턴).
import { BookOpen, CalendarDays, LayoutGrid, LineChart, MessageSquare, ReceiptText, Wallet } from 'lucide-react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
import { isGoogleSheetsEnabled } from '@/shared/lib/googleSheets';
import { isCommunityEnabled } from '@/shared/lib/supabase';
import {
  Brand,
  NavScroller,
  BrandFallback,
  BrandWordmark,
  Nav,
  NavItem,
  NavItems,
  NavLabel,
  WordmarkIncome,
  WordmarkSnow
} from './PrimaryNav.styled';
import type { PrimaryNavProps } from './PrimaryNav.types';

const n = COMMUNITY_COPY.nav;

/**
 * 전역 주요 nav — 모든 페이지 상단(시뮬레이터·커뮤니티 헤더)에 주입되는 공유 컴포넌트.
 *
 *   [워드마크 "스노우볼 인컴"] → `<Link to="/">`(홈)  +  라우트 링크: 시뮬레이터(/simulator)·갤러리(/community)·게시판(/community/board)
 *
 * ⚠ 엔트리 번들 격리: 이 컴포넌트는 시뮬레이터 헤더를 통해 **엔트리 번들에 들어간다.** 그래서
 *   `@/components/community` 배럴·CommunityIcons·supabase-js·Tiptap을 끌어오는 모듈을 import하지 않는다.
 *   아이콘은 lucide-react에서 per-icon으로 직접 가져오고, env 상수(`isCommunityEnabled`·`isGoogleSheetsEnabled`)만
 *   데이터 레이어에서 읽는다(둘 다 순수 상수 모듈이라 supabase-js·GIS 스크립트를 끌고 오지 않는다).
 *   커뮤니티 비활성 배포(isCommunityEnabled=false)에선 갤러리/게시판 링크를, 가계부 비활성
 *   (isGoogleSheetsEnabled=false)에선 가계부 링크를 렌더하지 않는다 — **둘 다 라우트 자체가 없어서**다
 *   (routes.tsx). 메뉴만 남기면 404 로 가는 죽은 링크가 된다.
 *
 * 활성 표시는 react-router `NavLink`가 담당한다(`aria-current="page"` + `.active`).
 * 시뮬레이터만 `end`(exact) — 워드마크가 가리키는 `/`(홈)와 구분하기 위해서다(목적지 문자열이
 * `/` → `/simulator` 로 옮겨 간 이전의 흔적. 워드마크 `Brand to="/"` 는 그대로 둔다).
 * 항목 수는 최대 7개다(2026-08-01 가계부 추가 — 두 env 플래그가 다 켜진 배포 기준).
 * 갤러리(`/community/portfolio`)·게시판(`/community/board`)은 **`end` 없음**: 상세(`/portfolio/:id`)·
 * 글쓰기(`/portfolio/write`)·수정(`/portfolio/:id/edit`) 같은 하위 경로에서도 자기 섹션 탭이 활성으로 남는다
 * (routes.tsx의 자식 라우트 참고). 두 섹션은 형제 세그먼트라 서로를 활성화하지 않는다.
 */
/** 라우트 링크 목록 — 윗줄(브랜드 옆)과 아랫줄(전용 스크롤 줄)이 공유하는 단일 정본. */
const NavLinkItems = () => (
  <>
    <NavItem to={SIMULATOR_PATH} end aria-label={n.simulator}>
      <LineChart size={16} strokeWidth={1.8} aria-hidden focusable={false} />
      <NavLabel>{n.simulator}</NavLabel>
    </NavItem>
    {/* ── 순서 = 예상 관심도·클릭률(사용자 결정 2026-07-25, 2026-08-01 가계부 삽입) ──────────
        시뮬레이터(핵심 도구) → 내 포트폴리오(지금 상태·목표 달성) → 가계부(내 실측 데이터 — 같은 축이라 붙인다) →
        배당 캘린더(매일 볼 유틸리티) → 갤러리(구경 콘텐츠) → 게시판 → ETF 소개(검색 유입이 주라 nav 클릭률은
        가장 낮다). GA4 로 실측되면 재조정. */}
    {/* 내 포트폴리오 — 보유 종목·수량으로 "지금 받는 배당"과 목표 달성률을 계산하는 화면. 아이콘은 지갑(Wallet):
        Briefcase 는 클리셰이고 PieChart 는 시뮬레이터(LineChart)와 혼동된다. */}
    <NavItem to="/dividend/portfolio" aria-label={n.myPortfolio}>
      <Wallet size={16} strokeWidth={1.8} aria-hidden focusable={false} />
      <NavLabel>{n.myPortfolio}</NavLabel>
    </NavItem>
    {/* 가계부 — 내 포트폴리오 **바로 뒤**. 둘은 "내가 직접 넣은 실측 데이터"라는 한 축이라
        페이지 hue 도 accentAlt 를 공유한다(usePageHue.utils.ts). 아이콘은 영수증(ReceiptText):
        Wallet 은 내 포트폴리오가, BookOpen 은 ETF 소개가 이미 쓴다(ledger UI 스펙 §아이콘과 동일 선택).
        🔴 `isGoogleSheetsEnabled` 가 false 면 routes.tsx 의 `/ledger` 라우트가 **존재하지 않는다** —
        같은 플래그로 이 항목도 지운다(커뮤니티 링크가 `isCommunityEnabled` 로 갈리는 것과 같은 방식).
        메뉴만 남으면 404 로 가는 죽은 링크가 된다. */}
    {isGoogleSheetsEnabled ? (
      <NavItem to="/ledger" aria-label={n.ledger}>
        <ReceiptText size={16} strokeWidth={1.8} aria-hidden focusable={false} />
        <NavLabel>{n.ledger}</NavLabel>
      </NavItem>
    ) : null}
    {/* 배당 캘린더 — 커뮤니티 여부와 무관(marketData 기반 정적 페이지). 페이지는 lazy 청크라
        이 링크(경로 문자열)로 엔트리 번들이 커지지 않는다(티커 허브와 동일 논리). */}
    <NavItem to="/dividend/calendar" aria-label={n.dividendCalendar}>
      <CalendarDays size={16} strokeWidth={1.8} aria-hidden focusable={false} />
      <NavLabel>{n.dividendCalendar}</NavLabel>
    </NavItem>
    {isCommunityEnabled ? (
      <>
        <NavItem to="/community/portfolio" aria-label={n.gallery}>
          <LayoutGrid size={16} strokeWidth={1.8} aria-hidden focusable={false} />
          <NavLabel>{n.gallery}</NavLabel>
        </NavItem>
        <NavItem to="/community/board" aria-label={n.board}>
          <MessageSquare size={16} strokeWidth={1.8} aria-hidden focusable={false} />
          <NavLabel>{n.board}</NavLabel>
        </NavItem>
      </>
    ) : null}
    <NavItem to="/ticker/all" aria-label={n.tickers}>
      <BookOpen size={16} strokeWidth={1.8} aria-hidden focusable={false} />
      <NavLabel>{n.tickers}</NavLabel>
    </NavItem>
  </>
);

/**
 * 헤더 라우트 메뉴 줄 — 가운데 정렬 + 가로 스크롤.
 *
 * 자리는 폭에 따라 다르다(`AppHeader` 의 `NavSlot`): **≥1024 는 브랜드와 컨트롤 사이의 남는 폭**,
 * **≤1023 은 아랫줄 전폭**. 어느 쪽이든 이 컴포넌트는 하나이고 마크업도 하나다.
 *
 * 가운데 정렬과 overflow 스크롤은 충돌한다(justify-content:center 는 넘친 왼쪽을 잘라 스크롤로도
 * 못 닿게 만든다). 그래서 스크롤 컨테이너 안에서 **margin-inline:auto** 로 중앙을 잡는다 —
 * 공간이 남으면 정중앙, 넘치면 자연스럽게 좌측부터 스크롤된다.
 */
export function PrimaryNavLinks() {
  const inRouter = useInRouterContext();
  if (!inRouter) return null;
  return (
    <NavScroller aria-label={n.primaryLabel}>
      <NavItems $scrollRow>
        <NavLinkItems />
      </NavItems>
    </NavScroller>
  );
}

export default function PrimaryNav({ brandAs = 'span', withLinks = true }: PrimaryNavProps) {
  const inRouter = useInRouterContext();
  // 워드마크("스노우볼 인컴")를 낱말 단위로 쪼개 두 색으로 그린다(2026-07-27 확정 — 심볼 아이콘 없이 텍스트 단독).
  // 두 파트 사이의 **공백은 진짜 텍스트 노드**로 남긴다: 접근명이 "스노우볼 인컴" 한 덩어리로 읽혀야 한다
  // (aria-hidden·이미지 치환 금지 — 브랜드명을 읽어줄 다른 요소가 이제 없다).
  const [brandSnow, ...brandIncomeWords] = n.brand.split(' ');

  const brandInner = (
    <BrandWordmark as={brandAs}>
      <WordmarkSnow>{brandSnow}</WordmarkSnow>{' '}
      <WordmarkIncome>{brandIncomeWords.join(' ')}</WordmarkIncome>
    </BrandWordmark>
  );

  // Router 컨텍스트가 없는 렌더(일부 단위 테스트/비라우터 임베드)에선 Link/NavLink가 컨텍스트를 요구해
  // 죽는다(구 CommunityNavLink의 방어와 동일 취지). 브랜드만 비링크로 폴백해 앱을 죽이지 않는다.
  // 프로덕션은 루트가 RouterProvider라 항상 아래 전체 nav를 렌더한다.
  if (!inRouter) {
    return (
      <Nav aria-label={n.primaryLabel} $brandOnly={!withLinks}>
        <BrandFallback>{brandInner}</BrandFallback>
      </Nav>
    );
  }

  return (
    <Nav aria-label={n.primaryLabel} $brandOnly={!withLinks}>
      <Brand to="/">{brandInner}</Brand>

      {withLinks ? (
        <NavItems>
          <NavLinkItems />
        </NavItems>
      ) : null}
    </Nav>
  );
}
