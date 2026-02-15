import type { ComponentType } from 'react';
import type { EChartsOption } from 'echarts';
import type { TickerProfile } from '@/shared/types/snowball';

export type PortfolioCompositionProps = {
  includedProfiles: TickerProfile[];
  normalizedAllocation: Array<{ profile: TickerProfile; weight: number }>;
  allocationPieOption: EChartsOption | null;
  allocationPercentByTickerId: Record<string, number>;
  fixedByTickerId: Record<string, boolean>;
  adjustableTickerCount: number;
  showPortfolioDividendCenter: boolean;
  onToggleCenterDisplay: (checked: boolean) => void;
  onSetTickerWeight: (profileId: string, value: number) => void;
  onToggleTickerFixed: (profileId: string) => void;
  onRemoveIncludedTicker: (profileId: string) => void;
  ResponsiveChart: ComponentType<{ option: EChartsOption; replaceMerge?: string[] }>;
};
