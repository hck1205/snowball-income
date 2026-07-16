import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

export const SimBadgeRoot = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  border: 1px solid ${color.brandBorder};
  color: ${color.brandText};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  flex: 0 0 auto;
`;
