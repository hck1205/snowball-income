import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/**
 * 눈에 띄지 않게, 그러나 읽히게. 당시의 `textMuted`는 앱 배경 위에서 WCAG AA(4.5:1)에
 * 못 미쳐 `textSecondary`를 쓴다 — 토큰 값이 바뀌어도 더 진한 단계라 항상 안전 마진이 있다.
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
