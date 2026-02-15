import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { MainPage } from '@/pages';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainPage />
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
];
