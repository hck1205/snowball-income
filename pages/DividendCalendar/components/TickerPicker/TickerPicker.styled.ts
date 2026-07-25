import styled from '@emotion/styled';
import { color, font, media, motion, radius, space, TOUCH_TARGET } from '@/shared/styles';

export const PickerRoot = styled.div`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

export const SearchLabel = styled.label`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const SearchRow = styled.div`
  position: relative;
  display: block;
`;

export const SearchIconSlot = styled.span`
  position: absolute;
  top: 50%;
  left: ${space[3]};
  transform: translateY(-50%);
  display: inline-flex;
  color: ${color.textMuted};
  pointer-events: none;
`;

export const SearchInput = styled.input`
  width: 100%;
  height: 40px;
  box-sizing: border-box;
  padding: 0 ${space[3]} 0 36px;
  border: 1px solid ${color.border};
  border-radius: ${radius.sm};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.base};
  font-family: inherit;

  &::placeholder {
    color: ${color.textMuted};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const PickerMetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
  min-height: 20px;
`;

export const ResultCount = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  ${font.numeric}
`;

export const ClearButton = styled.button`
  border: 0;
  background: transparent;
  padding: ${space[1]} ${space[2]};
  border-radius: ${radius.sm};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  cursor: pointer;
  transition: background ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const SelectedChipList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]};
`;

export const SelectedChipItem = styled.li`
  display: inline-flex;
`;

export const ResultList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 2px;
  max-height: 320px;
  overflow-y: auto;

  ${media.down('layout')} {
    max-height: 260px;
  }

  ${media.down('mobile')} {
    max-height: 220px;
  }
`;

export const ResultItem = styled.li`
  min-width: 0;
`;

/**
 * 결과 한 줄. 선택 여부는 `aria-pressed`가 말하고, 색은 그것을 눈으로 반복할 뿐이다.
 * 선택 불가 종목은 `disabled` 대신 `aria-disabled` — 스크린리더가 건너뛰지 않고 이유를 읽게 한다.
 */
export const ResultButton = styled.button<{ $selected: boolean; $disabled: boolean }>`
  width: 100%;
  min-height: ${TOUCH_TARGET};
  display: flex;
  align-items: center;
  gap: ${space[2]};
  text-align: left;
  padding: ${space[2]} ${space[3]};
  border: 0;
  border-radius: ${radius.sm};
  background: ${({ $selected }) => ($selected ? color.brandSubtle : 'transparent')};
  box-shadow: ${({ $selected }) => ($selected ? `inset 2px 0 0 ${color.brand}` : 'none')};
  color: ${({ $selected, $disabled }) =>
    $disabled ? color.textMuted : $selected ? color.brandText : color.text};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  font-family: inherit;
  transition: background ${motion.fast} ${motion.ease};

  &:hover {
    background: ${({ $selected, $disabled }) =>
      $disabled ? 'transparent' : $selected ? color.brandSubtleHover : color.surfaceHover};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }
`;

export const ResultTicker = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

export const ResultName = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const UnavailableHint = styled.p`
  margin: 0 0 0 ${space[3]};
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

export const NoResultText = styled.p`
  margin: 0;
  padding: ${space[3]};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;
