import type { CommunityOAuthProvider } from '@/shared/lib/supabase';

/**
 * 이 페이지의 viewModel 은 **인증 게이트 정보만** 담는다.
 * 목록 데이터는 `MyPostsSection` 이 스스로 쥔다(그 섹션의 로딩/실패는 게이트와 무관하다).
 */
export type CommunityMyPostsViewModel = {
  /** 초기 세션 확인 여부 — false면 로딩 상태를 보여준다. */
  authReady: boolean;
  isLoggedIn: boolean;
  /** 비로그인 딥링크 시 로그인 게이트에서 호출. */
  onLogin: (provider: CommunityOAuthProvider) => void;
};

export type CommunityMyPostsViewProps = {
  viewModel: CommunityMyPostsViewModel;
};
