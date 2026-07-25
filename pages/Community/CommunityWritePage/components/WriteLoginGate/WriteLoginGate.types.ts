import type { CommunityOAuthProvider } from '@/shared/lib/supabase';

export type WriteLoginGateProps = {
  onLogin: (provider: CommunityOAuthProvider) => void;
};
