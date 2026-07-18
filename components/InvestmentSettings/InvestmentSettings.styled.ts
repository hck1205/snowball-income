import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/** 기존 인라인 style 속성을 그대로 옮겨온 것 (마크업/동작 변화 없음). */

export const ReinvestRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
`;

export const ReinvestLabel = styled.span`
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  font-weight: ${font.weight.medium};
`;

export const ReinvestControls = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

export const ReinvestPercentField = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
`;

export const ReinvestPercentInput = styled.input`
  width: 64px;
  height: 32px;
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.sm};
  padding: 0 ${space[2]};
  font-size: ${font.size.sm};
  font-family: inherit;
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  background: ${color.surface};
  text-align: right;
  transition: border-color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brandBorder};
  }
`;

export const ReinvestPercentSuffix = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
`;
