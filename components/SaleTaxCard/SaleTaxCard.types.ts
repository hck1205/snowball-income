import type { SimulationSummary } from '@/shared/types';

export type SaleTaxCardProps = {
  summary: SimulationSummary;
  isResultCompact: boolean;
  formatResultAmount: (value: number, compact: boolean) => string;
};
