import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

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

  /* 히트 영역 44px 확장 */
  position: relative;
  &::before {
    content: '';
    position: absolute;
    inset: 50% auto auto 50%;
    width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
  }

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
