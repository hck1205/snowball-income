export { FreshnessBadge } from './FreshnessBadge';
export type { FreshnessBadgeProps, PortfolioFreshnessTone } from './FreshnessBadge';

export { GoalCard, buildPortfolioGoalCardModel, resolvePortfolioGoalBasis, toProgressBucket } from './GoalCard';
export type {
  BuildPortfolioGoalCardModelInput,
  GoalBasisNoteModel,
  GoalCardProps,
  GoalConditionRow,
  GoalProgressBucket,
  GoalStatusLineModel,
  GoalTileModel,
  PortfolioGoalBasis,
  PortfolioGoalCardModel,
  PortfolioGoalFallbackReason,
  ResolvePortfolioGoalBasisInput
} from './GoalCard';

export { GoalMeter } from './GoalMeter';
export type { GoalMeterProps } from './GoalMeter';

export { GoalSetupPanel } from './GoalSetupPanel';
export type { GoalSetupPanelProps } from './GoalSetupPanel';

export { HoldingPicker } from './HoldingPicker';
export type { HoldingPickerProps } from './HoldingPicker';

export { HoldingPickerDrawer } from './HoldingPickerDrawer';
export type { HoldingPickerDrawerProps } from './HoldingPickerDrawer';

export { COMPOSITION_MAX_SLICES, HoldingsComposition, buildCompositionSlices, buildConicStops } from './HoldingsComposition';
export type { CompositionSlice, HoldingsCompositionProps } from './HoldingsComposition';

export { HoldingsTable } from './HoldingsTable';
export type { HoldingsTableProps, PortfolioHoldingRowModel } from './HoldingsTable';

export { ManualTickerForm } from './ManualTickerForm';
export type {
  ManualTickerFormProps,
  ManualTickerSubmitInput,
  ManualTickerSubmitResult
} from './ManualTickerForm';

export { default as CloudSyncNotice } from './CloudSyncNotice';
export type { CloudSyncNoticeProps } from './CloudSyncNotice';

/* 월간 리캡 — 한 해의 배당 리듬과 이번 달의 자리(평가서 P1-⑤). */
export { MonthlyRecap } from './MonthlyRecap';
