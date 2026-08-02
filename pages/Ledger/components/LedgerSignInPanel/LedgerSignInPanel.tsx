import { SocialLoginButton } from '@/components/community/SocialLoginButton';
import { isNaverEnabled } from '@/shared/lib/supabase';
import { LEDGER_COPY } from '../../copy';
import type { LedgerSignInPanelProps } from './LedgerSignInPanel.types';
import { SignInBody, SignInButtons, SignInHeading, SignInSection } from './LedgerSignInPanel.styled';

const copy = LEDGER_COPY;

/**
 * 앱 로그인 유도 — 비로그인 상태로 `/ledger` 에 들어왔을 때의 본문.
 *
 * 🔴 **새 제공자 UI 를 만들지 않는다.** 커뮤니티 딥링크 게이트(`CommunityMyPostsPage.view.tsx`)와
 * 같은 부품·같은 순서(구글 → 네이버 → 카카오)다. 네이버는 env 가 없으면 숨기지 않고 "준비 중"으로
 * 노출한다(무음 실패 금지 — 없는 선택지가 조용히 사라지면 사용자는 자기 계정이 안 되는 줄 안다).
 *
 * 🔴 어느 제공자로 로그인하든 다음 단계는 같다. 구글 시트 접근은 **앱 로그인과 다른 층**이라
 * 네이버·카카오 사용자도 로그인을 갈아탈 필요가 없다(`LedgerAppAuthGate` 주석).
 */
export default function LedgerSignInPanel({ headingId, onSignIn }: LedgerSignInPanelProps) {
  return (
    <SignInSection aria-labelledby={headingId}>
      <SignInHeading id={headingId}>{copy.signIn.heading}</SignInHeading>
      <SignInBody>{copy.signIn.body}</SignInBody>
      <SignInButtons>
        <SocialLoginButton provider="google" onClick={() => onSignIn('google')} />
        <SocialLoginButton
          provider="naver"
          pending={!isNaverEnabled}
          onClick={() => {
            if (isNaverEnabled) onSignIn('naver');
          }}
        />
        <SocialLoginButton provider="kakao" onClick={() => onSignIn('kakao')} />
      </SignInButtons>
    </SignInSection>
  );
}
