import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

export const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[4]};
  margin-top: ${space[4]};

  ${media.down('tablet')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ChartCard = styled.figure`
  margin: 0;
  padding: ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  min-width: 0;
`;

export const ChartCaption = styled.figcaption`
  margin: 0 0 ${space[2]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const ChartBox = styled.div`
  height: 260px;
`;
