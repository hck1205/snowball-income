import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
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
import { usePageHue } from '@/shared/hooks';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { SIMULATOR_PATH } from '@/shared/constants/routes';

/**
 * 모든 라우트를 덮는 **상시 마운트 레이아웃**. 라우트가 바뀔 때마다 일어나야 하는 문서 수준
 * 부수효과를 여기 한 곳에 모은다 — 페이지가 각자 하면 lazy 청크가 뜨기 전 한 박자가 비고,
 * 히어로가 없는 화면(커뮤니티)은 아예 빠진다.
 *
 *  - SEO 런타임 메타데이터 + GA4 page_view
 *  - 페이지 정체성 hue(`--sb-page-hue`) — `shared/hooks/usePageHue` 참고
 */
function RootLayout() {
  const location = useLocation();

  usePageHue();

  useEffect(() => {
    const page = {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash
    };

    applySeoRuntimeMetadata(page);

    const raf = window.requestAnimationFrame(() => {
      sendPageView(page);
    });

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [location.hash, location.pathname, location.search]);

  return <Outlet />;
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
const TickerDetailPage = lazy(() => import('@/pages/Ticker/TickerDetailPage'));

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
 * 가계부(`/ledger`) — 구글 시트 연동. 티커 랜딩과 같은 `lazy` 격리다.
 *
 * 🔴 `isGoogleSheetsEnabled`(= `VITE_GOOGLE_CLIENT_ID`·`VITE_GOOGLE_API_KEY`·
 * `VITE_GOOGLE_PROJECT_NUMBER` 셋 다 있음)가 false 면 **배열이 비어 라우트가 존재하지 않는다** →
 * 아래 `*` catch-all 이 받아 404 를 낸다. 홈으로 리다이렉트하지 않는다(확정 결정) — 없는 기능을
 * "정상적으로 메인이 떴다"로 위장하지 않는다.
 *
 * 🔴 사이트맵에 넣지 않는다(`vite.config.ts` 의 ROUTES) — 로그인·동의가 필요한 화면이라 크롤러가
 * 도달해도 빈손이다. 헤더 nav 에도 넣지 않는다(진입점은 포트폴리오 카드와 프로필 드롭다운 두 곳).
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
          // 포트폴리오 갤러리(/community/portfolio)와 게시판(/community/board)을 대칭 섹션으로 둔다.
          // 예전 진입점 /community 는 포트폴리오 갤러리로 리다이렉트(기존 링크·북마크 보존).
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
          { path: 'board/:id/edit', element: <CommunityWritePage kind="board" /> }
        ]
      }
    ]
  : [];

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      /**
       * 시뮬레이터 — 지금은 `/` 와 `/simulator` **둘 다** 같은 화면을 그린다(이전 중간 상태).
       *
       * 왜 두 개인가: 내부 링크·og:url·사이트맵을 먼저 `/simulator` 로 옮기고, 이미 배포된 공유
       * 링크(`/?share=…`·`/?s=…`)와 북마크는 `/` 에서 그대로 살려 둔다. 나중에 랜딩이 `/` 를
       * 가져갈 때 이 `'/'` 항목만 교체하면 되고, 되돌릴 때도 그 한 줄만 되돌리면 된다
       * (docs/simulator-route-migration-compat.md §10 P2·§11).
       *
       * 🔴 `MainPage` 는 **eager import 를 유지한다.** lazy 로 내리면 `AuthControl`·`HeaderOverflowMenu`
       * 가 엔트리 그래프에서 빠지면서 헤더가 lazy 경계 뒤로 가는 **번들 토폴로지 변경**이 된다 —
       * 그 판단은 랜딩 PR 에서 실측과 함께 한다.
       */
      {
        path: '/',
        element: <MainPage />
      },
      {
        path: SIMULATOR_PATH,
        element: <MainPage />
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
