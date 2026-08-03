import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { PageFooter, PageFooterSlotProvider } from '@/components/common';
import { CommunityAuthProvider, CommunityHeader } from '@/components/community';
import { CommunityMain, LayoutRoot, SkipLink } from './CommunityLayout.styled';
import { KakaoLoginErrorBanner } from './components/KakaoLoginErrorBanner';
import { NaverLoginErrorBanner } from './components/NaverLoginErrorBanner';

/**
 * 커뮤니티 라우트 셸.
 *
 * - `CommunityAuthProvider`가 세션 하이드레이션(getSupabaseClient → getSession → onAuthStateChange →
 *   fetchMyProfile)과 로그인 유도 모달을 소유한다. 이 배선은 커뮤니티 라우트 안에서만 돈다
 *   → 대시보드는 supabase-js를 로드하지 않는다.
 * - sticky `CommunityHeader` + `<main>` 랜드마크 + SkipLink + **전 화면 공용 푸터**.
 * - `NaverLoginErrorBanner`/`KakaoLoginErrorBanner`가 `?naverLogin=failed`·`?kakaoLogin=failed` 착지를
 *   인라인 에러로 표면화한다(무음 실패 금지). 둘은 서로 다른 쿼리 플래그를 보므로 동시에 뜨지 않는다.
 *
 * 이 컴포넌트 자체가 `React.lazy`로 로드되므로 supabase-js/커뮤니티 코드는 별도 청크가 된다.
 */
export default function CommunityLayout() {
  return (
    <CommunityAuthProvider>
      <LayoutRoot>
        <SkipLink href="#main-content">본문으로 건너뛰기</SkipLink>
        {/*
          🔴 푸터는 `<main>` **밖**, `CommunityHeader` 와 같은 레벨에 선다. 두 가지가 동시에 풀린다:
          ①`<footer>` 가 main/section/article 의 자손이면 `contentinfo` 랜드마크가 **되지 않는다**
          (HTML 명세 — 커뮤니티 10개 라우트는 그전까지 푸터 자체가 없었다) ②`CommunityMain` 이
          max-width 1200 이라 그 안에서는 전폭 띠가 될 수 없다. 근거 전문은
          `components/common/PageFooterSlot/PageFooterSlot.tsx` 머리말(티커 셸과 같은 규약).

          `PageFooterSlotProvider` 를 함께 두는 이유: 나중에 어느 커뮤니티 뷰가 자기 상태에서
          각주를 만들어야 할 때(`<PageFooter notes={...} />`) 호출부를 뷰에 두고 DOM 만 여기로
          올릴 수 있게 자리를 미리 열어 둔다. 지금은 소비처가 없어 이 푸터가 제자리에 그려진다.
          🔴 뷰에서 `<PageFooter />` 를 또 그리지 마라 — 레이아웃과 뷰가 둘 다 그리면 contentinfo
             랜드마크가 2개가 된다. 각주가 필요해지는 날에는 **이 렌더를 지우고** 뷰로 옮겨라.
        */}
        <PageFooterSlotProvider>
          <CommunityHeader />
          <CommunityMain id="main-content">
            {/* 소셜 로그인 커스텀 콜백 실패 표면화 — 어느 커뮤니티 페이지로 착지하든 보인다. */}
            <NaverLoginErrorBanner />
            <KakaoLoginErrorBanner />
            <Suspense fallback={null}>
              <Outlet />
            </Suspense>
          </CommunityMain>
          <PageFooter />
        </PageFooterSlotProvider>
      </LayoutRoot>
    </CommunityAuthProvider>
  );
}
