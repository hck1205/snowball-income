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
  onSetTickerWeight: (profileId: string, value: number) => void;
  onToggleTickerFixed: (profileId: string) => void;
  onClearAllFixed: () => void;
  onRemoveIncludedTicker: (profileId: string) => void;
  /** 달러 표시 중일 때 차트 `aria-label` 에 붙는 접미 — 파이 중앙의 월배당이 달러로 바뀌므로 여기도 알린다. */
  chartLabelSuffix?: string;
  ResponsiveChart: ComponentType<{ option: EChartsOption; replaceMerge?: string[] }>;
};
