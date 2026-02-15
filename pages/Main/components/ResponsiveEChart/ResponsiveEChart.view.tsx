import ReactECharts from 'echarts-for-react';
import { chartStyle, containerStyle } from './ResponsiveEChart.styled';
import type { ResponsiveEChartProps } from './ResponsiveEChart.types';

type ResponsiveEChartViewProps = ResponsiveEChartProps & {
  chartRef: React.RefObject<any>;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

export default function ResponsiveEChartView({
  chartRef,
  containerRef,
  option,
  replaceMerge
}: ResponsiveEChartViewProps) {
  return (
    <div ref={containerRef as any} style={containerStyle}>
      <ReactECharts
        ref={chartRef}
        option={option}
        autoResize={false}
        lazyUpdate
        replaceMerge={replaceMerge}
        opts={{
          renderer: 'canvas'
        }}
        style={chartStyle}
      />
    </div>
  );
}
