import type { CommunityOAuthProvider } from '@/shared/lib/supabase';
import type { UseScenarioComposer } from './hooks';

export type CommunityWriteViewModel = {
  composer: UseScenarioComposer;
  authReady: boolean;
  isLoggedIn: boolean;
  onLogin: (provider: CommunityOAuthProvider) => void;
};

export type CommunityWriteViewProps = {
  viewModel: CommunityWriteViewModel;
};
