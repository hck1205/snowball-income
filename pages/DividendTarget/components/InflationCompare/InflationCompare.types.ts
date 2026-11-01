import type { InflationRateChoice } from '@/shared/constants/inflation';
import type { TickerRequirement } from '@/shared/lib/dividendTarget';

export type InflationCompareProps = {
  readonly item: TickerRequirement;
  readonly inflationRate: InflationRateChoice;
  readonly onInflationChange: (rate: InflationRateChoice) => void;
};
