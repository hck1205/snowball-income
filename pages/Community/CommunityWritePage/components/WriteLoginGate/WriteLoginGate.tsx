import { BrandGlyph } from '@/components/common';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { isNaverEnabled } from '@/shared/lib/supabase';
import { SocialLoginButton } from '@/components/community/SocialLoginButton';
import type { WriteLoginGateProps } from './WriteLoginGate.types';
import {
  GateBody,
  GateBodyLabel,
  GateButtons,
  GateCard,
  GateFootnote,
  GateGlyph,
  GateHead,
  GateSubtitle,
  GateTitle,
  GateWrap
} from './WriteLoginGate.styled';

const w = COMMUNITY_COPY.write;

/*
 * 🔴 자매 게이트(프로필·내가 쓴 글)와 **같은 문장**을 쓴다 — 같은 말이 화면마다 달라지면
 * 사용자는 그것을 다른 규칙으로 읽는다. 값이 갈리지 않게 문자열도 같은 두 줄로 고정한다.
 */
const GATE_PROVIDERS_LABEL = '로그인 수단';
const GATE_FOOTNOTE = '로그인은 커뮤니티 기능에만 쓰입니다. 시뮬레이터는 로그인 없이 그대로 사용할 수 있습니다.';

/**
 * 비로그인 게이트 — 글쓰기 진입 전 소셜 로그인 3종(구글→네이버→카카오).
 *
 * 조판은 `/community/profile`·`/community/my-posts` 게이트와 한 벌이다(반전 헤드 + 흰 바디).
 * 게이트 판정·로그인 호출은 부모/컨테이너가 그대로 소유한다 — 여기는 그리기만 한다.
 */
export default function WriteLoginGate({ onLogin }: WriteLoginGateProps) {
  return (
    <GateWrap>
      <GateCard>
        <GateHead>
          <GateGlyph>
            <BrandGlyph size={32} />
          </GateGlyph>
          <GateTitle>{w.loginGateTitle}</GateTitle>
          <GateSubtitle>{w.loginGateSubtitle}</GateSubtitle>
        </GateHead>
        <GateBody>
          <GateBodyLabel>{GATE_PROVIDERS_LABEL}</GateBodyLabel>
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
          <GateFootnote>{GATE_FOOTNOTE}</GateFootnote>
        </GateBody>
      </GateCard>
    </GateWrap>
  );
}
