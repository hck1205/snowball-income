/**
 * 소셜 로그인 버튼 공용 타입.
 *
 * `SocialProvider`는 표시(브랜드) 관점의 유니온이라 네이버를 포함한다.
 * 동작(로그인) 관점의 `CommunityOAuthProvider`('google'|'kakao', auth.ts)와는 별개다 —
 * 이 컴포넌트는 표시만 하고, 클릭 핸들러가 라우팅한다(네이버는 준비중 경로).
 */
export type SocialProvider = 'google' | 'kakao' | 'naver';

export type SocialLoginButtonProps = {
  /** 브랜드 프로바이더 — 규정색·로고·카피를 결정한다. */
  provider: SocialProvider;
  /** 클릭 핸들러. 구글/카카오는 OAuth 시작, 네이버(준비중)는 안내 노출을 부른다. */
  onClick: () => void;
  /** 로그인 진행 중 등 — 실제 HTML disabled(상호작용 차단). */
  disabled?: boolean;
  /** 네이버 "준비 중" 표시 — aria-disabled + 딤 처리 + 배지, 클릭은 유지(안내 노출용). */
  pending?: boolean;
  /** 세로 스택에서 100% 폭. 기본 true. */
  fullWidth?: boolean;
  /** 준비중 안내 문구 요소의 id — 접근성 연결(aria-describedby). */
  describedById?: string;
  /** pending 배지 문구 override(기본 '준비 중'). 예: 네이버 검수중이면 '검수중'. */
  pendingBadgeLabel?: string;
  /** pending 클릭 시 뜨는 안내 문구 override(기본 naverPending). 예: 검수중 안내. */
  pendingHintText?: string;
};
