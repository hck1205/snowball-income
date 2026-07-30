import styled from '@emotion/styled';
import { color, font, hitArea, motion, radius, space } from '@/shared/styles';

export const LikeRoot = styled.button<{ liked: boolean; size: 'sm' | 'md' }>`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  height: ${({ size }) => (size === 'md' ? '36px' : '30px')};
  padding: 0 ${({ size }) => (size === 'md' ? space[3] : space[2])};
  border-radius: ${radius.pill};
  border: 1px solid ${({ liked }) => (liked ? color.danger : color.borderStrong)};
  background: ${({ liked }) => (liked ? color.dangerSurface : color.surface)};
  color: ${({ liked }) => (liked ? color.danger : color.textSecondary)};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  ${font.numeric}
  transition: background ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease};

  /*
   * 히트 영역 확장. 손코딩 'width/height: 44px' 였는데 이 버튼은 라벨(♥ + 개수)이 붙어
   * **44px 보다 넓다** — 고정 44px 은 히트 영역을 오히려 버튼보다 좁게 만들고 있었다.
   * 헬퍼는 'max(100%, 44px)' 라 시각 크기 이상을 보장한다.
   */
  ${hitArea()}

  &:hover:not(:disabled) {
    border-color: ${color.danger};
    color: ${color.danger};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  svg {
    flex: 0 0 auto;
  }
`;
