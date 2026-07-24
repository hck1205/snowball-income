import { memo, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components';
import type { MonthlyCashflowProps } from './MonthlyCashflow.types';
import { resolveSelectedYear } from './MonthlyCashflow.utils';
import { ChartWrap, HintText } from '@/pages/Main/Main.shared.styled';
import { CashflowHeader, CashflowHeaderControls, CashflowTitle, CashflowTotalLabel } from './MonthlyCashflow.styled';
import { Select } from '@/components/common';
import { buildRecentCashflowBarOption } from '@/pages/Main/utils';
import { formatKRW } from '@/shared/utils';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { usePalettePresetAtomValue } from '@/jotai';

function MonthlyCashflowComponent({
  yearlyCashflowByTicker,
  hasData = true,
  emptyMessage,
  formatAmount = formatKRW,
  chartLabelSuffix = '',
  ResponsiveChart
}: MonthlyCashflowProps) {
  const years = yearlyCashflowByTicker.years;
  const [selectedYear, setSelectedYear] = useState<number | null>(() => resolveSelectedYear(years, null));
  /* 캔버스는 CSS 변수를 다시 읽지 않는다 — 팔레트 프리셋 전환 시 옵션을 다시 빌드해야 한다. */
  const palettePreset = usePalettePresetAtomValue();

  useEffect(() => {
    setSelectedYear((prev) => resolveSelectedYear(years, prev));
  }, [years]);

  const selectedYearData =
    selectedYear === null ? null : yearlyCashflowByTicker.byYear[String(selectedYear)] ?? null;
  /* 표시 통화도 팔레트와 같은 재빌드 트리거다 — 빠지면 이 차트만 옛 통화 라벨로 남는다. */
  const chartOption = useMemo(
    () => buildRecentCashflowBarOption(selectedYearData ?? { months: [], series: [] }, undefined, formatAmount),
    [formatAmount, palettePreset, selectedYearData]
  );
  const totalDividend = selectedYearData?.totalDividend ?? 0;
  const headerControls = (
    <CashflowHeaderControls>
      <Select
        size="md"
        width="116px"
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
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}년
          </option>
        ))}
      </Select>
      <CashflowTotalLabel>
        {/* 합계는 원화에서 이미 합산된 값이다 — 여기서 표시 직전에 한 번만 환산한다. */}
        {selectedYear ? `배당 합계: ${formatAmount(totalDividend)}` : '실지급 배당 데이터 없음'}
      </CashflowTotalLabel>
    </CashflowHeaderControls>
  );

  return (
    <Card>
      <CashflowHeader>
        <CashflowTitle>실지급 월별 배당</CashflowTitle>
        {headerControls}
      </CashflowHeader>
      {hasData ? (
        <ChartWrap role="img" aria-label={`선택 연도의 월별 실지급 배당 차트${chartLabelSuffix}`}>
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
