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
  /* 🔴 세로 시작 여백은 TickerPageShell 의 ShellMain · 시뮬레이터 FeatureLayout 과 **같은 값이어야 한다**
     (2026-08-02 실측: 이 값이 clamp(16px,3vw,24px) 이던 동안 1280 에서 본문 시작이 89px 대 113px 로
     갈려 커뮤니티만 24px 위에서 시작했다). 라우트를 옮길 때 본문 시작선이 튀면 안 된다. */
  padding: clamp(${space[5]}, 4vw, ${space[12]}) clamp(${space[3]}, 4vw, ${space[5]}) ${space[16]};
`;
