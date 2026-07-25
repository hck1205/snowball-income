import { COMMUNITY_COPY } from '@/shared/constants/community';
import { isNaverEnabled } from '@/shared/lib/supabase';
import { EmptyState } from '@/components/community';
import { SocialLoginButton } from '@/components/community/SocialLoginButton';
import type { WriteLoginGateProps } from './WriteLoginGate.types';
import { GateButtons, GateWrap } from './WriteLoginGate.styled';

const w = COMMUNITY_COPY.write;

/**
 * 비로그인 게이트 — 글쓰기 진입 전 소셜 로그인 3종(구글→네이버→카카오).
 * CommunityWritePage 뷰에서 조각만 분리했다(게이트 판정·로그인 호출은 부모/컨테이너 그대로).
 */
export default function WriteLoginGate({ onLogin }: WriteLoginGateProps) {
  return (
    <GateWrap>
      <EmptyState title={w.loginGateTitle} subtitle={w.loginGateSubtitle} />
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
