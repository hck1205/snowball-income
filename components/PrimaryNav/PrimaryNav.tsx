import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useInRouterContext, useLocation } from 'react-router-dom';
// per-icon named import(트리셰이킹) → 엔트리에는 이 아이콘들만 실린다(CommunityNavLink·ThemePresetSwitcher와 동일 패턴).
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  LayoutGrid,
  LineChart,
  MessageSquare,
  ReceiptText,
  Scale,
  Users,
  Wallet
} from 'lucide-react';
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
  NavMenu,
  NavMenuChevron,
  NavMenuItem,
  NavMenuRoot,
  NavMenuTrigger,
  WordmarkIncome,
  WordmarkSnow
} from './PrimaryNav.styled';
import type { PrimaryNavProps } from './PrimaryNav.types';

const n = COMMUNITY_COPY.nav;

/**
 * 묶음 메뉴가 품는 목적지. 트리거의 활성 판정도 이 목록에서 파생한다(경로를 두 번 적지 않는다).
 *
 * 순서는 **내 것 → 남의 것 → 모두의 것**이다(2026-08-02 사용자 지시로 갤러리 합류).
 * ⚠ 갤러리만 `isCommunityEnabled` 로 갈린다 — 꺼진 배포에선 라우트 자체가 없어 죽은 링크가 된다.
 * ⚠ 경로가 셋 다 다른 접두사인 것은 의도가 아니라 **현실**이다. 주소 개편은 2026-08-02 에
 *   "이미 배포된 주소를 흔들지 않는다"로 보류됐고, `/portfolio/investors` 만 새로 태어나 그 형태를 따랐다.
 */
const PORTFOLIO_GROUP_ITEMS = [
  { to: '/dividend/portfolio', label: n.myPortfolio, Icon: Wallet, communityOnly: false },
  { to: '/portfolio/investors', label: n.investors, Icon: Users, communityOnly: false },
  { to: '/community/portfolio', label: n.gallery, Icon: LayoutGrid, communityOnly: true }
] as const;

/**
 * 포트폴리오 묶음 메뉴 — nav 한 칸에 목적지 둘을 접는다.
 *
 * 왜 묶는가: nav 항목이 8개에 닿아 "더 늘릴 거면 접기·묶기를 먼저 설계하라"고 못 박아 뒀는데
 * (`NavLinkItems` 의 종목 비교 주석), 대가들의 포트폴리오가 아홉 번째였다. 내 포트폴리오와
 * 대가들의 포트폴리오는 **"누구의 포트폴리오인가"라는 한 축**이라 묶는 값이 가장 크다
 * (2026-08-02 사용자 결정 — 헤더는 2단 그대로, 묶음만 도입).
 *
 * 🔴 트리거는 **목적지가 아니다** — `/portfolio` 라우트는 없다. 눌러도 이동하지 않고 메뉴만 연다.
 * 개폐는 `HeaderOverflowMenu` 와 같은 메커니즘을 따른다(바깥 pointerdown · Esc · 트리거로 포커스 복귀).
 *
 * 🔴 **`role="menu"`/`role="menuitem"` 을 붙이지 마라.** 두 가지가 깨진다:
 *  ① `menuitem` 은 `<a>` 의 암묵 role(link)을 **덮어써서** 링크가 링크로 안 읽힌다(실측: `getByRole('link')`
 *     가 못 찾는다). 새 탭 열기·주소 복사를 기대하는 사용자에게 그건 거짓말이다 — 이건 진짜 링크다.
 *  ② `menu` 를 선언하면 방향키 로빙 포커스까지 약속하는 셈인데 여기는 그걸 구현하지 않는다.
 * 여기 쓰는 것은 WAI-ARIA 의 **disclosure 패턴**이다 — 버튼(`aria-expanded` + `aria-controls`)이
 * 링크 묶음을 여닫는다. 약속하는 만큼만 말한다.
 *
 * ⚠ 목록은 **body 로 포털**한다. nav 줄이 `overflow-x: auto` 스크롤 컨테이너라 그 안에 두면
 *   세로로 잘리기 때문이다(근거는 `NavMenu` 주석). 그래서 좌표를 직접 재서 `fixed` 로 띄운다.
 */
function PortfolioNavMenu() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // 커뮤니티가 꺼진 배포에선 갤러리 항목이 통째로 빠진다 — 활성 판정도 남은 것들로만 한다.
  const items = PORTFOLIO_GROUP_ITEMS.filter((item) => !item.communityOnly || isCommunityEnabled);

  const isActive = items.some(
    (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
  );

  /* 트리거 바로 아래에 붙인다. 포털이라 좌표를 직접 줘야 한다 — 뷰포트 기준(fixed)이다. */
  const syncPosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 4, left: rect.left });
  }, []);

  // 페인트 전에 맞춰 첫 프레임이 엉뚱한 자리에 그려지지 않게 한다.
  useLayoutEffect(() => {
    if (open) syncPosition();
  }, [open, syncPosition]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      // 포털된 메뉴는 rootRef 밖에 있다 — 메뉴 자신을 클릭한 경우를 따로 봐준다.
      if (rootRef.current?.contains(target)) return;
      if (document.getElementById(menuId)?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    // nav 줄 자체가 가로 스크롤되므로 capture 로 받아 안쪽 스크롤도 따라간다.
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', syncPosition, true);
    window.addEventListener('resize', syncPosition);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', syncPosition, true);
      window.removeEventListener('resize', syncPosition);
    };
  }, [open, menuId, syncPosition]);

  // 이동하면 닫는다 — 열어 둔 채로 다음 화면에 남으면 유령 메뉴가 된다.
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <NavMenuRoot ref={rootRef}>
      <NavMenuTrigger
        ref={triggerRef}
        type="button"
        $active={isActive}
        /*
         * 접힌 채로도 "지금 이 묶음 안에 있다"를 말한다. 채움 pill 은 시각 신호일 뿐이라
         * 그것만 두면 스크린리더 사용자는 펼쳐 보기 전까지 현재 위치를 알 수 없다.
         * `page` 가 아니라 `true` 인 이유: 이 버튼 자체는 페이지가 아니다(목적지가 없다).
         */
        aria-current={isActive ? 'true' : undefined}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Wallet size={16} strokeWidth={1.8} aria-hidden focusable={false} />
        <NavLabel>{n.portfolioGroup}</NavLabel>
        <NavMenuChevron $open={open}>
          <ChevronDown size={14} strokeWidth={1.8} aria-hidden focusable={false} />
        </NavMenuChevron>
      </NavMenuTrigger>

      {open && position
        ? createPortal(
            <NavMenu id={menuId} style={{ top: position.top, left: position.left }}>
              {items.map(({ to, label, Icon }) => (
                <NavMenuItem key={to} to={to} onClick={() => setOpen(false)}>
                  <Icon size={16} strokeWidth={1.8} aria-hidden focusable={false} />
                  {label}
                </NavMenuItem>
              ))}
            </NavMenu>,
            document.body
          )
        : null}
    </NavMenuRoot>
  );
}

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
 * 윗줄 항목 수는 **7개**다(두 env 플래그가 다 켜진 배포 기준). 2026-08-02 에 대가들의 포트폴리오가
 * 아홉 번째가 될 뻔했는데, 포트폴리오 3종(내 배당 포트폴리오·대가들의 포트폴리오·갤러리)을
 * 한 칸으로 **묶어**(`PortfolioNavMenu`) 오히려 한 칸 줄었다.
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
    {/* 포트폴리오 묶음 — 내 배당 포트폴리오 + 대가들의 포트폴리오 + 포트폴리오 갤러리 셋.
        아이콘은 지갑(Wallet): Briefcase 는 클리셰이고 PieChart 는 시뮬레이터(LineChart)와 혼동된다.
        ⚠ 갤러리는 원래 커뮤니티 축(갤러리·게시판)에 있었는데 2026-08-02 사용자 지시로 이리 옮겼다 —
          사용자에게는 "포트폴리오를 보는 곳"이 한 군데인 편이 낫다는 판단이다. 게시판은 그대로 남는다. */}
    <PortfolioNavMenu />
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
    {/* 갤러리(/community/portfolio)는 2026-08-02 부터 포트폴리오 묶음 안이다 — 윗줄에는 게시판만 남는다. */}
    {isCommunityEnabled ? (
      <NavItem to="/community/board" aria-label={n.board}>
        <MessageSquare size={16} strokeWidth={1.8} aria-hidden focusable={false} />
        <NavLabel>{n.board}</NavLabel>
      </NavItem>
    ) : null}
    <NavItem to="/ticker/all" aria-label={n.tickers}>
      <BookOpen size={16} strokeWidth={1.8} aria-hidden focusable={false} />
      <NavLabel>{n.tickers}</NavLabel>
    </NavItem>
    {/* 종목 비교 — ETF 소개 **바로 뒤**. 둘은 "종목 정보"라는 한 축이고, 비교는 소개를 읽다가
        "그래서 저것과 뭐가 다른가"로 이어지는 자리라 그 옆이 자연스럽다.
        ⚠ 이 항목으로 nav 가 8개가 됐다. 좁은 폭에서는 `NavScroller` 가 가로 스크롤로 흡수하는데,
        스크롤로 숨는 항목은 사용자에게 아무 신호를 주지 않는다(pitfalls 2026-07-31 실측).
        🔴 **8개가 상한이다.** 아홉 번째가 필요하면 새 칸을 만들지 말고 `PortfolioNavMenu` 처럼
        같은 축끼리 묶어라 — 그것이 2026-08-02 에 실제로 택한 길이다. */}
    <NavItem to="/ticker/compare" aria-label={n.tickerCompare}>
      <Scale size={16} strokeWidth={1.8} aria-hidden focusable={false} />
      <NavLabel>{n.tickerCompare}</NavLabel>
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
