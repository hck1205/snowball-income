import { useId, useState } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { PROVIDER_MARK } from './SocialLoginButton.marks';
import { Button, Logo, PendingBadge, PendingHint, PendingWrap } from './SocialLoginButton.styled';
import type { SocialLoginButtonProps, SocialProvider } from './SocialLoginButton.types';

const LABEL: Record<SocialProvider, string> = {
  google: COMMUNITY_COPY.login.google,
  kakao: COMMUNITY_COPY.login.kakao,
  naver: COMMUNITY_COPY.login.naver
};

/**
 * 소셜 로그인 버튼 — 구글 / 카카오 / 네이버 3사 공식 가이드라인 표준.
 *
 * 하나의 컴포넌트가 규정색·인라인 SVG 로고·정본 카피를 조립한다(단일 출처 = 규정 준수의 전제).
 * 접근명은 라벨 텍스트로 충분하므로(로고는 aria-hidden) 별도 aria-label을 두지 않는다 —
 * 오히려 텍스트 라벨을 덮어 AT 표기가 어긋난다. 포커스 링은 전역 `:focus-visible`(프리셋 브랜드색)
 * 을 쓰고 버튼별로 재정의하지 않는다.
 *
 * 네이버는 **config-gated 실연동**이다: `VITE_NAVER_CLIENT_ID` 가 있으면 구글·카카오와 같은 경로로
 * 로그인하고, 없으면 호출부가 `pending`으로 넘겨 준비중 상태(딤 + "준비 중" 배지 + aria-disabled)를
 * 표시한다. 준비중이어도 클릭은 유지한다 — 무동작(무음) 대신, 클릭하면 정본 `login.naverPending`
 * 안내를 띄워 왜 진행되지 않는지 알린다(호출부가 `describedById`로 자기 안내를 소유하면 그쪽에 맡긴다).
 */
export default function SocialLoginButton({
  provider,
  onClick,
  disabled = false,
  pending = false,
  fullWidth = true,
  describedById,
  pendingBadgeLabel,
  pendingHintText
}: SocialLoginButtonProps) {
  const Mark = PROVIDER_MARK[provider];
  const [pendingHintShown, setPendingHintShown] = useState(false);
  const generatedHintId = useId();

  // 준비중인데 호출부가 자기 안내(describedById)를 주지 않은 경우에만 컴포넌트가 안내를 소유한다.
  const ownsPendingHint = pending && !describedById;
  const showInternalHint = ownsPendingHint && pendingHintShown;

  const handleClick = () => {
    // 준비중 클릭은 예전에 무동작(무음)이었다 — 안내를 띄워 사유를 드러낸다(무음 실패 금지).
    if (ownsPendingHint) setPendingHintShown(true);
    onClick();
  };

  const button = (
    <Button
      type="button"
      provider={provider}
      fullWidth={fullWidth}
      pending={pending}
      disabled={disabled}
      aria-disabled={pending || undefined}
      aria-describedby={describedById ?? (showInternalHint ? generatedHintId : undefined)}
      onClick={handleClick}
    >
      <Logo>
        <Mark />
      </Logo>
      {LABEL[provider]}
      {pending ? <PendingBadge>{pendingBadgeLabel ?? COMMUNITY_COPY.login.naverPendingBadge}</PendingBadge> : null}
    </Button>
  );

  if (!showInternalHint) return button;

  return (
    <PendingWrap fullWidth={fullWidth}>
      {button}
      <PendingHint id={generatedHintId} role="status">
        {pendingHintText ?? COMMUNITY_COPY.login.naverPending}
      </PendingHint>
    </PendingWrap>
  );
}
