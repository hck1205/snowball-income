import { useState } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import type { CommunityOAuthProvider } from '@/shared/lib/supabase';
import { CommunityModal } from '@/components/community/CommunityModal';
import {
  GoogleMark,
  KakaoMark,
  NaverMark,
  ProviderButton,
  ProviderList,
  ProviderNotice,
  Subtitle
} from './LoginModal.styled';

export type LoginModalProps = {
  onClose: () => void;
  onSelectProvider: (provider: CommunityOAuthProvider) => void;
  pending?: boolean;
};

/**
 * 경량 로그인 유도 모달. 구글 / 네이버 / 카카오. 브랜드 규정색은 로고(아이콘)로만 식별한다.
 *
 * ⚠ 네이버는 Supabase 기본 OAuth 프로바이더가 아니라, `signInWithOAuth`에 'naver'를 흘리면
 *   Supabase가 타입·런타임 모두에서 거부한다. 그래서 네이버 버튼은 `onSelectProvider`(=구글/카카오
 *   전용 유니온)로 보내지 않고, 여기서 "준비 중" 안내만 인라인으로 띄운다(크래시 방지).
 *   정식 연동에는 Edge Function(네이버 access token ↔ Supabase 세션 교환) + 네이버 개발자센터
 *   앱 등록이 필요하며, 확장 지점은 `shared/lib/supabase/auth.ts`의 `CommunityOAuthProvider` seam이다.
 */
const NAVER_LABEL = '네이버로 계속하기';
const NAVER_PENDING_NOTICE = '네이버 로그인은 준비 중입니다. 지금은 구글 또는 카카오로 로그인해 주세요.';

export default function LoginModal({ onClose, onSelectProvider, pending }: LoginModalProps) {
  const [naverNotice, setNaverNotice] = useState(false);

  return (
    <CommunityModal title={COMMUNITY_COPY.login.title} onClose={onClose} align="center">
      <Subtitle>{COMMUNITY_COPY.login.subtitle}</Subtitle>
      <ProviderList>
        <ProviderButton type="button" disabled={pending} onClick={() => onSelectProvider('google')}>
          <GoogleMark aria-hidden="true" viewBox="0 0 18 18" width={18} height={18}>
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
            />
            <path
              fill="#FBBC05"
              d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
            />
          </GoogleMark>
          {COMMUNITY_COPY.login.google}
        </ProviderButton>

        {/* 네이버: 백엔드(Edge Function) 미비 → onSelectProvider로 보내지 않고 인라인 안내만 한다. */}
        <ProviderButton
          type="button"
          disabled={pending}
          aria-describedby={naverNotice ? 'naver-login-notice' : undefined}
          onClick={() => setNaverNotice(true)}
        >
          <NaverMark aria-hidden="true" viewBox="0 0 18 18" width={18} height={18}>
            <rect width="18" height="18" rx="4" fill="#03C75A" />
            <path
              fill="#ffffff"
              d="M11.137 9.418 6.701 3H3v12h3.863V8.582L11.299 15H15V3h-3.863z"
            />
          </NaverMark>
          {NAVER_LABEL}
        </ProviderButton>

        <ProviderButton type="button" disabled={pending} onClick={() => onSelectProvider('kakao')}>
          <KakaoMark aria-hidden="true" viewBox="0 0 18 18" width={18} height={18}>
            <path
              fill="currentColor"
              d="M9 1.5C4.86 1.5 1.5 4.14 1.5 7.4c0 2.12 1.42 3.98 3.55 5.02-.16.57-.58 2.1-.66 2.43-.1.4.15.4.31.29.13-.09 2.02-1.37 2.84-1.93.63.09 1.29.14 1.96.14 4.14 0 7.5-2.64 7.5-5.9S13.14 1.5 9 1.5Z"
            />
          </KakaoMark>
          {COMMUNITY_COPY.login.kakao}
        </ProviderButton>
      </ProviderList>

      {naverNotice ? (
        <ProviderNotice id="naver-login-notice" role="status" aria-live="polite">
          {NAVER_PENDING_NOTICE}
        </ProviderNotice>
      ) : null}
    </CommunityModal>
  );
}
