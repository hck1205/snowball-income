import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 필드 한 칸(라벨 줄 + 컨트롤). `<label>` 이 아니라 `<div>` 인 이유:
 * 도움말 `?` 버튼이 `<label>` 안에 들어가면 라벨의 클릭 영역과 겹치고,
 * 접근성 트리에서 라벨 이름이 input 과 버튼 양쪽에 붙는다.
 */
export const FieldWrapper = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const FieldLabel = styled.label`
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

  /* 단위 기호(prefix/suffix)가 있으면 그 기호를 피해 입력 텍스트 여백을 넓힌다(겹침 방지). */
  &[data-adorn~='prefix'] {
    padding-left: calc(${space[3]} + 1em);
  }
  &[data-adorn~='suffix'] {
    padding-right: calc(${space[3]} + 1.2em);
  }

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

/** 입력 + 단위 기호를 겹쳐 배치하는 래퍼. 기호는 입력 위에 절대배치(입력 여백으로 자리 확보). */
export const InputAdornmentWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

/** 입력값 앞/뒤의 단위 기호. 클릭이 입력으로 통과하도록 pointer-events 를 끈다. */
export const Adornment = styled.span<{ side: 'prefix' | 'suffix' }>`
  position: absolute;
  ${({ side }) => (side === 'prefix' ? 'left' : 'right')}: ${space[3]};
  color: ${color.textMuted};
  font-size: ${font.size.base};
  line-height: 1;
  pointer-events: none;
`;

/* 셀렉트는 공용 프리미티브 `@/components/common/Select`가 그린다(구 BaseSelect 제거). */
