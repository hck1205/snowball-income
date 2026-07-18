import styled from '@emotion/styled';
import { ModalBody } from '@/pages/Main/Main.shared.styled';
import { color, font } from '@/shared/styles';

/** 기존 인라인 `style={{ fontSize: '12px' }}`를 대체하는 보조 설명문. */
export const ModalCaption = styled(ModalBody)`
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;
