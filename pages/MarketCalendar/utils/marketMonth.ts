import {
  FOMC_MEETINGS,
  FOMC_STATEMENT_ET,
  MARKET_CALENDAR,
  describeTradingDay,
  earlyClosesOfYear,
  etToKst,
  holidaysOfYear,
  isCuratedYear,
  nextTradingDay,
  toCalendarDate
} from '@/shared/constants/marketCalendar';
import type {
  EarningsEvent,
  EconomicEvent,
  FomcMeeting,
  KstMoment,
  TradingDay
} from '@/shared/constants/marketCalendar';

/**
 * 월 그리드와 일정 목록을 만드는 **순수 계산**.
 *
 * ⚠ **`toISOString()` 을 쓰지 않는다.** KST(UTC+9)에서 로컬 자정은 UTC 전날 15:00 이라
 *   `toISOString().slice(0, 10)` 은 하루 밀린 날짜를 준다("오늘"이 어제 칸에 찍힌다).
 *   `shared/constants/marketCalendar/marketCalendar.sessions.ts` 의 `toCalendarDate` 만 쓴다.
 * ⚠ `today` 는 **컨테이너가 만들어 넘긴다.** 계산 계층이 스스로 `new Date()` 를 부르면
 *   테스트가 실제 날짜에 매인다(이 레포가 캘린더·목표에서 쓰는 같은 규율).
 */

const DAYS_PER_WEEK = 7;
const CALENDAR_WEEKS = 6;

/** 한 날에 걸린 일정들. 셋 다 없으면 그 날은 그냥 거래일이다. */
export type DayEvents = {
  readonly fomc: FomcMeeting | null;
  readonly economic: readonly EconomicEvent[];
  readonly earnings: readonly EarningsEvent[];
};

export type MarketDayCell = {
  readonly date: string;
  readonly day: number;
  /** false = 앞뒤 달에서 넘어온 칸. */
  readonly inMonth: boolean;
  readonly isToday: boolean;
  /**
   * 그 날의 거래 상태. 🔴 큐레이션 구간 밖이면 `null` — "열려 있다"가 아니라 **모른다**이다.
   */
  readonly trading: TradingDay | null;
  readonly events: DayEvents;
};

export type MarketMonthViewModel = {
  readonly year: number;
  readonly month: number;
  readonly weeks: readonly (readonly MarketDayCell[])[];
  /** 이 달이 큐레이션 구간 안인가. 밖이면 화면이 "자료 없음"을 말한다. */
  readonly curated: boolean;
  readonly holidayCount: number;
  readonly earlyCloseCount: number;
};

const pad2 = (value: number): string => String(value).padStart(2, '0');

const emptyEvents: DayEvents = { fomc: null, economic: [], earnings: [] };

/** 날짜별 색인. 한 달 그리드가 42칸이라 매 칸에서 배열을 훑지 않게 미리 접는다. */
const indexEvents = () => {
  const economic = new Map<string, EconomicEvent[]>();
  for (const event of MARKET_CALENDAR.economic) {
    const bucket = economic.get(event.date);
    if (bucket) bucket.push(event);
    else economic.set(event.date, [event]);
  }

  const earnings = new Map<string, EarningsEvent[]>();
  for (const event of MARKET_CALENDAR.earnings) {
    const bucket = earnings.get(event.date);
    if (bucket) bucket.push(event);
    else earnings.set(event.date, [event]);
  }

  /* 🔴 FOMC 는 **발표일**(둘째 날)에 건다. 첫날에 걸면 하루 이른 거짓이 된다. */
  const fomc = new Map<string, FomcMeeting>(FOMC_MEETINGS.map((meeting) => [meeting.decisionDate, meeting]));

  return { economic, earnings, fomc };
};

const EVENTS = indexEvents();

export const eventsOn = (date: string): DayEvents => ({
  fomc: EVENTS.fomc.get(date) ?? null,
  economic: EVENTS.economic.get(date) ?? [],
  earnings: EVENTS.earnings.get(date) ?? []
});

export const hasAnyEvent = (events: DayEvents): boolean =>
  events.fomc !== null || events.economic.length > 0 || events.earnings.length > 0;

export type MarketMonthInput = {
  readonly year: number;
  /** 1-12. */
  readonly month: number;
  readonly today: Date;
};

export const buildMarketMonth = ({ year, month, today }: MarketMonthInput): MarketMonthViewModel => {
  const todayDate = toCalendarDate(today);
  /* 그리드 첫 칸 = 1일이 속한 주의 일요일. 로컬 생성자라 타임존 보정이 필요 없다. */
  const leadingOffset = new Date(year, month - 1, 1).getDay();

  const weeks: MarketDayCell[][] = [];
  let holidayCount = 0;
  let earlyCloseCount = 0;

  for (let weekIndex = 0; weekIndex < CALENDAR_WEEKS; weekIndex += 1) {
    const week: MarketDayCell[] = [];

    for (let dayIndex = 0; dayIndex < DAYS_PER_WEEK; dayIndex += 1) {
      const offset = weekIndex * DAYS_PER_WEEK + dayIndex - leadingOffset;
      const cursor = new Date(year, month - 1, 1 + offset);
      const cellYear = cursor.getFullYear();
      const cellMonth = cursor.getMonth() + 1;
      const date = `${cellYear}-${pad2(cellMonth)}-${pad2(cursor.getDate())}`;
      const inMonth = cellYear === year && cellMonth === month;
      const trading = describeTradingDay(date);

      if (inMonth && trading?.status === 'closed') holidayCount += 1;
      if (inMonth && trading?.status === 'early') earlyCloseCount += 1;

      week.push({
        date,
        day: cursor.getDate(),
        inMonth,
        isToday: date === todayDate,
        trading,
        /* 앞뒤 달 칸에는 일정을 걸지 않는다 — 그 달의 밀도를 잘못 보이게 한다. */
        events: inMonth ? eventsOn(date) : emptyEvents
      });
    }

    weeks.push(week);
  }

  return { year, month, weeks, curated: isCuratedYear(year), holidayCount, earlyCloseCount };
};

/** 이전/다음 달. 연 경계를 자동으로 넘는다. */
export const shiftMonth = (year: number, month: number, delta: number): { year: number; month: number } => {
  const total = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(total / 12);
  return { year: nextYear, month: total - nextYear * 12 + 1 };
};

/* ── 다가오는 일정 ─────────────────────────────────────────────────────────── */

export type UpcomingKind = 'fomc' | 'economic' | 'holiday' | 'earlyClose';

export type UpcomingItem = {
  readonly date: string;
  readonly kind: UpcomingKind;
  readonly labelKo: string;
  /** 미 동부시각 `HH:MM`. 종일 항목(휴장)은 `null`. */
  readonly timeEt: string | null;
  readonly timeKst: KstMoment | null;
  /** 시장이 특히 주목하는 항목인가. 굵기를 가르는 데만 쓴다. */
  readonly major: boolean;
};

const compareByDateTime = (left: UpcomingItem, right: UpcomingItem): number =>
  left.date.localeCompare(right.date) || (left.timeEt ?? '').localeCompare(right.timeEt ?? '');

/**
 * 오늘 이후의 주요 일정을 한 줄로 합친다 — FOMC · 경제지표 · 휴장 · 조기폐장.
 *
 * 🔴 실적 발표는 **넣지 않는다.** 하루에 수십 건이라 이 목록을 통째로 덮어 버린다. 실적은 달력
 * 칸과 별도 섹션이 맡는다.
 * ⚠ 한국시각을 함께 낸다 — "8월 13일 08:30"은 한국 사람에게 밤 9시 반이다. 그 환산을 사용자
 *   머릿속에 맡기면 이 화면의 존재 이유가 절반 사라진다.
 */
export const buildUpcoming = (today: Date, limit: number): UpcomingItem[] => {
  const from = toCalendarDate(today);
  const items: UpcomingItem[] = [];

  const withKst = (date: string, timeEt: string): KstMoment | null => {
    const day = describeTradingDay(date);
    /* 큐레이션 밖이면 서머타임 여부를 단정할 수 없다 — 그때는 한국시각을 비운다. */
    return day ? etToKst(timeEt, day.daylightSaving) : null;
  };

  for (const meeting of FOMC_MEETINGS) {
    if (meeting.decisionDate < from) continue;
    items.push({
      date: meeting.decisionDate,
      kind: 'fomc',
      labelKo: meeting.withProjections ? 'FOMC 금리 결정 · 경제전망 발표' : 'FOMC 금리 결정',
      timeEt: FOMC_STATEMENT_ET,
      timeKst: withKst(meeting.decisionDate, FOMC_STATEMENT_ET),
      major: true
    });
  }

  for (const event of MARKET_CALENDAR.economic) {
    if (event.date < from) continue;
    items.push({
      date: event.date,
      kind: 'economic',
      labelKo: event.nameKo,
      timeEt: event.timeEt,
      timeKst: withKst(event.date, event.timeEt),
      major: event.major
    });
  }

  const year = today.getFullYear();
  for (const y of [year, year + 1]) {
    for (const holiday of holidaysOfYear(y)) {
      if (holiday.date < from) continue;
      items.push({ date: holiday.date, kind: 'holiday', labelKo: `휴장 · ${holiday.nameKo}`, timeEt: null, timeKst: null, major: true });
    }
    for (const early of earlyClosesOfYear(y)) {
      if (early.date < from) continue;
      items.push({
        date: early.date,
        kind: 'earlyClose',
        labelKo: `조기 폐장 · ${early.nameKo}`,
        timeEt: early.closeEt,
        timeKst: withKst(early.date, early.closeEt),
        major: false
      });
    }
  }

  return items.sort(compareByDateTime).slice(0, limit);
};

/**
 * "지금 장이 열려 있나"에 답할 재료.
 *
 * 🔴 **열려 있는지를 시각까지 따져 말하지 않는다.** 이 화면은 정적으로 배포되는 페이지라
 * 사용자가 보는 순간의 초 단위 상태를 알 수 없고, 초 단위로 맞는 척하면 틀렸을 때 가장 크게 틀린다.
 * 대신 **오늘이 거래일인지**와 **한국시각 몇 시에 열고 닫는지**를 말한다 — 그것이 이 자료가
 * 정직하게 답할 수 있는 질문이다.
 */
export type TodayStatus = {
  readonly today: TradingDay | null;
  readonly next: TradingDay | null;
};

export const buildTodayStatus = (today: Date): TodayStatus => {
  const date = toCalendarDate(today);
  const current = describeTradingDay(date);
  return {
    today: current,
    next: current?.status === 'open' || current?.status === 'early' ? current : nextTradingDay(date)
  };
};
