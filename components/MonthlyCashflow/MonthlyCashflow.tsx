import { memo } from 'react';
import { Card } from '@/components';
import type { MonthlyCashflowProps } from './MonthlyCashflow.types';
import { ChartWrap } from '@/pages/Main/Main.shared.styled';

function MonthlyCashflowComponent({ chartOption, ResponsiveChart }: MonthlyCashflowProps) {
  return (
    <Card title="실지급 월별 배당 (최근 12개월)">
      <ChartWrap role="img" aria-label="최근 12개월 실지급 월별 배당 차트">
        <ResponsiveChart option={chartOption} />
      </ChartWrap>
    </Card>
  );
}

const MonthlyCashflow = memo(MonthlyCashflowComponent);

export default MonthlyCashflow;
