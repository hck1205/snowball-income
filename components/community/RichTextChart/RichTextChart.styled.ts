import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 차트 + "표로 보기" 한 덩어리(2026-11-10). 차트가 크기 비교를, 펼친 표가 정확한 숫자를 말한다.
 * 예전에는 차트 아래 같은 숫자의 표가 늘 펼쳐져 있어 글이 두 배로 길었다.
 */
export const ChartBlock = styled.figure`
  margin: 0 0 ${space[5]};
`;

/** 차트 높이는 데이터가 정한다(가로 막대는 항목 수에 비례 — `richChartHeight`). */
export const ChartFrame = styled('div', { shouldForwardProp: (prop) => prop !== 'chartHeight' })<{ chartHeight: number }>`
  height: ${({ chartHeight }) => chartHeight}px;
`;

/** 표 펼치기. 링크가 아니라 같은 자리의 표시를 바꾸는 버튼이다(aria-expanded 로 상태를 말한다). */
export const TableToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  margin-top: ${space[2]};
  padding: ${space[1]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: transparent;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  cursor: pointer;
  transition: border-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.borderStrong};
    color: ${color.text};
  }
`;

export const ToggleCaret = styled.span<{ open: boolean }>`
  display: inline-block;
  transition: transform ${motion.fast} ${motion.ease};
  transform: rotate(${({ open }) => (open ? '180deg' : '0deg')});
`;
