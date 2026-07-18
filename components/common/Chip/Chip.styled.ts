import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';
import type { ChipVariant } from './Chip.types';

/**
 * 티커 칩.
 *
 * 예전에는 밋밋한 아웃라인 버튼이라 "선택 가능한 토큰"이 아니라 그냥 작은 버튼처럼 보였다.
 * pill 형태 + 선택 시 브랜드 채움으로 "이건 붙였다 뗐다 하는 조각"이라는 걸 형태로 말한다.
 *
 * variant(§4.6): 정보 배지로 쓸 때만 오로라 틴트(accent/accentAlt). **선택 상태는 항상 brand** —
 * "선택=브랜드"라는 기존 학습을 variant가 침범하지 않는다.
 */

const VARIANT: Record<ChipVariant, { border: string; bg: string; text: string }> = {
  neutral: { border: color.border, bg: color.surface, text: color.textSecondary },
  accent: { border: color.accentBorder, bg: color.accentSubtle, text: color.accentText },
  accentAlt: { border: color.accentAltBorder, bg: color.accentAltSubtle, text: color.accentAltText }
};

export const ChipRoot = styled.span<{
  selected?: boolean;
  disabled?: boolean;
  interactive?: boolean;
  variant?: ChipVariant;
}>`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  max-width: 100%;
  min-height: 28px;
  padding: 0 ${space[1]} 0 ${space[3]};
  border: 1px solid ${({ selected, variant = 'neutral' }) => (selected ? color.brandBorder : VARIANT[variant].border)};
  border-radius: ${radius.pill};
  background: ${({ selected, variant = 'neutral' }) => (selected ? color.brandSubtle : VARIANT[variant].bg)};
  color: ${({ selected, variant = 'neutral' }) => (selected ? color.brandText : VARIANT[variant].text)};
  font-size: ${font.size.xs};
  font-weight: ${({ selected }) => (selected ? font.weight.bold : font.weight.medium)};
  opacity: ${({ disabled }) => (disabled ? 0.55 : 1)};
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};
`;

/** 칩 본체가 클릭 가능할 때. `<button>`으로 렌더된다. */
export const ChipButton = styled.button<{ selected?: boolean; hasRemove?: boolean; variant?: ChipVariant }>`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 28px;
  padding: 0 ${({ hasRemove }) => (hasRemove ? space[1] : space[3])} 0 ${space[3]};
  border: 1px solid ${({ selected, variant = 'neutral' }) => (selected ? color.brandBorder : VARIANT[variant].border)};
  border-radius: ${radius.pill};
  background: ${({ selected, variant = 'neutral' }) => (selected ? color.brandSubtle : VARIANT[variant].bg)};
  color: ${({ selected, variant = 'neutral' }) => (selected ? color.brandText : VARIANT[variant].text)};
  font-family: inherit;
  font-size: ${font.size.xs};
  font-weight: ${({ selected }) => (selected ? font.weight.bold : font.weight.medium)};
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    border-color: ${color.brandBorder};
    background: ${({ selected }) => (selected ? color.brandSubtleHover : color.surfaceHover)};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export const ChipLabel = styled.span`
  min-width: 0;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ChipRemove = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: ${radius.pill};
  background: transparent;
  color: currentColor;
  font-family: inherit;
  font-size: ${font.size.xs};
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease};

  /* 20px 원이지만 히트 영역은 44x44. */
  &::before {
    content: '';
    position: absolute;
    width: 44px;
    height: 44px;
  }

  position: relative;

  &:hover {
    background: ${color.brandSubtleHover};
  }
`;
