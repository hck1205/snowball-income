import type { SimulationOutput } from '@/shared/types';

export type SimulationResultProps = {
  simulation: SimulationOutput;
  showQuickEstimate: boolean;
  isResultCompact: boolean;
  targetMonthlyDividend: number;
  onToggleCompact: (checked: boolean) => void;
  formatResultAmount: (value: number, compact: boolean) => string;
  formatPercent: (value: number) => string;
  targetYearLabel: (year: number | undefined) => string;
};
