import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useInRouterContext, useLocation } from 'react-router-dom';
// per-icon named import(트리셰이킹). 목적지 아이콘은 전부 PrimaryNav.utils 가 들고 있다 — 여기 남은
// 것은 트리거의 개폐 표시 하나뿐이다.
import { ChevronDown } from 'lucide-react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import {
  Brand,
  NavScroller,
  BrandFallback,
  BrandWordmark,
  Nav,
  NavItems,
  NavLabel,
  NavMenu,
  NavMenuChevron,
  NavMenuItem,
  NavMenuRoot,
  NavMenuTrigger,
  WordmarkLead,
  WordmarkTail
} from './PrimaryNav.styled';
import type { NavColumn, NavLeaf, PrimaryNavProps } from './PrimaryNav.types';
import { buildNavTree, isNavPathActive } from './PrimaryNav.utils';

const n = COMMUNITY_COPY.nav;

/**
 * 묶음 메뉴 한 벌 — nav 한 칸에 목적지 여럿을 접는다.
 *
 * 🔴 **칸은 전부 같은 모양이다**(2026-08-14). 자식이 많은 칸 하나만 여러 열을 가진 판(메가메뉴)으로
 *    열게 했다가 되돌렸다 — 형제 중 하나만 다르게 동작하면 사용자가 배운 규칙("누르면 목록이
 *    떨어진다")이 깨진다(사용자 신고: "다른 메뉴는 안 그런데 저것만 이상하다"). 자식이 늘어 목록이
 *    길어지면 판을 키우지 말고 **칸을 나눠라**(상한 8칸 안에서).
 *
 * 🔴 트리거는 **목적지가 아니다** — `/portfolio`·`/dividend` 라우트는 없다. 눌러도 이동하지 않고
 * 메뉴만 연다. 개폐는 `HeaderOverflowMenu` 와 같은 메커니즘을 따른다(바깥 pointerdown · Esc ·
 * 트리거로 포커스 복귀).
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
type NavGroupMenuProps = { column: NavColumn };

function NavGroupMenu({ column }: NavGroupMenuProps) {
  const { label, Icon: TriggerIcon, items } = column;
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  /* 접힌 트리거의 활성 판정 — 자식 어디에 있어도 켠다(펼치지 않아도 현재 위치가 읽혀야 한다). */
  const isActive = items.some((item) => isNavPathActive(location.pathname, item.to));

  /*
   * 트리거 바로 아래에 붙인다. 포털이라 좌표를 직접 줘야 한다 — 뷰포트 기준(fixed)이다.
   * ⚠ 오른쪽 넘침을 막는다: 마지막 칸(커뮤니티)은 줄 오른쪽 끝에 서서, 트리거 왼쪽에 그대로
   *   맞추면 목록이 화면 밖으로 나갈 수 있다. 실제 폭은 목록이 붙은 뒤에야 알 수 있으므로 아래
   *   `setMenuNode`(콜백 ref)가 마운트 시점에 한 번 더 부른다 — 커밋 단계라 페인트 전에 보정된다.
   */
  const syncPosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuWidth = menuRef.current?.offsetWidth ?? 0;
    const maxLeft = Math.max(8, window.innerWidth - menuWidth - 8);
    setPosition({ top: rect.bottom + 4, left: Math.min(rect.left, maxLeft) });
  }, []);

  const setMenuNode = useCallback(
    (node: HTMLDivElement | null) => {
      menuRef.current = node;
      /* 붙은 직후 실제 폭으로 다시 잰다. 떼어질 때(node === null)는 다음 개폐가 어차피 다시 잰다. */
      if (node) syncPosition();
    },
    [syncPosition]
  );

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

  const renderItem = ({ to, label: itemLabel, Icon }: NavLeaf) => (
    <NavMenuItem key={to} to={to} onClick={() => setOpen(false)}>
      <Icon size={16} strokeWidth={1.8} aria-hidden focusable={false} />
      {itemLabel}
    </NavMenuItem>
  );

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
        <TriggerIcon size={16} strokeWidth={1.8} aria-hidden focusable={false} />
        <NavLabel>{label}</NavLabel>
        <NavMenuChevron $open={open}>
          <ChevronDown size={14} strokeWidth={1.8} aria-hidden focusable={false} />
        </NavMenuChevron>
      </NavMenuTrigger>

      {open && position
        ? createPortal(
            <NavMenu id={menuId} ref={setMenuNode} style={{ top: position.top, left: position.left }}>
              {items.map(renderItem)}
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
 *   [워드마크 "Hungry Hippo"] → `<Link to="/">`(홈)  +  라우트 링크: 아래 다섯 칸
 *
 * ## 일곱 칸의 **순서**가 사용자 여정이다 (2026-08-14 사용자 결정)
 *
 *   외부 포트폴리오 · 배당 종목 · 시장 읽기 → 종목 탐색 → 내 자산계획 → 캘린더 · 커뮤니티
 *   └────────── 유입(구경) ──────────┘   허브(비교)   전환(계산)    상설
 *
 * 종전 순서는 관심도 추정이었다. 🔴 **여정은 순서에만 담고 이름은 목적지를 말한다** — 칸을
 * '둘러보기·비교하기' 같은 동사로 바꿨다가 되돌린 근거는 `PrimaryNav.utils` 주석에 있다.
 * 목록·순서·아이콘의 근거도 전부 그쪽이다 — 여기서는 그 트리를 그리기만 한다.
 *
 * 🔴 상한은 **8칸**이다(지금 7칸). 좁은 폭에서 넘치면 가로 스크롤로 숨는데, 스크롤로 숨는 항목은
 *    사용자에게 아무 신호를 주지 않는다(2026-07-31 실측). 여덟째가 필요하면 **또 하나의 묶음**을
 *    만들어라 — 칸 하나를 특별하게 키우는 길은 2026-08-14 에 닫혔다.
 *
 * ⚠ 엔트리 번들 격리: 이 컴포넌트는 시뮬레이터 헤더를 통해 **엔트리 번들에 들어간다.** 그래서
 *   `@/components/community` 배럴·CommunityIcons·supabase-js·Tiptap을 끌어오는 모듈을 import하지 않는다.
 *   목적지·아이콘·env 분기는 전부 `PrimaryNav.utils`(순수 상수 모듈만 참조) 안에 있다.
 *
 * 활성 표시는 react-router `NavLink`가 담당한다(`aria-current="page"` + `.active`).
 * 갤러리(`/community/portfolio`)·게시판(`/community/board`)은 **`end` 없음**: 상세(`/portfolio/:id`)·
 * 글쓰기(`/portfolio/write`)·수정(`/portfolio/:id/edit`) 같은 하위 경로에서도 자기 링크가 활성으로 남는다
 * (routes.tsx의 자식 라우트 참고). 두 섹션은 형제 세그먼트라 서로를 활성화하지 않는다.
 */
/** 라우트 링크 목록 — 윗줄(브랜드 옆)과 아랫줄(전용 스크롤 줄)이 공유하는 단일 정본. */
const NavLinkItems = () => (
  <>
    {/* 🔴 env 필터는 `buildNavTree()` 안에 있다 — 렌더마다 부르는 것이 계약이다(모듈 상수로 굳히면
        가계부·커뮤니티가 꺼진 배포의 동작을 테스트가 검증할 수 없다). */}
    {buildNavTree().map((column) => (
      <NavGroupMenu key={column.label} column={column} />
    ))}
  </>
);

/**
 * 헤더 라우트 메뉴 줄 — **워드마크와 같은 시작선 + 남는 폭을 항목 사이로 균등 분배** + 가로 스크롤.
 *
 * 자리는 폭에 따라 다르다(`AppHeader` 의 `NavSlot`): **≥1024 는 브랜드와 컨트롤 사이의 남는 폭**,
 * **≤1023 은 아랫줄 전폭**. 어느 쪽이든 이 컴포넌트는 하나이고 마크업도 하나다.
 *
 * 🔴 2026-08-05 사용자 지시로 **가운데 정렬(margin-inline:auto)을 걷어냈다.** 종전에는 메뉴 덩어리가
 * 줄 한가운데 뭉쳐 있어서, 바로 위 "Hungry Hippo" 워드마크와 시작선이 어긋나고 양옆에 큰 빈 폭이
 * 남았다. 지금은 첫 항목이 워드마크와 같은 x 에서 시작하고(NavScroller 의 음수 마진), 남는 폭은
 * `space-between` 이 항목 사이로 **똑같이** 나눠 준다.
 *
 * ⚠ 정렬과 overflow 스크롤은 충돌할 수 있다 — `justify-content: center` 는 넘친 왼쪽을 잘라
 *   스크롤로도 못 닿게 만든다. `space-between` 은 그 함정이 없다(넘치면 간격이 gap 최솟값으로
 *   수렴하고 줄은 왼쪽부터 스크롤된다).
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
  // 워드마크("Hungry Hippo")를 낱말 단위로 쪼개 두 색으로 그린다(2026-07-27 확정 — 심볼 아이콘 없이 텍스트 단독).
  // 두 파트 사이의 **공백은 진짜 텍스트 노드**로 남긴다: 접근명이 "Hungry Hippo" 한 덩어리로 읽혀야 한다
  // (aria-hidden·이미지 치환 금지 — 브랜드명을 읽어줄 다른 요소가 이제 없다).
  // 낱말이 셋 이상이 되면 두 번째부터 전부 뒷 낱말로 묶인다 — 지금은 정확히 둘이다.
  const [brandLead, ...brandTailWords] = n.brand.split(' ');

  /*
   * 🔴 로고(하마+금화)는 여기 없다 — **`AppHeader` 가 소유한다.**
   * 헤더 격자에서 로고는 브랜드 글자 줄과 메뉴 줄을 **가로지르는 트랙**(grid-area: logo)에 서야 하는데,
   * 그러려면 로고가 브랜드 슬롯 안이 아니라 격자의 직계 자식이어야 한다(2026-08-03 사용자 지시).
   * ⚠ 그래서 이 워드마크는 글자 단독이다. 여기에 그림을 되돌리면 로고가 다시 윗줄에만 걸린다.
   */
  const brandInner = (
    <BrandWordmark as={brandAs}>
      <WordmarkLead>{brandLead}</WordmarkLead>{' '}
      <WordmarkTail>{brandTailWords.join(' ')}</WordmarkTail>
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
