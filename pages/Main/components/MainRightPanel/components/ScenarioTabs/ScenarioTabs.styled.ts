import styled from '@emotion/styled';
import { HelpMarkButton } from '@/components/common';
import {
  color,
  font,
  hiddenScrollbar,
  media,
  motion,
  radius,
  shadow,
  space,
  subtleScrollbar,
  zIndex
} from '@/shared/styles';

/** `pages/Main/Main.shared.styled.ts`에서 옮겨온 시나리오 탭 조각 (스타일 값 동일, 마크업/동작 변화 없음). */

/**
 * 탭 스트립. **밑줄은 여기 없다** — 래퍼(`ScenarioTabsRow`)가 갖는다.
 * 여기에 두면 스트립 폭(= 탭 개수만큼)까지만 선이 그려져 우측 "간략히" 토글 아래가 끊긴다.
 */
export const ScenarioTabsWrap = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${space[1]};
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  ${subtleScrollbar}

  /* 모바일에서 탭이 넘칠 때: 스냅 + 우측 페이드로 "더 있음"을 알린다 —
     넘침 신호가 따로 있으므로 여기서만 스크롤바를 감춘다(위 선언을 덮는다). */
  ${media.down('drawer')} {
    scroll-snap-type: x proximity;
    scroll-padding-inline: ${space[2]};
    ${hiddenScrollbar}
  }
`;

export const ScenarioTabButton = styled.button<{ active?: boolean; dragOver?: boolean; isDragging?: boolean }>`
  position: relative;
  flex: 0 0 auto;
  max-width: 160px;
  scroll-snap-align: start;
  border: 1px solid ${({ active }) => (active ? color.border : 'transparent')};
  border-bottom: 0;
  background: ${({ active }) => (active ? color.surface : 'transparent')};
  color: ${({ active }) => (active ? color.text : color.textMuted)};
  border-radius: ${radius.md} ${radius.md} 0 0;
  padding: ${space[2]} ${space[4]};
  min-height: 40px;
  font-size: ${font.size.sm};
  font-family: inherit;
  font-weight: ${({ active }) => (active ? font.weight.bold : font.weight.medium)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  touch-action: manipulation;
  cursor: pointer;
  z-index: ${({ active }) => (active ? 2 : 1)};
  opacity: ${({ isDragging }) => (isDragging ? 0.65 : 1)};
  box-shadow: ${({ dragOver }) => (dragOver ? `inset 0 0 0 2px ${color.brand}` : 'none')};
  transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  /* 손가락으로 쓰는 폭에서는 터치 타깃 하한(44px)까지 올린다. */
  ${media.down('tablet')} {
    min-height: 44px;
  }

  /* 활성 탭이 아래 패널과 이어져 보이도록 경계선을 덮는다 */
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 1px;
    background: ${({ active }) => (active ? color.surface : 'transparent')};
  }

  &[draggable='true'] {
    cursor: ${({ isDragging }) => (isDragging ? 'grabbing' : 'grab')};
  }

  &:hover:not(:disabled) {
    background: ${({ active }) => (active ? color.surface : color.surfaceHover)};
    color: ${color.text};
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

export const ScenarioTabRenameInput = styled.input`
  border: 0;
  background: transparent;
  color: ${color.text};
  padding: 0 ${space[4]} 0 0;
  min-height: 20px;
  min-width: 0;
  width: 100%;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  font-family: inherit;
  box-shadow: none;
  appearance: none;

  &:focus {
    outline: none;
    box-shadow: none;
  }
`;

export const ScenarioTabEditWrap = styled.div`
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0;
  max-width: 160px;
  border: 1px solid ${color.border};
  border-bottom: 0;
  background: ${color.surface};
  color: ${color.text};
  border-radius: ${radius.md} ${radius.md} 0 0;
  padding: ${space[2]} ${space[4]};
  min-height: 40px;
  white-space: nowrap;
`;

export const ScenarioTabCloseButton = styled.button`
  position: absolute;
  top: 50%;
  right: ${space[2]};
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: ${color.textMuted};
  width: 20px;
  height: 20px;
  border-radius: ${radius.xs};
  padding: 0;
  line-height: 1;
  font-size: ${font.size.base};
  font-family: inherit;
  cursor: pointer;
  transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ScenarioTabTooltip = styled.div`
  position: fixed;
  z-index: ${zIndex.tooltip};
  pointer-events: none;
  max-width: 280px;
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  border-radius: ${radius.sm};
  padding: ${space[2]} ${space[3]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
  box-shadow: ${shadow.e3};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ScenarioTabsHelpButton = styled(HelpMarkButton)`
  align-self: center;
  flex: 0 0 auto;
  margin-left: ${space[2]};
`;
