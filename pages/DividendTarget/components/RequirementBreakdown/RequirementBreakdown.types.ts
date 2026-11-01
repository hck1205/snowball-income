import type { InflationRateChoice } from '@/shared/constants/inflation';
import type { TickerRequirement } from '@/shared/lib/dividendTarget';

export type RequirementBreakdownProps = {
  readonly item: TickerRequirement;
  /** 실측값 기준일. 없으면 `null`. */
  readonly asOf: string | null;
  readonly inflationRate: InflationRateChoice;
  readonly onInflationChange: (rate: InflationRateChoice) => void;
  readonly onSimulate: (ticker: string) => void;
};
