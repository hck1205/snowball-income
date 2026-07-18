import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 하이드레이션 홀딩용 로더 컨테이너.
 *
 * 무성의한 회색 박스가 아니라 앱의 muted 카드(테두리 + surfaceMuted)와 같은 결에,
 * 브랜드 스피너를 얹은 "정돈된" 전환 UI다. 실제 콘텐츠도 이 톤의 카드로 채워지므로
 * 로더 → 콘텐츠 교체가 튀지 않는다. `minHeight`로 대략적인 자리만 예약해 시프트를 줄인다.
 */
export const LoaderWrap = styled.div<{ minHeight?: string }>`
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

  /* 전역 reduced-motion 리셋은 transition만 덮는다 — 키프레임 애니메이션은 여기서 완만하게 늦춘다. */
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 1.6s;
  }
`;

export const LoaderLabel = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
  letter-spacing: -0.01em;
`;
