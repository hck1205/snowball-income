import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';
import { MEASURE } from './metrics';

/* -------------------------------------------------------------------------- */
/* 마무리 고지                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * 고지문. 🔴 `footer` 가 아니라 `section` 이다 — 이 페이지는 이제 공용 `PageFooter` 를 달았고,
 * 문서에 footer 랜드마크가 둘이면 스크린리더 사용자가 어느 쪽이 사이트 푸터인지 알 수 없다.
 */
export const Disclaimer = styled.section`
  display: grid;
  gap: ${space[2]};
  padding-top: ${space[5]};
  border-top: 1px solid ${color.border};
`;

export const DisclaimerText = styled.p`
  margin: 0;
  max-width: ${MEASURE};
  font-size: ${font.size.xs};
  line-height: ${font.leading.relaxed};
  color: ${color.textMuted};
`;

export const UpdatedAt = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  ${font.numeric};
`;
