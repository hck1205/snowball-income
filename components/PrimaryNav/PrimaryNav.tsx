import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useInRouterContext, useLocation } from 'react-router-dom';
// per-icon named import(트리셰이킹) → 엔트리에는 이 아이콘들만 실린다(CommunityNavLink·ThemePresetSwitcher와 동일 패턴).
import {
  Activity,
  BookOpen,
  ChartPie,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  Crown,
  Gem,
  Landmark,
  LayoutGrid,
  LineChart,
  ListOrdered,
  Sparkles,
  Medal,
  Thermometer,
  MessageSquare,
  MessagesSquare,
  PiggyBank,
  ReceiptText,
  Scale,
  Trophy,
  Users,
  Wallet
} from 'lucide-react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { DIVIDEND_LIST_HUB_PATH, SIMULATOR_PATH, dividendListPath } from '@/shared/constants/routes';
/* 경로 문자열만 가져온다 — 페이지 모듈이 아니라 상수 파일이라 엔트리 번들이 커지지 않는다. */
import { MARKET_PULSE_PATH } from '@/pages/MarketPulse/marketPulseRoute';
import { HIPPO_STATS_PATH } from '@/pages/HippoStats/hippoStatsRoute';
import { isGoogleSheetsEnabled } from '@/shared/lib/googleSheets';
import { isCommunityEnabled } from '@/shared/lib/supabase';
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
/*
 * 🔴 2026-08-09 에 **'나의 배당 포트폴리오'가 여기서 빠졌다**(사용자 결정). 그 화면만 주어가
 *    '나'라서, 남은 넷(공시로 만든 남의 자료)과 축이 달랐다 — 묶음 이름이 '외부 포트폴리오'가
 *    된 것도 그래서다. 내 포트폴리오는 `PERSONAL_GROUP_ITEMS` 로 옮겼다.
 */
export const PORTFOLIO_GROUP_ITEMS = [
  { to: '/portfolio/investors', label: n.investors, Icon: Users, communityOnly: false },
  /* 2026-08-04 합류. 셋 다 "누구의 포트폴리오인가"라는 한 축이라 같은 묶음에 선다 —
     사람(대가) → 기관(국민연금) → 정치인(하원). 순서는 익숙한 것에서 낯선 것으로. */
  { to: '/portfolio/nps', label: n.npsPortfolio, Icon: PiggyBank, communityOnly: false },
  { to: '/portfolio/congress', label: n.congressTrades, Icon: Landmark, communityOnly: false },
  /* 2026-08-05 합류. 미국 화면 바로 뒤에 둔다 — 같은 '정치인' 축이고, 둘을 나란히 놓아야
     "거래(미국) / 보유(한국)"라는 성격 차이가 이름만으로도 눈에 들어온다. */
  { to: '/portfolio/korea-assembly', label: n.koreaAssemblyStocks, Icon: Landmark, communityOnly: false },
  /*
   * 🔴 갤러리는 2026-08-05 에 **커뮤니티 묶음으로 옮겼다**(사용자 지시). 2026-08-02 에는 "포트폴리오를
   * 보는 곳이 한 군데인 편이 낫다"는 이유로 여기 들어왔지만, 그 뒤 이 묶음이 다섯으로 불어나면서
   * 축이 갈렸다 — 나머지 넷은 **공시로 만든 자료**이고 갤러리는 **사용자가 쓴 글**이다.
   * 성격이 다른 하나가 섞여 있으면 묶음 이름이 무엇을 뜻하는지 흐려진다.
   */
] as const;

/**
 * 캘린더 묶음 — 배당 캘린더 + 미국 증시 캘린더(2026-08-04 신설).
 *
 * 왜 묶는가: 증시 캘린더가 **아홉 번째** nav 항목이 될 뻔했다(상한 8). 배당 캘린더는 이미 윗줄에
 * 혼자 서 있었고, 두 화면 다 "언제"를 묻는 한 축이라 묶는 값이 가장 컸다 — 묶어서 8을 지켰다.
 *
 * 순서는 **내 것 → 시장 것**이다. 배당 캘린더는 내가 고른 종목의 지급일이고, 증시 캘린더는
 * 시장 전체의 개폐장·발표 일정이다.
 */
/**
 * 개인 묶음이 품는 목적지 — 시뮬레이터 · 나의 배당 포트폴리오 · 가계부(2026-08-09 사용자 결정).
 *
 * 순서는 **계획 → 지금 → 흐름**이다: 앞으로 얼마가 될지(시뮬레이터), 지금 무엇을 갖고 있는지
 * (포트폴리오), 매달 얼마가 들고 나는지(가계부).
 *
 * 🔴 `sheetsOnly` 는 가계부 전용 플래그다. `isGoogleSheetsEnabled` 가 false 면 `/ledger` 라우트가
 *    **존재하지 않으므로**(routes.tsx) 이 항목도 지워야 한다 — 남기면 404 로 가는 죽은 링크다.
 *    `communityOnly` 가 갤러리에 하던 일과 같은 처방이다.
 */
export const PERSONAL_GROUP_ITEMS = [
  { to: SIMULATOR_PATH, label: n.simulator, Icon: LineChart, sheetsOnly: false },
  { to: '/dividend/portfolio', label: n.myPortfolio, Icon: Wallet, sheetsOnly: false },
  { to: '/ledger', label: n.ledger, Icon: ReceiptText, sheetsOnly: true }
] as const;

/**
 * 종목 묶음이 품는 목적지 — ETF 소개 + 종목 비교(2026-08-09 사용자 결정).
 * 소개를 읽다가 "그래서 저것과 뭐가 다른가"로 이어지는 순서라 비교가 뒤에 선다.
 */
export const TICKER_GROUP_ITEMS = [
  { to: '/ticker/all', label: n.tickers, Icon: BookOpen },
  { to: '/ticker/compare', label: n.tickerCompare, Icon: Scale }
] as const;

/**
 * 시장 묶음이 품는 목적지 — 지금은 시장 온도 하나다(2026-08-09 신설).
 *
 * ⚠ 자식이 하나뿐인 묶음을 만든 이유: 여기에 곧 둘이 더 붙는다. 단독 칸으로 올렸다가 다시
 *   접으면 사용자가 익힌 위치가 두 번 바뀐다 — 자리를 미리 잡아 두는 편이 낫다.
 */
export const MARKET_GROUP_ITEMS = [
  /* 온도계 — 이름이 '시장 온도'라 그림이 이름을 그대로 말한다(2026-08-09 사용자 지시). */
  { to: MARKET_PULSE_PATH, label: n.marketPulse, Icon: Thermometer },
  /* 히포 통계 — 시장 온도 **바로 밑**이다. 그 화면의 지표를 재료로 쓰는 화면이라 순서가 곧 흐름이다. */
  { to: HIPPO_STATS_PATH, label: n.hippoStats, Icon: ChartPie }
] as const;

export const CALENDAR_GROUP_ITEMS = [
  { to: '/dividend/calendar', label: n.dividendCalendar, Icon: CalendarDays },
  { to: '/market/us-calendar', label: n.marketCalendar, Icon: CalendarRange }
] as const;

/**
 * 배당 목록 묶음이 품는 목적지 — 허브 + 목록 3종.
 *
 * 왜 묶는가: 목록 셋을 nav 에 각각 올리면 항목이 8 → 11개가 되어 **상한(8)을 넘는다**(아래
 * `NavLinkItems` 의 종목 비교 주석이 그 상한을 못 박았고, 2026-08-02 에 포트폴리오 3종이 같은 이유로
 * 접혔다). 세 목록은 "몇 년 연속 배당을 늘렸는가"라는 **한 축**이라 묶는 값이 가장 크다.
 *
 * 순서는 **넓은 것 → 좁은 것**이 아니라 **비교 → 기간이 긴 순**이다: 허브에서 차이를 보고,
 * 그다음 50년 → 25년(지수) → 25년(전체)로 내려간다.
 *
 * 🔴 경로는 `shared/constants/routes`(의존성 0 리프)에서 온다 — 여기서 목록 데이터 폴더를 import 하면
 * 200종 가까운 종목 배열이 **엔트리 번들**에 실린다(이 컴포넌트는 시뮬레이터 헤더를 통해 엔트리다).
 */
export const DIVIDEND_LIST_GROUP_ITEMS = [
  { to: DIVIDEND_LIST_HUB_PATH, label: n.dividendListHub, Icon: ListOrdered },
  { to: dividendListPath('kings'), label: n.dividendKings, Icon: Crown },
  { to: dividendListPath('aristocrats'), label: n.dividendAristocrats, Icon: Gem },
  { to: dividendListPath('champions'), label: n.dividendChampions, Icon: Medal },
  /*
   * 배당 히든스타(2026-08-08 신설) — **맨 끝**이다. 앞의 셋은 기간이 긴 순(50년 → 25년)이고
   * 이것은 그 셋 어디에도 못 든 종목이라, 순서로도 "그다음"임을 말한다.
   * ⚠ 글리프는 왕관·보석·메달과 결이 다르다 — 저 셋은 수여받은 지위이고 이건 아니다.
   */
  { to: dividendListPath('hiddenStars'), label: n.dividendHiddenStars, Icon: Sparkles }
] as const;

/**
 * 커뮤니티 묶음 — 배당계산 갤러리 + 게시판(2026-08-05 신설, 사용자 지시).
 *
 * 왜 묶는가: 포트폴리오 묶음이 다섯으로 불어나면서 그 안의 갤러리만 성격이 달랐다(나머지는 공시
 * 자료, 갤러리는 사용자 글). 갤러리를 게시판 옆으로 옮기면 **"사람이 쓴 것"이 한 칸에 모인다.**
 * 윗줄 항목 수는 그대로다 — 게시판이 단독 항목에서 이 묶음 안으로 들어가고 묶음이 그 자리를 받는다.
 *
 * 🔴 순서는 **갤러리가 1번**이다(사용자 지시). 갤러리가 이 앱의 얼굴에 가까운 콘텐츠이고,
 * 게시판은 그다음이다.
 *
 * ⚠ 묶음 아이콘은 말풍선 **둘**(MessagesSquare), 자식 게시판은 말풍선 **하나**(MessageSquare)다 —
 *   2026-08-05 에 둘이 같은 글리프라 부모·자식이 같은 것으로 읽힌다는 지적을 받고 갈랐다.
 */
export const COMMUNITY_GROUP_ITEMS = [
  { to: '/community/portfolio', label: n.gallery, Icon: LayoutGrid },
  { to: '/community/board', label: n.board, Icon: MessageSquare }
  /*
   * 🔴 미디어 뉴스는 **일부러 빠져 있다** (2026-08-08 사용자 결정으로 임시 비공개).
   *   되돌릴 때는 아래 한 줄을 되살리고 `COMMUNITY_NEWS_PUBLIC` 을 true 로 바꾼다. 둘은 짝이다.
   *     { to: '/community/news', label: n.news, Icon: Newspaper }
   *   (`Newspaper` 는 위 lucide import 에서도 함께 빼 뒀다 — noUnusedLocals 가 켜져 있어 남겨 둘 수 없다.
   *    되살릴 때 import 도 같이 되살려라. 카피 `n.news` 는 그대로 있다.)
   *   (셋 다 커뮤니티 묶음 안이라 nav 상한 8칸에는 영향이 없다 — 자리는 비워 둔 것이지 없앤 게 아니다.)
   *
   * ⚠ 왜 `isAdmin` 조건부로 두지 않았나: 이 nav 는 **전 라우트 공용 헤더**인데
   *   `profileAtom` 은 `CommunityAuthProvider`(= /community 라우트 안)에서만 채워진다. 조건부로 두면
   *   운영자에게도 커뮤니티 밖에서는 안 보이고 커뮤니티 안에서만 나타나 — 라우트마다 nav 가 바뀐다.
   *   그 어긋남보다 "주소로 들어간다"가 낫다. 운영자 진입: /community/news
   */
] as const;

/**
 * 묶음 메뉴 한 벌 — nav 한 칸에 목적지 여럿을 접는다.
 *
 * 왜 묶는가: nav 항목이 8개에 닿아 "더 늘릴 거면 접기·묶기를 먼저 설계하라"고 못 박아 뒀는데
 * (`NavLinkItems` 의 종목 비교 주석), 대가들의 포트폴리오가 아홉 번째였다. 내 포트폴리오와
 * 대가들의 포트폴리오는 **"누구의 포트폴리오인가"라는 한 축**이라 묶는 값이 가장 크다
 * (2026-08-02 사용자 결정 — 헤더는 2단 그대로, 묶음만 도입).
 *
 * ⚠ 2026-08-04 에 배당 목록 묶음이 **두 번째 소비처**가 되면서 파라미터화했다. 개폐·포털·포커스
 *   복귀 로직을 두 벌로 복제하면 한쪽만 고쳐지는 자리가 된다(이 레포가 헤더 4벌·드로어 3벌로
 *   겪은 그 사고다). 바뀐 것은 **소유자뿐이고 동작·마크업·ARIA 는 그대로**다.
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
type NavGroupItem = {
  to: string;
  label: string;
  Icon: typeof Wallet;
};

type NavGroupMenuProps = {
  label: string;
  /** 트리거 왼쪽 글리프. 묶음이 무엇인지 한 눈에 말한다. */
  Icon: typeof Wallet;
  items: readonly NavGroupItem[];
};

function NavGroupMenu({ label, Icon: TriggerIcon, items }: NavGroupMenuProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

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
        <TriggerIcon size={16} strokeWidth={1.8} aria-hidden focusable={false} />
        <NavLabel>{label}</NavLabel>
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
 *   [워드마크 "Hungry Hippo"] → `<Link to="/">`(홈)  +  라우트 링크: 시뮬레이터(/simulator)·갤러리(/community)·게시판(/community/board)
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
 * 윗줄 항목 수는 **8개**다(두 env 플래그가 다 켜진 배포 기준). 2026-08-02 에 대가들의 포트폴리오가
 * 아홉 번째가 될 뻔했는데, 포트폴리오 3종(내 배당 포트폴리오·대가들의 포트폴리오·갤러리)을
 * 한 칸으로 **묶어**(`NavGroupMenu`) 오히려 한 칸 줄었다. 2026-08-04 에 배당 목록 4종(허브 + 킹·귀족·
 * 챔피언)이 같은 방식으로 한 칸을 차지해 8개가 됐다 — **여기가 상한이다.** 아홉 번째가 필요하면
 * 새 칸이 아니라 또 하나의 묶음을 만들어라.
 * 갤러리(`/community/portfolio`)·게시판(`/community/board`)은 **`end` 없음**: 상세(`/portfolio/:id`)·
 * 글쓰기(`/portfolio/write`)·수정(`/portfolio/:id/edit`) 같은 하위 경로에서도 자기 섹션 탭이 활성으로 남는다
 * (routes.tsx의 자식 라우트 참고). 두 섹션은 형제 세그먼트라 서로를 활성화하지 않는다.
 */
/** 라우트 링크 목록 — 윗줄(브랜드 옆)과 아랫줄(전용 스크롤 줄)이 공유하는 단일 정본. */
const NavLinkItems = () => (
  <>
    {/*
      ── 2026-08-09 대개편(사용자 결정) ────────────────────────────────────────────
      종전 8칸: 시뮬레이터 · 포트폴리오 · 가계부 · 캘린더 · 배당 종목 · 커뮤니티 · ETF 소개 · 종목 비교
      지금 7칸: 내 자산계획 · 외부 포트폴리오 · 시장 읽기 · 캘린더 · 배당 종목 · 커뮤니티 · 종목 탐색

      무엇이 바뀌었나:
       ① **주어로 갈랐다.** 시뮬레이터·내 포트폴리오·가계부는 주어가 '나'라서 한 묶음(내 자산계획)이
          되고, 남은 넷(대가·국민연금·미국 의원·한국 의원)은 전부 **남의 공시 자료**라 '외부
          포트폴리오'가 됐다. 종전에는 내 것과 남의 것이 한 묶음에 섞여 있어 이름이 무엇을
          뜻하는지 흐렸다.
       ② ETF 소개 + 종목 비교를 '종목 탐색'으로 접어 한 칸을 돌려받았다.
       ③ 그 자리에 '시장 읽기'가 들어갔다.

      🔴 상한은 여전히 8칸이다. 8번째가 필요하면 새 칸이 아니라 또 하나의 묶음을 만들어라.
      ⚠ 순서 = 예상 관심도. 내 데이터 → 남의 데이터 → 시장 전체 → 시간(캘린더) → 목록 → 사람 → 종목.
    */}
    {/* 내 자산계획 — 시뮬레이터 · 나의 배당 포트폴리오 · 가계부.
        아이콘은 지갑(Wallet): 셋 다 "내 돈"이 주어라 가장 곧은 그림이다.
        🔴 가계부는 `isGoogleSheetsEnabled` 가 꺼진 배포에서 라우트 자체가 없다 — 항목도 함께 지운다. */}
    <NavGroupMenu
      label={n.personalGroup}
      Icon={Wallet}
      items={PERSONAL_GROUP_ITEMS.filter((item) => !item.sheetsOnly || isGoogleSheetsEnabled)}
    />
    {/* 외부 포트폴리오 — 대가들 · 국민연금 · 미국 의원 · 한국 의원. 넷 다 공시에서 나온 남의 보유다.
        아이콘은 사람들(Users): 지갑은 위 개인 묶음이 가져갔고, 이 묶음의 공통점은 "누구의 것인가"다. */}
    <NavGroupMenu
      label={n.portfolioGroup}
      Icon={Users}
      /* 커뮤니티가 꺼진 배포에선 커뮤니티 전용 항목이 빠진다(지금은 해당 항목이 없지만 계약은 남긴다). */
      items={PORTFOLIO_GROUP_ITEMS.filter((item) => !item.communityOnly || isCommunityEnabled)}
    />
    {/* 시장 읽기 — 지금은 시장 온도 하나. 아이콘은 파형(Activity): 묶음이 재는 것이
        시장의 흔들림이라, 캘린더·트로피·책과 뜻이 겹치지 않는다.
        ⚠ 온도계는 **묶음이 아니라 그 안의 '시장 온도' 항목**이 쓴다(2026-08-09 사용자 정정) —
          묶음에는 곧 다른 화면이 붙으므로 이름 하나에 그림을 맞추면 안 된다. */}
    <NavGroupMenu label={n.marketGroup} Icon={Activity} items={MARKET_GROUP_ITEMS} />
    {/* 캘린더 묶음 — 배당 캘린더 + 미국 증시 캘린더(2026-08-04). */}
    <NavGroupMenu label={n.calendarGroup} Icon={CalendarDays} items={CALENDAR_GROUP_ITEMS} />
    {/* 배당 목록 묶음 — 허브 + 배당킹·귀족·챔피언·히든스타. "몇 년 연속 배당을 늘렸는가"라는 한 축. */}
    <NavGroupMenu label={n.dividendListGroup} Icon={Trophy} items={DIVIDEND_LIST_GROUP_ITEMS} />
    {/* 커뮤니티 묶음(2026-08-05) — 배당계산 갤러리 + 게시판. 둘 다 **사용자가 쓴 것**이라 한 축이다.
        🔴 커뮤니티가 꺼진 배포에서는 묶음째 사라진다(안에 든 두 목적지가 모두 커뮤니티 전용이다). */}
    {isCommunityEnabled ? (
      <NavGroupMenu label={n.communityGroup} Icon={MessagesSquare} items={COMMUNITY_GROUP_ITEMS} />
    ) : null}
    {/* 종목 탐색 — ETF 소개 + 종목 비교(2026-08-09). 아이콘은 책(BookOpen): 종전 ETF 소개의
        아이콘을 묶음이 물려받았다 — 사용자가 익힌 그림을 그대로 둔다. */}
    <NavGroupMenu label={n.tickerGroup} Icon={BookOpen} items={TICKER_GROUP_ITEMS} />
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
