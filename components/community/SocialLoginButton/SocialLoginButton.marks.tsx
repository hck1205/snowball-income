import type { FC } from 'react';
import type { SocialProvider } from './SocialLoginButton.types';

/**
 * 브랜드 공식 마크 — **인라인 SVG**(외부 요청 금지: CSP).
 *
 * 모든 색은 각 개발자센터 가이드가 지정한 **브랜드 규정색 하드코딩**이다(테마 토큰 예외).
 * 로고 색·비율 변경은 규정 위반이므로 건드리지 않는다. path 원본은 각 개발자센터 배포
 * 에셋이 정본이며, 형태를 바꿔야 할 일이 생기면 그쪽 공식 SVG와 대조해 교체한다.
 */
const MARK_ATTRS = {
  width: 18,
  height: 18,
  viewBox: '0 0 18 18',
  'aria-hidden': 'true',
  focusable: 'false'
} as const;

/** 구글 4색 "G" — #4285F4/#34A853/#FBBC05/#EA4335 (규정색, 변경 금지). */
const GoogleMark: FC = () => (
  <svg {...MARK_ATTRS}>
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
    />
    <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
    <path
      fill="#EA4335"
      d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
    />
  </svg>
);

/**
 * 카카오 말풍선 심볼 — 규정 검정 85% 불투명(`rgba(0,0,0,0.85)`) 고정.
 * (구 구현은 텍스트색 currentColor를 따라 다크에서 심볼이 밝아지는 위반이었음 → 하드코딩 교정.)
 */
const KakaoMark: FC = () => (
  <svg {...MARK_ATTRS}>
    <path
      fill="rgba(0, 0, 0, 0.85)"
      d="M9 1.5C4.86 1.5 1.5 4.14 1.5 7.4c0 2.12 1.42 3.98 3.55 5.02-.16.57-.58 2.1-.66 2.43-.1.4.15.4.31.29.13-.09 2.02-1.37 2.84-1.93.63.09 1.29.14 1.96.14 4.14 0 7.5-2.64 7.5-5.9S13.14 1.5 9 1.5Z"
    />
  </svg>
);

/**
 * 네이버 "N" — **흰 N path만**(그린 배경은 버튼이 담당, §3.3).
 * 구 마크는 자체 그린 rect를 포함했는데 그린 버튼 위에 얹으면 이중이라 rect를 제거했다.
 */
const NaverMark: FC = () => (
  <svg {...MARK_ATTRS}>
    <path fill="#FFFFFF" d="M11.137 9.418 6.701 3H3v12h3.863V8.582L11.299 15H15V3h-3.863z" />
  </svg>
);

export const PROVIDER_MARK: Record<SocialProvider, FC> = {
  google: GoogleMark,
  kakao: KakaoMark,
  naver: NaverMark
};
