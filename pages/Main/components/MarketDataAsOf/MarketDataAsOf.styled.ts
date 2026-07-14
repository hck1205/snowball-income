import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/**
 * 눈에 띄지 않게, 그러나 읽히게. `textMuted`(#64748b)는 앱 배경(#f2f5f8) 위에서 4.35:1 로
 * WCAG AA(4.5:1)에 못 미치므로 `textSecondary`를 쓴다(라이트 6.4:1, 다크 8.7:1).
 */
export const MarketDataFootnote = styled.footer`
  margin: 0;
  padding: 0 ${space[1]};
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  text-align: right;
`;

export const MarketDataDate = styled.time`
  ${font.numeric}
  font-weight: ${font.weight.medium};
`;
