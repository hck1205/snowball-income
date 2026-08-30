import { lazy, Suspense, useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { ScrollTopButton } from '@/components/common';
import { RouteError } from './RouteError';
import { MainPage } from '@/pages';
import {
  isCommunityEnabled,
  isKakaoCustomAuthEnabled,
  isNaverEnabled,
  KAKAO_CALLBACK_PATH,
  NAVER_CALLBACK_PATH
} from '@/shared/lib/supabase';
import { isGoogleSheetsEnabled } from '@/shared/lib/googleSheets';
import { applySeoRuntimeMetadata, sendPageView } from '@/shared/lib/analytics';
import { syncFaqStructuredData } from '@/shared/lib/seo';
import { usePageHue } from '@/shared/hooks';
import { COMMUNITY_COPY } from '@/shared/constants/community';
/*
 * 🔴 배당 목록의 **경로만** 가져온다(`shared/constants/routes` = 의존성 0 리프). 목록 폴더
 * (`shared/constants/dividendLists`)를 여기서 import 하면 200종 가까운 종목 데이터가 엔트리 번들에
 * 실려 아래 lazy 격리가 그 자리에서 무효가 된다.
 */
import { ABOUT_PATH,
  INVESTOR_TYPE_PATH,
  DIVIDEND_LIST_HUB_PATH,
  DIVIDEND_LIST_IDS,
  SIMULATOR_PATH,
  dividendListPath
} from '@/shared/constants/routes';


/**
 * 모든 라우트를 덮는 **상시 마운트 레이아웃**. 라우트가 바뀔 때마다 일어나야 하는 문서 수준
 * 부수효과를 여기 한 곳에 모은다 — 페이지가 각자 하면 lazy 청크가 뜨기 전 한 박자가 비고,
 * 히어로가 없는 화면(커뮤니티)은 아예 빠진다.
 *
 *  - SEO 런타임 메타데이터 + GA4 page_view
 *  - 페이지 정체성 hue(`--sb-page-hue`) — `shared/hooks/usePageHue` 참고
 *  - 랜딩 전용 `FAQPage` JSON-LD 의 부착/제거 — `shared/lib/seo/faqStructuredData.ts` 참고
 */
function RootLayout() {
  const location = useLocation();
  const topAnchorRef = useRef<HTMLDivElement>(null);

  usePageHue();

  useEffect(() => {
    const page = {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash
    };

    applySeoRuntimeMetadata(page);
    // 🔴 페이지 수준 마크업을 전 라우트가 공유하는 셸에서 떼어 내는 **유일한 지점**.
    //    되돌리려면 이 한 줄만 지운다(그 함수 주석의 근거·되돌리기 조건 참고).
    syncFaqStructuredData(location.pathname);

    const raf = window.requestAnimationFrame(() => {
      sendPageView(page);
    });

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [location.hash, location.pathname, location.search]);

  /*
   * 🔴 **라우트가 바뀌면 문서 맨 위에서 시작한다.** react-router 는 스크롤을 스스로 건드리지 않아서,
   * 페이지 중간의 링크(티커 상세의 "함께 비교하면 좋은 티커" 등)를 누르면 **새 페이지가 그 스크롤
   * 위치 그대로** 열린다 — 사용자에게는 "가운데부터 시작하는 화면"으로 보인다.
   *
   * ⚠ 세 가지를 일부러 좁혔다.
   *  1) **`pathname` 이 바뀔 때만** 한다. 쿼리·해시만 바뀌는 것은 같은 화면 안의 상태 변화라
   *     (종목 비교의 `?t=`, 캘린더의 월 이동) 그때 위로 튀면 방금 누른 자리를 잃는다.
   *  2) **해시가 있으면 하지 않는다.** 티커 허브의 카테고리 바로가기(`#id`)가 앵커로 이동하는데
   *     여기서 0 으로 덮으면 그 기능이 죽는다.
   *  3) `behavior: 'auto'`(즉시). 라우트 전환에 부드러운 스크롤을 얹으면 새 화면이 그려지는 동안
   *     화면이 흐르고, reduced-motion 사용자에게는 그 자체가 위반이다.
   */
  useEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.hash]);

  /*
   * 🔴 **"맨 위로"는 전 라우트가 공유한다**(2026-08-06 사용자 지시: 모든 페이지에 붙여 달라).
   * 종전에는 랜딩과 커뮤니티 상세 두 곳이 각자 렌더했는데, 긴 화면은 그 둘만이 아니다
   * (티커 상세·배당 목록·가이드·국민연금 전부 스크롤이 길다). 셸이 한 번 그리면 화면마다
   * 붙이는 것을 잊을 일이 없다.
   *
   * ⚠ 버튼은 이동 뒤 스스로 사라지므로 **포커스를 넘길 곳**이 필요하다(그 부품이 prop 으로 강제한다).
   *   라우트마다 제목의 자리가 달라서 셸에서는 문서 맨 위의 빈 앵커를 쓴다 — 화면에 아무것도
   *   그리지 않지만 `tabIndex={-1}` 이라 포커스는 받는다.
   */
  return (
    <>
      <div ref={topAnchorRef} tabIndex={-1} />
      <Outlet />
      <ScrollTopButton focusRef={topAnchorRef} />
    </>
  );
}

/**
 * 커뮤니티 라우트 — 전부 `React.lazy`.
 *
 * supabase-js/Tiptap/dompurify는 이 lazy 청크 안에서만 로드된다(엔트리 보호).
 * 레이아웃(`CommunityLayout`)이 자식 Outlet을 Suspense로 감싸므로 자식 페이지는 별도 Suspense가 필요 없다.
 * `isCommunityEnabled`가 false면 배열이 비어 라우트가 존재하지 않고, 아래 `*` 리다이렉트가 처리한다.
 */
/**
 * 티커 SEO 랜딩 — `React.lazy`로 격리한다.
 *
 * 티커 콘텐츠(`shared/constants/tickers`의 한국어 서사·FAQ)는 이 lazy 청크 안에서만 import되어야
 * 엔트리 번들에 실리지 않는다(decisions.md "티커 SEO 콘텐츠" 격리 관례). `/ticker/all`을
 * `:name`보다 먼저 등록해 정적 세그먼트가 파라미터보다 우선 매칭되게 한다.
 */
const TickerHubPage = lazy(() => import('@/pages/Ticker/TickerHubPage'));
/* 카테고리 허브(`/ticker/category/:categoryId`) — 허브와 개별 티커 사이의 중간 계층(토픽 클러스터). */
const TickerCategoryPage = lazy(() => import('@/pages/Ticker/TickerCategoryPage'));
const TickerDetailPage = lazy(() => import('@/pages/Ticker/TickerDetailPage'));
/* 종목 비교. `:name` 보다 먼저 등록해야 `/ticker/compare` 가 티커 이름으로 먹히지 않는다. */
const TickerComparePage = lazy(() => import('@/pages/Ticker/TickerComparePage'));
/* 대가들의 포트폴리오 — 커밋된 13F 스냅샷을 읽는 정적 화면이라 조회가 없다. */
const InvestorsPage = lazy(() => import('@/pages/Investors/InvestorsPage'));

/**
 * `/portfolio/` 아래 두 자매 화면(2026-08-04 신설) — **대가들의 포트폴리오와 같은 축**이다.
 * "누구의 포트폴리오인가"라는 질문에 사람(대가)·기관(국민연금)·정치인(하원)이 각각 답한다.
 *
 * 셋 다 커밋된 스냅샷을 읽는 정적 화면이라 조회가 없고, 각자 `lazy` 로 격리한다 —
 * 배럴(`@/pages/Congress`)이 아니라 페이지 폴더를 직접 import 하는 이유는 배당 목록과 같다:
 * 배럴을 lazy 하면 한 화면만 열어도 형제 화면의 데이터·문구까지 내려받는다.
 * 두 스냅샷은 각각 40KB·70KB 라 엔트리에 실리면 그대로 첫인상 비용이 된다.
 */
const CongressPage = lazy(() => import('@/pages/Congress/CongressPage'));
const KoreaAssemblyPage = lazy(() => import('@/pages/KoreaAssembly/KoreaAssemblyPage'));
const NpsPage = lazy(() => import('@/pages/Nps/NpsPage'));
/**
 * 검색어 랜딩(`/guide/:slug`). 콘텐츠가 문자열뿐이라 가벼운데도 lazy 로 두는 이유는 **첫 화면 비용**
 * 때문이다 — 시뮬레이터로 들어온 사람에게 가이드 본문을 실어 줄 이유가 없다.
 */
const GuidePage = lazy(() => import('@/pages/Guide/GuidePage'));
/**
 * 투자 성향 테스트. 랜딩 4갈래 중 **중급자**가 도착하는 유일한 신규 화면이다(2026-08-17).
 * 문항과 결과가 같은 라우트를 쓴다 — 결과는 쿼리(`?t=…&s=…`)에 실린다(그 이유는 화면 파일 머리말).
 */
const InvestorTypePage = lazy(() => import('@/pages/InvestorType/InvestorTypePage/InvestorTypePage'));

/**
 * 미국 증시 캘린더(`/market/us-calendar`) — 배당 캘린더와 같은 `lazy` 격리.
 *
 * 🔴 `/dividend/calendar` 밑에 두지 않은 이유: 그 화면은 **내가 고른 종목의 배당 지급일**을 그리고,
 * 이 화면은 **시장 전체의 개폐장·발표 일정**을 그린다. 축이 달라서 주소도 갈랐다.
 */
const MarketCalendarPage = lazy(() => import('@/pages/MarketCalendar/MarketCalendarPage'));

/**
 * 시장 온도(`/market/pulse`) — 미국 증시 캘린더와 같은 `/market/` 축, 같은 `lazy` 격리.
 *
 * ⚠ 이 화면은 마운트 즉시 `/api/market-pulse` 를 부른다. 엔트리 번들에 들어가면 시뮬레이터로
 *   들어온 사람도 그 코드를 받는다 — lazy 를 풀지 마라.
 */
const MarketPulsePage = lazy(() => import('@/pages/MarketPulse/MarketPulsePage'));

/** 히포 통계(`/market/stats`) — 시장 온도와 같은 `/market/` 축, 같은 `lazy` 격리. */
const HippoStatsPage = lazy(() => import('@/pages/HippoStats/HippoStatsPage'));

/**
 * 배당 지급 월 캘린더 — 티커 랜딩과 같은 `lazy` 격리.
 *
 * 시뮬레이터를 거치지 않는 독립 도구라 엔트리에 실을 이유가 없다. `PrimaryNav` 링크와 사이트맵
 * 등록은 노출 결정 전까지 하지 않는다(주소를 아는 사람만 들어오는 상태).
 */
const DividendCalendarPage = lazy(() => import('@/pages/DividendCalendar/DividendCalendarPage'));

/**
 * 내 포트폴리오(`/dividend/portfolio`) — 배당 캘린더와 같은 `lazy` 격리.
 *
 * 보유 목록은 자기 저장소(IndexedDB `snowball-portfolio`)에만 있고 시뮬레이터 상태와 겹치지 않는다.
 * PrimaryNav 에는 경로 문자열과 아이콘만 추가되므로 이 lazy 경계가 유지된다.
 */
const PortfolioPage = lazy(() => import('@/pages/Portfolio/PortfolioPage'));

/**
 * 배당 연속 증배 목록(`/dividend/lists` 허브 + 배당킹·배당귀족·배당챔피언 3종) — 배당 캘린더와 같은
 * `lazy` 격리다. 커밋된 목록 데이터를 읽는 정적 화면이라 조회가 없다.
 *
 * 🔴 **배럴(`@/pages/DividendList`)이 아니라 각 페이지 폴더를 직접** import 한다. 배럴을 lazy 하면
 * 허브와 목록이 한 청크로 묶여 허브만 열어도 목록 셋의 문구·데이터를 전부 내려받는다(법무 문서 두
 * 벌이 같은 이유로 폴더 직접 import 를 쓴다).
 *
 * 목록 3종은 **같은 컴포넌트**가 그린다 — 차이가 데이터와 문구뿐이라 `listId` prop 하나로 갈린다.
 * 경로는 `/dividend/calendar`·`/dividend/portfolio` 와 같은 depth 를 지킨다.
 */
const DividendListHubPage = lazy(() => import('@/pages/DividendList/DividendListHubPage'));
const DividendListPage = lazy(() => import('@/pages/DividendList/DividendListPage'));

/**
 * 404 — 어떤 라우트에도 맞지 않는 주소(`*`).
 *
 * 예전에는 이 자리가 `<Navigate to="/" replace />` 라 **잘못된 주소가 조용히 홈으로 갔다**. 그러면
 * 오타·죽은 링크·없어진 페이지가 전부 "정상적으로 메인이 떴다"로 보이고, 사용자는 자기가 무엇을
 * 잘못 요청했는지 알 수 없다(주소창 기록마저 홈으로 바뀐다). 이제 무엇을 요청했는지 보여 주고
 * 갈 곳을 제시한다.
 *
 * ⚠ `/ticker/:name` 의 **콘텐츠 없는 티커**는 여기로 오지 않는다 — 그 라우트는 매칭에 성공하고
 * `TickerDetailPage` 가 허브(`/ticker/all`)로 보낸다(서버가 200 무치환 셸을 주는 SEO 결정과 한 쌍이다,
 * `server/handlers/TickerHtml/TickerHtml.ts` 주석). 그 경로를 404 로 바꾸지 마라.
 */
const NotFoundPage = lazy(() => import('@/pages/NotFound'));

/**
 * 법무 고지문 — 개인정보처리방침(`/privacy`)·이용약관(`/terms`).
 *
 * 티커 랜딩과 같은 `lazy` 격리다. 두 문서는 본문이 길고(표 포함) 방문 빈도가 낮아 엔트리에 실을
 * 이유가 없다. **배럴(`@/pages/Legal`)이 아니라 각 페이지 폴더를 직접** import 하는 이유: 배럴을
 * lazy 하면 두 문서가 한 청크로 묶여 방침만 열어도 약관까지 내려받는다.
 *
 * 🔴 `noindex` 를 걸지 않는다. 구글 OAuth 동의 화면 심사가 개인정보처리방침 URL 에 접근할 수 있어야
 * 하고, 색인을 막으면 그 검토가 막힌다(404 와 반대 결정이다 — `pages/NotFound` 의 `useNoIndex` 참고).
 * 사이트맵 등재도 같은 이유다(`vite.config.ts` 의 ROUTES).
 */
const PrivacyPage = lazy(() => import('@/pages/Legal/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/Legal/TermsPage'));
const SitemapPage = lazy(() => import('@/pages/Sitemap'));

/**
 * 랜딩(`/`) — 배당을 처음 접하는 사람이 도착하는 정문. 404·법무 문서와 같은 `lazy` 격리다.
 *
 * 🔴 `MainPage` 의 **eager import 는 그대로 둔다.** lazy 로 내리면 `AuthControl`·`HeaderOverflowMenu`
 * 가 엔트리 그래프에서 빠지면서 헤더가 lazy 경계 뒤로 가는 **번들 토폴로지 변경**이 된다 — 랜딩
 * 방문자가 시뮬레이터를 내려받는 비용과 맞바꿀지는 실측과 함께 별도로 판단한다
 * (docs/simulator-route-migration-compat.md §10 P3 의 ⚠ 항목).
 */
const LandingPage = lazy(() => import('@/pages/Landing/LandingPage'));
/**
 * 첫 화면(`/`). 🔴 **`LandingPage` 와 다른 화면이다** — 그쪽은 2026-08-27 부터 `/about` 을 그린다.
 * 이름이 헷갈리면 아래 라우트의 `path` 로 판단해라.
 */
const HomePage = lazy(() => import('@/pages/Home/HomePage'));

/**
 * 가계부(`/ledger`) — 구글 시트 연동. 티커 랜딩과 같은 `lazy` 격리다.
 *
 * 🔴 `isGoogleSheetsEnabled`(= `VITE_GOOGLE_CLIENT_ID`·`VITE_GOOGLE_API_KEY`·
 * `VITE_GOOGLE_PROJECT_NUMBER` 셋 다 있음)가 false 면 **배열이 비어 라우트가 존재하지 않는다** →
 * 아래 `*` catch-all 이 받아 404 를 낸다. 홈으로 리다이렉트하지 않는다(확정 결정) — 없는 기능을
 * "정상적으로 메인이 떴다"로 위장하지 않는다.
 *
 * 🔴 사이트맵에 넣지 않는다(`vite.config.ts` 의 ROUTES) — 로그인·동의가 필요한 화면이라 크롤러가
 * 도달해도 빈손이다.
 *
 * 진입점: ~~포트폴리오 카드와 프로필 드롭다운 두 곳(헤더 nav 에는 넣지 않는다 — 로그인·동의가
 * 필요한 화면을 전역 메뉴에 올리면 대부분의 방문자에게 막힌 문이 된다)~~
 * → **2026-08-01 사용자 결정으로 변경: 헤더 nav 에도 넣는다**(`components/PrimaryNav`, 내 포트폴리오
 * 바로 뒤 7번째). 사이트맵 제외 근거는 그대로 유효하다 — 크롤러와 사용자 메뉴는 다른 이야기다.
 * 🔴 nav 항목은 이 파일과 **같은 `isGoogleSheetsEnabled` 플래그**로 갈린다: 여기서 라우트가 사라지는데
 * 메뉴만 남으면 404 로 가는 죽은 링크다. 한쪽만 고치지 마라.
 *
 * GIS·Picker 스크립트는 이 lazy 청크 안에서만, 그것도 사용자가 버튼을 누른 뒤에 로드된다.
 */
const LedgerPage = lazy(() => import('@/pages/Ledger/LedgerPage'));

const ledgerRoutes: RouteObject[] = isGoogleSheetsEnabled
  ? [
      {
        path: '/ledger',
        element: (
          <Suspense fallback={null}>
            <LedgerPage />
          </Suspense>
        )
      }
    ]
  : [];

const CommunityLayout = lazy(() => import('@/pages/Community/CommunityLayout'));
const CommunityGalleryPage = lazy(() => import('@/pages/Community/CommunityGalleryPage'));
const CommunityBoardPage = lazy(() => import('@/pages/Community/CommunityBoardPage'));
const CommunityWritePage = lazy(() => import('@/pages/Community/CommunityWritePage'));
/** 미디어 뉴스 — 목록과 링크 공유 화면(마이그레이션 20260807000000·…001 이 스키마를 연다). */
const CommunityFirePage = lazy(() => import('@/pages/Community/CommunityFirePage'));
const CommunityFireSharePage = lazy(() => import('@/pages/Community/CommunityFireSharePage'));
/** 뉴스 세 라우트의 접근 게이트. 임시 비공개(2026-08-08) — 근거는 아래 라우트 주석. */
const CommunityDetailPage = lazy(() => import('@/pages/Community/CommunityDetailPage'));
const CommunityProfilePage = lazy(() => import('@/pages/Community/CommunityProfilePage'));
const CommunityMyPostsPage = lazy(() => import('@/pages/Community/CommunityMyPostsPage'));

/**
 * 네이버 OAuth 콜백 착지점(`/community/auth/naver/callback`).
 *
 * 실제 세션 교환은 **엔트리(main.tsx)**의 `completeNaverCallback` 이 담당한다(lazy 커뮤니티 청크와
 * 무관하게 즉시 실행 — OAuth+React.lazy 타이밍 함정 회피). 이 라우트는 그동안 화면에 뜨는 **경량
 * 착지 표시**일 뿐이라, lazy 도 supabase-js 도 끌어오지 않는 eager 텍스트다. 라우트가 없으면
 * 아래 `*` catch-all 이 이 경로를 `/` 로 client-navigate 해 메인이 잠깐 번쩍인다 — 그걸 막는다.
 * completeNaverCallback 은 성공/실패 어느 쪽이든 곧바로 `location.replace(returnTo)` 하므로 이 화면은
 * 순간만 보인다. isNaverEnabled(=커뮤니티 활성 && client_id)일 때만 존재한다.
 */
function NaverAuthCallback() {
  return (
    <p role="status" aria-live="polite">
      {COMMUNITY_COPY.login.naverCallback}
    </p>
  );
}

const naverCallbackRoute: RouteObject[] = isNaverEnabled
  ? [{ path: NAVER_CALLBACK_PATH, element: <NaverAuthCallback /> }]
  : [];

/**
 * 카카오 OAuth 콜백 착지점(`/community/auth/kakao/callback`) — 위 네이버 착지 라우트와 같은 역할·같은 이유.
 *
 * 카카오는 Supabase 기본 프로바이더지만, 이메일로 인한 **구글 계정 병합**을 피하려고 네이버와 동일한
 * 커스텀 플로우를 탄다(shared/lib/supabase/kakao.ts). 실제 세션 교환은 **엔트리(main.tsx)**의
 * `completeKakaoCallback` 이 담당하고, 이 라우트는 그동안 잠깐 뜨는 **경량 착지 표시**다(lazy·supabase-js
 * 미로드). `isKakaoCustomAuthEnabled`(=커뮤니티 활성 && VITE_KAKAO_CLIENT_ID)일 때만 존재한다 — env 가
 * 없으면 기존 Supabase 카카오 플로우라 이 경로로 착지할 일이 없다.
 */
function KakaoAuthCallback() {
  return (
    <p role="status" aria-live="polite">
      {COMMUNITY_COPY.login.kakaoCallback}
    </p>
  );
}

const kakaoCallbackRoute: RouteObject[] = isKakaoCustomAuthEnabled
  ? [{ path: KAKAO_CALLBACK_PATH, element: <KakaoAuthCallback /> }]
  : [];

const communityRoutes: RouteObject[] = isCommunityEnabled
  ? [
      {
        path: '/community',
        element: (
          <Suspense fallback={null}>
            <CommunityLayout />
          </Suspense>
        ),
        children: [
          // 배당계산 갤러리(/community/portfolio)와 게시판(/community/board)을 대칭 섹션으로 둔다.
          // 예전 진입점 /community 는 배당계산 갤러리로 리다이렉트(기존 링크·북마크 보존).
          { index: true, element: <Navigate to="/community/portfolio" replace /> },
          { path: 'portfolio', element: <CommunityGalleryPage /> },
          { path: 'portfolio/write', element: <CommunityWritePage /> },
          { path: 'portfolio/:id', element: <CommunityDetailPage /> },
          { path: 'portfolio/:id/edit', element: <CommunityWritePage /> },
          { path: 'profile', element: <CommunityProfilePage /> },
          // 내가 쓴 글 — 프로필 설정과 형제 화면(둘 다 프로필 드롭다운 진입점, 자체 로그인 게이트).
          // 목록 쿼리가 is_public=true 를 걸어 비공개 글은 이 경로에서만 보인다.
          { path: 'my-posts', element: <CommunityMyPostsPage /> },
          // 자유게시판 — 정적 세그먼트 'board'.
          { path: 'board', element: <CommunityBoardPage /> },
          { path: 'board/write', element: <CommunityWritePage kind="board" /> },
          { path: 'board/:id', element: <CommunityDetailPage kind="board" /> },
          { path: 'board/:id/edit', element: <CommunityWritePage kind="board" /> },
          /*
           * 미디어 뉴스 — 정적 세그먼트 'fire'.
           * ⚠ 공유 화면 경로가 'write' 가 아니라 **'share'** 인 것은 의도다. 이 화면이 하는 일은
           *   글쓰기가 아니라 남의 글을 가져오는 것이고, 주소가 그 차이를 먼저 말한다.
           * ⚠ 수정 경로는 두지 않는다 — 뉴스의 본체는 남의 원문이라 고칠 것이 한 줄 감상뿐이고,
           *   `kind` 는 게시 후 고정이다(update GRANT 없음). 필요해지면 그때 연다.
           *
           * 🔴 **게이트가 없다.** 종전 뉴스 지면은 비공개 플래그 아래 있었지만, 파이어족들은
           *   **누구나 본다** — 제한은 보기가 아니라 **쓰기**에 있고, 그건 화면이 아니라 DB 가
           *   막는다(20260810000001: `kind='fire'` INSERT 는 `profiles.is_admin` 만).
           */
          { path: 'firenow', element: <CommunityFirePage /> },
          { path: 'firenow/share', element: <CommunityFireSharePage /> },
          { path: 'firenow/:id', element: <CommunityDetailPage kind="fire" /> }
        ]
      }
    ]
  : [];

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    /*
     * 🔴 라우트 오류의 **마지막 안전망**(2026-08-07 프로덕션 사고). 없으면 react-router 의 기본
     * 화면("Unexpected Application Error!" + 영문 스택)이 앱을 통째로 대체한다 — 사용자에게는
     * "사이트가 깨졌다"로 보인다. 가장 흔한 원인은 배포 스큐(사라진 lazy 청크)이고, 그건
     * 새로고침 한 번이면 끝나는 상태다. 이 화면이 그것을 한국어로 말하고 스스로 복구한다.
     */
    errorElement: <RouteError />,
    children: [
      /**
       * `/` = 랜딩, `/simulator` = 시뮬레이터. **공유 링크는 `/simulator` 에만 붙는다.**
       *
       * 한때 `/` 가 `?share=`·`?s=`·`?sv=` 를 받아 `/simulator` 로 넘겼다. 2026-08-01 사용자 결정으로
       * 걷어냈다 — 이전 주소로 배포된 공유 링크의 **실사용자가 없다고 확인**됐고, 없는 트래픽을 위해
       * 루트에 분기를 두면 랜딩이 그려지기 전에 매번 쿼리를 파싱한다.
       * ⚠ 그래서 **옛 `/?share=…` 링크는 이제 랜딩을 보여 준다**(시나리오가 열리지 않는다).
       * 되살리려면 `resolveShareRedirectPath`(git 이력)와 그 소비처를 함께 되돌려야 한다.
       *
       * 🔴 **롤백은 이 `'/'` 항목의 element 를 `<MainPage />` 로 되돌리는 한 줄이다** — 그러면 랜딩만
       * 사라지고 `/simulator`·내부 링크·테스트는 전부 유효한 P2 상태로 안전하게 돌아간다
       * (docs/simulator-route-migration-compat.md §11).
       */
      {
        /*
         * 🔴 2026-08-27: 이 자리의 화면이 **바뀌었다.** 여섯 장짜리 안내문(`LandingPage`)이 여기
         * 있었는데, 그 문서는 아래 `/about` 으로 옮기고 `/` 는 **목표 여섯**을 고르는 한 화면이 됐다
         * (사용자 피드백: "직관적인 버튼 6개 만들고 그거 먼저 시작해야 재밌을 것 같다").
         *
         * ⚠ 주소는 그대로다 — 색인·공유 링크·외부 유입은 하나도 깨지지 않는다. 바뀐 것은
         *   그 주소가 그리는 화면뿐이라 사이트맵 priority(1.0)도 그대로 둔다(vite.config.ts 주석).
         */
        path: '/',
        element: (
          <Suspense fallback={null}>
            <HomePage />
          </Suspense>
        )
      },
      {
        /*
         * 긴 안내문. **`/` 에 있던 그 화면 그대로**이고 부품·문구·테스트도 손대지 않았다
         * (`pages/Landing`). 옮긴 이유는 첫 화면이 "읽어라"부터 시키고 있었기 때문이다.
         *
         * 🔴 `FAQPage` JSON-LD 가 이 주소로 함께 옮겨 왔다 — FAQ 가 **화면에 보이는** 유일한 곳이라서다
         *   (`shared/lib/seo/faqStructuredData.ts`). 이 라우트를 지우거나 옮기면 그 상수도 함께 고쳐라.
         */
        path: ABOUT_PATH,
        element: (
          <Suspense fallback={null}>
            <LandingPage />
          </Suspense>
        )
      },
      {
        path: SIMULATOR_PATH,
        element: <MainPage />
      },
      {
        /*
         * 검색어 랜딩 — "배당금 계산기"·"월 배당 100만원" 처럼 **사람이 검색창에 치는 말**에 1:1로
         * 맞는 페이지다(docs/site-assessment-2026-08-06.md P0-③). 콘텐츠는 전부
         * `shared/constants/guides` 에 있고, 새 가이드는 그 레지스트리에 한 줄이면 여기 자동으로 붙는다.
         * ⚠ 크롤러 HTML(`api/guide-html.js`)이 같은 콘텐츠를 서버에서 그린다 — vercel.json 의 rewrite 와
         *   이 라우트는 **한 벌**이라 한쪽만 바꾸면 색인과 화면이 갈린다.
         */
        path: INVESTOR_TYPE_PATH,
        element: (
          <Suspense fallback={null}>
            <InvestorTypePage />
          </Suspense>
        )
      },
      {
        path: '/guide/:slug',
        element: (
          <Suspense fallback={null}>
            <GuidePage />
          </Suspense>
        )
      },
      {
        path: '/ticker/all',
        element: (
          <Suspense fallback={null}>
            <TickerHubPage />
          </Suspense>
        )
      },
      {
        /*
         * 🔴 `/ticker/:name` 보다 **먼저** 선언한다. 두 경로가 같은 깊이라면 상관없지만, 여기는
         * `/ticker/category/:id`(두 겹)라 `:name`(한 겹)과 겹치지 않는다 — 다만 vercel.json 의
         * rewrite 순서는 실제로 겹치므로 그쪽에서 카테고리를 앞에 둔다(가드가 잠근다).
         */
        path: '/ticker/category/:categoryId',
        element: (
          <Suspense fallback={null}>
            <TickerCategoryPage />
          </Suspense>
        )
      },
      {
        /*
         * 🔴 `/portfolio/` 아래 한 겹으로 둔다(2026-08-02 사용자 지시) — "누구의 포트폴리오인가"라는
         * 축을 주소가 먼저 말한다. 다른 포트폴리오 화면(`/dividend/portfolio`·`/community/portfolio`)의
         * 경로는 **건드리지 않았다**(같은 날 사용자 결정 — 이미 배포된 주소를 흔들지 않는다).
         * ⚠ `/portfolio` 단독 라우트는 없다. 그건 nav 묶음의 이름일 뿐 목적지가 아니다.
         * 옛 `/investors` 는 하루도 배포된 적이 없어(페이지가 미커밋 상태였다) 리다이렉트를 두지 않는다.
         */
        path: '/portfolio/investors',
        element: (
          <Suspense fallback={null}>
            <InvestorsPage />
          </Suspense>
        )
      },
      {
        /* 국회의원 주식 거래 — `/portfolio/investors` 의 형제(정적 세그먼트라 순서 의존이 없다). */
        path: '/portfolio/congress',
        element: (
          <Suspense fallback={null}>
            <CongressPage />
          </Suspense>
        )
      },
      {
        /*
         * 대한민국 국회의원 주식 보유 — 미국 화면(`/portfolio/congress`)의 형제.
         * 🔴 **한 화면에 합치지 않았다.** 국회공보의 정기재산변동신고는 연 1회 보유 스냅샷이고
         * 미 하원 PTR 은 거래 기록이라, 같은 표에 놓으면 어느 쪽도 참이 아닌 숫자가 나온다.
         */
        path: '/portfolio/korea-assembly',
        element: (
          <Suspense fallback={null}>
            <KoreaAssemblyPage />
          </Suspense>
        )
      },
      {
        /* 국민연금 포트폴리오 — 같은 축의 세 번째 화면. */
        path: '/portfolio/nps',
        element: (
          <Suspense fallback={null}>
            <NpsPage />
          </Suspense>
        )
      },
      {
        path: '/market/stats',
        element: (
          <Suspense fallback={null}>
            <HippoStatsPage />
          </Suspense>
        )
      },
      {
        path: '/market/pulse',
        element: (
          <Suspense fallback={null}>
            <MarketPulsePage />
          </Suspense>
        )
      },
      {
        path: '/market/us-calendar',
        element: (
          <Suspense fallback={null}>
            <MarketCalendarPage />
          </Suspense>
        )
      },
      {
        path: '/ticker/compare',
        element: (
          <Suspense fallback={null}>
            <TickerComparePage />
          </Suspense>
        )
      },
      {
        path: '/ticker/:name',
        element: (
          <Suspense fallback={null}>
            <TickerDetailPage />
          </Suspense>
        )
      },
      {
        path: '/dividend/calendar',
        element: (
          <Suspense fallback={null}>
            <DividendCalendarPage />
          </Suspense>
        )
      },
      {
        path: '/dividend/portfolio',
        element: (
          <Suspense fallback={null}>
            <PortfolioPage />
          </Suspense>
        )
      },
      {
        /*
         * 배당 목록 허브. `/dividend/kings` 등 정적 세그먼트들과 형제라 순서 의존이 없다
         * (`/dividend/:id` 같은 파라미터 라우트를 두지 않았다 — 목록은 셋으로 고정이고, 파라미터로
         * 열어 두면 존재하지 않는 목록 주소가 200 으로 살아난다).
         */
        path: DIVIDEND_LIST_HUB_PATH,
        element: (
          <Suspense fallback={null}>
            <DividendListHubPage />
          </Suspense>
        )
      },
      ...DIVIDEND_LIST_IDS.map((listId) => ({
        path: dividendListPath(listId),
        element: (
          <Suspense fallback={null}>
            <DividendListPage listId={listId} />
          </Suspense>
        )
      })),
      {
        path: '/privacy',
        element: (
          <Suspense fallback={null}>
            <PrivacyPage />
          </Suspense>
        )
      },
      {
        path: '/terms',
        element: (
          <Suspense fallback={null}>
            <TermsPage />
          </Suspense>
        )
      },
      {
        // 사람이 훑는 사이트 색인. XML 사이트맵(크롤러용)과 청중이 다르다 — 둘 다 둔다.
        path: '/sitemap',
        element: (
          <Suspense fallback={null}>
            <SitemapPage />
          </Suspense>
        )
      },
      ...ledgerRoutes,
      ...naverCallbackRoute,
      ...kakaoCallbackRoute,
      ...communityRoutes,
      {
        path: '*',
        element: (
          <Suspense fallback={null}>
            <NotFoundPage />
          </Suspense>
        )
      }
    ]
  }
];
