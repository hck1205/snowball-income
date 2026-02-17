import type { EChartsOption } from 'echarts';
import type { ComponentType } from 'react';
import type { YearlyCashflowByTicker } from '@/pages/Main/utils';

export type MonthlyCashflowProps = {
  chartOption?: EChartsOption;
  yearlyCashflowByTicker: YearlyCashflowByTicker;
  hasData?: boolean;
  emptyMessage?: string;
  ResponsiveChart: ComponentType<{ option: EChartsOption; replaceMerge?: string[] }>;
};
