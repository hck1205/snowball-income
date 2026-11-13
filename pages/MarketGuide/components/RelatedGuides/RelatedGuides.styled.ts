import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

export const RelatedSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
  margin-top: ${space[4]};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;
