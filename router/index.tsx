import { Global } from '@emotion/react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useApplyPalettePreset } from '@/jotai/snowball';
import { globalStyles } from '@/shared/styles';
import { routes } from './routes';

const router = createBrowserRouter(routes);

export default function AppRouter() {
  // 선택된 팔레트 프리셋을 html[data-palette]로 반영 — globalStyles의
  // :root[data-palette='...'] 변수 스코프와 짝. 모든 라우트를 덮도록 루트에서 1회 배선한다.
  useApplyPalettePreset();

  return (
    <>
      {/*
        디자인 시스템 전역 스타일(--sb-* CSS 변수 + 리셋/바탕)을 앱 루트에서 한 번 주입한다.
        예전엔 Main.view에서만 렌더돼, /community 등 다른 라우트로 가면 변수가 사라져
        색/레이아웃/모달 배경이 통째로 깨졌다(모든 var(--sb-*)가 미정의). 루트에 두면
        모든 라우트가 토큰을 항상 받는다.
      */}
      <Global styles={globalStyles} />
      <RouterProvider
        router={router}
        future={{
          v7_startTransition: true
        }}
      />
    </>
  );
}
