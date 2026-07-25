import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

export const ErrorBox = styled.div`
  display: grid;
  gap: ${space[1]};
  border: 1px solid ${color.dangerBorder};
  border-left: 3px solid ${color.danger};
  border-radius: ${radius.sm};
  padding: ${space[3]};
  margin-top: ${space[3]};
  background: ${color.dangerSurface};
  color: ${color.danger};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};

  p {
    margin: 0;
  }
`;
