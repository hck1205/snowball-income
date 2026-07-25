import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

export const InlineField = styled.label`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
`;

export const InlineFieldHeader = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

/* InlineField 안의 셀렉트는 공용 프리미티브(`@/components/common` Select, 기본 size='lg')가 그린다. */
