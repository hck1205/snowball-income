import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { MainPage } from '@/pages';
import { isCommunityEnabled } from '@/shared/lib/supabase';
import { applySeoRuntimeMetadata, sendPageView } from '@/shared/lib/analytics';

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
const CommunityWritePage = lazy(() => import('@/pages/Community/CommunityWritePage'));
const CommunityDetailPage = lazy(() => import('@/pages/Community/CommunityDetailPage'));

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
          { index: true, element: <CommunityGalleryPage /> },
          { path: 'new', element: <CommunityWritePage /> },
          { path: ':id', element: <CommunityDetailPage /> },
          { path: ':id/edit', element: <CommunityWritePage /> }
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
      ...communityRoutes,
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  }
];
