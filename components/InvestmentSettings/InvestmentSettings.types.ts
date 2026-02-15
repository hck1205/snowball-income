import type { ChangeEvent } from 'react';
import type { YieldFormValues } from '@/shared/types';

export type InvestmentSettingsProps = {
  values: YieldFormValues;
  showQuickEstimate: boolean;
  showSplitGraphs: boolean;
  validationErrors: string[];
  onSetField: <K extends keyof YieldFormValues>(field: K, value: YieldFormValues[K]) => void;
  onToggleQuickEstimate: (checked: boolean) => void;
  onToggleSplitGraphs: (checked: boolean) => void;
  onHelpResultMode: () => void;
  onHelpReinvestTiming: () => void;
  onHelpDpsGrowthMode: () => void;
};

export type SelectChangeEvent = ChangeEvent<HTMLSelectElement>;
