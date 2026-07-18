import { COMMUNITY_COPY } from '@/shared/constants/community';
import { isNaverEnabled, type CommunityOAuthProvider } from '@/shared/lib/supabase';
import { CommunityModal } from '@/components/community/CommunityModal';
import { SocialLoginButton } from '@/components/community/SocialLoginButton';
import { ProviderList, Subtitle } from './LoginModal.styled';

export type LoginModalProps = {
  onClose: () => void;
  onSelectProvider: (provider: CommunityOAuthProvider) => void;
  pending?: boolean;
};

/**
 * 경량 로그인 유도 모달. 순서: **구글 → 네이버 → 카카오**.
 * 3버튼 모두 공용 `SocialLoginButton`으로 브랜드 규정색·로고·카피를 통일한다.
 *
 * 네이버는 **config-gated**다(`isNaverEnabled` = 커뮤니티 활성 && `VITE_NAVER_CLIENT_ID` 존재).
 * - 활성(env 설정됨): 구글·카카오와 **완전히 같은 경로**로 보낸다 —
 *   onSelectProvider('naver') → CommunityAuthProvider.login → signInWithOAuth(client,'naver').
 *   auth.ts 가 provider==='naver' 를 가로채 `startNaverLogin`(우리 authorize 리다이렉트 + state)으로
 *   라우팅하고, 콜백은 main.tsx 엔트리의 `completeNaverCallback` 이 세션을 확립한다(shared/lib/supabase/naver.ts).
 * - 비활성(기본): 버튼을 **숨기지 않고 "준비 중"(pending)으로 노출**한다 — 구글/카카오는 늘 보이는데
 *   네이버만 사라지면 사용자가 회귀로 인지한다. pending 은 aria-disabled + "준비 중" 배지이고, 클릭은
 *   에러 없이 무동작(가드). `pending` prop(로그인 진행 중)과는 별개다 — 그건 `disabled` 로 전 버튼을 잠근다.
 */
export default function LoginModal({ onClose, onSelectProvider, pending }: LoginModalProps) {
  return (
    <CommunityModal title={COMMUNITY_COPY.login.title} onClose={onClose} align="center">
      <Subtitle>{COMMUNITY_COPY.login.subtitle}</Subtitle>
      <ProviderList>
        <SocialLoginButton
          provider="google"
          disabled={pending}
          onClick={() => onSelectProvider('google')}
        />
        <SocialLoginButton
          provider="naver"
          disabled={pending}
          pending={!isNaverEnabled}
          onClick={() => {
            if (isNaverEnabled) onSelectProvider('naver');
          }}
        />
        <SocialLoginButton
          provider="kakao"
          disabled={pending}
          onClick={() => onSelectProvider('kakao')}
        />
      </ProviderList>
    </CommunityModal>
  );
}
