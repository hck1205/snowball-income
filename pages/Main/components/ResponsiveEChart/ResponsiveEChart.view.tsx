import ReactECharts from 'echarts-for-react';
import { chartStyle, containerStyle } from './ResponsiveEChart.styled';
import type { ResponsiveEChartProps } from './ResponsiveEChart.types';

type ResponsiveEChartViewProps = ResponsiveEChartProps & {
  chartRef: React.RefObject<any>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  width?: number;
  height?: number;
};

export default function ResponsiveEChartView({
  chartRef,
  containerRef,
  height,
  option,
  replaceMerge,
  width
}: ResponsiveEChartViewProps) {
  return (
    <div ref={containerRef as any} style={containerStyle}>
      <ReactECharts
        ref={chartRef}
        option={option}
        autoResize={false}
        replaceMerge={replaceMerge}
        opts={{
          width: width && width > 0 ? width : undefined,
          height: height && height > 0 ? height : undefined
        }}
        style={chartStyle}
      />
    </div>
  );
}
