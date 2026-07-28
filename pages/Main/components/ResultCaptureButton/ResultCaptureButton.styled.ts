import styled from '@emotion/styled';
import { color, font, radius, shadow, space, zIndex } from '@/shared/styles';

/** 버튼과 실패 알림을 함께 쥐는 자리. 알림은 흐름 밖(절대 배치)이라 컨트롤 줄 높이를 흔들지 않는다. */
export const CaptureSlot = styled.div`
  position: relative;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
`;

/**
 * 실패 안내. 컨트롤 줄은 결과 그리드 바로 위 한 줄이라, 여기서 높이가 늘면 아래 카드가 통째로 밀린다.
 * 그래서 흐름에서 빼고 버튼 아래에 띄운다. 우측 정렬은 "간략히" 토글 쪽으로 넘치지 않게 하는 장치다.
 */
export const CaptureFailureNote = styled.p`
  position: absolute;
  top: calc(100% + ${space[1]});
  right: 0;
  z-index: ${zIndex.dropdown};
  margin: 0;
  width: max-content;
  max-width: min(320px, 70vw);
  padding: ${space[2]} ${space[3]};
  border: 1px solid ${color.dangerBorder};
  border-radius: ${radius.md};
  /* 톤 조합은 Banner danger 와 같다(테두리=danger-border, 면=danger-surface, 글자는 중립 text). */
  background: ${color.dangerSurface};
  color: ${color.text};
  box-shadow: ${shadow.e2};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;
