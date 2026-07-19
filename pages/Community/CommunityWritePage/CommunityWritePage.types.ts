import type { CommunityOAuthProvider } from '@/shared/lib/supabase';
import type { ScenarioCandidates, UsePostComposer } from './hooks';

export type CommunityWriteViewModel = {
  composer: UsePostComposer;
  /** 첨부 택1 후보 목록(read-only) — 워크스페이스 시나리오 탭 전부를 카드로 보여준다. */
  candidates: ScenarioCandidates;
  authReady: boolean;
  isLoggedIn: boolean;
  onLogin: (provider: CommunityOAuthProvider) => void;
};

export type CommunityWriteViewProps = {
  viewModel: CommunityWriteViewModel;
};
