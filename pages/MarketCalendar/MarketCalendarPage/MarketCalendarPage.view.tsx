import { useId, useMemo, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import {
  DataSection,
  DataTable,
  NoteList,
  PageHero,
  SectionLink,
  SectionMeta,
  SectionStack,
  StatTile,
  SummaryGrid
} from '@/components/common';
import { ICON } from '@/shared/styles';
import type { MarketEarlyClose, MarketHoliday } from '@/shared/constants/marketCalendar';
import { MARKET_CALENDAR_COPY } from '../copy';
import { DayDrawer, MonthGrid } from '../components';
import {
  buildMarketMonth,
  buildTodayStatus,
  buildUpcoming,
  formatDaylightSaving,
  formatKst,
  formatMonthDay,
  formatSessionKst,
  formatWeekday,
  shiftMonth,
  TRADING_STATUS_KO
} from '../utils';
import type { UpcomingItem } from '../utils';
import type { MarketCalendarViewProps } from './MarketCalendarPage.types';
import { EarningsTicker, MonthNote, YearHeading } from './styled';

const copy = MARKET_CALENDAR_COPY;

/** 다가오는 일정에 몇 줄까지 보일지. 더 필요하면 달력에서 그 달로 옮긴다. */
const UPCOMING_ROWS = 18;

const UPCOMING_COLUMNS = [
  {
    key: 'date',
    header: copy.upcoming.columnDate,
    render: (row: UpcomingItem) => `${formatMonthDay(row.date)} (${formatWeekday(row.date)})`,
    /*
     * 🔴 **같은 날짜는 한 칸으로 합친다**(2026-08-05 사용자 지시). 하루에 지표가 셋씩 걸리는 날이
     * 흔해서, 합치기 전에는 같은 날짜가 세 줄에 반복돼 눈이 "며칠에 무엇이 있나"를 세기 어려웠다.
     * ⚠ 이 병합은 **행이 날짜순일 때만** 옳다. `buildUpcoming` 이 날짜·시각 순으로 정렬해 돌려준다.
     */
    mergeKey: (row: UpcomingItem) => row.date
  },
  { key: 'event', header: copy.upcoming.columnEvent, render: (row: UpcomingItem) => row.labelKo },
  {
    key: 'kst',
    header: copy.upcoming.columnKst,
    /* 휴장은 시각이 없다 — 빈칸 대신 "종일"이라고 말한다. */
    render: (row: UpcomingItem) => (row.timeKst ? formatKst(row.timeKst) : copy.upcoming.allDay)
  },
  {
    key: 'et',
    header: copy.upcoming.columnEt,
    render: (row: UpcomingItem) => row.timeEt ?? '—'
  }
];

/**
 * `/market/us-calendar` 의 뷰.
 *
 * 🔴 상태는 **보고 있는 달** 하나뿐이다. 그 외 모든 것은 커밋된 자료에서 파생한다.
 * ⚠ `today` 는 컨테이너가 만들어 넘긴다 — 뷰가 `new Date()` 를 부르면 테스트가 실제 날짜에 매인다.
 */
export default function MarketCalendarView({ viewModel }: MarketCalendarViewProps) {
  const { today, snapshot, closures, earnings, year: thisYear } = viewModel;

  const [cursor, setCursor] = useState(() => ({ year: today.getFullYear(), month: today.getMonth() + 1 }));
  /**
   * 드로어가 보고 있는 날(`YYYY-MM-DD`). 닫혀 있으면 `null`.
   *
   * 🔴 **날짜 문자열**을 상태로 둔다(칸 객체가 아니라). 달을 옮기면 칸 객체는 새로 만들어지므로,
   * 객체를 들고 있으면 이전 달의 낡은 칸을 계속 그리게 된다. 문자열을 두고 지금 달에서 다시 찾는다.
   */
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const dayDrawerId = useId();

  const month = useMemo(() => buildMarketMonth({ ...cursor, today }), [cursor, today]);
  const upcoming = useMemo(() => buildUpcoming(today, UPCOMING_ROWS), [today]);
  const status = useMemo(() => buildTodayStatus(today), [today]);

  const isThisMonth = cursor.year === today.getFullYear() && cursor.month === today.getMonth() + 1;

  /* 지금 달의 칸에서 고른 날짜를 찾는다. 달을 옮겨 그 날짜가 사라지면 `null` — 드로어도 닫힌다. */
  const selectedCell = useMemo(
    () => (selectedDate ? (month.weeks.flat().find((cell) => cell.date === selectedDate) ?? null) : null),
    [month, selectedDate]
  );

  const holidayColumns = [
    {
      key: 'date',
      header: copy.holidays.columnDate,
      render: (row: MarketHoliday | MarketEarlyClose) => formatMonthDay(row.date)
    },
    {
      key: 'weekday',
      header: copy.holidays.columnWeekday,
      render: (row: MarketHoliday | MarketEarlyClose) => formatWeekday(row.date)
    },
    {
      key: 'name',
      header: copy.holidays.columnName,
      render: (row: MarketHoliday | MarketEarlyClose) =>
        'observed' in row && row.observed ? `${row.nameKo} (${copy.holidays.observedTag})` : row.nameKo
    },
    {
      key: 'kind',
      header: copy.holidays.columnKind,
      render: (row: MarketHoliday | MarketEarlyClose) =>
        'closeEt' in row ? `${copy.holidays.kindEarly} · ${row.closeEt} ET` : copy.holidays.kindHoliday
    }
  ];

  return (
    <>
      <PageHero
        icon={<CalendarRange size={ICON.lg} strokeWidth={1.8} aria-hidden focusable={false} />}
        title={copy.hero.title}
        titleAs="h1"
        lede={copy.hero.lede}
        notice={copy.hero.notice}
      />

      <SectionStack>
        <DataSection title={copy.today.heading}>
          <SummaryGrid>
            <StatTile
              label={copy.today.todayLabel}
              value={status.today ? TRADING_STATUS_KO[status.today.status] : '자료 없음'}
              hint={formatSessionKst(status.today)}
              emphasis="hero"
            />
            <StatTile
              label={copy.today.nextLabel}
              value={status.next ? formatMonthDay(status.next.date) : '자료 없음'}
              hint={formatSessionKst(status.next)}
            />
            <StatTile
              label={copy.today.etLabel}
              value={
                status.next?.openEt && status.next?.closeEt
                  ? `${status.next.openEt} ~ ${status.next.closeEt}`
                  : '—'
              }
            />
            <StatTile label={copy.today.dstLabel} value={formatDaylightSaving(status.next ?? status.today)} />
          </SummaryGrid>
        </DataSection>

        {/* 🔴 달력보다 **먼저** 온다 — 빈칸이 "일정 없음"이 아니라는 것을 보기 전에 알아야 한다. */}
        <NoteList title={copy.limits.heading} items={copy.limits.items} />

        <DataSection title={copy.month.heading} subtitle={copy.month.subtitle}>
          <MonthGrid
            month={month}
            onShift={(delta) => setCursor((prev) => shiftMonth(prev.year, prev.month, delta))}
            onReset={() => setCursor({ year: today.getFullYear(), month: today.getMonth() + 1 })}
            canReset={!isThisMonth}
            onSelectDay={setSelectedDate}
            selectedDate={selectedDate}
          />
          {/* 칸이 눌린다는 사실을 격자 아래에서 한 번만 말한다(칸마다 적으면 42번 반복된다). */}
          <MonthNote>{copy.month.dayHint}</MonthNote>
          <MonthNote>
            {month.curated ? copy.month.summary(month.holidayCount, month.earlyCloseCount) : copy.month.notCurated}
          </MonthNote>
          {/* 수집 구간을 넘어선 달을 보고 있으면, 빈칸의 뜻을 그 자리에서 말해 준다. */}
          {`${month.year}-${String(month.month).padStart(2, '0')}-01` > snapshot.rangeEnd ? (
            <MonthNote>{copy.month.beyondRange}</MonthNote>
          ) : null}
          {/* 하루치 상세 — 달력 칸이 접은 것(+N건 더)을 펴 보는 자리. 달력 바로 아래에 산다. */}
          <DayDrawer
            id={dayDrawerId}
            isOpen={selectedCell !== null}
            cell={selectedCell}
            onClose={() => setSelectedDate(null)}
          />
        </DataSection>

        <DataSection title={copy.upcoming.heading} subtitle={copy.upcoming.subtitle}>
          {upcoming.length > 0 ? (
            <DataTable columns={UPCOMING_COLUMNS} rows={upcoming} />
          ) : (
            <MonthNote>{copy.upcoming.empty}</MonthNote>
          )}
        </DataSection>

        <DataSection
          title={copy.earnings.heading}
          subtitle={copy.earnings.subtitle}
          meta={copy.earnings.sessionHint}
        >
          {earnings.length > 0 ? (
            <DataTable
              columns={[
                {
                  key: 'date',
                  header: copy.earnings.columnDate,
                  render: (row: (typeof earnings)[number]) =>
                    `${formatMonthDay(row.date)} (${formatWeekday(row.date)})`,
                  /*
                   * 🔴 실적 표야말로 병합이 필요한 자리다 — 하루에 수십 건이 몰려서, 합치기 전에는
                   * 같은 날짜가 스무 줄 넘게 되풀이됐다(2026-08-06 사용자 지시로 확대 적용).
                   * ⚠ 병합은 **연속한 것만** 합치므로 행이 날짜순이어야 한다. 이 배열은 컨테이너가
                   *   날짜·세션 순으로 정렬해 넘긴다.
                   */
                  mergeKey: (row: (typeof earnings)[number]) => row.date
                },
                {
                  key: 'ticker',
                  header: copy.earnings.columnTicker,
                  render: (row: (typeof earnings)[number]) =>
                    row.hasTickerPage ? (
                      <EarningsTicker to={`/ticker/${row.ticker.toLowerCase()}`}>{row.ticker}</EarningsTicker>
                    ) : (
                      <span>{row.ticker}</span>
                    )
                },
                {
                  key: 'name',
                  header: copy.earnings.columnName,
                  render: (row: (typeof earnings)[number]) => row.nameEn
                },
                {
                  key: 'session',
                  header: copy.earnings.columnSession,
                  render: (row: (typeof earnings)[number]) => copy.earnings.session[row.session]
                }
              ]}
              rows={[...earnings]}
            />
          ) : (
            <MonthNote>{copy.earnings.empty}</MonthNote>
          )}
        </DataSection>

        <DataSection title={copy.holidays.heading} subtitle={copy.holidays.subtitle}>
          <YearHeading>{copy.holidays.yearLabel(thisYear)}</YearHeading>
          <DataTable columns={holidayColumns} rows={[...closures]} />
        </DataSection>

        <DataSection title={copy.source.heading}>
          <SectionMeta>
            <span>{copy.source.holidaysLabel}</span>
            <SectionLink href={copy.source.holidaysUrl} target="_blank" rel="noreferrer noopener">
              {copy.source.holidaysName}
            </SectionLink>
            <span>{copy.source.fomcLabel}</span>
            <SectionLink href={copy.source.fomcUrl} target="_blank" rel="noreferrer noopener">
              {copy.source.fomcName}
            </SectionLink>
          </SectionMeta>
          <SectionMeta>
            <span>{`${copy.source.collectedLabel} ${snapshot.generatedAt}`}</span>
            <span>{`${copy.source.rangeLabel} ${snapshot.rangeStart} ~ ${snapshot.rangeEnd}`}</span>
          </SectionMeta>
        </DataSection>
      </SectionStack>
    </>
  );
}
