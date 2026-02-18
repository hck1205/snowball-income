import { memo, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components';
import type { MonthlyCashflowProps } from './MonthlyCashflow.types';
import { ChartWrap, HintText, InlineSelect, SeriesToggleLabel } from '@/pages/Main/Main.shared.styled';
import { buildRecentCashflowBarOption } from '@/pages/Main/utils';
import { formatKRW } from '@/shared/utils';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

function MonthlyCashflowComponent({ yearlyCashflowByTicker, hasData = true, emptyMessage, ResponsiveChart }: MonthlyCashflowProps) {
  const years = yearlyCashflowByTicker.years;
  const [selectedYear, setSelectedYear] = useState<number | null>(years[years.length - 1] ?? null);

  useEffect(() => {
    if (years.length === 0) {
      setSelectedYear(null);
      return;
    }
    setSelectedYear((prev) => {
      if (prev !== null && years.includes(prev)) return prev;
      return years[years.length - 1] ?? null;
    });
  }, [years]);

  const selectedYearData =
    selectedYear === null ? null : yearlyCashflowByTicker.byYear[String(selectedYear)] ?? null;
  const chartOption = useMemo(
    () => buildRecentCashflowBarOption(selectedYearData ?? { months: [], series: [] }),
    [selectedYearData]
  );
  const totalDividend = selectedYearData?.totalDividend ?? 0;
  const headerControls = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <InlineSelect
        aria-label="실지급 배당 연도 선택"
        value={selectedYear ?? ''}
        onChange={(event) => {
          const nextYear = Number(event.target.value);
          trackEvent(ANALYTICS_EVENT.INVESTMENT_SETTING_CHANGED, {
            field_name: 'monthly_cashflow_selected_year',
            value: nextYear
          });
          setSelectedYear(nextYear);
        }}
        style={{ maxWidth: '110px', minWidth: '110px', padding: '6px 24px 6px 8px', fontSize: '13px' }}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}년
          </option>
        ))}
      </InlineSelect>
      <SeriesToggleLabel style={{ whiteSpace: 'nowrap' }}>
        {selectedYear ? `배당 합계: ${formatKRW(totalDividend)}` : '실지급 배당 데이터 없음'}
      </SeriesToggleLabel>
    </div>
  );

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <h2 style={{ margin: 0, color: '#1f3341', fontSize: '18px' }}>실지급 월별 배당</h2>
        {headerControls}
      </div>
      {hasData ? (
        <ChartWrap role="img" aria-label="선택 연도의 월별 실지급 배당 차트">
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
