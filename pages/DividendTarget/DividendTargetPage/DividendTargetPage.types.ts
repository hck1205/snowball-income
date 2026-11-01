import type { InflationRateChoice } from '@/shared/constants/inflation';
import type { DividendTargetModel, TickerRequirement } from '@/shared/lib/dividendTarget';

export type DividendTargetViewProps = {
  readonly model: DividendTargetModel;
  readonly monthlyMan: number;
  /** 자세히 보는 종목. 쿼리 파서가 큐레이션 안으로 강제하므로 모델에서 항상 찾아진다. */
  readonly selected: TickerRequirement;
  readonly inflationRate: InflationRateChoice;
  readonly onMonthlyChange: (monthlyMan: number, source: 'chip' | 'custom') => void;
  readonly onSelectTicker: (ticker: string) => void;
  readonly onInflationChange: (rate: InflationRateChoice) => void;
  /** slot = 이 화면의 어느 버튼에서 왔는가(계측). */
  readonly onSimulate: (ticker: string, slot: 'detail' | 'final') => void;
};
