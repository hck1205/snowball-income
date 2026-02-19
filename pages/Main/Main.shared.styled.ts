import styled from '@emotion/styled';

export const SkipLink = styled.a`
  position: absolute;
  top: -40px;
  left: 12px;
  z-index: 2147483647;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #2f6f93;
  background: #ffffff;
  color: #1f3341;
  font-size: 13px;
  text-decoration: none;

  &:focus-visible {
    top: 10px;
  }
`;

export const FeatureLayout = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(14px, 2.6vw, 24px) clamp(12px, 2vw, 16px) clamp(24px, 4vw, 40px);
  display: grid;
  gap: clamp(10px, 1.8vw, 16px);
  color: #1f3341;
  container-type: inline-size;
  contain: layout style;

  @media (max-width: 960px) {
    contain: none;
  }
`;

export const MainContent = styled.main`
  display: contents;
`;

export const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(250px, 320px) minmax(0, 1fr);
  gap: clamp(10px, 2vw, 20px);
  align-items: start;

  @container (max-width: 980px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

export const ConfigColumn = styled.aside`
  position: static;
  display: grid;
  gap: 14px;
  max-height: none;
  overflow: visible;
  padding: 0;
  contain: layout paint style;

  @media (max-width: 960px) {
    position: fixed;
    top: 0;
    left: 0;
    width: min(92vw, 360px);
    height: 100dvh;
    max-height: 100dvh;
    z-index: 60;
    background: #f7fbff;
    border-right: 1px solid #d7e2eb;
    padding: 44px 12px 20px;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
`;

export const ConfigDrawerColumn = styled(ConfigColumn)<{ open: boolean }>`
  @media (max-width: 960px) {
    display: ${({ open }) => (open ? 'grid' : 'none')};
    will-change: transform;
    transform: ${({ open }) => (open ? 'translateX(0)' : 'translateX(-100%)')};
  }
`;

export const DrawerBackdrop = styled.div<{ open: boolean }>`
  display: none;

  @media (max-width: 960px) {
    display: ${({ open }) => (open ? 'block' : 'none')};
    position: fixed;
    inset: 0;
    z-index: 55;
    background: rgba(16, 29, 41, 0.35);
  }
`;

export const DrawerToggleButton = styled.button`
  display: none;

  @media (max-width: 960px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: static;
    align-self: flex-start;
    width: fit-content;
    border: 1px solid #2f6f93;
    background: #2f6f93;
    color: #fff;
    border-radius: 8px;
    padding: 7px 10px;
    font-size: 13px;
    cursor: pointer;
    touch-action: manipulation;

    &[data-floating='true'] {
      position: fixed;
      left: max(12px, env(safe-area-inset-left));
      top: max(12px, env(safe-area-inset-top));
      z-index: 54;
      box-shadow: 0 6px 18px rgba(14, 37, 54, 0.22);
    }

    &[aria-expanded='true'] {
      display: none;
    }
  }
`;

export const DrawerCloseButton = styled.button`
  display: none;

  @media (max-width: 960px) {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 10px;
    right: 10px;
    width: 28px;
    height: 28px;
    border: 1px solid #bfd0de;
    background: #f4f8fb;
    color: #29465a;
    border-radius: 999px;
    padding: 0;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    touch-action: manipulation;
  }
`;

export const ResultsColumn = styled.section`
  display: grid;
  gap: clamp(10px, 1.8vw, 16px);
  min-width: 0;
  contain: layout style;

  > * {
    min-width: 0;
  }
`;

export const ScenarioNameTag = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: 37px;
  padding: 0 10px;
  margin-bottom: 10px;
  border: none;
  border-radius: 10px;
  background: #ffffff;
  color: #1f3341;
  font-size: 13px;
  font-weight: 700;

  button[data-delete='true'] {
    opacity: 0;
    pointer-events: none;
    transform: translateX(2px);
    transition: opacity 0.15s ease, transform 0.15s ease;
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
  color: #1f3341;
  font-size: 13px;
  font-weight: 700;
  padding: 0;
  box-shadow: none;
  appearance: none;

  &:focus {
    outline: none;
    box-shadow: none;
  }
`;

export const ScenarioDeleteButton = styled.button`
  border: 1px solid #bfd0de;
  background: #f4f8fb;
  color: #29465a;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ScenarioTabsWrap = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 1px;
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: 1px solid #c9d8e4;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
`;

export const ScenarioTabButton = styled.button<{ active?: boolean; dragOver?: boolean; isDragging?: boolean }>`
  position: relative;
  flex: 0 0 auto;
  max-width: 160px;
  border: 1px solid ${({ active }) => (active ? '#9fb9cc' : '#c9d8e4')};
  border-bottom: 0;
  background: ${({ active }) => (active ? '#ffffff' : '#edf4fa')};
  color: ${({ active }) => (active ? '#1f3341' : '#486073')};
  border-radius: 10px 10px 0 0;
  padding: 8px 14px 9px;
  min-height: 34px;
  font-size: 13px;
  font-weight: ${({ active }) => (active ? 700 : 600)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  touch-action: manipulation;
  cursor: pointer;
  z-index: ${({ active }) => (active ? 2 : 1)};
  opacity: ${({ isDragging }) => (isDragging ? 0.65 : 1)};
  box-shadow: ${({ dragOver }) => (dragOver ? 'inset 0 0 0 2px #7da2bc' : 'none')};

  &[draggable='true'] {
    cursor: ${({ isDragging }) => (isDragging ? 'grabbing' : 'grab')};
  }

  &:hover {
    background: ${({ active }) => (active ? '#ffffff' : '#e4eef7')};
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

export const ScenarioTabRenameInput = styled.input`
  border: 0;
  background: transparent;
  color: #1f3341;
  padding: 0 14px 0 0;
  min-height: 20px;
  min-width: 0;
  width: 100%;
  font-size: 13px;
  font-weight: 700;
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
  border: 1px solid #9fb9cc;
  border-bottom: 0;
  background: #ffffff;
  color: #1f3341;
  border-radius: 10px 10px 0 0;
  padding: 8px 14px 9px;
  min-height: 34px;
  white-space: nowrap;
`;

export const ScenarioTabCloseButton = styled.button`
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: #486073;
  width: 16px;
  height: 16px;
  padding: 0;
  line-height: 1;
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ScenarioTabTooltip = styled.div`
  position: fixed;
  z-index: 2000;
  pointer-events: none;
  max-width: 280px;
  border: 1px solid #c9d8e4;
  background: #ffffff;
  color: #1f3341;
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  box-shadow: 0 6px 16px rgba(21, 37, 50, 0.14);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const TickerHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
`;

export const TickerQuickActionRow = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  width: 100%;
  margin-bottom: 8px;
`;

export const TickerQuickActionButton = styled.button`
  border: 1px solid #c8d8e5;
  background: #f7fbff;
  color: #2f4f63;
  border-radius: 8px;
  min-height: 44px;
  padding: 6px 4px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 10px;
  cursor: pointer;
  touch-action: manipulation;

  &:hover {
    background: #edf6fb;
    border-color: #b6ccdc;
  }
`;

export const PortfolioPresetGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
`;

export const PortfolioPresetCardButton = styled.button`
  display: grid;
  gap: 6px;
  width: 100%;
  text-align: left;
  border: 1px solid #d4e0e9;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
  padding: 12px;
  color: #1f3341;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;

  &:hover {
    border-color: #9fc0d7;
    box-shadow: 0 6px 16px rgba(20, 52, 77, 0.12);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const PortfolioPresetContentRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: 14px;
  align-items: start;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

export const PortfolioPresetMain = styled.div`
  display: grid;
  gap: 6px;
`;

export const PortfolioPresetTitle = styled.span`
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
`;

export const PortfolioPresetDesc = styled.span`
  font-size: 12px;
  color: #4a6375;
  line-height: 1.35;
`;

export const PortfolioPresetCore = styled.span`
  font-size: 12px;
  color: #2f4f63;
  line-height: 1.35;
`;

export const PortfolioPresetMeta = styled.span`
  font-size: 11px;
  color: #5d7382;
  line-height: 1.3;
`;

export const PortfolioPresetPlan = styled.div`
  display: grid;
  gap: 4px;
  border: 1px solid #d9e5ee;
  border-radius: 10px;
  background: #f3f8fc;
  padding: 8px 10px;
`;

export const PortfolioPresetPlanItem = styled.span`
  font-size: 11px;
  color: #3f596b;
  line-height: 1.3;
  display: flex;
  justify-content: space-between;
  gap: 8px;
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
  border: 1px solid #2f6f93;
  background: #2f6f93;
  color: #fff;
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 13px;
  cursor: pointer;
  width: 100%;
  margin-bottom: 10px;
  touch-action: manipulation;

  @media (max-width: 960px) {
    margin-bottom: 21px;
  }
`;

export const TickerGridWrap = styled.div`
  border: 1px solid #e4edf4;
  border-radius: 10px;
  background: #f8fbfe;
  padding: 8px;
`;

export const TickerList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 6px;
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
  text-align: center;
  border: 1px solid ${({ selected }) => (selected ? '#b7cedd' : '#eaf1f6')};
  background: ${({ selected }) => (selected ? '#edf6fb' : '#fff')};
  color: #29465a;
  border-radius: 8px;
  padding: 6px 8px;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, padding-right 0.2s ease;

  &:hover {
    background: ${({ selected }) => (selected ? '#e3f1f9' : '#f3f8fc')};
    border-color: ${({ selected }) => (selected ? '#a8c3d5' : '#dde9f2')};
  }
`;

export const TickerGearButton = styled.button`
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%) scale(0.88);
  border: 1px solid #bfd0de;
  background: #fff;
  color: #29465a;
  border-radius: 999px;
  width: 24px;
  height: 24px;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  pointer-events: auto;
  transition: opacity 0.2s ease, transform 0.2s ease;
`;

export const SelectedChipWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;

  @media (max-width: 960px) {
    margin-top: 17px;
  }
`;

export const SelectedChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #b7cedd;
  background: #edf6fb;
  color: #29465a;
  border-radius: 8px;
  padding: 4px 6px 4px 8px;
  font-size: 11px;
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
  border: 0;
  background: transparent;
  color: #29465a;
  font-size: 12px;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  padding: 0;
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;
  &:hover {
    background: #dfeef8;
  }
`;

export const RatioGrid = styled.div`
  display: grid;
  gap: 8px;
`;

export const RatioRow = styled.label`
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) 52px;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #314d60;
`;

export const RatioTickerLabel = styled.span`
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const RatioSlider = styled.input`
  width: 100%;
  height: 22px;
  accent-color: #2f6f93;
`;

export const RatioValue = styled.span`
  text-align: right;
  font-size: 12px;
  color: #486073;
  font-variant-numeric: tabular-nums;
`;

export const PrimaryButton = styled.button`
  border: 1px solid #2f6f93;
  background: #2f6f93;
  color: #fff;
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 13px;
  cursor: pointer;
  touch-action: manipulation;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export const SecondaryButton = styled.button`
  border: 1px solid #bfd0de;
  background: #f4f8fb;
  color: #29465a;
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 13px;
  cursor: pointer;
  touch-action: manipulation;
`;

export const Header = styled.header`
  display: grid;
  gap: 8px;
`;

export const HeaderTitle = styled.h1`
  margin: 0;
`;

export const HeaderDescription = styled.p`
  margin: 0;
  color: #486073;
  font-size: 13px;
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: 12px;
`;

export const ModalCompactFormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: 12px;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
`;

export const ConfigFormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
`;

export const ConfigInputGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;

  @container (min-width: 640px) and (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 12px;
  }
`;

export const ConfigSectionDivider = styled.hr`
  border: 0;
  border-top: 1px solid #e9eff5;
  width: 86%;
  margin: 4px auto 8px;
`;

export const InlineField = styled.label`
  display: grid;
  gap: 6px;
  min-width: 0;
  font-size: 14px;
  color: #314d60;
`;

export const InlineFieldHeader = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

export const ModalTickerSearchWrap = styled.div`
  position: relative;
  margin-bottom: 10px;
`;

export const ModalTickerSearchIcon = styled.span`
  position: absolute;
  left: 10px;
  top: 50%;
  width: 14px;
  height: 14px;
  color: #5e7688;
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
  border: 1px solid #bfd0de;
  border-radius: 8px;
  padding: 8px 10px 8px 32px;
  font-size: 14px;
  color: #1f3341;
  background-color: #fff;

  &::placeholder {
    color: #6d8597;
  }

  &:focus-visible {
    outline: 2px solid #8ab1cb;
    outline-offset: 1px;
  }
`;

export const SearchResultList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
  scrollbar-gutter: stable;
`;

export const SearchResultButton = styled.button`
  width: 100%;
  border: 1px solid #d5e2ec;
  background: #fff;
  border-radius: 8px;
  padding: 8px 10px;
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: #bfcfdd;
    background: #f7fbff;
  }
`;

export const SearchResultTicker = styled.div`
  color: #1f3341;
  font-size: 13px;
  font-weight: 700;
`;

export const SearchResultName = styled.div`
  color: #486073;
  font-size: 12px;
  line-height: 1.4;
`;

export const InlineSelect = styled.select`
  width: 100%;
  min-width: 0;
  border: 1px solid #bfd0de;
  border-radius: 8px;
  padding: 8px 28px 8px 10px;
  font-size: 14px;
  background-color: #fff;
  appearance: none;
  -webkit-appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, #5e7688 50%), linear-gradient(135deg, #5e7688 50%, transparent 50%);
  background-position: calc(100% - 14px) calc(50% - 1px), calc(100% - 10px) calc(50% - 1px);
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
`;

export const PresetDropdownWrap = styled.div`
  position: relative;
`;

export const PresetDropdownButton = styled.button`
  width: 100%;
  min-width: 0;
  border: 1px solid #bfd0de;
  border-radius: 8px;
  padding: 8px 28px 8px 10px;
  font-size: 14px;
  line-height: 1.4;
  color: #1f3341;
  text-align: left;
  background-color: #fff;
  cursor: pointer;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    right: 10px;
    top: calc(50% - 2px);
    width: 8px;
    height: 8px;
    border-right: 2px solid #5e7688;
    border-bottom: 2px solid #5e7688;
    transform: rotate(45deg);
    pointer-events: none;
  }
`;

export const PresetDropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid #bfd0de;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(31, 51, 65, 0.14);
  z-index: 20;
`;

export const PresetDropdownOption = styled.button<{ selected?: boolean }>`
  display: block;
  width: 100%;
  border: 0;
  border-bottom: 1px solid #eef3f7;
  padding: 8px 10px;
  text-align: left;
  font-size: 14px;
  color: #1f3341;
  background: ${({ selected }) => (selected ? '#edf6fb' : '#fff')};
  cursor: pointer;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: ${({ selected }) => (selected ? '#e5f2fa' : '#f5f9fc')};
  }
`;

export const PresetChipGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-content: start;
  gap: 8px;
`;

export const PresetChipScrollArea = styled.div`
  max-height: 110px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  margin-bottom: 6px;
  scrollbar-gutter: stable;
`;

export const PresetChipButton = styled.button<{ selected?: boolean }>`
  border: 1px solid ${({ selected }) => (selected ? '#9fb9cc' : '#d5e2ec')};
  background: ${({ selected }) => (selected ? '#edf6fb' : '#ffffff')};
  color: ${({ selected }) => (selected ? '#1f3341' : '#355366')};
  border-radius: 9px;
  padding: 7px 8px;
  font-size: 12px;
  font-weight: ${({ selected }) => (selected ? 700 : 600)};
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  touch-action: manipulation;

  &:hover {
    border-color: ${({ selected }) => (selected ? '#8baec6' : '#c2d4e2')};
    background: ${({ selected }) => (selected ? '#e4f1f9' : '#f5f9fc')};
  }
`;

export const ModeToggleInput = styled.input`
  width: 18px;
  height: 18px;
  margin: 0;
`;

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: clamp(8px, 1.5vw, 10px);
`;

export const SummaryValue = styled.p`
  margin: 8px 0 0;
  font-size: 18px;
  font-weight: 700;
`;

export const CompactSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(170px, 100%), 1fr));
  gap: 8px;
`;

export const CompactSummaryItem = styled.div`
  border: 1px solid #dfe9f1;
  background: #f8fbfe;
  border-radius: 8px;
  padding: 8px 10px;
  min-width: 0;
`;

export const CompactSummaryLabel = styled.p`
  margin: 0;
  font-size: 12px;
  color: #557084;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CompactSummaryLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
`;

export const CompactSummaryLabelGrow = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

export const CompactSummaryHelpButton = styled.button`
  flex: 0 0 auto;
  margin-left: auto;
  border: 1px solid #bfd0de;
  background: #f4f8fb;
  color: #29465a;
  border-radius: 999px;
  width: 16px;
  height: 16px;
  line-height: 1;
  padding: 0;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
`;

export const CompactSummaryValue = styled.p`
  margin: 4px 0 0;
  font-size: 15px;
  font-weight: 700;
  color: #1f3341;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SeriesFilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 10px;
  align-items: center;
  justify-content: space-between;
`;

export const SeriesFilterGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
`;

export const SeriesFilterItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

export const SeriesFilterLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #486073;
  cursor: pointer;
  user-select: none;
`;

export const SeriesFilterCheckbox = styled.input`
  margin: 0;
  width: 14px;
  height: 14px;
  accent-color: #2f6f93;
`;

export const SeriesBgToggleButton = styled.button<{ active: boolean }>`
  border: 1px solid ${({ active }) => (active ? '#2f6f93' : '#bfd0de')};
  background: ${({ active }) => (active ? '#2f6f93' : '#f4f8fb')};
  color: ${({ active }) => (active ? '#fff' : '#486073')};
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
`;

export const SeriesToggleRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

export const SeriesToggleLabel = styled.span`
  font-size: 12px;
  color: #486073;
`;

export const HintText = styled.p`
  margin: 0;
  font-size: 13px;
  color: #486073;
`;

export const HelpMarkButton = styled.button`
  border: 1px solid #bfd0de;
  background: #f4f8fb;
  color: #29465a;
  border-radius: 999px;
  width: 18px;
  height: 18px;
  line-height: 1;
  padding: 0;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
`;

export const ScenarioTabsHelpButton = styled(HelpMarkButton)`
  align-self: center;
  flex: 0 0 auto;
  margin-left: 6px;
`;

export const ErrorBox = styled.div`
  border: 1px solid #f0bcbc;
  border-radius: 8px;
  padding: 10px;
  background: #fff2f2;
  color: #8d2323;
`;

export const ChartWrap = styled.div`
  width: 100%;
  height: clamp(200px, 30vw, 260px);
  min-width: 0;
  overflow: hidden;
  contain: layout paint style;
`;

export const AllocationChartLayout = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr));
  gap: clamp(8px, 1.5vw, 12px);
  align-items: start;
  contain: layout style;
`;

export const AllocationLegend = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
  container-type: inline-size;
`;

export const AllocationLegendItem = styled.li`
  display: grid;
  grid-template-columns: 16px 72px minmax(120px, 1fr) 40px 52px;
  grid-template-areas: 'dot name slider fix value';
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #314d60;

  @container (max-width: 560px) {
    grid-template-columns: 16px minmax(0, 1fr) 48px;
    grid-template-areas:
      'dot name value'
      'dot slider fix';
    gap: 6px 8px;
  }

  @media (max-width: 560px) {
    grid-template-columns: 16px minmax(0, 1fr) 48px;
    grid-template-areas:
      'dot name value'
      'dot slider fix';
    gap: 6px 8px;
  }
`;

export const AllocationColorDot = styled.span<{ color: string }>`
  grid-area: dot;
  width: 16px;
  height: 12px;
  border-radius: 3px;
  background: ${({ color }) => color};
`;

export const AllocationLegendName = styled.span`
  grid-area: name;
  min-width: 0;
  color: #314d60;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const AllocationLegendSlider = styled.input`
  grid-area: slider;
  width: 100%;
  height: 12px;
  appearance: none;
  -webkit-appearance: none;
  background: linear-gradient(to right, #2f6f93 0%, #2f6f93 var(--slider-progress), #d8e7f1 var(--slider-progress), #d8e7f1 100%);
  border: 1px solid #c7d8e4;
  border-radius: 3px;
  --slider-progress: 0%;
  margin: 0;
  padding: 0;

  &::-webkit-slider-runnable-track {
    height: 12px;
    background: transparent;
    border-radius: 3px;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 24px;
    margin-top: -6px;
    border-radius: 3px;
    border: 1px solid #2f6f93;
    background: #2f6f93;
  }

  &::-moz-range-track {
    height: 12px;
    background: transparent;
    border-radius: 3px;
  }

  &::-moz-range-progress {
    height: 12px;
    background: transparent;
    border-radius: 3px;
  }

  &::-moz-range-thumb {
    width: 14px;
    height: 24px;
    border-radius: 3px;
    border: 1px solid #2f6f93;
    background: #2f6f93;
  }
`;

export const AllocationFixButton = styled.button<{ active: boolean }>`
  grid-area: fix;
  width: 36px;
  height: 24px;
  border: 1px solid ${({ active }) => (active ? '#2f6f93' : '#bfd0de')};
  background: ${({ active }) => (active ? '#2f6f93' : '#f4f8fb')};
  color: ${({ active }) => (active ? '#fff' : '#486073')};
  border-radius: 5px;
  padding: 0;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;

  @container (max-width: 560px) {
    justify-self: end;
  }

  @media (max-width: 560px) {
    justify-self: end;
  }
`;

export const AllocationLegendValue = styled.span`
  grid-area: value;
  color: #486073;
  font-variant-numeric: tabular-nums;
  justify-self: end;
`;

export const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(16, 29, 41, 0.45);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 2147483000;
  contain: paint;
`;

export const ModalPanel = styled.section`
  width: min(520px, 100%);
  max-height: min(88vh, 760px);
  background: #fff;
  border: 1px solid #d7e2eb;
  border-radius: 12px;
  padding: 16px;
  display: grid;
  gap: 12px;
  overflow-y: auto;
  scrollbar-gutter: stable;
`;

export const ModalTitle = styled.h3`
  margin: 0;
  color: #1f3341;
`;

export const ModalBody = styled.p`
  margin: 0;
  color: #314d60;
  line-height: 1.5;
  white-space: pre-line;
`;

export const ModalTabList = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 6px;
  margin-bottom: 4px;
`;

export const ModalTabButton = styled.button<{ active?: boolean }>`
  position: relative;
  border: 1px solid ${({ active }) => (active ? '#9fb9cc' : '#c9d8e4')};
  border-bottom: 0;
  background: ${({ active }) => (active ? '#ffffff' : '#edf4fa')};
  color: ${({ active }) => (active ? '#1f3341' : '#486073')};
  border-radius: 10px 10px 0 0;
  padding: 8px 14px 9px;
  font-size: 13px;
  font-weight: ${({ active }) => (active ? 700 : 600)};
  cursor: pointer;
  touch-action: manipulation;
  z-index: ${({ active }) => (active ? 2 : 1)};

  &:hover {
    background: ${({ active }) => (active ? '#ffffff' : '#e4eef7')};
  }
`;

export const ModalClose = styled.button`
  justify-self: end;
  border: 1px solid #bfd0de;
  background: #f4f8fb;
  color: #29465a;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  cursor: pointer;
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;
