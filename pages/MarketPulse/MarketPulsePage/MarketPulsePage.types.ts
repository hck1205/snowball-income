import type { MarketPulseState } from '../hooks';

export type MarketPulseViewProps = {
  state: MarketPulseState;
  onReload: () => void;
};
