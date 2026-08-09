import type { MarketPulseState } from '@/pages/MarketPulse/hooks';

export type HippoStatsViewProps = {
  state: MarketPulseState;
  onReload: () => void;
};
