import { memo, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components';
import { ChartWrap, HintText } from '@/components/common';
import { buildRecentCashflowBarOption } from '@/shared/lib/charts';
import { formatKRW } from '@/shared/utils';
import { usePalettePresetAtomValue } from '@/jotai';
import type { MonthlyCashflowProps } from './MonthlyCashflow.types';
import { buildCalendarMonths, buildPayoutScheduleRows, resolveSelectedYear } from './MonthlyCashflow.utils';
import { CashflowCalendar, CashflowControls, PayoutScheduleStrip } from './components';
import type { CashflowViewMode } from './components';
import { CashflowHeader, CashflowTitle } from './MonthlyCashflow.styled';

function MonthlyCashflowComponent({
  yearlyCashflowByTicker,
  hasData = true,
  emptyMessage,
  formatAmount = formatKRW,
  chartLabelSuffix = '',
  scheduleTickers = [],
  ResponsiveChart
}: MonthlyCashflowProps) {
  const scheduleRows = useMemo(() => buildPayoutScheduleRows(scheduleTickers), [scheduleTickers]);
  /*
   * 차트(엔진의 월 분배) ↔ 캘린더(관측 지급월로 재배분)는 **다른 월 배치**를 보여준다.
   * 나란히 두면 "왜 숫자가 다르냐"가 되므로 한 번에 하나만 — 토글 전환이 이 화면의 UX 답이다.
   */
  const [viewMode, setViewMode] = useState<CashflowViewMode>('chart');
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
  const calendarMonths = useMemo(
    () => (viewMode === 'calendar' ? buildCalendarMonths(selectedYearData?.series ?? [], scheduleRows) : []),
    [scheduleRows, selectedYearData, viewMode]
  );

  return (
    <Card>
      <CashflowHeader>
        <CashflowTitle>실지급 월별 배당</CashflowTitle>
        <CashflowControls
          years={years}
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
          totalDividend={totalDividend}
          formatAmount={formatAmount}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
        />
      </CashflowHeader>
      {!hasData ? (
        <HintText>{emptyMessage ?? '좌측 티커 생성을 통해 포트폴리오를 구성해주세요.'}</HintText>
      ) : viewMode === 'chart' ? (
        <ChartWrap role="img" aria-label={`선택 연도의 월별 실지급 배당 차트${chartLabelSuffix}`}>
          <ResponsiveChart option={chartOption} replaceMerge={['series', 'legend', 'xAxis']} />
        </ChartWrap>
      ) : (
        <CashflowCalendar months={calendarMonths} formatAmount={formatAmount} labelSuffix={chartLabelSuffix} />
      )}
      {hasData && scheduleRows.length > 0 ? <PayoutScheduleStrip rows={scheduleRows} /> : null}
    </Card>
  );
}

const MonthlyCashflow = memo(MonthlyCashflowComponent);

export default MonthlyCashflow;
