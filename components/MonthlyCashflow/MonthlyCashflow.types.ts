import type { EChartsOption } from 'echarts';
import type { ComponentType } from 'react';

export type MonthlyCashflowProps = {
  chartOption: EChartsOption;
  ResponsiveChart: ComponentType<{ option: EChartsOption; replaceMerge?: string[] }>;
};
