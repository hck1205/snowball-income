import styled from '@emotion/styled';
import { color, elevation as elevationToken, font, radius, space } from '@/shared/styles';
import type { CardElevation } from './Card.types';

export const CardContainer = styled.section<{ elevation: CardElevation }>`
  background: ${color.surface};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  padding: clamp(16px, 1.8vw, 20px);
  box-shadow: ${({ elevation }) => elevationToken[elevation]};
  color: ${color.text};
  min-width: 0;
  width: 100%;
  content-visibility: auto;
  contain-intrinsic-size: 280px;
  contain: layout paint style;
`;

export const CardHeader = styled.div<{ inlineTitleRight?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ inlineTitleRight }) => (inlineTitleRight ? 'flex-start' : 'space-between')};
  gap: ${space[2]};
  margin: 0 0 ${space[4]};
  min-height: 28px;
`;

export const CardTitleGroup = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const CardTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
`;

export const CardSubtitle = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
`;
