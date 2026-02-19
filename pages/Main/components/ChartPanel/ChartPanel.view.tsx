import { Card } from '@/components';
import { HintText } from '@/pages/Main/Main.shared.styled';
import { ResponsiveEChart } from '../ResponsiveEChart';
import { ChartPanelWrap } from './ChartPanel.styled';
import type { ChartPanelViewProps } from './ChartPanel.types';

export default function ChartPanelView({ chartOption, title, titleRight, titleRightInline, hasData, emptyMessage }: ChartPanelViewProps) {
  return (
    <Card title={title} titleRight={titleRight} titleRightInline={titleRightInline}>
      {hasData ? (
        <ChartPanelWrap role="img" aria-label={`${title} 차트`}>
          <ResponsiveEChart option={chartOption} />
        </ChartPanelWrap>
      ) : (
        <HintText>{emptyMessage ?? '좌측 티커 생성을 통해 포트폴리오를 구성해주세요.'}</HintText>
      )}
    </Card>
  );
}
