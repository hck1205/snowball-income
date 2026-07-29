import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 라벨 없는 인라인 수량 입력. 표 셀 안에 들어가므로 폭을 스스로 제한하고(140px) 값은 오른쪽 정렬한다 —
 * 열의 숫자가 같은 세로선에서 끝나야 위아래를 비교할 수 있다.
 */
export const QuantityRoot = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
  max-width: 140px;
`;

export const QuantityField = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 40px;
  box-sizing: border-box;
  padding: ${space[2]} calc(${space[3]} + 1.6em) ${space[2]} ${space[3]};
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.sm};
  background-color: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.base};
  font-family: inherit;
  text-align: right;
  ${font.numeric}
  transition: border-color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    border-color: ${color.brandBorder};
  }

  &:disabled {
    background: ${color.surfaceSunken};
    color: ${color.textMuted};
    cursor: not-allowed;
  }
`;

/** 단위 표기('주'). 값의 일부가 아니라 장식이라 클릭이 입력으로 통과한다. */
export const QuantityUnit = styled.span`
  position: absolute;
  right: ${space[3]};
  color: ${color.textMuted};
  font-size: ${font.size.sm};
  line-height: 1;
  pointer-events: none;
`;
