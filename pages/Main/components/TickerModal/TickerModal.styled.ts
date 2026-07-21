import styled from '@emotion/styled';
import { ModalBody } from '@/pages/Main/Main.shared.styled';
import { color, font, space } from '@/shared/styles';

/** 기존 인라인 `style={{ fontSize: '12px' }}`를 대체하는 보조 설명문. */
export const ModalCaption = styled(ModalBody)`
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

/**
 * 한 필드 + 그 필드를 설명하는 캡션을 한 그리드 셀로 묶는다.
 * 기대 총수익률(자동계산 필드) 바로 아래에 "총수익률 X% (배당+성장)" 근거를 붙이기 위한 것 —
 * 폼 맨 아래 푸터로 두지 않고 설명 대상 필드에 시각적으로 결합한다.
 */
export const FieldWithCaption = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;
