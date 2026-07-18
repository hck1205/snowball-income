import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { CommunityAuthProvider, CommunityHeader } from '@/components/community';
import { CommunityMain, LayoutRoot, SkipLink } from './CommunityLayout.styled';
import { NaverLoginErrorBanner } from './components/NaverLoginErrorBanner';

/**
 * 커뮤니티 라우트 셸.
 *
 * - `CommunityAuthProvider`가 세션 하이드레이션(getSupabaseClient → getSession → onAuthStateChange →
 *   fetchMyProfile)과 로그인 유도 모달을 소유한다. 이 배선은 커뮤니티 라우트 안에서만 돈다
 *   → 대시보드는 supabase-js를 로드하지 않는다.
 * - sticky `CommunityHeader` + `<main>` 랜드마크 + SkipLink.
 * - `NaverLoginErrorBanner`가 `?naverLogin=failed` 착지를 인라인 에러로 표면화한다(무음 실패 금지).
 *
 * 이 컴포넌트 자체가 `React.lazy`로 로드되므로 supabase-js/커뮤니티 코드는 별도 청크가 된다.
 */
export default function CommunityLayout() {
  return (
    <CommunityAuthProvider>
      <LayoutRoot>
        <SkipLink href="#main-content">본문으로 건너뛰기</SkipLink>
        <CommunityHeader />
        <CommunityMain id="main-content">
          {/* 네이버 로그인 실패(?naverLogin=failed) 표면화 — 어느 커뮤니티 페이지로 착지하든 보인다. */}
          <NaverLoginErrorBanner />
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </CommunityMain>
      </LayoutRoot>
    </CommunityAuthProvider>
  );
}
