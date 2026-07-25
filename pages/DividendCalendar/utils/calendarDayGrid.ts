import { MARKET_DATA } from '@/shared/constants/marketData';
import type { CalendarScheduleSource, CalendarTickerEntry } from './calendarSchedule';

/**
 * 월간 달력(주 × 일 그리드)을 만드는 순수 계산.
 *
 * ⚠ **날짜 계산에 UTC 게터·`toISOString()`을 쓰지 않는다.** KST(UTC+9)에서 로컬 자정은 UTC 전날
 * 15:00이라 `toISOString().slice(0, 10)` 은 **하루 밀린 날짜**를 준다("오늘"이 어제 칸에 찍힌다).
 * 여기서는 `new Date(year, month - 1, day)` 와 `getFullYear/getMonth/getDate` 만 쓰고,
 * ISO 문자열은 연·월·일을 직접 zero-pad 해 만든다.
 */

/** 한 종목의 그 달 지급 예정. `day === null` 이면 "이 달에 주긴 하는데 날짜를 모른다". */
export type ExpectedPayout = {
  ticker: string;
  koreanName: string;
  /** 지급 '월'의 출처(v1 매핑 규칙 그대로). '일'의 출처가 아니다. */
  source: CalendarScheduleSource;
  /** 예상 지급'일'(1-31). null = 날짜 미정. */
  day: number | null;
};

export type DayCell = {
  /** 'YYYY-MM-DD' — `<time datetime>` 에 그대로 쓴다. */
  date: string;
  day: number;
  /** false = 앞뒤 달에서 넘어온 칸(칩을 놓지 않는다). */
  inMonth: boolean;
  isToday: boolean;
  /** 표시 중인 달이 '오늘의 달'일 때만 true 가 될 수 있다. */
  isPast: boolean;
  /** 티커 오름차순. `inMonth === false` 면 항상 빈 배열. */
  items: ExpectedPayout[];
};

export type MonthViewModel = {
  year: number;
  /** 1-12. */
  month: number;
  /** 6주 × 7일 고정 — 5주짜리 달에서 표 높이가 튀지 않게 한다. */
  weeks: DayCell[][];
  /** 그 달 지급 예정이지만 `day === null` 인 종목들. */
  undated: ExpectedPayout[];
  /** weeks 안 items 총 개수. */
  datedCount: number;
};

/** 아젠다(날짜순 목록)의 한 날. 항목이 있는 날짜만 만들어진다. */
export type AgendaDay = {
  date: string;
  month: number;
  day: number;
  /** 0=일 … 6=토. 카피의 요일 배열 인덱스로 그대로 쓴다. */
  weekday: number;
  items: ExpectedPayout[];
};

export type CalendarYearMonth = { year: number; month: number };

/** 0=일요일 시작(국내 달력 관례), 1=월요일 시작. */
export type CalendarWeekStart = 0 | 1;

const CALENDAR_WEEKS = 6;
const DAYS_PER_WEEK = 7;

const isCalendarMonth = (month: number): boolean => Number.isInteger(month) && month >= 1 && month <= 12;

const pad2 = (value: number): string => String(value).padStart(2, '0');

/** 그 달의 마지막 날. `new Date(year, month, 0)` 은 로컬 기준이라 타임존에 안전하다. */
export const getDaysInMonth = (year: number, month: number): number => new Date(year, month, 0).getDate();

/** `toISOString()` 대신 쓰는 로컬 날짜 문자열. */
export const formatCalendarDate = (year: number, month: number, day: number): string =>
  `${year}-${pad2(month)}-${pad2(day)}`;

/** 이전/다음 달. 연 경계를 자동으로 넘는다(12월 다음 = 이듬해 1월). */
export const shiftCalendarMonth = ({ year, month }: CalendarYearMonth, delta: number): CalendarYearMonth => {
  const total = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(total / 12);

  return { year: nextYear, month: total - nextYear * 12 + 1 };
};

/** 로컬 기준 '오늘'이 속한 연·월. */
export const getCalendarMonthOf = (date: Date): CalendarYearMonth => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1
});

export const isSameCalendarMonth = (left: CalendarYearMonth, right: CalendarYearMonth): boolean =>
  left.year === right.year && left.month === right.month;

/**
 * 그 종목이 `year`년 `month`월에 지급할 것으로 **예상되는 날**. 근거가 없으면 `null`.
 *
 * 스냅샷의 `estimatedPayDayByMonth` 는 실지급일 이력에서 계산한 값이라 `payoutMonthsSource: 'pay'`
 * 인 종목에만 있다. 없는 종목을 "1일"이나 "말일"로 채우지 않는다 — 없는 날짜를 지어내는 순간
 * 화면 전체가 거짓이 된다. 값이 그 달 일수를 넘으면(2월 31일 같은 경우) 말일로 클램프만 한다.
 */
export const getExpectedPayoutDay = (ticker: string, year: number, month: number): number | null => {
  if (!isCalendarMonth(month)) return null;

  const raw = MARKET_DATA.entries[ticker]?.estimatedPayDayByMonth?.[String(month)];
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 1) return null;

  return Math.min(Math.trunc(raw), getDaysInMonth(year, month));
};

export type ExpectedPayoutDayResolver = (ticker: string, year: number, month: number) => number | null;

const byTicker = (left: { ticker: string }, right: { ticker: string }): number =>
  left.ticker < right.ticker ? -1 : left.ticker > right.ticker ? 1 : 0;

/**
 * 선택 종목 중 그 달에 지급 예정인 것들. 지급월 데이터가 없거나 그 달에 지급하지 않으면
 * **아예 등장하지 않는다**(미정 목록에도 넣지 않는다 — 미정은 "언제인지"를 모르는 것이지
 * "주는지"를 모르는 게 아니다).
 */
export const buildExpectedPayouts = (
  entries: CalendarTickerEntry[],
  selectedTickers: string[],
  year: number,
  month: number,
  resolveDay: ExpectedPayoutDayResolver = getExpectedPayoutDay
): ExpectedPayout[] => {
  if (!isCalendarMonth(month) || selectedTickers.length === 0) return [];

  const selected = new Set(selectedTickers.map((ticker) => ticker.trim().toUpperCase()));

  return entries
    .filter((entry) => selected.has(entry.ticker) && (entry.payoutMonths?.includes(month) ?? false))
    .map((entry) => ({
      ticker: entry.ticker,
      koreanName: entry.name,
      source: entry.source ?? 'ex',
      day: resolveDay(entry.ticker, year, month)
    }))
    .sort(byTicker);
};

export type MonthViewModelInput = {
  year: number;
  month: number;
  /** 컨테이너가 만든 '오늘'. 유틸이 내부에서 `new Date()` 를 부르면 테스트가 실제 날짜에 매인다. */
  today: Date;
  selected: string[];
  entries: CalendarTickerEntry[];
  /** 테스트 주입용. 기본값은 스냅샷 기반 실물 해석기. */
  resolveDay?: ExpectedPayoutDayResolver;
  weekStart?: CalendarWeekStart;
};

export const buildMonthViewModel = ({
  year,
  month,
  today,
  selected,
  entries,
  resolveDay = getExpectedPayoutDay,
  weekStart = 0
}: MonthViewModelInput): MonthViewModel => {
  const payouts = buildExpectedPayouts(entries, selected, year, month, resolveDay);

  const itemsByDay = new Map<number, ExpectedPayout[]>();
  for (const payout of payouts) {
    if (payout.day === null) continue;
    const bucket = itemsByDay.get(payout.day);
    if (bucket) bucket.push(payout);
    else itemsByDay.set(payout.day, [payout]);
  }

  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const showsCurrentMonth = year === todayYear && month === todayMonth;

  // 그리드 첫 칸 = 1일이 속한 주의 시작 요일. 로컬 생성자라 DST/타임존 보정이 필요 없다.
  const leadingOffset = (new Date(year, month - 1, 1).getDay() - weekStart + DAYS_PER_WEEK) % DAYS_PER_WEEK;

  const weeks: DayCell[][] = [];
  let datedCount = 0;

  for (let weekIndex = 0; weekIndex < CALENDAR_WEEKS; weekIndex += 1) {
    const week: DayCell[] = [];

    for (let dayIndex = 0; dayIndex < DAYS_PER_WEEK; dayIndex += 1) {
      const offset = weekIndex * DAYS_PER_WEEK + dayIndex - leadingOffset;
      const cursor = new Date(year, month - 1, 1 + offset);
      const cellYear = cursor.getFullYear();
      const cellMonth = cursor.getMonth() + 1;
      const cellDay = cursor.getDate();
      const inMonth = cellYear === year && cellMonth === month;
      const items = inMonth ? (itemsByDay.get(cellDay) ?? []) : [];

      datedCount += items.length;

      week.push({
        date: formatCalendarDate(cellYear, cellMonth, cellDay),
        day: cellDay,
        inMonth,
        isToday: cellYear === todayYear && cellMonth === todayMonth && cellDay === todayDay,
        // 다른 달을 보고 있을 때는 과거 표시를 하지 않는다 — 지난 달 전체가 회색인 건 정보가 아니라 소음이다.
        isPast: inMonth && showsCurrentMonth && cellDay < todayDay,
        items
      });
    }

    weeks.push(week);
  }

  return {
    year,
    month,
    weeks,
    undated: payouts.filter((payout) => payout.day === null),
    datedCount
  };
};

/** 표에서 밀도 때문에 잘린 정보의 원본. 항목이 있는 날짜만, 날짜 오름차순. */
export const buildAgendaDays = (viewModel: MonthViewModel): AgendaDay[] => {
  const days: AgendaDay[] = [];

  for (const week of viewModel.weeks) {
    for (const cell of week) {
      if (!cell.inMonth || cell.items.length === 0) continue;

      days.push({
        date: cell.date,
        month: viewModel.month,
        day: cell.day,
        weekday: new Date(viewModel.year, viewModel.month - 1, cell.day).getDay(),
        items: cell.items
      });
    }
  }

  return days.sort((left, right) => left.day - right.day);
};
