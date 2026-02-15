import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { MainPage } from '@/pages';
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

export const routes: RouteObject[] = [
  {
    element: <AnalyticsLayout />,
    children: [
      {
        path: '/',
        element: <MainPage />
      },
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  }
];
