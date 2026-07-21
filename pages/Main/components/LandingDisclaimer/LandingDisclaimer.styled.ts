import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/**
 * 랜딩 하단 상시 고지. 장식이 아니라 **법적 고지**이므로 muted 톤이되 항상 읽히게 둔다
 * (접힘·닫기 없음). `textSecondary`는 앱 배경 위에서 WCAG AA(4.5:1)를 만족한다
 * (MarketDataAsOf와 동일 근거). 위 콘텐츠와 얇은 상단 경계로만 구분한다.
 */
export const DisclaimerFooter = styled.footer`
  margin: 0;
  padding: ${space[3]} ${space[1]} 0;
  border-top: 1px solid ${color.border};
  color: ${color.textSecondary};
  text-align: center;
`;

export const DisclaimerText = styled.small`
  display: block;
  max-width: 60ch;
  margin: 0 auto;
  font-size: ${font.size.xs};
  line-height: ${font.leading.relaxed};
`;
