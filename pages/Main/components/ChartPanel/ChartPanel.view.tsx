import { Card } from '@/components';
import { HintText, ResponsiveEChart } from '@/components/common';
import { SIMULATOR_COPY } from '@/shared/constants';
import { ChartPanelWrap } from './ChartPanel.styled';
import type { ChartPanelViewProps } from './ChartPanel.types';

export default function ChartPanelView({
  chartOption,
  title,
  titleRight,
  titleRightInline,
  hasData,
  emptyMessage,
  chartLabelSuffix = ''
}: ChartPanelViewProps) {
  return (
    <Card title={title} titleRight={titleRight} titleRightInline={titleRightInline}>
      {hasData ? (
        <ChartPanelWrap role="img" aria-label={`${title} 차트${chartLabelSuffix}`}>
          <ResponsiveEChart option={chartOption} />
        </ChartPanelWrap>
      ) : (
        <HintText>{emptyMessage ?? SIMULATOR_COPY.emptyPortfolioHint}</HintText>
      )}
    </Card>
  );
}
