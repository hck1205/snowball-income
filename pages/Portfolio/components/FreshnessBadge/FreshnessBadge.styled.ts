import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';
import type { PortfolioFreshnessTone } from './FreshnessBadge.types';

/**
 * 톤은 **대비가 검증된 토큰 쌍**만 쓴다(`shared/styles/contrast.test.ts`):
 * warning/warning-surface · accent-alt-text/accent-alt-subtle.
 * 색은 보조일 뿐이고 **텍스트가 사실을 전부 말한다**(색 단독 전달 금지).
 */
const TONE_COLOR: Record<PortfolioFreshnessTone, string> = {
  'stale-price': color.warning,
  manual: color.accentAltText
};

const TONE_BACKGROUND: Record<PortfolioFreshnessTone, string> = {
  'stale-price': color.warningSurface,
  manual: color.accentAltSubtle
};

const TONE_BORDER: Record<PortfolioFreshnessTone, string> = {
  'stale-price': `1px solid ${color.warningSurface}`,
  manual: `1px solid ${color.accentAltBorder}`
};

export const FreshnessBadgeRoot = styled.span<{ $tone: PortfolioFreshnessTone }>`
  display: inline-block;
  padding: 0 ${space[2]};
  border: ${({ $tone }) => TONE_BORDER[$tone]};
  border-radius: ${radius.pill};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  color: ${({ $tone }) => TONE_COLOR[$tone]};
  background: ${({ $tone }) => TONE_BACKGROUND[$tone]};
`;
