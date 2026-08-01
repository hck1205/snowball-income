import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 하이드레이션 홀딩용 로더 컨테이너.
 *
 * 무성의한 회색 박스가 아니라 앱의 muted 카드(테두리 + surfaceMuted)와 같은 결에,
 * 브랜드 스피너를 얹은 "정돈된" 전환 UI다. 실제 콘텐츠도 이 톤의 카드로 채워지므로
 * 로더 → 콘텐츠 교체가 튀지 않는다. `minHeight`로 대략적인 자리만 예약해 시프트를 줄인다.
 */
export const LoaderWrap = styled.div<{ minHeight?: string; $variant?: 'plain' | 'result' }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${space[3]};
  width: 100%;
  min-height: ${({ minHeight }) => minHeight ?? '240px'};
  padding: ${space[6]} ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};

  /*
   * 결과 스켈레톤은 **자기가 카드를 그린다** — 껍데기가 또 하나의 카드면 카드 안의 카드가 된다
   * (공용 규칙: Card 안의 Card 금지). 그래서 이 자리에서는 껍데기의 면·테두리·가운데 정렬을 뺀다.
   */
  ${({ $variant }) =>
    $variant === 'result'
      ? `
    align-items: stretch;
    justify-content: flex-start;
    padding: 0;
    border: 0;
    background: transparent;
  `
      : ''}
`;

/* -------------------------------------------------------------------------- */
/* 결과 그리드 스켈레톤 (variant='result')                                       */
/* -------------------------------------------------------------------------- */

/**
 * **곧 올 화면의 모양**을 미리 그리는 껍데기. 회전하는 원은 "기다려라"까지만 말하지만
 * 스켈레톤은 "요약 카드 하나, 차트 하나, 표 하나가 온다"를 말한다.
 *
 * 껍데기는 실제 결과 그리드처럼 **세로로 쌓인 전 폭 카드**다(`MainResultGrid` 의 12열 배치는
 * 좁은 폭에서 1열로 접히고, 넓은 폭에서도 결과 카드는 대부분 12칸이다).
 * 여기서 굳이 12열 그리드를 흉내내면 실제 배치가 바뀔 때마다 두 곳을 함께 고쳐야 한다.
 */
export const SkeletonStack = styled.div`
  display: grid;
  gap: clamp(12px, 1.8vw, 20px);
  width: 100%;
`;

export const SkeletonCard = styled.div`
  display: grid;
  gap: ${space[3]};
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
`;

/** 요약 카드 안 지표 타일 줄 — 실제 `SummaryGrid` 와 같은 auto-fit 규칙. */
export const SkeletonTileRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(170px, 100%), 1fr));
  gap: ${space[2]};
`;

/**
 * 회색 막대 한 개.
 *
 * 🔴 **reduced-motion 에서 셔머를 되찾지 않는다** — 스켈레톤이 말하는 것은 "이 자리에 올 값이
 * 아직 없다"이고 그건 막대의 *모양*이 통째로 말한다(되찾아야 하는 것은 "아직 일하는 중"을
 * 말하는 스피너뿐이다 — `test/shared/reducedMotionCues.test.ts` 의 스피너/스켈레톤 경계).
 * 전역 리셋이 남기는 "0.01ms 1회" 잔상 대신 명시적으로 끈다.
 */
export const SkeletonBar = styled.div<{ $w?: string; $h?: string }>`
  width: ${({ $w }) => $w ?? '100%'};
  height: ${({ $h }) => $h ?? '14px'};
  border-radius: ${radius.xs};
  background: linear-gradient(
    90deg,
    ${color.surfaceMuted} 25%,
    ${color.surfaceHover} 37%,
    ${color.surfaceMuted} 63%
  );
  background-size: 400% 100%;
  animation: main-content-shimmer 1.4s ease infinite;

  @keyframes main-content-shimmer {
    0% {
      background-position: 100% 0;
    }
    100% {
      background-position: -100% 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** 브랜드 색 링 스피너 — 테마 토큰 기반이라 프리셋을 바꿔도 색이 따라온다. */
export const LoaderSpinner = styled.span`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 3px solid ${color.brandSubtle};
  border-top-color: ${color.brand};
  animation: main-content-spin 0.7s linear infinite;

  @keyframes main-content-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /*
   * 🔴 이 블록은 2026-07-30 까지 **아무 효과가 없었다.** 위 주석이 "전역 리셋은 transition만
   * 덮는다"고 말하는데 사실이 아니다 — 'globalStyles.ts' 는 'animation-duration: 0.01ms' 와
   * 'animation-iteration-count: 1' 을 **'!important' 로** 건다. 그래서 여기 1.6s 는 무시됐고,
   * reduced-motion 사용자의 스피너는 한 바퀴를 순식간에 돌고 **얼어붙었다.** "작업 중"이라는
   * 유일한 신호가 죽어 있었던 셈이다(라벨 텍스트가 있어 완전한 실패는 면했다).
   *
   * reduced-motion 은 "없애라"가 아니라 "완만하게"다 — '!important' 로 되찾아 느리게 돌린다.
   */
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 1.6s !important;
    animation-iteration-count: infinite !important;
  }
`;

export const LoaderLabel = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
  letter-spacing: -0.01em;
`;
