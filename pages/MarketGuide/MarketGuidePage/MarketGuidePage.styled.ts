import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

export const GuideStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[5]};
  padding-bottom: ${space[7]};
`;

export const Emphasis = styled.strong`
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const Note = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;

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
