import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

export const SeriesFilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[3]};
  margin-bottom: ${space[3]};
  align-items: center;
  justify-content: space-between;
`;

export const SeriesFilterGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[3]};
`;

export const SeriesFilterItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

export const SeriesFilterLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  min-height: 32px;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
  cursor: pointer;
  user-select: none;
`;

export const SeriesFilterCheckbox = styled.input`
  margin: 0;
  width: 16px;
  height: 16px;
  accent-color: ${color.brand};
  cursor: pointer;
`;
