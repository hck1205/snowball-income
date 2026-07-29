import { COMMUNITY_COPY } from '@/shared/constants/community';
import { EmptyState } from '@/components/community';
import { SocialLoginButton } from '@/components/community/SocialLoginButton';
import { isNaverEnabled } from '@/shared/lib/supabase';
import { CommunityTopBar } from '@/pages/Community/components';
import type { CommunityMyPostsViewProps } from './CommunityMyPostsPage.types';
import { MyPostsSection } from './components';
import { GateButtons, GateWrap, MyPostsMain, PageTitle } from './CommunityMyPostsPage.styled';

const c = COMMUNITY_COPY.myPosts;

/**
 * "내가 쓴 글" 화면의 순수 뷰 — 인증 게이트 + 목록 카드.
 * 목록 자체(로딩/실패/빈/목록)는 `MyPostsSection` 이 소유한다.
 */
export default function CommunityMyPostsView({ viewModel }: CommunityMyPostsViewProps) {
  const { authReady, isLoggedIn, onLogin } = viewModel;

  // ── 게이트: 인증 확인 중 / 비로그인(딥링크) ────────────────────────────────
  // 프로필 설정과 같은 처리다 — 이 경로는 남의 글이 아니라 **내 글**(비공개 포함)을 보여주므로
  // 로그인 전에는 목록 조회를 아예 시작하지 않는다.
  if (!authReady) {
    return <EmptyState title={c.loading} />;
  }

  if (!isLoggedIn) {
    return (
      <GateWrap>
        <EmptyState title={c.loginGateTitle} subtitle={c.loginGateSubtitle} />
        <GateButtons>
          <SocialLoginButton provider="google" onClick={() => onLogin('google')} />
          {/* 네이버: env 미설정이면 숨기지 않고 "준비 중"(pending)으로 노출, 클릭 무동작. 순서 구글→네이버→카카오. */}
          <SocialLoginButton
            provider="naver"
            pending={!isNaverEnabled}
            onClick={() => {
              if (isNaverEnabled) onLogin('naver');
            }}
          />
          <SocialLoginButton provider="kakao" onClick={() => onLogin('kakao')} />
        </GateButtons>
      </GateWrap>
    );
  }

  return (
    <MyPostsMain>
      <CommunityTopBar />
      <PageTitle>{c.title}</PageTitle>
      <MyPostsSection />
    </MyPostsMain>
  );
}
