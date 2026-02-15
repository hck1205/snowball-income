import { memo } from 'react';
import { Card } from '@/components';
import type { MonthlyCashflowProps } from './MonthlyCashflow.types';
import { ChartWrap, HintText } from '@/pages/Main/Main.shared.styled';

function MonthlyCashflowComponent({ chartOption, hasData = true, emptyMessage, ResponsiveChart }: MonthlyCashflowProps) {
  return (
    <Card title="실지급 월별 배당 (최근 12개월)">
      {hasData ? (
        <ChartWrap role="img" aria-label="최근 12개월 실지급 월별 배당 차트">
          <ResponsiveChart option={chartOption} replaceMerge={['series', 'legend', 'xAxis']} />
        </ChartWrap>
      ) : (
        <HintText>{emptyMessage ?? '좌측 티커 생성을 통해 포트폴리오를 구성해주세요.'}</HintText>
      )}
    </Card>
  );
}

const MonthlyCashflow = memo(MonthlyCashflowComponent);

export default MonthlyCashflow;
