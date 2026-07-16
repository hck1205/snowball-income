import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, motion, radius, shadow, space } from '@/shared/styles';

export const CardLink = styled(Link)`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
  padding: ${space[4]};
  border-radius: ${radius.lg};
  border: 1px solid ${color.border};
  background: ${color.surface};
  text-decoration: none;
  color: inherit;
  box-shadow: ${shadow.e1};
  transition: transform ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease};
  overflow: hidden;

  /* 좌측 브랜드 액센트 바 (호버 시) */
  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: ${color.brand};
    opacity: 0;
    transition: opacity ${motion.fast} ${motion.ease};
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${shadow.e2};
    border-color: ${color.brandBorder};
  }

  &:hover::before {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
`;

export const AuthorLine = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};

  b {
    font-weight: ${font.weight.semibold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const CardTitle = styled.h3`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.snug};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const CardSummary = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const CardBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
  margin-top: auto;

  time {
    color: ${color.textMuted};
    font-size: ${font.size.xs};
    white-space: nowrap;
  }
`;
