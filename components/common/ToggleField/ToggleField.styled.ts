import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 라벨 줄만 책임진다.
 * 스위치 트랙/썸/체크박스 스타일은 `Toggle` 프리미티브(`components/common/Toggle`)로 옮겼다.
 */

export const ToggleLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  min-height: 32px;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  font-weight: ${font.weight.medium};
`;

export const ToggleHeader = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
`;

/**
 * 도움말 버튼. 시각적으로는 18px 원이지만 ::before로 44x44 히트 영역을 깔아
 * 레이아웃을 바꾸지 않으면서 터치 타겟(WCAG 2.5.5)을 확보한다.
 */
export const HelpButton = styled.button`
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
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
  }

  &:hover {
    background: ${color.brandSubtle};
    border-color: ${color.brandBorder};
    color: ${color.brandText};
  }
`;
