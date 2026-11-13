import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, radius, space } from '@/shared/styles';

/** 은퇴 후 건강보험 — 피부양자 판정 배지 · 다음 계산기로 가는 링크. */
export const StatusBadge = styled('span', { shouldForwardProp: (prop) => prop !== 'tone' })<{ tone: 'ok' | 'warn' }>`
  justify-self: start;
  display: inline-flex;
  align-items: center;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  border: 1px solid ${({ tone }) => (tone === 'warn' ? color.accentBorder : color.brandBorder)};
  background: ${({ tone }) => (tone === 'warn' ? color.accentSubtle : color.brandSubtle)};
  color: ${({ tone }) => (tone === 'warn' ? color.accentText : color.brandText)};
`;

export const LinkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[3]};
`;

export const SecondaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-decoration: none;

  &:hover {
    border-color: ${color.borderStrong};
  }
`;

export const Strong = styled.p`
  margin: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;
