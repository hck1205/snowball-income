import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { MainPage } from '@/pages';
import { isCommunityEnabled, isNaverEnabled, NAVER_CALLBACK_PATH } from '@/shared/lib/supabase';
import { applySeoRuntimeMetadata, sendPageView } from '@/shared/lib/analytics';
import { COMMUNITY_COPY } from '@/shared/constants/community';

function AnalyticsLayout() {
  const location = useLocation();

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
const CommunityLayout = lazy(() => import('@/pages/Community/CommunityLayout'));
const CommunityGalleryPage = lazy(() => import('@/pages/Community/CommunityGalleryPage'));
const CommunityBoardPage = lazy(() => import('@/pages/Community/CommunityBoardPage'));
const CommunityWritePage = lazy(() => import('@/pages/Community/CommunityWritePage'));
const CommunityDetailPage = lazy(() => import('@/pages/Community/CommunityDetailPage'));
const CommunityProfilePage = lazy(() => import('@/pages/Community/CommunityProfilePage'));

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
    element: <AnalyticsLayout />,
    children: [
      {
        path: '/',
        element: <MainPage />
      },
      ...naverCallbackRoute,
      ...communityRoutes,
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  }
];
