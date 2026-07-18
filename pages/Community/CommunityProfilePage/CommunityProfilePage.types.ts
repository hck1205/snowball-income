import type { CommunityOAuthProvider } from '@/shared/lib/supabase';
import type { ProfileEditor } from './hooks';

export type CommunityProfileViewModel = ProfileEditor & {
  /** 초기 세션 확인 여부 — false면 로딩 상태를 보여준다. */
  authReady: boolean;
  isLoggedIn: boolean;
  /** 비로그인 딥링크 시 로그인 게이트에서 호출. */
  onLogin: (provider: CommunityOAuthProvider) => void;
};

export type CommunityProfileViewProps = {
  viewModel: CommunityProfileViewModel;
};
