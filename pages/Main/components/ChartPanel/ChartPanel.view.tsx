import { Card } from '@/components';
import { ResponsiveEChart } from '../ResponsiveEChart';
import { ChartPanelWrap } from './ChartPanel.styled';
import type { ChartPanelViewProps } from './ChartPanel.types';

export default function ChartPanelView({ chartOption, title }: ChartPanelViewProps) {
  return (
    <Card title={title}>
      <ChartPanelWrap>
        <ResponsiveEChart option={chartOption} />
      </ChartPanelWrap>
    </Card>
  );
}
