import { memo, useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components';
import type { MonthlyCashflowProps } from './MonthlyCashflow.types';
import { buildCalendarMonths, buildPayoutScheduleRows, resolveSelectedYear } from './MonthlyCashflow.utils';
import { ChartWrap, HintText } from '@/pages/Main/Main.shared.styled';
import {
  CashflowHeader,
  CashflowHeaderControls,
  CashflowTitle,
  CashflowTotalLabel,
  ScheduleDot,
  ScheduleBody,
  ScheduleDetails,
  ScheduleScroll,
  ScheduleSummary,
  ScheduleSourceBadge,
  ScheduleTable,
  ScheduleTickerCell,
  CalendarCell,
  CalendarGrid,
  CalendarItemRow,
  CalendarMonthLabel,
  CalendarTotal,
  ViewToggleButton,
  ViewToggleGroup
} from './MonthlyCashflow.styled';

const MONTH_HEADERS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

/**
 * 스트립 하단 고지. 두 사실을 정직하게 말한다:
 * 1) "추정" 종목은 배당락일 기반이라 실제 입금 달이 다를 수 있다(월말 배당락 → 다음 달 입금).
 * 2) "실측"도 과거 이력이다 — 운용사가 일정을 바꾸면 달라질 수 있다.
 * 위 차트(시뮬레이션 분배)와 이 표(관측 이력)가 다를 수 있는 이유도 여기서 설명된다.
 */
const SCHEDULE_DISCLAIMER =
  '지급 월은 과거 지급 이력에서 관측한 값입니다. "추정" 표시는 배당락일 기준이라 실제 입금 달과 다를 수 있고, ' +
  '"실측"이라도 운용사 사정에 따라 일정이 바뀔 수 있습니다. 위 차트는 시뮬레이션의 분배 가정이라 이 표와 다를 수 있습니다.';
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
  scheduleTickers = [],
  ResponsiveChart
}: MonthlyCashflowProps) {
  const scheduleRows = useMemo(() => buildPayoutScheduleRows(scheduleTickers), [scheduleTickers]);
  /*
   * 차트(엔진의 월 분배) ↔ 캘린더(관측 지급월로 재배분)는 **다른 월 배치**를 보여준다.
   * 나란히 두면 "왜 숫자가 다르냐"가 되므로 한 번에 하나만 — 토글 전환이 이 화면의 UX 답이다.
   */
  const [viewMode, setViewMode] = useState<'chart' | 'calendar'>('chart');
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
      {/* 보기 전환은 맨 우측(사용자 지정 위치). */}
      <ViewToggleGroup role="group" aria-label="월별 배당 보기 방식">
        {(
          [
            ['chart', '차트'],
            ['calendar', '캘린더']
          ] as const
        ).map(([mode, label]) => (
          <ViewToggleButton
            key={mode}
            type="button"
            $active={viewMode === mode}
            aria-pressed={viewMode === mode}
            onClick={() => {
              if (viewMode === mode) return;
              trackEvent(ANALYTICS_EVENT.INVESTMENT_SETTING_CHANGED, {
                field_name: 'monthly_cashflow_view_mode',
                value: mode
              });
              setViewMode(mode);
            }}
          >
            {label}
          </ViewToggleButton>
        ))}
      </ViewToggleGroup>
    </CashflowHeaderControls>
  );

  return (
    <Card>
      <CashflowHeader>
        <CashflowTitle>실지급 월별 배당</CashflowTitle>
        {headerControls}
      </CashflowHeader>
      {!hasData ? (
        <HintText>{emptyMessage ?? '좌측 티커 생성을 통해 포트폴리오를 구성해주세요.'}</HintText>
      ) : viewMode === 'chart' ? (
        <ChartWrap role="img" aria-label={`선택 연도의 월별 실지급 배당 차트${chartLabelSuffix}`}>
          <ResponsiveChart option={chartOption} replaceMerge={['series', 'legend', 'xAxis']} />
        </ChartWrap>
      ) : (
        <CalendarGrid aria-label={`선택 연도의 배당 캘린더 (관측 지급월 기준)${chartLabelSuffix}`}>
          {calendarMonths.map((cell) => (
            <CalendarCell key={cell.month} $paying={cell.total > 0}>
              <CalendarMonthLabel>{cell.month}월</CalendarMonthLabel>
              <CalendarTotal>{cell.total > 0 ? formatAmount(cell.total) : '—'}</CalendarTotal>
              {cell.items.map((item) => (
                <CalendarItemRow key={item.name} $estimated={item.source !== 'pay'} title={item.name}>
                  {item.name} {formatAmount(item.amount)}
                  {item.source === 'ex' ? ' (추정)' : item.source === 'sim' ? ' (시뮬)' : ''}
                </CalendarItemRow>
              ))}
            </CalendarCell>
          ))}
        </CalendarGrid>
      )}
      {hasData && scheduleRows.length > 0 ? (
        <ScheduleDetails>
          <ScheduleSummary>
            <ChevronRight size={14} aria-hidden focusable={false} />
            종목별 실제 지급 월 (지급 이력 기준)
          </ScheduleSummary>
          <ScheduleBody>
          <ScheduleScroll>
            <ScheduleTable>
              <thead>
                <tr>
                  <ScheduleTickerCell scope="col">종목</ScheduleTickerCell>
                  {MONTH_HEADERS.map((label) => (
                    <th key={label} scope="col">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((row) => (
                  <tr key={row.ticker}>
                    <ScheduleTickerCell scope="row">
                      {row.displayName}
                      <ScheduleSourceBadge $estimated={row.source === 'ex'}>
                        {row.source === 'pay' ? '실측' : '추정'}
                      </ScheduleSourceBadge>
                    </ScheduleTickerCell>
                    {MONTH_HEADERS.map((label, monthIndex) => {
                      const paying = row.months.includes(monthIndex + 1);
                      return (
                        <td key={label} aria-label={paying ? `${label} 지급` : undefined}>
                          <ScheduleDot $paying={paying} aria-hidden={paying ? undefined : true} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </ScheduleTable>
          </ScheduleScroll>
          <HintText>{SCHEDULE_DISCLAIMER}</HintText>
          </ScheduleBody>
        </ScheduleDetails>
      ) : null}
    </Card>
  );
}

const MonthlyCashflow = memo(MonthlyCashflowComponent);

export default MonthlyCashflow;
