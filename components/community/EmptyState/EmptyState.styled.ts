import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

export const EmptyRoot = styled.div`
  display: grid;
  justify-items: center;
  gap: ${space[3]};
  text-align: center;
  padding: clamp(${space[8]}, 8vw, ${space[16]}) ${space[5]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surfaceMuted};
`;

export const EmptyIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${color.brandSubtle};
  color: ${color.brandText};
`;

export const EmptyTitle = styled.p`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
`;

export const EmptySubtitle = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.normal};
`;
