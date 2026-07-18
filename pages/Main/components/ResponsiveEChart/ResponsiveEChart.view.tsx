import { Suspense, lazy } from 'react';
import { chartStyle, containerStyle } from './ResponsiveEChart.styled';
import type { ResponsiveEChartProps } from './ResponsiveEChart.types';

/**
 * ECharts를 초기 번들에서 들어낸다.
 *
 * echarts + echarts-for-react가 초기 JS의 대부분을 차지하는데, 첫 화면(티커가 없는 빈 상태)에는
 * 차트가 하나도 없다. 차트는 사용자가 종목을 담은 뒤에야 나타나므로 지연 로딩이 자연스럽다.
 *
 * Suspense 경계를 이 컴포넌트 안에 두는 이유:
 *  - 호출부(ChartPanel, MainRightPanel)를 하나도 바꾸지 않아도 된다.
 *  - 폴백이 컨테이너와 같은 박스를 차지해 레이아웃 시프트(CLS)가 생기지 않는다.
 *
 * 타입 임포트(`import type { EChartsOption }`)는 컴파일 시 지워지므로 번들에 영향이 없다.
 */
const ReactECharts = lazy(() => import('echarts-for-react'));

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
      <Suspense fallback={<div style={chartStyle} aria-hidden="true" />}>
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
      </Suspense>
    </div>
  );
}
