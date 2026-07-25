import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

type BadgeTone = 'pay' | 'ex' | 'unavailable';

const TONE_COLOR: Record<BadgeTone, string> = {
  pay: color.brandText,
  ex: color.textMuted,
  unavailable: color.textMuted
};

const TONE_BACKGROUND: Record<BadgeTone, string> = {
  pay: color.brandSubtle,
  ex: color.surfaceHover,
  unavailable: color.surfaceMuted
};

/**
 * 실측 / 추정 / 데이터 준비 중을 한 단어로 가르는 배지.
 * 색은 보조일 뿐이고 **텍스트가 정보를 전부 말한다**(색만으로 전달 금지).
 */
export const SourceBadgeRoot = styled.span<{ $tone: BadgeTone }>`
  display: inline-block;
  padding: 1px ${space[2]};
  border-radius: ${radius.pill};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  white-space: nowrap;
  color: ${({ $tone }) => TONE_COLOR[$tone]};
  background: ${({ $tone }) => TONE_BACKGROUND[$tone]};
`;
