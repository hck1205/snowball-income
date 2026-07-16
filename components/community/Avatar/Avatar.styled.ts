import styled from '@emotion/styled';
import { color, font } from '@/shared/styles';
import type { AvatarSize } from './Avatar.types';

const DIMENSION: Record<AvatarSize, string> = {
  sm: '24px',
  md: '32px',
  lg: '44px'
};

const FONT: Record<AvatarSize, string> = {
  sm: font.size['2xs'],
  md: font.size.sm,
  lg: font.size.lg
};

export const AvatarRoot = styled.span<{ size: AvatarSize }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: ${({ size }) => DIMENSION[size]};
  height: ${({ size }) => DIMENSION[size]};
  border-radius: 50%;
  overflow: hidden;
  background: ${color.brandSubtle};
  border: 1px solid ${color.brandBorder};
  color: ${color.brandText};
  font-size: ${({ size }) => FONT[size]};
  font-weight: ${font.weight.bold};
  line-height: 1;
  user-select: none;
`;

export const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;
