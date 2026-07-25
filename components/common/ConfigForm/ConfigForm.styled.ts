import styled from '@emotion/styled';
import { color, container, space } from '@/shared/styles';

export const ConfigFormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${space[3]};
`;

export const ConfigInputGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${space[3]};

  ${container.between('mobileWide', 'layout')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${space[3]} ${space[4]};
  }
`;

export const ConfigSectionDivider = styled.hr`
  border: 0;
  border-top: 1px solid ${color.border};
  width: 100%;
  margin: ${space[1]} auto ${space[2]};
`;
