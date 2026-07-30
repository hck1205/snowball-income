import styled from '@emotion/styled';
import { color, font, hitAreaWithin, motion, radius, space } from '@/shared/styles';

export const CompactSummaryHelpButton = styled.button`
  position: relative;
  flex: 0 0 auto;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.textSecondary};
  border-radius: ${radius.pill};
  width: 18px;
  height: 18px;
  line-height: 1;
  padding: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  font-family: inherit;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  /*
   * 시각 크기는 유지하고 히트 영역만 넓힌다.
   *
   * 🔴 2026-07-30 까지 무조건 44×44 였다. 이 버튼은 8px 격자 안에 산다
   * ('ResultSummaryCard.styled.ts' · 'SaleTaxCard.styled.ts' 의 'gap: space[2]') — 18px 원에
   * 44px 히트 영역을 걸면 위아래 이웃 줄을 13px 씩 덮는다(같은 기하로 'InputField' 도움말이
   * 아래 입력칸 상단을 먹고 있었다). 44px 는 상한이 아니라 희망값이다.
   */
  ${hitAreaWithin(space[2])}

  &:hover {
    background: ${color.brandSubtle};
    border-color: ${color.brandBorder};
    color: ${color.brandText};
  }
`;
