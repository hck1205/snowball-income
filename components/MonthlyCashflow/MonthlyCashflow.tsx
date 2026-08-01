import { memo, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components';
import { ChartWrap, HintText } from '@/components/common';
import { buildRecentCashflowBarOption } from '@/shared/lib/charts';
import { SIMULATOR_COPY } from '@/shared/constants';
import { formatKRW } from '@/shared/utils';
import { useEffectiveColorScheme, usePalettePresetAtomValue } from '@/jotai';
import type { MonthlyCashflowProps } from './MonthlyCashflow.types';
import { buildCalendarMonths, buildPayoutScheduleRows, resolveSelectedYear } from './MonthlyCashflow.utils';
import { CashflowCalendar, CashflowControls, PayoutScheduleStrip } from './components';
import type { CashflowViewMode } from './components';

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
  /* 캔버스는 CSS 변수를 다시 읽지 않는다 — 테마 두 축(색 프리셋·밝기) 어느 쪽이 바뀌어도 옵션을 다시 빌드해야 한다. */
  const palettePreset = usePalettePresetAtomValue();
  const colorScheme = useEffectiveColorScheme();

  useEffect(() => {
    setSelectedYear((prev) => resolveSelectedYear(years, prev));
  }, [years]);

  const selectedYearData =
    selectedYear === null ? null : yearlyCashflowByTicker.byYear[String(selectedYear)] ?? null;
  /* 표시 통화도 팔레트와 같은 재빌드 트리거다 — 빠지면 이 차트만 옛 통화 라벨로 남는다. */
  const chartOption = useMemo(
    () => buildRecentCashflowBarOption(selectedYearData ?? { months: [], series: [] }, undefined, formatAmount),
    [colorScheme, formatAmount, palettePreset, selectedYearData]
  );
  const totalDividend = selectedYearData?.totalDividend ?? 0;
  const calendarMonths = useMemo(
    () => (viewMode === 'calendar' ? buildCalendarMonths(selectedYearData?.series ?? [], scheduleRows) : []),
    [scheduleRows, selectedYearData, viewMode]
  );

  return (
    /* 제목·컨트롤 줄은 공용 `Card` 헤더가 그린다 — 예전에는 같은 형태를 이 파일이 손으로 복제해
       (CashflowHeader/CashflowTitle) 카드 제목 크기·여백 규칙이 다른 카드와 따로 놀았다.
       좁은 폭 줄바꿈도 이제 `CardHeader` 한 곳에서 온다. */
    <Card
      title="실지급 월별 배당"
      titleRight={
        <CashflowControls
          years={years}
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
          totalDividend={totalDividend}
          formatAmount={formatAmount}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
        />
      }
    >
      {!hasData ? (
        <HintText>{emptyMessage ?? SIMULATOR_COPY.emptyPortfolioHint}</HintText>
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
