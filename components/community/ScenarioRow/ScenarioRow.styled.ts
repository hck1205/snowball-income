import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, media, motion, space } from '@/shared/styles';

export const RowLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  padding: ${space[3]} ${space[2]};
  border-bottom: 1px solid ${color.border};
  text-decoration: none;
  color: inherit;
  transition: background ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }
`;

export const RowMain = styled.span`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  flex: 1 1 auto;
`;

export const RowTitle = styled.span`
  min-width: 0;
  color: ${color.text};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RowAuthor = styled.span`
  flex: 0 0 auto;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  ${media.down('mobileWide')} {
    display: none;
  }
`;

export const RowRight = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[3]};
  flex: 0 0 auto;

  time {
    color: ${color.textMuted};
    font-size: ${font.size.xs};
    white-space: nowrap;

    ${media.down('mobileWide')} {
      display: none;
    }
  }
`;
