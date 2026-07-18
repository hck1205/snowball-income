import styled from '@emotion/styled';
import { color, font, radius, shadow, space, zIndex } from '@/shared/styles';

/** 공유 링크 복사 토스트. 배경/글자색은 토큰(다크에서도 안전). */
export const ShareToast = styled.div`
  position: fixed;
  top: ${space[4]};
  left: 50%;
  transform: translateX(-50%);
  z-index: ${zIndex.tooltip};
  background: ${color.text};
  color: ${color.surface};
  border-radius: ${radius.sm};
  padding: ${space[3]} ${space[4]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  box-shadow: ${shadow.e3};
`;
