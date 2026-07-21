import { useCallback, useEffect, useMemo, useState } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import {
  detectInAppBrowser,
  isNaverEnabled,
  NAVER_UNDER_REVIEW,
  selectOAuthFailureGuidance,
  type CommunityOAuthProvider,
  type OAuthLoginFailure
} from '@/shared/lib/supabase';
import { CommunityModal } from '@/components/community/CommunityModal';
import { SocialLoginButton } from '@/components/community/SocialLoginButton';
import {
  CopyFeedback,
  CopyLinkButton,
  FailureNotice,
  FailureTitle,
  InAppNotice,
  InAppTitle,
  ProviderList,
  Subtitle
} from './LoginModal.styled';

export type LoginModalProps = {
  onClose: () => void;
  onSelectProvider: (provider: CommunityOAuthProvider) => void;
  pending?: boolean;
  /** 직전 OAuth 콜백 실패 기록. 있으면 상단에 안내 배너(role=alert)를 띄운다. */
  failure?: OAuthLoginFailure | null;
};

/**
 * OAuth 콜백 실패 안내 카피 — **컴포넌트 로컬 상수**(copy.ts 로 승격하지 않음).
 * `NaverLoginErrorBanner` 의 `LOGIN_NUDGE_TEXT` 와 같은 선례다. copy.ts 에 자리가 생기면 이 상수를 교체.
 */
export const LOGIN_FAILURE_COPY = {
  /** 실패 배너 제목(role=alert). */
  title: '로그인이 완료되지 않았어요',
  /** 일반 실패(프로바이더 오류·취소 등) — 재시도로 풀릴 수 있는 경우. */
  generic: '로그인 도중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
  /**
   * 인앱 브라우저(카카오톡 등) 컨텍스트 분리로 세션이 만들어지지 않은 경우. 앱 안의 브라우저는
   * Safari·Chrome 과 저장소가 분리돼, 거기서 로그인이 완료돼도 사용자의 원래 브라우저엔 세션이 안 남는다.
   */
  inAppBrowser:
    '카카오톡 같은 앱 안의 화면에서는 로그인이 끝까지 완료되지 않을 수 있어요. 오른쪽 위 메뉴에서 “다른 브라우저로 열기”(Safari·Chrome)를 누른 뒤 다시 로그인해 주세요.',
  /**
   * **선제 안내 제목**(role=status). 모달이 열리자마자(실패를 겪기 전에) 인앱 브라우저면 띄운다 —
   * 인앱에서는 로그인 버튼을 눌러봐야 실패하므로 "먼저 외부 브라우저로 여세요"가 먼저 보여야 한다.
   */
  inAppPreemptiveTitle: '카카오톡 인앱 브라우저에서는 로그인이 막혀요',
  /** 현재 URL을 복사하는 버튼. 복사한 링크를 Safari·Chrome 에 붙여넣어 열도록 유도한다. */
  copyLink: '링크 복사하기',
  /** 복사 성공 피드백(aria-live). */
  copyLinkDone: '링크를 복사했어요. Safari·Chrome 에 붙여넣어 열어 주세요.',
  /** 클립보드 접근이 막힌 경우(권한·미지원) 폴백 안내. */
  copyLinkFailed: '링크 복사가 안 됐어요. 주소창의 링크를 직접 복사해 외부 브라우저에 붙여넣어 주세요.'
} as const;

/**
 * 경량 로그인 유도 모달. 순서: **구글 → 네이버 → 카카오**.
 * 3버튼 모두 공용 `SocialLoginButton`으로 브랜드 규정색·로고·카피를 통일한다.
 *
 * ## 인앱 브라우저 선제 안내 (카카오톡 등 무한 루프 차단)
 * 카카오톡 같은 인앱 브라우저(WKWebView)는 Safari·Chrome 과 저장소가 분리돼, 거기서 OAuth 를 끝내도
 * 세션이 원래 브라우저에 안 남아 **로그인→실패→재로그인 루프**가 된다. flowType 으로 못 고치는 구조적
 * 한계라 유일한 실질 해법은 "외부 브라우저로 열기"다. 그래서 모달이 **열리는 즉시**(실패를 겪기 전에)
 * `detectInAppBrowser(navigator.userAgent)` 로 인앱을 판정해, 인앱이면 링크 복사 버튼이 달린 선제
 * 안내(role=status)를 로그인 버튼 위에 띄운다. 일반 브라우저('none')면 아무 변화 없이 기존 동작 그대로다.
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
export default function LoginModal({ onClose, onSelectProvider, pending, failure }: LoginModalProps) {
  // ⚠ 훅은 최상단에서 무조건 호출한다(단축평가 뒤로 숨기지 않는다 — 프로덕션 死 이력).
  // 모달이 열리는 시점의 UA 로 인앱 브라우저를 판정한다(SSR·테스트에서 navigator 부재 방어).
  const inAppBrowser = useMemo(
    () => detectInAppBrowser(typeof navigator === 'undefined' ? '' : navigator.userAgent),
    []
  );
  const isInAppBrowser = inAppBrowser !== 'none';

  // 링크 복사 결과 피드백. 잠깐 뒤 자동 소멸(usePostShare 토스트와 동일 타이밍 정신).
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => {
    if (copyState === 'idle') return;
    const timer = window.setTimeout(() => setCopyState('idle'), 2200);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const handleCopyLink = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
        await navigator.clipboard.writeText(url);
        setCopyState('copied');
        return;
      }
      setCopyState('failed');
    } catch {
      setCopyState('failed');
    }
  }, []);

  // 인앱 브라우저 컨텍스트 분리가 의심되면 "다른 브라우저로 열기"를, 아니면 일반 재시도 안내를 보인다.
  const failureGuidance = failure ? selectOAuthFailureGuidance(failure) : null;
  // 인앱이면 위 선제 배너가 이미 같은 안내를 하므로, 실패 배너의 인앱 안내는 중복이라 접는다.
  // (generic 실패는 선제 배너가 담지 않는 정보라 그대로 노출 — 선제/실패 안내가 공존한다.)
  const failureMessage =
    failure && !(isInAppBrowser && failureGuidance === 'in-app-browser')
      ? failureGuidance === 'in-app-browser'
        ? LOGIN_FAILURE_COPY.inAppBrowser
        : LOGIN_FAILURE_COPY.generic
      : null;

  return (
    <CommunityModal title={COMMUNITY_COPY.login.title} onClose={onClose} align="center">
      {isInAppBrowser ? (
        <InAppNotice role="status" aria-label="인앱 브라우저 로그인 안내">
          <InAppTitle>{LOGIN_FAILURE_COPY.inAppPreemptiveTitle}</InAppTitle>
          {LOGIN_FAILURE_COPY.inAppBrowser}
          <div>
            <CopyLinkButton type="button" onClick={handleCopyLink}>
              {LOGIN_FAILURE_COPY.copyLink}
            </CopyLinkButton>
          </div>
          {copyState !== 'idle' ? (
            <CopyFeedback aria-live="polite">
              {copyState === 'copied' ? LOGIN_FAILURE_COPY.copyLinkDone : LOGIN_FAILURE_COPY.copyLinkFailed}
            </CopyFeedback>
          ) : null}
        </InAppNotice>
      ) : null}
      {failureMessage ? (
        <FailureNotice role="alert">
          <FailureTitle>{LOGIN_FAILURE_COPY.title}</FailureTitle>
          {failureMessage}
        </FailureNotice>
      ) : null}
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
          // env 미설정 → '준비 중', env 있으나 네이버 앱 심사 통과 전(NAVER_UNDER_REVIEW) → '검수중'.
          // 두 경우 모두 pending(딤+배지+안내) 이고 클릭은 무동작 — 실패하는 로그인을 사용자가 시도하지 않게 한다.
          pending={!isNaverEnabled || NAVER_UNDER_REVIEW}
          pendingBadgeLabel={
            isNaverEnabled && NAVER_UNDER_REVIEW ? COMMUNITY_COPY.login.naverReviewBadge : undefined
          }
          pendingHintText={isNaverEnabled && NAVER_UNDER_REVIEW ? COMMUNITY_COPY.login.naverReview : undefined}
          onClick={() => {
            if (isNaverEnabled && !NAVER_UNDER_REVIEW) onSelectProvider('naver');
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
