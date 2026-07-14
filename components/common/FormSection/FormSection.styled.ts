import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

export const Section = styled.section`
  display: grid;
  gap: ${space[3]};
`;

export const SectionTitle = styled.h3`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.01em;
`;
