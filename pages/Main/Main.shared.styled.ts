import styled from '@emotion/styled';
import { color, container, font, media, motion, radius, shadow, space, zIndex } from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 레이아웃                                                                     */
/* -------------------------------------------------------------------------- */

export const SkipLink = styled.a`
  position: absolute;
  top: -48px;
  left: ${space[3]};
  z-index: ${zIndex.skipLink};
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.sm};
  border: 1px solid ${color.brand};
  background: ${color.surface};
  color: ${color.brandText};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-decoration: none;
  box-shadow: ${shadow.e2};

  &:focus-visible {
    top: ${space[3]};
  }
`;

export const FeatureLayout = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(16px, 2.6vw, 28px) clamp(12px, 2vw, 20px) clamp(24px, 4vw, 48px);
  display: grid;
  gap: clamp(12px, 1.8vw, 20px);
  color: ${color.text};
  container-type: inline-size;
  contain: layout style;

  ${media.down('drawer')} {
    contain: none;
  }
`;

export const MainContent = styled.main`
  display: contents;
`;

export const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(250px, 320px) minmax(0, 1fr);
  gap: clamp(12px, 2vw, 20px);
  align-items: start;

  ${container.down('layout')} {
    grid-template-columns: 1fr;
  }

  ${media.down('layout')} {
    grid-template-columns: 1fr;
  }
`;

export const ConfigColumn = styled.aside`
  position: static;
  display: grid;
  gap: ${space[4]};
  max-height: none;
  overflow: visible;
  padding: 0;
  contain: layout paint style;

  ${media.down('drawer')} {
    position: fixed;
    top: 0;
    left: 0;
    width: min(92vw, 360px);
    height: 100dvh;
    max-height: 100dvh;
    z-index: ${zIndex.drawer};
    background: ${color.bg};
    border-right: 1px solid ${color.border};
    box-shadow: ${shadow.e3};
    padding: ${space[12]} ${space[3]} ${space[5]};
    transform: translateX(-100%);
    transition: transform ${motion.base} ${motion.ease};
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
`;

export const ConfigDrawerColumn = styled(ConfigColumn)<{ open: boolean }>`
  ${media.down('drawer')} {
    display: ${({ open }) => (open ? 'grid' : 'none')};
    will-change: transform;
    transform: ${({ open }) => (open ? 'translateX(0)' : 'translateX(-100%)')};
  }
`;

export const DrawerBackdrop = styled.div<{ open: boolean }>`
  display: none;

  ${media.down('drawer')} {
    display: ${({ open }) => (open ? 'block' : 'none')};
    position: fixed;
    inset: 0;
    z-index: ${zIndex.drawerBackdrop};
    background: ${color.overlay};
    backdrop-filter: blur(2px);
  }
`;

export const DrawerToggleButton = styled.button`
  display: none;

  ${media.down('drawer')} {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: static;
    align-self: flex-start;
    width: fit-content;
    min-height: 44px;
    border: 1px solid ${color.brand};
    background: ${color.brand};
    color: ${color.onBrand};
    border-radius: ${radius.sm};
    padding: ${space[2]} ${space[4]};
    font-size: ${font.size.sm};
    font-weight: ${font.weight.semibold};
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};

    &:hover {
      background: ${color.brandHover};
    }

    &[data-floating='true'] {
      position: fixed;
      left: max(12px, env(safe-area-inset-left));
      top: max(12px, env(safe-area-inset-top));
      z-index: ${zIndex.drawerToggle};
      box-shadow: ${shadow.e3};
    }

    &[aria-expanded='true'] {
      display: none;
    }
  }
`;

export const DrawerCloseButton = styled.button`
  display: none;

  ${media.down('drawer')} {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: ${space[2]};
    right: ${space[2]};
    width: 44px;
    height: 44px;
    border: 1px solid ${color.border};
    background: ${color.surface};
    color: ${color.textSecondary};
    border-radius: ${radius.pill};
    padding: 0;
    font-size: ${font.size.xl};
    line-height: 1;
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

    &:hover {
      background: ${color.surfaceHover};
      color: ${color.text};
    }
  }
`;

export const ResultsColumn = styled.section`
  display: grid;
  gap: clamp(12px, 1.8vw, 20px);
  min-width: 0;
  contain: layout style;

  > * {
    min-width: 0;
  }
`;

/* -------------------------------------------------------------------------- */
/* 헤더                                                                         */
/* -------------------------------------------------------------------------- */

export const Header = styled.header`
  display: grid;
  gap: ${space[2]};
`;

export const HeaderTitle = styled.h1`
  margin: 0;
  color: ${color.text};
  font-size: clamp(22px, 3vw, 28px);
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
`;

export const HeaderDescription = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.snug};
`;

/* -------------------------------------------------------------------------- */
/* 버튼 (공통 기반)                                                             */
/* -------------------------------------------------------------------------- */

const buttonBase = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${space[2]};
  min-height: 40px;
  border-radius: ${radius.sm};
  padding: ${space[2]} ${space[4]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  font-family: inherit;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export const PrimaryButton = styled.button`
  ${buttonBase};
  border: 1px solid ${color.brand};
  background: ${color.brand};
  color: ${color.onBrand};

  &:hover:not(:disabled) {
    background: ${color.brandHover};
    border-color: ${color.brandHover};
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }
`;

export const SecondaryButton = styled.button`
  ${buttonBase};
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.textSecondary};

  &:hover:not(:disabled) {
    background: ${color.surfaceHover};
    border-color: ${color.brandBorder};
    color: ${color.text};
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }
`;

/* -------------------------------------------------------------------------- */
/* 시나리오 이름 / 탭                                                           */
/* -------------------------------------------------------------------------- */

export const ScenarioNameTag = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]};
  width: 100%;
  height: 40px;
  padding: 0 ${space[3]};
  margin-bottom: ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};

  button[data-delete='true'] {
    opacity: 0;
    pointer-events: none;
    transform: translateX(2px);
    transition: opacity ${motion.fast} ${motion.ease}, transform ${motion.fast} ${motion.ease};
  }

  &:hover button[data-delete='true'],
  &:active button[data-delete='true'],
  &:focus-within button[data-delete='true'] {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(0);
  }
`;

export const ScenarioNameEditButton = styled.button`
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
  cursor: text;
  padding: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ScenarioNameEditInput = styled.input`
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  background: transparent;
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  font-family: inherit;
  padding: 0;
  box-shadow: none;
  appearance: none;

  &:focus {
    outline: none;
    box-shadow: none;
  }
`;

export const ScenarioDeleteButton = styled.button`
  flex: 0 0 auto;
  border: 1px solid ${color.borderStrong};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  border-radius: ${radius.sm};
  padding: ${space[1]} ${space[3]};
  min-height: 30px;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  font-family: inherit;
  cursor: pointer;
  transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    background: ${color.dangerSurface};
    border-color: ${color.dangerBorder};
    color: ${color.danger};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ScenarioTabsWrap = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${space[1]};
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: 1px solid ${color.border};
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;

  /* 모바일에서 탭이 넘칠 때: 스냅 + 우측 페이드로 "더 있음"을 알린다 */
  ${media.down('drawer')} {
    scroll-snap-type: x proximity;
    scroll-padding-inline: ${space[2]};
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
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

/* -------------------------------------------------------------------------- */
/* 티커 생성 / 목록                                                             */
/* -------------------------------------------------------------------------- */

export const TickerHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${space[3]};
`;

export const TickerQuickActionRow = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: ${space[2]};
  width: 100%;
  margin-bottom: ${space[2]};
`;

export const TickerQuickActionButton = styled.button`
  border: 1px solid ${color.border};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  border-radius: ${radius.sm};
  min-height: 44px;
  padding: ${space[2]} ${space[1]};
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${space[1]};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  font-family: inherit;
  line-height: 1.1;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandSubtle};
    border-color: ${color.brandBorder};
    color: ${color.brandText};
  }
`;

export const TickerQuickActionIcon = styled.span`
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

export const TickerCreateButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${color.brand};
  background: ${color.brand};
  color: ${color.onBrand};
  border-radius: ${radius.sm};
  min-height: 44px;
  padding: ${space[2]} ${space[4]};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  font-family: inherit;
  cursor: pointer;
  width: 100%;
  margin-bottom: ${space[3]};
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandHover};
    box-shadow: ${shadow.e2};
  }

  &:active {
    transform: translateY(1px);
  }

  ${media.down('drawer')} {
    margin-bottom: ${space[5]};
  }
`;

export const TickerGridWrap = styled.div`
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
  padding: ${space[2]};
`;

export const TickerList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: ${space[2]};
`;

export const TickerChipWrap = styled.div`
  position: relative;

  &:hover button[data-chip='true'],
  &:focus-within button[data-chip='true'] {
    padding-right: 34px;
  }

  &:hover button[data-gear='true'],
  &:focus-within button[data-gear='true'] {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(-50%) scale(1);
  }
`;

export const TickerItemButton = styled.button<{ selected?: boolean }>`
  width: 100%;
  min-height: 36px;
  text-align: center;
  border: 1px solid ${({ selected }) => (selected ? color.brandBorder : color.border)};
  background: ${({ selected }) => (selected ? color.brandSubtle : color.surface)};
  color: ${({ selected }) => (selected ? color.brandText : color.textSecondary)};
  border-radius: ${radius.sm};
  padding: ${space[2]};
  font-size: ${font.size['2xs']};
  font-weight: ${({ selected }) => (selected ? font.weight.bold : font.weight.medium)};
  font-family: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease}, padding-right ${motion.base} ${motion.ease};

  &:hover {
    background: ${({ selected }) => (selected ? color.brandSubtleHover : color.surfaceHover)};
    border-color: ${color.brandBorder};
  }
`;

export const TickerGearButton = styled.button`
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%) scale(0.88);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.textSecondary};
  border-radius: ${radius.pill};
  width: 24px;
  height: 24px;
  padding: 0;
  line-height: 0;
  cursor: pointer;
  opacity: 0;
  pointer-events: auto;
  transition: opacity ${motion.base} ${motion.ease}, transform ${motion.base} ${motion.ease},
    background-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandSubtle};
    color: ${color.brandText};
  }

  svg {
    width: 12px;
    height: 12px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

/* -------------------------------------------------------------------------- */
/* 선택된 티커 칩                                                               */
/* -------------------------------------------------------------------------- */

export const SelectedChipWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin-top: ${space[2]};

  ${media.down('drawer')} {
    margin-top: ${space[4]};
  }
`;

export const SelectedChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  border: 1px solid ${color.brandBorder};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  border-radius: ${radius.pill};
  padding: ${space[1]} ${space[1]} ${space[1]} ${space[3]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  max-width: 100%;
`;

export const SelectedChipLabel = styled.span`
  min-width: 0;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ChipRemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: ${color.brandText};
  font-size: ${font.size.xs};
  font-family: inherit;
  width: 20px;
  height: 20px;
  border-radius: ${radius.pill};
  padding: 0;
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandSubtleHover};
  }
`;

/* -------------------------------------------------------------------------- */
/* 비율 슬라이더                                                                */
/* -------------------------------------------------------------------------- */

export const RatioGrid = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const RatioRow = styled.label`
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) 52px;
  align-items: center;
  gap: ${space[2]};
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
`;

export const RatioTickerLabel = styled.span`
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const RatioSlider = styled.input`
  width: 100%;
  height: 24px;
  accent-color: ${color.brand};
  cursor: pointer;
`;

export const RatioValue = styled.span`
  text-align: right;
  font-size: ${font.size.xs};
  color: ${color.text};
  font-weight: ${font.weight.semibold};
  ${font.numeric};
`;

/* -------------------------------------------------------------------------- */
/* 폼 그리드 / 필드                                                             */
/* -------------------------------------------------------------------------- */

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: ${space[3]};
`;

export const ModalCompactFormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: ${space[3]};

  ${media.down('drawer')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${space[3]};
  }
`;

export const ConfigFormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${space[3]};
`;

export const ConfigInputGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${space[3]};

  ${container.between('mobileWide', 'layout')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${space[3]} ${space[4]};
  }
`;

export const ConfigSectionDivider = styled.hr`
  border: 0;
  border-top: 1px solid ${color.border};
  width: 100%;
  margin: ${space[1]} auto ${space[2]};
`;

export const InlineField = styled.label`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
`;

export const InlineFieldHeader = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

export const InlineSelect = styled.select`
  width: 100%;
  min-width: 0;
  min-height: 40px;
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.sm};
  padding: ${space[2]} ${space[7]} ${space[2]} ${space[3]};
  font-size: ${font.size.base};
  font-family: inherit;
  background-color: ${color.surface};
  color: ${color.text};
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
    linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position: calc(100% - 16px) calc(50% - 1px), calc(100% - 12px) calc(50% - 1px);
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  transition: border-color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    border-color: ${color.brandBorder};
  }

  &:disabled {
    background-color: ${color.surfaceSunken};
    color: ${color.textMuted};
    cursor: not-allowed;
  }
`;

export const ModeToggleInput = styled.input`
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: ${color.brand};
`;

/* -------------------------------------------------------------------------- */
/* 모달 내 티커 검색                                                            */
/* -------------------------------------------------------------------------- */

export const ModalTickerSearchWrap = styled.div`
  position: relative;
  margin-bottom: ${space[3]};
`;

export const ModalTickerSearchIcon = styled.span`
  position: absolute;
  left: ${space[3]};
  top: 50%;
  width: 14px;
  height: 14px;
  color: ${color.textMuted};
  transform: translateY(-50%);
  pointer-events: none;

  svg {
    width: 14px;
    height: 14px;
    display: block;
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

export const ModalTickerSearchInput = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 40px;
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.sm};
  padding: ${space[2]} ${space[3]} ${space[2]} ${space[8]};
  font-size: ${font.size.base};
  font-family: inherit;
  color: ${color.text};
  background-color: ${color.surface};
  transition: border-color ${motion.fast} ${motion.ease};

  &::placeholder {
    color: ${color.textMuted};
  }

  &:hover {
    border-color: ${color.brandBorder};
  }
`;

export const SearchResultList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: ${space[2]};
  max-height: 260px;
  overflow-y: auto;
  scrollbar-gutter: stable;
`;

export const SearchResultButton = styled.button`
  width: 100%;
  min-height: 44px;
  border: 1px solid ${color.border};
  background: ${color.surface};
  border-radius: ${radius.sm};
  padding: ${space[2]} ${space[3]};
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brandBorder};
    background: ${color.brandSubtle};
  }
`;

export const SearchResultTicker = styled.div`
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
`;

export const SearchResultName = styled.div`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/* -------------------------------------------------------------------------- */
/* 프리셋 드롭다운 / 칩                                                          */
/* -------------------------------------------------------------------------- */

export const PresetDropdownWrap = styled.div`
  position: relative;
`;

export const PresetDropdownButton = styled.button`
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 40px;
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.sm};
  padding: ${space[2]} ${space[7]} ${space[2]} ${space[3]};
  font-size: ${font.size.base};
  font-family: inherit;
  line-height: ${font.leading.snug};
  color: ${color.text};
  text-align: left;
  background-color: ${color.surface};
  cursor: pointer;
  transition: border-color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brandBorder};
  }

  &::after {
    content: '';
    position: absolute;
    right: ${space[3]};
    top: calc(50% - 3px);
    width: 7px;
    height: 7px;
    border-right: 2px solid ${color.textMuted};
    border-bottom: 2px solid ${color.textMuted};
    transform: rotate(45deg);
    pointer-events: none;
  }
`;

export const PresetDropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  box-shadow: ${shadow.e3};
  z-index: ${zIndex.dropdown};
  padding: ${space[1]};
`;

export const PresetDropdownOption = styled.button<{ selected?: boolean }>`
  display: block;
  width: 100%;
  min-height: 40px;
  border: 0;
  border-radius: ${radius.xs};
  padding: ${space[2]} ${space[3]};
  text-align: left;
  font-size: ${font.size.base};
  font-family: inherit;
  font-weight: ${({ selected }) => (selected ? font.weight.semibold : font.weight.regular)};
  color: ${({ selected }) => (selected ? color.brandText : color.text)};
  background: ${({ selected }) => (selected ? color.brandSubtle : 'transparent')};
  cursor: pointer;
  transition: background-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${({ selected }) => (selected ? color.brandSubtleHover : color.surfaceHover)};
  }
`;

export const PresetChipGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-content: start;
  gap: ${space[2]};
`;

export const PresetChipScrollArea = styled.div`
  max-height: 110px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: ${space[1]};
  margin-bottom: ${space[2]};
  scrollbar-gutter: stable;
`;

export const PresetChipButton = styled.button<{ selected?: boolean }>`
  border: 1px solid ${({ selected }) => (selected ? color.brandBorder : color.border)};
  background: ${({ selected }) => (selected ? color.brandSubtle : color.surface)};
  color: ${({ selected }) => (selected ? color.brandText : color.textSecondary)};
  border-radius: ${radius.sm};
  padding: ${space[2]};
  min-height: 36px;
  font-size: ${font.size.xs};
  font-family: inherit;
  font-weight: ${({ selected }) => (selected ? font.weight.bold : font.weight.medium)};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brandBorder};
    background: ${({ selected }) => (selected ? color.brandSubtleHover : color.surfaceHover)};
  }
`;

/* -------------------------------------------------------------------------- */
/* 포트폴리오 프리셋 카드                                                        */
/* -------------------------------------------------------------------------- */

export const PortfolioPresetGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${space[3]};
`;

export const PortfolioPresetCardButton = styled.button`
  display: grid;
  gap: ${space[2]};
  width: 100%;
  text-align: left;
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  padding: ${space[4]};
  color: ${color.text};
  font-family: inherit;
  cursor: pointer;
  transition: border-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease},
    transform ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brandBorder};
    box-shadow: ${shadow.e2};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const PortfolioPresetContentRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: ${space[4]};
  align-items: start;

  ${media.down('tabletSm')} {
    grid-template-columns: 1fr;
  }
`;

export const PortfolioPresetMain = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const PortfolioPresetTitle = styled.span`
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  color: ${color.text};
  letter-spacing: -0.01em;
`;

export const PortfolioPresetDesc = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;

export const PortfolioPresetCore = styled.span`
  font-size: ${font.size.xs};
  color: ${color.brandText};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
`;

export const PortfolioPresetMeta = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

export const PortfolioPresetPlan = styled.div`
  display: grid;
  gap: ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.sm};
  background: ${color.surfaceMuted};
  padding: ${space[3]};
`;

export const PortfolioPresetPlanItem = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
  display: flex;
  justify-content: space-between;
  gap: ${space[2]};

  strong {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
    ${font.numeric};
  }
`;

/* -------------------------------------------------------------------------- */
/* 요약 카드                                                                    */
/* -------------------------------------------------------------------------- */

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: clamp(8px, 1.5vw, 12px);
`;

export const SummaryValue = styled.p`
  margin: ${space[2]} 0 0;
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric};
`;

export const CompactSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(170px, 100%), 1fr));
  gap: ${space[2]};
`;

export const CompactSummaryItem = styled.div`
  border: 1px solid ${color.border};
  background: ${color.surfaceMuted};
  border-radius: ${radius.md};
  padding: ${space[3]};
  min-width: 0;
  transition: border-color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.borderStrong};
  }
`;

export const CompactSummaryLabel = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CompactSummaryLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  width: 100%;
`;

export const CompactSummaryLabelGrow = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

export const CompactSummaryHelpButton = styled.button`
  position: relative;
  flex: 0 0 auto;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.textSecondary};
  border-radius: ${radius.pill};
  width: 18px;
  height: 18px;
  line-height: 1;
  padding: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  font-family: inherit;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  /* 시각 크기는 유지하고 히트 영역만 44x44 */
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

export const CompactSummaryValue = styled.p`
  margin: ${space[1]} 0 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
  ${font.numeric};
`;

/* -------------------------------------------------------------------------- */
/* 시리즈 필터 / 토글                                                           */
/* -------------------------------------------------------------------------- */

export const SeriesFilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[3]};
  margin-bottom: ${space[3]};
  align-items: center;
  justify-content: space-between;
`;

export const SeriesFilterGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[3]};
`;

export const SeriesFilterItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

export const SeriesFilterLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  min-height: 32px;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
  cursor: pointer;
  user-select: none;
`;

export const SeriesFilterCheckbox = styled.input`
  margin: 0;
  width: 16px;
  height: 16px;
  accent-color: ${color.brand};
  cursor: pointer;
`;

export const SeriesBgToggleButton = styled.button<{ active: boolean }>`
  border: 1px solid ${({ active }) => (active ? color.brand : color.borderStrong)};
  background: ${({ active }) => (active ? color.brand : color.surface)};
  color: ${({ active }) => (active ? color.onBrand : color.textSecondary)};
  border-radius: ${radius.pill};
  padding: ${space[1]} ${space[3]};
  min-height: 32px;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};
`;

export const SeriesToggleRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

export const SeriesToggleLabel = styled.span`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
  ${font.numeric};
`;

/* -------------------------------------------------------------------------- */
/* 보조 텍스트 / 도움말 / 에러                                                   */
/* -------------------------------------------------------------------------- */

export const HintText = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  color: ${color.textMuted};
  line-height: ${font.leading.normal};
`;

export const HelpMarkButton = styled.button`
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
  font-family: inherit;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  /* 시각 크기는 유지하고 히트 영역만 44x44 */
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

export const ScenarioTabsHelpButton = styled(HelpMarkButton)`
  align-self: center;
  flex: 0 0 auto;
  margin-left: ${space[2]};
`;

export const ErrorBox = styled.div`
  display: grid;
  gap: ${space[1]};
  border: 1px solid ${color.dangerBorder};
  border-left: 3px solid ${color.danger};
  border-radius: ${radius.sm};
  padding: ${space[3]};
  margin-top: ${space[3]};
  background: ${color.dangerSurface};
  color: ${color.danger};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};

  p {
    margin: 0;
  }
`;

/* -------------------------------------------------------------------------- */
/* 차트 / 알로케이션 범례                                                        */
/* -------------------------------------------------------------------------- */

export const ChartWrap = styled.div`
  width: 100%;
  height: clamp(220px, 30vw, 280px);
  min-width: 0;
  overflow: hidden;
  contain: layout paint style;
`;

export const AllocationChartLayout = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr));
  gap: clamp(8px, 1.5vw, 16px);
  align-items: start;
  contain: layout style;
`;

export const AllocationLegend = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: ${space[2]};
  container-type: inline-size;
`;

const stackedLegendItem = `
  grid-template-columns: 16px minmax(0, 1fr) 48px;
  grid-template-areas:
    'dot name value'
    'dot slider fix';
  gap: ${space[2]};
`;

export const AllocationLegendItem = styled.li`
  display: grid;
  grid-template-columns: 16px 72px minmax(120px, 1fr) 40px 52px;
  grid-template-areas: 'dot name slider fix value';
  gap: ${space[2]};
  align-items: center;
  font-size: ${font.size.xs};
  color: ${color.textSecondary};

  ${container.down('mobile')} {
    ${stackedLegendItem};
  }

  ${media.down('mobile')} {
    ${stackedLegendItem};
  }
`;

export const AllocationColorDot = styled.span<{ color: string }>`
  grid-area: dot;
  width: 12px;
  height: 12px;
  border-radius: ${radius.xs};
  background: ${({ color: dotColor }) => dotColor};
`;

export const AllocationLegendName = styled.span`
  grid-area: name;
  min-width: 0;
  color: ${color.text};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.tight};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const AllocationLegendSlider = styled.input`
  grid-area: slider;
  width: 100%;
  height: 8px;
  appearance: none;
  -webkit-appearance: none;
  background: linear-gradient(
    to right,
    ${color.brand} 0%,
    ${color.brand} var(--slider-progress),
    ${color.surfaceSunken} var(--slider-progress),
    ${color.surfaceSunken} 100%
  );
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  --slider-progress: 0%;
  margin: 0;
  padding: 0;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &::-webkit-slider-runnable-track {
    height: 8px;
    background: transparent;
    border-radius: ${radius.pill};
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    margin-top: -5px;
    border-radius: ${radius.pill};
    border: 2px solid ${color.surface};
    background: ${color.brand};
    box-shadow: 0 1px 3px rgba(15, 25, 35, 0.3);
  }

  &::-moz-range-track {
    height: 8px;
    background: transparent;
    border-radius: ${radius.pill};
  }

  &::-moz-range-progress {
    height: 8px;
    background: transparent;
    border-radius: ${radius.pill};
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: ${radius.pill};
    border: 2px solid ${color.surface};
    background: ${color.brand};
    box-shadow: 0 1px 3px rgba(15, 25, 35, 0.3);
  }
`;

const stackedFixButton = `
  justify-self: end;
`;

export const AllocationFixButton = styled.button<{ active: boolean }>`
  grid-area: fix;
  width: 40px;
  height: 28px;
  border: 1px solid ${({ active }) => (active ? color.brand : color.borderStrong)};
  background: ${({ active }) => (active ? color.brand : color.surface)};
  color: ${({ active }) => (active ? color.onBrand : color.textSecondary)};
  border-radius: ${radius.xs};
  padding: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  font-family: inherit;
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brand};
  }

  ${container.down('mobile')} {
    ${stackedFixButton};
  }

  ${media.down('mobile')} {
    ${stackedFixButton};
  }
`;

export const AllocationLegendValue = styled.span`
  grid-area: value;
  color: ${color.text};
  font-weight: ${font.weight.semibold};
  justify-self: end;
  ${font.numeric};
`;

/* -------------------------------------------------------------------------- */
/* 모달                                                                         */
/* -------------------------------------------------------------------------- */

export const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: ${color.overlay};
  backdrop-filter: blur(3px);
  display: grid;
  place-items: center;
  padding: ${space[4]};
  z-index: ${zIndex.modal};
  contain: paint;
`;

export const ModalPanel = styled.section`
  width: min(520px, 100%);
  max-height: min(88vh, 760px);
  background: ${color.surface};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  padding: ${space[5]};
  display: grid;
  gap: ${space[3]};
  overflow-y: auto;
  scrollbar-gutter: stable;
  box-shadow: ${shadow.e3};
  color: ${color.text};
`;

export const ModalTitle = styled.h3`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.01em;
`;

export const ModalBody = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.relaxed};
  white-space: pre-line;

  strong {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
  }
`;

export const ModalTabList = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${space[1]};
  margin-bottom: ${space[1]};
  border-bottom: 1px solid ${color.border};
`;

export const ModalTabButton = styled.button<{ active?: boolean }>`
  position: relative;
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
  cursor: pointer;
  touch-action: manipulation;
  z-index: ${({ active }) => (active ? 2 : 1)};
  transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 1px;
    background: ${({ active }) => (active ? color.surface : 'transparent')};
  }

  &:hover {
    background: ${({ active }) => (active ? color.surface : color.surfaceHover)};
    color: ${color.text};
  }
`;

export const ModalClose = styled.button`
  justify-self: end;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.textSecondary};
  border-radius: ${radius.sm};
  padding: ${space[2]} ${space[4]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  font-family: inherit;
  cursor: pointer;
  transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    color: ${color.text};
  }
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${space[2]};
`;
