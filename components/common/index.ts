export { default as Banner } from './Banner';
export type { BannerProps, BannerTone } from './Banner';

export { BrandGlyph } from './BrandGlyph';
export type { BrandGlyphProps } from './BrandGlyph';
export { HippoCoinScene } from './HippoCoinScene';
export type { HippoCoinSceneProps } from './HippoCoinScene';

export { default as Button } from './Button';
export type { ButtonProps, ButtonSize, ButtonVariant } from './Button';

export { default as Card } from './Card';
export type { CardProps, CardTone } from './Card';

export { ChartWrap } from './ChartWrap';

export { default as Chip } from './Chip';
export type { ChipProps } from './Chip';

export { CompactSummaryHelpButton } from './CompactSummaryHelpButton';

export { ConfigFormGrid, ConfigInputGrid, ConfigSectionDivider } from './ConfigForm';

/**
 * 자료형 화면(국회의원 거래·국민연금·증시 캘린더)이 공유하는 섹션 조판.
 * 표 자체는 `DataTable` 이, 그 표를 둘러싼 단락은 이쪽이 그린다.
 */
export {
  DataSection,
  NoteList,
  SectionLink,
  SectionMeta,
  SectionStack,
  SectionSubtitle,
  SectionTitle,
  SummaryGrid,
  splitEmphasis
} from './DataSection';
export type { DataSectionProps, NoteChunk, NoteListProps } from './DataSection';

export { default as DataTable } from './DataTable';

export { ErrorBox } from './ErrorBox';

export { default as FormSection } from './FormSection';

export { HelpMarkButton } from './HelpMarkButton';

export { HintText } from './HintText';

export { InlineField, InlineFieldHeader } from './InlineField';

export { default as InputField } from './InputField';
export { FrequencySelect } from './InputField';

export { default as Modal } from './Modal';
export { MODAL_EXIT_MS, ModalActions, ModalBackdrop, ModalBody, ModalPanel, ModalTitle } from './Modal';
export type { ModalProps } from './Modal';

export { default as PageFooter } from './PageFooter';
export { PageFooterSlotProvider } from './PageFooterSlot';
export type { PageFooterSlotProviderProps } from './PageFooterSlot';
export type { PageFooterProps } from './PageFooter';

export { default as PageHero } from './PageHero';
export type { PageHeroProps, PageHeroTone } from './PageHero';

/**
 * 고르는 면(brand)의 공용 카드. "여기서 무언가를 고르면 화면이 바뀌는가"가 참이면 이 카드고,
 * 결과·차트·표처럼 **읽는 면**은 위의 `Card` 를 그대로 쓴다.
 */
export { PickCard, PickCardGrid } from './PickCard';
export type {
  PickCapAxis,
  PickCapHeight,
  PickCapKind,
  PickCapPaint,
  PickCardCap,
  PickCardGridProps,
  PickCardProps
} from './PickCard';

export {
  AllocationChartLayout,
  AllocationClearFixedButton,
  AllocationColorDot,
  AllocationFixButton,
  AllocationHint,
  AllocationLegend,
  AllocationLegendItem,
  AllocationLegendName,
  AllocationLegendSlider,
  AllocationLegendValue,
  SelectedChipWrap
} from './PortfolioAllocation';

export { default as QuantityInput, QUANTITY_INPUT_DECIMALS } from './QuantityInput';
export type { QuantityInputProps } from './QuantityInput';

export { default as RangeSlider } from './RangeSlider';
export type { RangeSliderProps } from './RangeSlider';

export { ResponsiveEChart } from './ResponsiveEChart';
export type { ResponsiveEChartProps } from './ResponsiveEChart';

export { ResultGrid, ResultGridCell } from './ResultGrid';

/**
 * 🔴 2026-08-04 승격 — 원래 `pages/Community/CommunityDetailPage/components/` 에 있었다.
 * 랜딩이 같은 장치를 요구했고 페이지 폴더끼리 직접 import 는 금지라, 두 벌로 복제하는 대신
 * 재사용 레이어로 올렸다. 커뮤니티 상세는 이제 여기서 가져간다(사본 0).
 */
export { ScrollTopButton } from './ScrollTopButton';
export type { ScrollTopButtonProps } from './ScrollTopButton';

export { default as Select } from './Select';
export type { SelectProps, SelectSize, SelectWidth } from './Select';

export {
  SeriesFilterCheckbox,
  SeriesFilterGroup,
  SeriesFilterItem,
  SeriesFilterLabel,
  SeriesFilterRow
} from './SeriesFilter';

export {
  SHARE_CHANNELS,
  SHARE_DIALOG_COPY,
  ShareDialog,
  buildShareChannelUrl,
  findShareChannel,
  isNativeShareIdiomatic
} from './ShareDialog';
export type { ShareChannel, ShareChannelId, ShareDialogProps } from './ShareDialog';

export { default as SideDrawer } from './SideDrawer';
export type { SideDrawerBodyLayout, SideDrawerDimScope, SideDrawerProps, SideDrawerSide } from './SideDrawer';

export { default as StatTile, toProgressPercent } from './StatTile';
export type { StatEmphasis, StatTileProps, StatTone } from './StatTile';

export { default as Tabs } from './Tabs';
export { TabButton, TabList } from './Tabs';
export type { TabItem, TabsProps } from './Tabs';

export {
  TickerChipWrap,
  TickerCreateButton,
  TickerGearButton,
  TickerGridWrap,
  TickerItemButton,
  TickerList
} from './TickerPicker';

export { default as Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';

export { default as Toggle } from './Toggle';
export type { ToggleProps, ToggleSize } from './Toggle';

export { default as ToggleField } from './ToggleField';
