import type { CommunityOAuthProvider } from '@/shared/lib/supabase';

export type LedgerSignInPanelProps = {
  /** 섹션 제목의 id — `<section aria-labelledby>` 가 가리킨다. */
  headingId: string;
  /**
   * 앱 로그인 시작. 🔴 이 앱의 **신원** 절차이고, 구글 시트 접근 권한과는 다른 층이다
   * (`pages/Ledger/types` 의 `LedgerAppAuthGate` 주석 참고).
   */
  onSignIn: (provider: CommunityOAuthProvider) => void;
};
