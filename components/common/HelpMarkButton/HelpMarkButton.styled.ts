import styled from '@emotion/styled';
import { color, font, hitAreaWithin, motion, radius, space } from '@/shared/styles';

export const HelpMarkButton = styled.button`
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${color.borderStrong};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  border-radius: ${radius.pill};
  width: 18px;
  height: 18px;
  line-height: 1;
  padding: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  font-family: inherit;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  /*
   * 시각 크기는 유지하고 히트 영역만 넓힌다 — 다만 **이웃을 침범하지 않는 선까지만**.
   * 종전 무조건 44px 은 이 버튼이 놓이는 곳(SeriesFilter 의 8px 간격 격자)에서 옆 라벨과
   * 위아래 줄을 물었다. 44 는 상한이 아니라 희망값이다.
   */
  ${hitAreaWithin(space[2])}

  &:hover {
    background: ${color.brandSubtle};
    border-color: ${color.brandBorder};
    color: ${color.brandText};
  }
`;
