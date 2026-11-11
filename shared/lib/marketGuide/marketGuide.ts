import {
  EARLY_CLOSE_ET,
  FOMC_MEETINGS,
  FOMC_STATEMENT_ET,
  MARKET_CALENDAR,
  earlyClosesOfYear,
  etToKst,
  holidaysOfYear,
  isDaylightSaving,
  parseCalendarDate,
  toCalendarDate,
  type KstMoment
} from '../../constants/marketCalendar';

/**
 * 미국 증시 **안내 지면** 데이터(2026-11-11) — 검색어 하나에 지면 하나.
 *
 * 왜: 검색 유입의 42% 가 `/market/us-calendar` 한 장에 몰린다(최근 60일 GA). 사람들은 "미국 증시 휴장일 2027",
 * "FOMC 일정", "이번 주 미국 증시 일정"처럼 **날짜를 확인하는 검색**으로 들어온다. 한 장이 모든 검색어를
 * 받는 대신, 검색어마다 제목·주소가 딱 맞는 지면을 둔다.
 *
 * 🔴 화면과 크롤러용 정적 HTML(`tools/seo`)이 **같은 함수**에서 숫자를 받는다 — 둘이 다르면 검색 결과와
 * 화면이 어긋난다. 전부 순수 함수다(`today` 는 인자).
 */

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

/** `2026-11-26` → `11월 26일 (목)`. */
export const formatGuideDate = (date: string): string => {
  const parsed = parseCalendarDate(date);
  if (!parsed) return date;
  return `${parsed.getMonth() + 1}월 ${parsed.getDate()}일 (${WEEKDAY_KO[parsed.getDay()]})`;
};

/** 한국시각 — 날짜를 넘기면 "다음 날"을 글자로 붙인다(05:00 을 그날 아침으로 읽지 않게). */
export const formatGuideKst = (moment: KstMoment | null): string => {
  if (!moment) return '—';
  return moment.dayOffset === 1 ? `다음 날 ${moment.time}` : moment.time;
};

const kstOf = (date: string, timeEt: string): KstMoment | null => {
  const parsed = parseCalendarDate(date);
  return parsed ? etToKst(timeEt, isDaylightSaving(parsed)) : null;
};

// ── 연도별 휴장일 ─────────────────────────────────────────────────────────────

export type HolidayGuideRow = {
  readonly date: string;
  readonly dateLabel: string;
  readonly name: string;
  readonly kind: 'holiday' | 'earlyClose';
  /** 휴장: "종일 휴장". 조기폐장: "13:00 마감 (한국시간 다음 날 03:00)". */
  readonly note: string;
};

/** 그 해의 휴장일 + 조기폐장일(날짜순). 큐레이션 밖 연도면 빈 배열. */
export const buildHolidayGuide = (year: number): HolidayGuideRow[] => {
  const holidays = holidaysOfYear(year).map((holiday) => ({
    date: holiday.date,
    dateLabel: formatGuideDate(holiday.date),
    name: holiday.nameKo,
    kind: 'holiday' as const,
    note: '종일 휴장'
  }));
  const earlyCloses = earlyClosesOfYear(year).map((early) => ({
    date: early.date,
    dateLabel: formatGuideDate(early.date),
    name: early.nameKo,
    kind: 'earlyClose' as const,
    note: `미국 ${EARLY_CLOSE_ET} 조기 마감 (한국시간 ${formatGuideKst(kstOf(early.date, EARLY_CLOSE_ET))})`
  }));
  return [...holidays, ...earlyCloses].sort((a, b) => a.date.localeCompare(b.date));
};

// ── FOMC ─────────────────────────────────────────────────────────────────────

export type FomcGuideRow = {
  readonly decisionDate: string;
  readonly meetingLabel: string;
  /** 성명 발표 한국시각(서머타임 반영). */
  readonly kstLabel: string;
  readonly withProjections: boolean;
  /** 오늘 기준으로 지났는가. */
  readonly past: boolean;
};

/** 공시된 FOMC 회의 전부. 회의 마지막 날 미 동부 14:00 성명 → 한국시각. */
export const buildFomcGuide = (today: Date): FomcGuideRow[] => {
  const todayKey = toCalendarDate(today);
  return FOMC_MEETINGS.map((meeting) => ({
    decisionDate: meeting.decisionDate,
    meetingLabel: `${formatGuideDate(meeting.startDate)} ~ ${formatGuideDate(meeting.decisionDate)}`,
    kstLabel: formatGuideKst(kstOf(meeting.decisionDate, FOMC_STATEMENT_ET)),
    withProjections: meeting.withProjections,
    past: meeting.decisionDate < todayKey
  }));
};

/** 다음 FOMC(오늘 포함 이후 첫 회의). 없으면 null. */
export const nextFomc = (today: Date): FomcGuideRow | null => buildFomcGuide(today).find((row) => !row.past) ?? null;

// ── 이번 주 ───────────────────────────────────────────────────────────────────

export type WeekGuideRow = {
  readonly date: string;
  readonly dateLabel: string;
  readonly kind: '휴장' | '조기 폐장' | 'FOMC' | '지표' | '실적';
  readonly label: string;
  readonly kstLabel: string;
  readonly major: boolean;
};

const WEEK_DAYS = 7;
const SESSION_KO = { beforeOpen: '장 전', afterClose: '장 후', unknown: '시간 미정' } as const;

/**
 * 오늘부터 7일 — 휴장·조기폐장·FOMC·주요 지표·실적(같은 회사의 상장 클래스는 한 줄).
 * 실적은 수집 구간(`MARKET_CALENDAR.rangeEnd`) 안에서만 있다 — 밖이면 "없음"이 아니라 "모름"이다.
 */
export const buildWeekGuide = (today: Date): WeekGuideRow[] => {
  const from = toCalendarDate(today);
  const until = toCalendarDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + WEEK_DAYS - 1));
  const inRange = (date: string) => date >= from && date <= until;
  const rows: WeekGuideRow[] = [];

  for (const year of new Set([today.getFullYear(), Number(until.slice(0, 4))])) {
    for (const row of buildHolidayGuide(year).filter((item) => inRange(item.date))) {
      rows.push({
        date: row.date,
        dateLabel: row.dateLabel,
        kind: row.kind === 'holiday' ? '휴장' : '조기 폐장',
        label: row.name,
        kstLabel: row.kind === 'holiday' ? '종일' : row.note.replace(/^미국 /, ''),
        major: true
      });
    }
  }
  for (const meeting of FOMC_MEETINGS.filter((item) => inRange(item.decisionDate))) {
    rows.push({
      date: meeting.decisionDate,
      dateLabel: formatGuideDate(meeting.decisionDate),
      kind: 'FOMC',
      label: meeting.withProjections ? 'FOMC 금리 결정 · 경제전망(점도표)' : 'FOMC 금리 결정',
      kstLabel: formatGuideKst(kstOf(meeting.decisionDate, FOMC_STATEMENT_ET)),
      major: true
    });
  }
  for (const event of MARKET_CALENDAR.economic.filter((item) => inRange(item.date))) {
    rows.push({
      date: event.date,
      dateLabel: formatGuideDate(event.date),
      kind: '지표',
      label: event.nameKo,
      kstLabel: formatGuideKst(kstOf(event.date, event.timeEt)),
      major: event.major
    });
  }
  const seen = new Set<string>();
  for (const earning of MARKET_CALENDAR.earnings.filter((item) => inRange(item.date))) {
    const issuer = `${earning.date}:${earning.ticker.split(/[.-]/)[0]}`;
    if (seen.has(issuer)) continue;
    seen.add(issuer);
    rows.push({
      date: earning.date,
      dateLabel: formatGuideDate(earning.date),
      kind: '실적',
      label: `${earning.ticker} · ${earning.nameEn}`,
      kstLabel: SESSION_KO[earning.session],
      major: earning.hasTickerPage
    });
  }

  const ORDER: Record<WeekGuideRow['kind'], number> = { 휴장: 0, '조기 폐장': 1, FOMC: 2, 지표: 3, 실적: 4 };
  return rows.sort((a, b) => a.date.localeCompare(b.date) || ORDER[a.kind] - ORDER[b.kind]);
};

/** 실적 수집 구간이 이번 주를 덮는가 — 덮지 못하면 화면이 "자료 갱신 전"을 말한다. */
export const weekGuideCoverage = (today: Date): { readonly covered: boolean; readonly generatedAt: string } => {
  const until = toCalendarDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + WEEK_DAYS - 1));
  return { covered: MARKET_CALENDAR.rangeEnd >= until, generatedAt: MARKET_CALENDAR.generatedAt };
};
