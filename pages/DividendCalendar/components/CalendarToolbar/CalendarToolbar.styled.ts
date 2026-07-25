import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

export const ToolbarRoot = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  flex-wrap: wrap;
`;

/** `min-width`로 폭을 고정한다 — 월을 넘길 때마다 제목 폭이 흔들리면 버튼이 좌우로 뛴다. */
export const MonthTitle = styled.h2`
  margin: 0;
  min-width: 9ch;
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric}
`;

export const NavButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  border: 1px solid ${color.border};
  border-radius: ${radius.sm};
  background: ${color.surface};
  color: ${color.textSecondary};
  cursor: pointer;
  transition:
    background ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const TodayButton = styled.button`
  margin-left: auto;
  height: 40px;
  padding: 0 ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.sm};
  background: ${color.surface};
  color: ${color.textSecondary};
  font-family: inherit;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  transition:
    background ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  &:disabled {
    color: ${color.textMuted};
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;
