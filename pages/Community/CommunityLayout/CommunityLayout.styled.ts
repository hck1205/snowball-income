import styled from '@emotion/styled';
import { color, font, radius, space, zIndex } from '@/shared/styles';

export const LayoutRoot = styled.div`
  min-height: 100vh;
  background: ${color.bg};
  color: ${color.text};
`;

export const SkipLink = styled.a`
  position: fixed;
  top: -100px;
  left: ${space[3]};
  z-index: ${zIndex.skipLink};
  padding: ${space[2]} ${space[4]};
  border-radius: ${radius.sm};
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-decoration: none;
  transition: top 150ms ease;

  &:focus {
    top: ${space[3]};
  }
`;

export const CommunityMain = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(${space[4]}, 3vw, ${space[6]}) clamp(${space[3]}, 4vw, ${space[5]}) ${space[16]};
`;
