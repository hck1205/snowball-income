import styled from '@emotion/styled';
import { color, font, radius, shadow, space, zIndex } from '@/shared/styles';

/** 버튼 + 실패 안내. 안내는 흐름 밖(절대 배치)이라 히어로 액션 줄 높이를 흔들지 않는다(캡처 버튼과 같은 규칙). */
export const ShareSlot = styled.div`
  position: relative;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
`;

export const ShareFailureNote = styled.p`
  position: absolute;
  top: calc(100% + ${space[1]});
  right: 0;
  z-index: ${zIndex.dropdown};
  margin: 0;
  width: max-content;
  max-width: min(280px, 80vw);
  padding: ${space[2]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.sm};
  background: ${color.surface};
  box-shadow: ${shadow.e2};
  font-size: ${font.size.xs};
  color: ${color.text};
`;
