import styled from '@emotion/styled';
import { color, font, hitAreaWithin, motion, radius, space } from '@/shared/styles';

/**
 * 라벨 줄만 책임진다.
 * 스위치 트랙/썸/체크박스 스타일은 `Toggle` 프리미티브(`components/common/Toggle`)로 옮겼다.
 */

/**
 * 라벨 좌 · 스위치 우 한 줄. `min-height` 는 이웃 폼 행과 높이를 맞춘다.
 *
 * ⚠ 한때 두 줄 배치(`stacked`)를 옵션으로 뒀다 — 좁은 폭 컨트롤 줄에서 가로를 아끼려는 것이었다.
 * 그 토글이 카드 헤더로 옮겨가면서 쓰는 곳이 없어져 제거했다(2026-07-29). 다시 필요하면
 * 그때 되살려라 — 쓰지 않는 배치 옵션은 화면마다 다른 토글을 만드는 입구가 된다.
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
 * 도움말 버튼. 시각적으로는 18px 원이지만 의사요소로 히트 영역을 깔아
 * 레이아웃을 바꾸지 않으면서 터치 타겟(WCAG 2.5.5)에 다가간다.
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

  /*
   * 🔴 2026-07-30 까지 무조건 44×44 였다 — 고친 'InputField' 도움말 버튼과 거의 글자 단위로 같은
   * 코드였고, 여기는 자리가 더 좁다: 이 버튼은 'min-height: 32px' 라벨 줄에 앉고 옆 스위치와의
   * 간격이 8px('ToggleHeader' gap)뿐이라 44px 히트 영역이 **라벨 텍스트와 스위치 양쪽을 덮었다.**
   *
   * 44px 는 상한이 아니라 희망값이다 — 이웃에 닿지 않는 선까지만 넓힌다.
   */
  ${hitAreaWithin(space[2])}

  &:hover {
    background: ${color.brandSubtle};
    border-color: ${color.brandBorder};
    color: ${color.brandText};
  }
`;
