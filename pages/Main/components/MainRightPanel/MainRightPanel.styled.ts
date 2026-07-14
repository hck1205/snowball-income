import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/** 기존 인라인 style 속성을 그대로 옮겨온 것 (마크업/동작 변화 없음). */

export const ProjectionControls = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

export const ProjectionYearField = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
`;

export const ProjectionYearSelect = styled.select`
  width: 64px;
  height: 32px;
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.sm};
  padding: 0 ${space[2]};
  font-size: ${font.size.xs};
  font-family: inherit;
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  background: ${color.surface};
  cursor: pointer;
  transition: border-color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brandBorder};
  }
`;

export const ProjectionYearSuffix = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;
