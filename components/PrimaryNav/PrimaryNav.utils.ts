// per-icon named import(트리셰이킹) → 엔트리에는 이 아이콘들만 실린다.
import {
  Activity,
  BookOpen,
  CalendarDays,
  CalendarRange,
  ChartPie,
  Crown,
  Flame,
  Gem,
  Landmark,
  LayoutGrid,
  LineChart,
  ListOrdered,
  Medal,
  MessageSquare,
  MessagesSquare,
  PiggyBank,
  ReceiptText,
  Scale,
  Sparkles,
  Thermometer,
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
import type { NavColumn } from './PrimaryNav.types';

/**
 * 전역 nav 의 **단일 정본**. 헤더(`PrimaryNav`)·모바일 드로어(`NavDrawer`)·사이트맵(`/sitemap`)
 * 셋이 전부 이 파일을 읽는다 — 목록을 각자 들면 화면을 더할 때 한쪽만 갱신되고 조용히 갈린다.
 *
 * ## 여정은 **칸 순서**에만 담는다 (2026-08-14 사용자 결정)
 * 일곱 칸의 순서를 사용자 여정으로 다시 세웠다:
 *
 *   ① 둘러보기(유입)          ② 허브        ③ 전환             ④ 상설
 *   외부 포트폴리오·배당 종목·시장 읽기 → 종목 탐색 → 내 자산계획 → 캘린더·커뮤니티
 *
 * 종전 순서는 관심도 추정이었다(내 것 → 남의 것 → 시장 → 시간 → 목록 → 사람 → 종목). 지금은
 * **처음 온 사람이 밟는 길**이다 — 남의 것을 구경하고, 재보고, 자기 숫자를 넣어 보고, 그다음
 * 캘린더·커뮤니티는 여정 단계가 아니라 언제든 가는 상설 구역이라 뒤에 선다.
 *
 * 🔴 **라벨은 명사 그대로다.** ①~④ 를 '둘러보기·비교하기·계산하기' 같은 동사 칸으로 만들었다가
 *    **되돌렸다**(같은 날). 두 가지가 깨졌다:
 *     ① 동사는 첫인상엔 좋지만 아는 것을 찾을 때 짐작을 막는다 — "배당킹"을 찾는 사람은
 *        '둘러보기'와 '비교하기' 중 어디를 열지 모른다. nav 가 하는 일은 **열기 전에** 어디를
 *        열지 알려주는 것인데, 명사를 판 안으로 밀어 넣으면 그 비용을 한 클릭 뒤로 미룰 뿐이다.
 *     ② 셋을 '둘러보기' 한 칸에 접으니 **그 칸만 여러 열을 가진 판**이 되어, 형제 중 하나만
 *        다르게 동작했다(사용자 신고: "다른 메뉴는 안 그런데 저것만 이상하다").
 *    그래서 여정은 순서가 말하고 이름은 목적지를 말한다. 되돌리지 마라.
 *
 * ⚠ 헤더 nav 를 실제로 반복해서 쓰는 사람은 **재방문자**다. 신규 유입 대부분은 SEO 랜딩으로
 *   직접 떨어져 헤더로 탐색하지 않는다 — 라벨은 그 재방문자 기준으로 고른다.
 *
 * 🔴 경로는 `shared/constants/routes`(의존성 0 리프)에서 온다 — 여기서 목록 데이터 폴더를 import
 * 하면 200종 가까운 종목 배열이 **엔트리 번들**에 실린다(이 모듈은 시뮬레이터 헤더를 통해 엔트리다).
 */
const n = COMMUNITY_COPY.nav;

/**
 * 외부 포트폴리오 — 넷 다 **공시로 만든 남의 보유**다.
 *
 * 순서는 사람(대가) → 기관(국민연금) → 정치인(미국 → 한국)이다. 미국·한국을 나란히 놓아야
 * "거래(미국) / 보유(한국)"라는 성격 차이가 이름만으로 눈에 들어온다.
 *
 * 🔴 2026-08-09 에 '나의 배당 포트폴리오'가 여기서 빠졌다 — 그 화면만 주어가 '나'라서 축이 달랐다.
 *    2026-08-05 에는 갤러리가 커뮤니티로 옮겨 갔다(나머지는 공시 자료, 갤러리는 사용자가 쓴 글).
 */
export const PORTFOLIO_GROUP_ITEMS = [
  { to: '/portfolio/investors', label: n.investors, Icon: Users, communityOnly: false },
  { to: '/portfolio/nps', label: n.npsPortfolio, Icon: PiggyBank, communityOnly: false },
  { to: '/portfolio/congress', label: n.congressTrades, Icon: Landmark, communityOnly: false },
  { to: '/portfolio/korea-assembly', label: n.koreaAssemblyStocks, Icon: Landmark, communityOnly: false }
] as const;

/**
 * 배당 목록 — 허브 + 목록 4종. "몇 년 연속 배당을 늘렸는가"라는 한 축이다.
 * 순서는 **비교 → 기간이 긴 순**: 허브에서 차이를 보고 50년 → 25년(지수) → 25년(전체)로 내려간다.
 * ⚠ 히든스타는 맨 끝이다 — 앞의 셋 어디에도 못 든 종목이라 순서로도 "그다음"임을 말한다.
 */
export const DIVIDEND_LIST_GROUP_ITEMS = [
  { to: DIVIDEND_LIST_HUB_PATH, label: n.dividendListHub, Icon: ListOrdered },
  { to: dividendListPath('kings'), label: n.dividendKings, Icon: Crown },
  { to: dividendListPath('aristocrats'), label: n.dividendAristocrats, Icon: Gem },
  { to: dividendListPath('champions'), label: n.dividendChampions, Icon: Medal },
  { to: dividendListPath('hiddenStars'), label: n.dividendHiddenStars, Icon: Sparkles }
] as const;

/**
 * 시장 읽기 — 시장 온도 · 히포 통계.
 * 히포 통계가 **바로 밑**인 이유: 시장 온도의 지표를 재료로 쓰는 화면이라 순서가 곧 흐름이다.
 */
export const MARKET_GROUP_ITEMS = [
  /* 온도계 — 이름이 '시장 온도'라 그림이 이름을 그대로 말한다(2026-08-09 사용자 지시). */
  { to: MARKET_PULSE_PATH, label: n.marketPulse, Icon: Thermometer },
  { to: HIPPO_STATS_PATH, label: n.hippoStats, Icon: ChartPie }
] as const;

/**
 * 종목 탐색 — ETF 소개 + 종목 비교. 소개를 읽다가 "그래서 저것과 뭐가 다른가"로 이어지는 순서다.
 * ⚠ `/ticker/category/:categoryId` 는 인덱스 라우트가 없다 — 카테고리 허브 역할은 `/ticker/all` 이 겸한다.
 */
export const TICKER_GROUP_ITEMS = [
  { to: '/ticker/all', label: n.tickers, Icon: BookOpen },
  { to: '/ticker/compare', label: n.tickerCompare, Icon: Scale }
] as const;

/**
 * 내 자산계획 — 시뮬레이터 · 나의 배당 포트폴리오 · 투자 성향 테스트 · 가계부. 넷 다 주어가 '나'다.
 * 순서는 **계획 → 지금 → 나 → 흐름**이다: 앞으로 얼마가 될지, 지금 무엇을 갖고 있는지,
 * 나는 어떤 성향인지, 매달 얼마가 들고 나는지.
 *
 * 🔴 `sheetsOnly` 는 가계부 전용 플래그다. `isGoogleSheetsEnabled` 가 false 면 `/ledger` 라우트가
 *    **존재하지 않으므로**(routes.tsx) 이 항목도 지워야 한다 — 남기면 404 로 가는 죽은 링크다.
 */
export const PERSONAL_GROUP_ITEMS = [
  { to: SIMULATOR_PATH, label: n.simulator, Icon: LineChart, sheetsOnly: false },
  { to: '/dividend/portfolio', label: n.myPortfolio, Icon: Wallet, sheetsOnly: false },
  /*
   * 🔴 **투자 성향 테스트(`/investor-type`)는 이 묶음에서 빠졌다**(2026-08-27 사용자 지시).
   *
   * 여기 있던 이유는 GA4 실측이었다 — 랜딩(`/`)에 닿는 세션이 28일간 5건뿐이라 그 화면의 수준
   * 4갈래만으로는 테스트가 노출될 길이 없었고, 내비는 모든 화면에 있어서 유일하게 실효가 있는
   * 자리였다. 그 근거가 2026-08-27 에 **바뀌었다**: 첫 화면이 목표 여섯으로 교체되면서 목표 카드
   * 바로 아래에 "나의 투자 성향 테스트" 카드가 생겼다(`pages/Home`). 이제 노출 경로가 있고,
   * 그 자리가 이 항목의 청중("아직 잘 모르는 사람")과 정확히 겹친다.
   *
   * ⚠ 라우트·사이트맵·정적 셸은 **그대로 있다** — 내비에서 뺀 것뿐이라 주소는 살아 있다.
   * ⚠ 되살리려면 `INVESTOR_TYPE_PATH` import 도 함께 되살려야 한다(지금은 쓰지 않아 지웠다).
   */
  { to: '/ledger', label: n.ledger, Icon: ReceiptText, sheetsOnly: true }
] as const;

/**
 * 캘린더 — 배당 캘린더 + 미국 증시 캘린더. 둘 다 "언제"를 묻는 한 축이다.
 * 순서는 **내 것 → 시장 것**: 내가 고른 종목의 지급일, 그다음 시장 전체의 개폐장·발표 일정.
 */
export const CALENDAR_GROUP_ITEMS = [
  { to: '/dividend/calendar', label: n.dividendCalendar, Icon: CalendarDays },
  { to: '/market/us-calendar', label: n.marketCalendar, Icon: CalendarRange }
] as const;

/**
 * 커뮤니티 — 갤러리 · 게시판 · 파이어족들. 셋 다 **사람이 만든 것**이다.
 *
 * 🔴 순서는 갤러리가 1번이다(사용자 지시) — 이 앱의 얼굴에 가까운 콘텐츠다.
 * ⚠ 묶음 아이콘은 말풍선 **둘**(MessagesSquare), 자식 게시판은 말풍선 **하나**(MessageSquare)다.
 *   2026-08-05 에 둘이 같은 글리프라 부모·자식이 같은 것으로 읽힌다는 지적을 받고 갈랐다.
 * 🔴 파이어족들은 보기는 누구나·쓰기는 운영자만이고, 그 제한은 화면이 아니라 DB 가 건다 —
 *    그래서 이 항목을 `isAdmin` 조건부로 두지 않는다(nav 가 라우트마다 달라진다).
 */
export const COMMUNITY_GROUP_ITEMS = [
  { to: '/community/portfolio', label: n.gallery, Icon: LayoutGrid },
  { to: '/community/board', label: n.board, Icon: MessageSquare },
  { to: '/community/firenow', label: n.fire, Icon: Flame }
] as const;

/**
 * 지금 배포에서 실제로 보일 nav 트리를 만든다.
 *
 * 🔴 **함수여야 한다 — 모듈 상수가 아니다.** env 플래그(`isCommunityEnabled`·`isGoogleSheetsEnabled`)를
 *    호출 시점에 읽어야 테스트가 플래그를 바꿔 가며 두 배포 상태를 모두 검증할 수 있다
 *    (모듈 로드 시점에 굳히면 첫 테스트의 값이 파일 전체에 새 버린다).
 * ⚠ 꺼진 배포에서는 라우트 자체가 없다 — 항목을 남기면 404 로 가는 죽은 링크다.
 */
export function buildNavTree(): readonly NavColumn[] {
  const personalItems = PERSONAL_GROUP_ITEMS.filter((item) => !item.sheetsOnly || isGoogleSheetsEnabled);
  const portfolioItems = PORTFOLIO_GROUP_ITEMS.filter((item) => !item.communityOnly || isCommunityEnabled);

  return [
    /* ── ① 유입: 남의 것을 구경하는 자리 셋. 처음 온 사람이 가장 먼저 닿는 칸들이다. ── */
    /* 사람들(Users): 이 묶음의 공통점은 "누구의 것인가"다(지갑은 아래 개인 묶음이 가져갔다). */
    { label: n.portfolioGroup, Icon: Users, items: portfolioItems },
    /* 트로피: "몇 년 연속 배당을 늘렸는가"라는 축을 그림 하나가 말한다. */
    { label: n.dividendListGroup, Icon: Trophy, items: DIVIDEND_LIST_GROUP_ITEMS },
    /* 파형(Activity): 이 묶음이 재는 것은 시장의 흔들림이다 — 캘린더·트로피·책과 뜻이 겹치지 않는다.
       ⚠ 온도계는 **묶음이 아니라 그 안의 '시장 온도' 항목**이 쓴다(2026-08-09 사용자 정정). */
    { label: n.marketGroup, Icon: Activity, items: MARKET_GROUP_ITEMS },

    /* ── ② 허브: 구경하다 눈에 든 종목을 여기서 재고 고른다. ── */
    /* 책(BookOpen): 종전 'ETF 소개'의 아이콘을 묶음이 물려받았다 — 사용자가 익힌 그림을 그대로 둔다. */
    { label: n.tickerGroup, Icon: BookOpen, items: TICKER_GROUP_ITEMS },

    /* ── ③ 전환: 자기 숫자를 넣어 보는 자리. ── */
    /* 지갑(Wallet): 셋 다 "내 돈"이 주어라 가장 곧은 그림이다. */
    { label: n.personalGroup, Icon: Wallet, items: personalItems },

    /* ── ④ 상설: 여정 단계가 아니라 언제든 가는 구역이라 뒤에 선다. ── */
    { label: n.calendarGroup, Icon: CalendarDays, items: CALENDAR_GROUP_ITEMS },
    /* 🔴 커뮤니티가 꺼진 배포에서는 **칸째 사라진다**(자식 셋이 전부 커뮤니티 전용이다).
       별도 칸이라 사라져도 나머지 여섯은 그대로다 — 다른 칸에 섞여 있었다면 그 칸이 조용히 쪼그라든다.
       ⚠ 묶음 아이콘은 말풍선 **둘**, 자식 게시판은 말풍선 **하나**다(COMMUNITY_GROUP_ITEMS 주석). */
    ...(isCommunityEnabled
      ? [{ label: n.communityGroup, Icon: MessagesSquare, items: COMMUNITY_GROUP_ITEMS }]
      : [])
  ];
}

/** 활성 판정 — 그 경로이거나 그 하위 경로면 켠다(상세·글쓰기에서도 자기 섹션이 활성으로 남는다). */
export function isNavPathActive(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`);
}
