import styled from '@emotion/styled';
import { container, media } from '@/shared/styles';

export const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(250px, 320px) minmax(0, 1fr);
  gap: clamp(12px, 2vw, 20px);
  align-items: start;

  ${container.down('layout')} {
    grid-template-columns: 1fr;
  }

  ${media.down('layout')} {
    grid-template-columns: 1fr;
  }
`;
