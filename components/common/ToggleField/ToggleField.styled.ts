import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

export const ToggleLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
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

  /* 시각 크기는 유지하되 히트 영역만 44x44로 확장 */
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

export const ToggleControl = styled.span<{ checked: boolean; disabled?: boolean; controlWidth?: string }>`
  position: relative;
  flex: 0 0 auto;
  width: ${({ controlWidth }) => controlWidth ?? '56px'};
  height: 26px;
  border-radius: ${radius.pill};
  border: 1px solid ${({ disabled, checked }) => (disabled ? color.border : checked ? color.brand : color.borderStrong)};
  background: ${({ checked, disabled }) =>
    disabled ? color.surfaceSunken : checked ? color.brandSubtle : color.surfaceMuted};
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};

  /* 스위치 자체의 터치 타겟 확보 */
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    min-width: 44px;
    height: 44px;
    width: 100%;
    transform: translate(-50%, -50%);
  }

`;

export const ToggleStateText = styled.span<{ checked: boolean; disabled?: boolean; stateTextColor?: string }>`
  position: absolute;
  top: 50%;
  left: ${({ checked }) => (checked ? '9px' : 'auto')};
  right: ${({ checked }) => (checked ? 'auto' : '9px')};
  transform: translateY(-50%);
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  color: ${({ checked, disabled, stateTextColor }) =>
    stateTextColor ?? (disabled ? color.textMuted : checked ? color.brandText : color.textSecondary)};
  letter-spacing: 0.2px;
  user-select: none;
  pointer-events: none;
`;

export const ToggleThumb = styled.span<{ checked: boolean; disabled?: boolean }>`
  position: absolute;
  top: 2px;
  left: ${({ checked }) => (checked ? 'calc(100% - 22px)' : '2px')};
  width: 20px;
  height: 20px;
  border-radius: ${radius.pill};
  background: ${({ checked, disabled }) => (disabled ? color.borderStrong : checked ? color.brand : color.textMuted)};
  box-shadow: 0 1px 2px rgba(15, 25, 35, 0.2);
  pointer-events: none;
  transition: left ${motion.fast} ${motion.ease}, background-color ${motion.fast} ${motion.ease};
`;

/**
 * 트랙과 정확히 같은 박스(absolute inset:0)를 차지하는 투명 체크박스.
 *
 * 기존에는 `opacity: 0`으로 숨겼는데, opacity가 0이면 포커스 아웃라인까지 같이 투명해져서
 * 토글에 키보드 포커스 링이 사실상 없었다. `appearance: none` + 투명 배경으로 바꾸면
 * 요소 자체는 보이지 않으면서 전역 `:focus-visible` 링은 트랙 위에 정확히 그려진다.
 * (`:has()`는 jsdom(nwsapi)이 파싱하지 못해 테스트가 깨지므로 쓰지 않는다.)
 */
export const HiddenCheckbox = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  border: 0;
  border-radius: ${radius.pill};
  cursor: pointer;
  z-index: 1;

  &:disabled {
    cursor: not-allowed;
  }
`;
