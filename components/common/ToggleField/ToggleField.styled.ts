import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 라벨 줄만 책임진다.
 * 스위치 트랙/썸/체크박스 스타일은 `Toggle` 프리미티브(`components/common/Toggle`)로 옮겼다.
 */

/**
 * 배치는 이 한 곳이 정본이다 — 호출부는 `stacked` 불리언만 준다.
 *
 * - 기본(한 줄): 라벨 좌 · 스위치 우. `min-height`로 이웃 폼 행과 높이를 맞춘다.
 * - `stacked`(두 줄): 라벨 위 · 스위치 아래, 좌측 정렬. **가로 폭을 아끼는 배치**라
 *   `min-height`를 걸지 않는다(걸면 아낀 세로를 도로 쓴다).
 */
export const ToggleLabel = styled.div<{ $stacked?: boolean }>`
  display: flex;
  gap: ${({ $stacked }) => ($stacked ? space[1] : space[3])};
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  font-weight: ${font.weight.medium};

  ${({ $stacked }) =>
    $stacked
      ? `
    flex-direction: column;
    align-items: flex-start;
  `
      : `
    align-items: center;
    justify-content: space-between;
    min-height: 32px;
  `}
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
