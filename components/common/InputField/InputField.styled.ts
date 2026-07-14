import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

export const FieldLabel = styled.label`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
`;

export const LabelRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

/**
 * 도움말 버튼. 시각적으로는 18px 원이지만, ::before로 44x44 히트 영역을 깔아
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

const controlBase = `
  width: 100%;
  min-width: 0;
  min-height: 40px;
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.sm};
  background-color: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.base};
  font-family: inherit;
  transition: border-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    border-color: ${color.brandBorder};
  }

  &:disabled {
    background: ${color.surfaceSunken};
    color: ${color.textMuted};
    cursor: not-allowed;
  }
`;

export const BaseInput = styled.input`
  ${controlBase};
  padding: ${space[2]} ${space[3]};
  color: ${color.text};

  &[type='date'] {
    font-family: inherit;
  }

  &[type='date']::-webkit-datetime-edit,
  &[type='date']::-webkit-datetime-edit-text,
  &[type='date']::-webkit-datetime-edit-month-field,
  &[type='date']::-webkit-datetime-edit-day-field,
  &[type='date']::-webkit-datetime-edit-year-field {
    font: inherit;
    color: inherit;
  }

  /* 다크 모드에서 날짜 피커 아이콘이 검게 묻히는 것 방지 */
  &[type='date']::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: var(--sb-picker-filter, none);
  }
`;

export const BaseSelect = styled.select`
  ${controlBase};
  padding: ${space[2]} ${space[7]} ${space[2]} ${space[3]};
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
    linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position: calc(100% - 16px) calc(50% - 1px), calc(100% - 12px) calc(50% - 1px);
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
`;
