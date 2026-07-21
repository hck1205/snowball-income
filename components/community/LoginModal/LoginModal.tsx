import { COMMUNITY_COPY } from '@/shared/constants/community';
import {
  isNaverEnabled,
  NAVER_UNDER_REVIEW,
  selectOAuthFailureGuidance,
  type CommunityOAuthProvider,
  type OAuthLoginFailure
} from '@/shared/lib/supabase';
import { CommunityModal } from '@/components/community/CommunityModal';
import { SocialLoginButton } from '@/components/community/SocialLoginButton';
import { FailureNotice, FailureTitle, ProviderList, Subtitle } from './LoginModal.styled';

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
    '카카오톡 같은 앱 안의 화면에서는 로그인이 끝까지 완료되지 않을 수 있어요. 오른쪽 위 메뉴에서 “다른 브라우저로 열기”(Safari·Chrome)를 누른 뒤 다시 로그인해 주세요.'
} as const;

/**
 * 경량 로그인 유도 모달. 순서: **구글 → 네이버 → 카카오**.
 * 3버튼 모두 공용 `SocialLoginButton`으로 브랜드 규정색·로고·카피를 통일한다.
 *
 * ## 인앱 브라우저 실패 안내 (사후, 안전망)
 * 카카오톡 같은 인앱 브라우저(WKWebView)는 Safari·Chrome 과 저장소가 분리돼, 거기서 OAuth 를 끝내도
 * 세션이 원래 브라우저에 안 남을 수 있다. 이건 `failure` 기록이 있고 `selectOAuthFailureGuidance` 가
 * `'in-app-browser'` 로 분류할 때만 실패 배너(role=alert)로 "다른 브라우저로 열기"를 안내한다 —
 * **모달을 여는 즉시 겁주는 선제 안내는 두지 않는다**(실제 원인은 인앱이 아니라 프로필 avatar_url
 * CHECK 제약 위반이었고 DB 마이그레이션으로 해소됨 — 선제 배너는 정상 로그인을 막힌다고 오안내했다).
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
  // 실제 로그인 실패 기록이 있을 때만 안내한다 — 인앱 컨텍스트 분리가 의심되면 "다른 브라우저로 열기"를,
  // 아니면 일반 재시도 안내를 보인다. (선제 안내 없음 — 정상 로그인을 막힌다고 오안내하지 않게.)
  const failureGuidance = failure ? selectOAuthFailureGuidance(failure) : null;
  const failureMessage = failure
    ? failureGuidance === 'in-app-browser'
      ? LOGIN_FAILURE_COPY.inAppBrowser
      : LOGIN_FAILURE_COPY.generic
    : null;

  return (
    <CommunityModal title={COMMUNITY_COPY.login.title} onClose={onClose} align="center">
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
