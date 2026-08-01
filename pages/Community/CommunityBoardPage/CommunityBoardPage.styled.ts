import styled from '@emotion/styled';
import { color, font, media, motion, radius, space } from '@/shared/styles';

/** 게시판 헤더 — 제목/설명(좌) + 글쓰기 CTA(우). */
export const BoardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${space[3]};
  margin-bottom: ${space[4]};
`;

export const BoardHeading = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

export const BoardTitle = styled.h1`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
`;

export const BoardSubtitle = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};

  ${media.down('mobileWide')} {
    display: none;
  }
`;

/**
 * 소프트 카드 피드(velog풍) — 각 행이 surface 카드로 뜨므로 세로 간격으로 리듬을 만든다.
 * 갤러리 InlineList와 같은 관례(PostRow 재사용).
 */
export const BoardList = styled.ul`
  list-style: none;
  margin: 0;
  padding: ${space[1]} 0 0;
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
`;

/** 무한스크롤 센티널. */
export const Sentinel = styled.div`
  min-height: 1px;
`;

export const LoadStatus = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${space[2]};
  padding: ${space[5]} 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;

export const Spinner = styled.span`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid ${color.border};
  border-top-color: ${color.brand};
  animation: board-spin 0.7s linear infinite;

  @keyframes board-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes board-busy-pulse {
    50% {
      opacity: 0.35;
    }
  }

  /*
   * 전역 리셋(globalStyles)이 'animation-duration: 0.01ms' 와 'animation-iteration-count: 1' 을
   * '!important' 로 걸어 이 링을 **첫 프레임에서 얼려 버린다.** 멈춘 링은 "더 불러오는 중"이 아니라
   * "여기서 끝"으로 읽힌다 — 로딩 표시가 정지 아이콘으로 굳으면 그건 거짓 상태다.
   * 회전이 아니라 불투명도 펄스로 되찾는다(전정계 안전, CloudSyncIndicator 와 같은 처방).
   * 옆 라벨('loadingMore')이 접근명 역할을 이미 하고 있어 색·모션이 유일한 채널은 아니다.
   */
  @media (prefers-reduced-motion: reduce) {
    animation-name: board-busy-pulse;
    animation-timing-function: ${motion.ease};
    animation-duration: 1.4s !important;
    animation-iteration-count: infinite !important;
  }
`;

export const InlineRetry = styled.button`
  border: 0;
  background: transparent;
  color: ${color.brandText};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  text-decoration: underline;

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const BannerAction = styled.div`
  margin-top: ${space[3]};
`;

export const ErrorWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 220px);
  padding: ${space[6]} ${space[4]};

  > * {
    width: 100%;
    max-width: 420px;
  }
`;

/* ── 스켈레톤 ─────────────────────────────────────────────────────────────── */

const shimmer = `
  background: linear-gradient(90deg, ${color.surfaceMuted} 25%, ${color.surfaceHover} 37%, ${color.surfaceMuted} 63%);
  background-size: 400% 100%;
  animation: board-shimmer 1.4s ease infinite;

  @keyframes board-shimmer {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }

  /*
   * 스켈레톤은 **정지가 정답**이다(스피너와 반대). 스켈레톤이 말하는 것은 "이 자리에 올 값이 아직
   * 없다"이고 그건 회색 막대의 *모양*이 통째로 말한다 — 되찾을 신호가 없으니 되찾지 않는다.
   * 다만 전역 리셋이 남기는 "0.01ms 1회" 잔상 대신 명시적으로 끈다(선례 ExchangeRateWidget).
   */
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const SkeletonRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  padding: ${space[3]} ${space[2]};
  border-bottom: 1px solid ${color.border};
`;

export const SkeletonLine = styled.div<{ w?: string; h?: string }>`
  width: ${({ w }) => w ?? '100%'};
  height: ${({ h }) => h ?? '14px'};
  border-radius: ${radius.xs};
  ${shimmer}
`;
