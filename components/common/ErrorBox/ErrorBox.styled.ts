import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

export const ErrorBox = styled.div`
  display: grid;
  gap: ${space[1]};
  border: 1px solid ${color.dangerBorder};
  border-left: 3px solid ${color.danger};
  border-radius: ${radius.sm};
  padding: ${space[3]};
  margin-top: ${space[3]};
  background: ${color.dangerSurface};
  color: ${color.danger};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  /*
   * 오류 문구는 'div' 안에 문자열로 직접 들어오는 경우가 많아 전역 'text-wrap: pretty'
   * (요소 선택자 'p,li,dd,…')를 못 받는다. 실패 문구는 마지막 줄에 낱말 하나만 남으면
   * 특히 조급해 보인다 — 여기서 건다. ⚠ 'keep-all' 금지(한국어 산문 관례 + 가로 넘침).
   */
  text-wrap: pretty;

  p {
    margin: 0;
  }
`;
