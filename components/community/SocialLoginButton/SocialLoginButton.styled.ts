import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';
import type { SocialProvider } from './SocialLoginButton.types';

/**
 * 프로바이더별 표면(배경·텍스트·테두리·hover/active).
 *
 * 여기 나오는 색은 **전부 브랜드 규정색 하드코딩 — 테마 무관**이다. 각 색은 공식
 * 가이드라인이 지정한 값이라 어떤 팔레트 프리셋/모드에서도 불변이어야 하고, 테마 토큰
 * (`--sb-*`)의 예외다(토큰화하면 규정색이 프리셋을 따라 바뀌어 규정 위반이 된다).
 *
 * `:not(:disabled):not([aria-disabled='true'])` 로 실제 disabled·네이버 준비중에는 hover가
 * 걸리지 않게 한다. (자기 요소 셀렉터라 vitest에서 안전 — Emotion **컴포넌트 셀렉터** 금지 규칙과 무관.)
 */
const providerSurface = (provider: SocialProvider): string => {
  switch (provider) {
    case 'google':
      return `
        background: #FFFFFF;                    /* 브랜드 규정색 — 테마 무관 */
        color: #1F1F1F;                         /* 브랜드 규정색 — 테마 무관 */
        border: 1px solid #747775;              /* 브랜드 규정색 — 구글 회색 테두리(밝은 배경 분리 필수 요소) */

        &:hover:not(:disabled):not([aria-disabled='true']) {
          background: #F8F9FA;                  /* 구글 hover 상태색 — 규정 */
        }
        &:active:not(:disabled):not([aria-disabled='true']) {
          background: #F1F3F4;                  /* 구글 active 상태색 — 규정 */
        }
      `;
    case 'kakao':
      return `
        background: #FEE500;                    /* 브랜드 규정색 — 테마 무관 */
        color: rgba(0, 0, 0, 0.85);            /* 브랜드 규정색 — 카카오 검정 85% 불투명 */
        border: 1px solid rgba(0, 0, 0, 0.1);  /* 밝은 배경 분리용 미세 외곽선(§5, 규정 배경색은 불변) */

        &:hover:not(:disabled):not([aria-disabled='true']) {
          filter: brightness(0.96);
        }
        &:active:not(:disabled):not([aria-disabled='true']) {
          filter: brightness(0.92);
        }
      `;
    case 'naver':
      return `
        background: #03C75A;                    /* 브랜드 규정색 — 테마 무관 */
        color: #FFFFFF;                         /* 브랜드 규정색 — 흰 텍스트 */
        border: 1px solid transparent;

        &:hover:not(:disabled):not([aria-disabled='true']) {
          filter: brightness(0.96);
        }
        &:active:not(:disabled):not([aria-disabled='true']) {
          filter: brightness(0.92);
        }
      `;
  }
};

/**
 * 3버튼 공통 규격 + 프로바이더별 규정색. 로고는 좌측 고정(absolute), 라벨은 중앙 정렬이라
 * 텍스트 길이가 달라도 3버튼의 로고 좌측선이 정확히 일치한다.
 */
export const Button = styled.button<{
  provider: SocialProvider;
  fullWidth: boolean;
  pending?: boolean;
}>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
  min-height: 48px;
  padding: 0 ${space[4]};
  border-radius: ${radius.md};
  font-family: inherit;
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color ${motion.fast} ${motion.ease}, filter ${motion.fast} ${motion.ease};

  ${({ provider }) => providerSurface(provider)}

  /* 포커스 링은 전역 :focus-visible(globalStyles, halo 포함)이 제공 — 버튼별 재정의 금지(스펙 §6). */

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* 네이버 준비중 — 규정색은 유지하되 딤 + 커서 기본(§3.3). 계약은 aria-disabled로 노출. */
  ${({ pending }) =>
    pending
      ? `
        opacity: 0.55;
        cursor: default;
      `
      : ''}
`;

/** 로고 좌측 고정 + 수직중앙(top/transform으로 견고화 — 정적 위치·렌더 의존 제거). */
export const Logo = styled.span`
  position: absolute;
  left: ${space[4]};
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

/** 네이버 준비중 "준비 중" 배지 — 우측 고정. */
export const PendingBadge = styled.span`
  position: absolute;
  right: ${space[4]};
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: rgba(0, 0, 0, 0.18);
  color: #ffffff;               /* 네이버 규정 흰색 — 테마 무관 */
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  line-height: 1.4;
`;

/** 준비중 버튼 + (클릭 시) 안내 문구를 세로로 묶는 래퍼. 버튼은 폭을 그대로 유지한다. */
export const PendingWrap = styled.div<{ fullWidth: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
`;

/**
 * 준비중 네이버 버튼을 눌렀을 때 뜨는 안내 문구. 규정색 예외인 버튼 표면과 달리 **일반 크롬 텍스트**라
 * 테마 토큰(textMuted)을 쓴다. copy 정본은 `login.naverPending`.
 */
export const PendingHint = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
  line-height: 1.5;
`;
