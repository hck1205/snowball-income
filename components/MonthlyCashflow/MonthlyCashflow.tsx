import { Card } from '@/components';
import type { MonthlyCashflowProps } from './MonthlyCashflow.types';
import { ChartWrap } from '@/pages/Main/Main.shared.styled';

export default function MonthlyCashflow({ chartOption, ResponsiveChart }: MonthlyCashflowProps) {
  return (
    <Card title="실지급 월별 배당 (최근 12개월)">
      <ChartWrap>
        <ResponsiveChart option={chartOption} />
      </ChartWrap>
    </Card>
  );
}
