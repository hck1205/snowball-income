import { LockKeyhole } from 'lucide-react';
import { SocialLoginButton } from '@/components/community/SocialLoginButton';
import { isNaverEnabled } from '@/shared/lib/supabase';
import { LEDGER_COPY } from '../../copy';
import type { LedgerSignInPanelProps } from './LedgerSignInPanel.types';
import {
  SignInBody,
  SignInButtons,
  SignInColumn,
  SignInGlyph,
  SignInHeadRow,
  SignInHeading,
  SignInSection
} from './LedgerSignInPanel.styled';

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
 *
 * ⚠ 이 관문은 **연결 무대보다 가볍게** 선다(styled 파일 머리말) — 두 관문이 같은 무게로 서면
 * "로그인했는데 왜 또 동의인가"라는 이 화면 최대의 혼란이 더 커진다.
 */
export default function LedgerSignInPanel({ headingId, onSignIn }: LedgerSignInPanelProps) {
  return (
    <SignInSection aria-labelledby={headingId}>
      {/*
        🔴 안쪽 열 하나에 제목·문장·버튼을 전부 넣는다 — 셋의 **왼쪽 시작점을 맞추기 위해서**다
           (2026-08-08 사용자 지시). 카드는 가운데지만 글은 왼쪽에서 시작해야 읽히고, 그 왼쪽이
           로그인 버튼의 왼쪽과 어긋나면 한 카드 안에 기준선이 둘이 된다.
      */}
      <SignInColumn>
        {/* 배지는 제목 **오른쪽 끝**이다. 장식이라 aria-hidden 그대로다. */}
        <SignInHeadRow>
          <SignInHeading id={headingId}>{copy.signIn.heading}</SignInHeading>
          <SignInGlyph aria-hidden>
            <LockKeyhole size={24} strokeWidth={1.8} focusable={false} />
          </SignInGlyph>
        </SignInHeadRow>
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
      </SignInColumn>
    </SignInSection>
  );
}
