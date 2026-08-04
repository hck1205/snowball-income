import {
  CURATED_FROM_YEAR,
  CURATED_THROUGH_YEAR,
  EARLY_CLOSE_ET,
  MARKET_EARLY_CLOSES,
  MARKET_HOLIDAYS,
  REGULAR_CLOSE_ET,
  REGULAR_OPEN_ET
} from './marketCalendar.curated';
import type { CalendarDate, KstMoment, TradingDay, TradingDayStatus } from './marketCalendar.types';

/**
 * 거래일 판정과 한국시각 환산 — **전부 순수 함수**다. 네트워크도 `new Date()` 도 없다.
 *
 * ## 🔴 서머타임은 표로 적지 않고 규칙에서 계산한다
 * 미국 서머타임은 2007년부터 **3월 둘째 일요일 02:00 ~ 11월 첫째 일요일 02:00** 으로 고정이다.
 * 연도별 전환일을 손으로 적으면 큐레이션 표가 하나 더 늘고, 그 표만 낡으면 **한국시각 개장 시각이
 * 한 시간 틀린 채로** 조용히 표시된다 — 규칙에서 뽑으면 그 사고가 원천적으로 없다.
 * (휴장일은 반대로 규칙이 없어서 표로 적는다. 부활절이 기준인 성금요일 하나만 봐도 그렇다.)
 *
 * ## 🔴 한국시각은 "시차를 더한 값"이 아니라 **날짜가 바뀌는 값**이다
 * 미 동부 16:00 은 한국 **다음 날** 새벽이다. 시각 문자열만 주면 화면은 그 사실을 말할 수 없다 —
 * 그래서 `KstMoment` 가 `dayOffset` 을 함께 들고 다닌다.
 * ```
 *   미 동부(ET)   서머타임(EDT, UTC-4)   표준시(EST, UTC-5)
 *   09:30 개장    22:30 당일             23:30 당일
 *   13:00 조기폐장 02:00 다음날           03:00 다음날
 *   16:00 폐장    05:00 다음날           06:00 다음날
 * ```
 */

/** 서머타임이면 +13, 아니면 +14 시간이 한국시각이다(KST 는 UTC+9, ET 는 UTC-4/-5). */
const KST_OFFSET_FROM_ET_DST = 13;
const KST_OFFSET_FROM_ET_STANDARD = 14;

const pad2 = (value: number): string => String(value).padStart(2, '0');

/** `YYYY-MM-DD` → 로컬 Date. 🔴 `new Date('2026-01-01')` 은 **UTC** 로 해석돼 KST 에서 하루 밀린다. */
export const parseCalendarDate = (date: CalendarDate): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;

  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  /* 2026-02-31 같은 값은 3월로 굴러간다 — 굴러갔으면 그 날짜는 존재하지 않는다. */
  if (parsed.getMonth() !== Number(month) - 1 || parsed.getDate() !== Number(day)) return null;
  return parsed;
};

export const toCalendarDate = (date: Date): CalendarDate =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/** 그 달 `weekday` 요일이 `nth` 번째로 오는 날(1-indexed). 0=일요일. */
const nthWeekdayOfMonth = (year: number, month: number, weekday: number, nth: number): Date => {
  const first = new Date(year, month - 1, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month - 1, 1 + offset + (nth - 1) * 7);
};

/**
 * 그 날 미국이 서머타임 중인가.
 *
 * 경계 처리: 시작일(3월 둘째 일요일)은 02:00 에 시작하지만 그 날은 일요일이라 장이 없다 —
 * 날짜 단위로는 **포함**으로 둔다. 종료일(11월 첫째 일요일)도 일요일이라 같은 이유로 **제외**한다.
 */
export const isDaylightSaving = (date: Date): boolean => {
  const year = date.getFullYear();
  const start = nthWeekdayOfMonth(year, 3, 0, 2);
  const end = nthWeekdayOfMonth(year, 11, 0, 1);
  return date >= start && date < end;
};

/**
 * 미 동부 시각(`HH:MM`)을 한국시각으로 옮긴다. 날짜를 넘기면 `dayOffset: 1`.
 * ⚠ 24시를 넘기는 값이 없다고 가정하지 않는다 — 09:30 + 14 = 23:30 은 같은 날이고 16:00 + 13 = 29:00 이다.
 */
export const etToKst = (timeEt: string, daylightSaving: boolean): KstMoment | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(timeEt);
  if (!match) return null;

  const shifted =
    Number(match[1]) + (daylightSaving ? KST_OFFSET_FROM_ET_DST : KST_OFFSET_FROM_ET_STANDARD);

  return {
    time: `${pad2(shifted % 24)}:${match[2]}`,
    dayOffset: shifted >= 24 ? 1 : 0
  };
};

const HOLIDAY_BY_DATE = new Map(MARKET_HOLIDAYS.map((holiday) => [holiday.date, holiday]));
const EARLY_CLOSE_BY_DATE = new Map(MARKET_EARLY_CLOSES.map((early) => [early.date, early]));

/** 큐레이션이 닿는 구간인가. 밖이면 "휴장이 아니다"가 아니라 **모른다**. */
export const isCuratedYear = (year: number): boolean =>
  year >= CURATED_FROM_YEAR && year <= CURATED_THROUGH_YEAR;

/**
 * 그 날의 완성된 설명. 큐레이션 구간 **밖이면 `null`** 을 돌려준다.
 *
 * 🔴 밖에서 `open` 을 돌려주면 안 된다. 2029년 성금요일을 "정상 거래일"이라고 말하는 순간
 * 이 화면의 존재 이유가 무너진다 — 모르는 것은 모른다고 말한다.
 */
export const describeTradingDay = (date: CalendarDate): TradingDay | null => {
  const parsed = parseCalendarDate(date);
  if (!parsed || !isCuratedYear(parsed.getFullYear())) return null;

  const daylightSaving = isDaylightSaving(parsed);
  const weekday = parsed.getDay();

  const blank = (status: TradingDayStatus, labelKo: string | null): TradingDay => ({
    date,
    status,
    labelKo,
    openEt: null,
    closeEt: null,
    openKst: null,
    closeKst: null,
    daylightSaving
  });

  if (weekday === 0 || weekday === 6) return blank('weekend', null);

  const holiday = HOLIDAY_BY_DATE.get(date);
  if (holiday) return blank('closed', holiday.nameKo);

  const early = EARLY_CLOSE_BY_DATE.get(date);
  const closeEt = early ? early.closeEt : REGULAR_CLOSE_ET;

  return {
    date,
    status: early ? 'early' : 'open',
    labelKo: early ? early.nameKo : null,
    openEt: REGULAR_OPEN_ET,
    closeEt,
    openKst: etToKst(REGULAR_OPEN_ET, daylightSaving),
    closeKst: etToKst(closeEt, daylightSaving),
    daylightSaving
  };
};

/** 그 해의 휴장일. 화면의 "올해 휴장일" 목록이 쓴다. */
export const holidaysOfYear = (year: number) =>
  MARKET_HOLIDAYS.filter((holiday) => holiday.date.startsWith(`${year}-`));

/** 그 해의 조기폐장일. */
export const earlyClosesOfYear = (year: number) =>
  MARKET_EARLY_CLOSES.filter((early) => early.date.startsWith(`${year}-`));

/**
 * `from` **다음** 첫 거래일. 큐레이션 구간을 벗어나면 `null`.
 * ⚠ 무한 루프를 막으려고 한 해치(370일)만 본다 — 그보다 긴 연휴는 존재하지 않는다.
 */
export const nextTradingDay = (from: CalendarDate): TradingDay | null => {
  const parsed = parseCalendarDate(from);
  if (!parsed) return null;

  for (let step = 1; step <= 370; step += 1) {
    const cursor = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() + step);
    const day = describeTradingDay(toCalendarDate(cursor));
    if (!day) return null;
    if (day.status === 'open' || day.status === 'early') return day;
  }
  return null;
};

export { EARLY_CLOSE_ET, REGULAR_CLOSE_ET, REGULAR_OPEN_ET };
