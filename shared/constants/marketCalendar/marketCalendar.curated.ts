import type { FomcMeeting, MarketEarlyClose, MarketHoliday } from './marketCalendar.types';

/**
 * 사람이 소유하는 캘린더 — **휴장일 · 조기폐장 · FOMC**.
 *
 * ## 🔴 왜 스크립트가 아니라 손으로 적는가
 * 이 셋은 **1년 전에 확정 공시되고 그 뒤로 거의 바뀌지 않는** 값이다. 확정된 사실을 매주 긁으면
 * 얻는 것 없이 소스 사이트의 개편·차단에 매주 노출된다(같은 세션에서 BLS 는 실제로 403 을 냈다).
 * 반대로 경제지표·실적은 수시로 바뀌므로 그쪽만 스크립트가 만든다(`marketCalendar.generated.json`).
 *
 * ## 출처 (2026-08-04 직접 확인)
 *  - 휴장·조기폐장: NYSE "Holidays & Trading Hours" — https://www.nyse.com/trade/hours-calendars
 *    표에서 2026·2027·2028 3개년을 그대로 옮겼고, 조기폐장은 같은 페이지 각주(***·****)가 근거다.
 *  - FOMC: 연방준비제도 "FOMC Meeting calendars" — https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
 *    ⚠ 2026 회차만 공시돼 있다. 2027 은 아직 없다 — **없는 것을 추정해 채우지 않는다.**
 *
 * ## ⚠ 갱신 규칙
 * 매년 말 NYSE 가 새 연도를 붙이면 여기에 한 해를 더한다. 그때 **지난 해를 지우지 마라** —
 * 사용자가 과거 달을 열 수 있고, 빈 해는 "그 날 열려 있었다"는 거짓이 된다.
 * 마지막으로 채운 해가 언제까지인지는 `CURATED_THROUGH_YEAR` 가 말한다. 그 뒤 날짜를 물으면
 * 화면은 "자료 없음"이라고 답해야 한다(`describeTradingDay` 가 그렇게 만든다).
 */

/** 손으로 채운 마지막 해. 이 해를 넘어가면 휴장 여부를 **모른다**고 말해야 한다. */
export const CURATED_THROUGH_YEAR = 2028;

/** 손으로 채운 첫 해. 이보다 앞은 자료를 넣지 않았다. */
export const CURATED_FROM_YEAR = 2026;

/**
 * 정규장(Core Trading Session) 시각 — 미국 동부시각.
 * 출처: 같은 NYSE 페이지의 "Trading Hours · Core Trading Session: 9:30 a.m. to 4:00 p.m. ET".
 * ⚠ 프리마켓(04:00~)·애프터마켓(~20:00)은 여기 넣지 않는다. 이 화면이 말하는 것은 정규장이다.
 */
export const REGULAR_OPEN_ET = '09:30';
export const REGULAR_CLOSE_ET = '16:00';

/** 조기폐장일의 폐장 시각. NYSE 각주가 전부 1:00 p.m. 으로 못 박고 있다. */
export const EARLY_CLOSE_ET = '13:00';

export const MARKET_HOLIDAYS: readonly MarketHoliday[] = [
  /* ── 2026 ─────────────────────────────────────────────────────────────── */
  { date: '2026-01-01', nameKo: '신정', nameEn: "New Year's Day" },
  { date: '2026-01-19', nameKo: '마틴 루서 킹 데이', nameEn: 'Martin Luther King, Jr. Day' },
  { date: '2026-02-16', nameKo: '대통령의 날', nameEn: "Washington's Birthday" },
  { date: '2026-04-03', nameKo: '성금요일', nameEn: 'Good Friday' },
  { date: '2026-05-25', nameKo: '메모리얼 데이', nameEn: 'Memorial Day' },
  { date: '2026-06-19', nameKo: '준틴스', nameEn: 'Juneteenth National Independence Day' },
  /* 7월 4일이 토요일이라 하루 앞으로 옮겨 쉰다. */
  { date: '2026-07-03', nameKo: '독립기념일(대체)', nameEn: 'Independence Day observed', observed: true },
  { date: '2026-09-07', nameKo: '노동절', nameEn: 'Labor Day' },
  { date: '2026-11-26', nameKo: '추수감사절', nameEn: 'Thanksgiving Day' },
  { date: '2026-12-25', nameKo: '성탄절', nameEn: 'Christmas Day' },

  /* ── 2027 ─────────────────────────────────────────────────────────────── */
  { date: '2027-01-01', nameKo: '신정', nameEn: "New Year's Day" },
  { date: '2027-01-18', nameKo: '마틴 루서 킹 데이', nameEn: 'Martin Luther King, Jr. Day' },
  { date: '2027-02-15', nameKo: '대통령의 날', nameEn: "Washington's Birthday" },
  { date: '2027-03-26', nameKo: '성금요일', nameEn: 'Good Friday' },
  { date: '2027-05-31', nameKo: '메모리얼 데이', nameEn: 'Memorial Day' },
  { date: '2027-06-18', nameKo: '준틴스(대체)', nameEn: 'Juneteenth observed', observed: true },
  { date: '2027-07-05', nameKo: '독립기념일(대체)', nameEn: 'Independence Day observed', observed: true },
  { date: '2027-09-06', nameKo: '노동절', nameEn: 'Labor Day' },
  { date: '2027-11-25', nameKo: '추수감사절', nameEn: 'Thanksgiving Day' },
  { date: '2027-12-24', nameKo: '성탄절(대체)', nameEn: 'Christmas Day observed', observed: true },

  /* ── 2028 ─────────────────────────────────────────────────────────────── */
  /* ⚠ 2028 신정은 **없다**. 1월 1일이 토요일이라 NYSE 가 대체 휴장을 두지 않는다(각주 * 참고). */
  { date: '2028-01-17', nameKo: '마틴 루서 킹 데이', nameEn: 'Martin Luther King, Jr. Day' },
  { date: '2028-02-21', nameKo: '대통령의 날', nameEn: "Washington's Birthday" },
  { date: '2028-04-14', nameKo: '성금요일', nameEn: 'Good Friday' },
  { date: '2028-05-29', nameKo: '메모리얼 데이', nameEn: 'Memorial Day' },
  { date: '2028-06-19', nameKo: '준틴스', nameEn: 'Juneteenth National Independence Day' },
  { date: '2028-07-04', nameKo: '독립기념일', nameEn: 'Independence Day' },
  { date: '2028-09-04', nameKo: '노동절', nameEn: 'Labor Day' },
  { date: '2028-11-23', nameKo: '추수감사절', nameEn: 'Thanksgiving Day' },
  { date: '2028-12-25', nameKo: '성탄절', nameEn: 'Christmas Day' }
];

export const MARKET_EARLY_CLOSES: readonly MarketEarlyClose[] = [
  {
    date: '2026-11-27',
    nameKo: '추수감사절 다음날',
    closeEt: EARLY_CLOSE_ET,
    reasonKo: '추수감사절 연휴라 정규장이 오후 1시(미 동부)에 끝납니다.'
  },
  {
    date: '2026-12-24',
    nameKo: '성탄 전야',
    closeEt: EARLY_CLOSE_ET,
    reasonKo: '성탄절 전날이라 정규장이 오후 1시(미 동부)에 끝납니다.'
  },
  {
    date: '2027-11-26',
    nameKo: '추수감사절 다음날',
    closeEt: EARLY_CLOSE_ET,
    reasonKo: '추수감사절 연휴라 정규장이 오후 1시(미 동부)에 끝납니다.'
  },
  {
    date: '2028-07-03',
    nameKo: '독립기념일 전날',
    closeEt: EARLY_CLOSE_ET,
    reasonKo: '독립기념일 전날이라 정규장이 오후 1시(미 동부)에 끝납니다.'
  },
  {
    date: '2028-11-24',
    nameKo: '추수감사절 다음날',
    closeEt: EARLY_CLOSE_ET,
    reasonKo: '추수감사절 연휴라 정규장이 오후 1시(미 동부)에 끝납니다.'
  }
];

/**
 * FOMC 정례회의 — **2026년 8회분만** 있다.
 *
 * 🔴 연준이 2027 일정을 아직 공시하지 않았다(2026-08-04 확인). 회의는 대체로 6~7주 간격이지만
 * 그 규칙으로 2027 을 채우면 **지어낸 날짜**다. 없는 채로 둔다 — 화면은 "공시된 일정까지"라고 말한다.
 */
export const FOMC_MEETINGS: readonly FomcMeeting[] = [
  { startDate: '2026-01-27', decisionDate: '2026-01-28', withProjections: false },
  { startDate: '2026-03-17', decisionDate: '2026-03-18', withProjections: true },
  { startDate: '2026-04-28', decisionDate: '2026-04-29', withProjections: false },
  { startDate: '2026-06-16', decisionDate: '2026-06-17', withProjections: true },
  { startDate: '2026-07-28', decisionDate: '2026-07-29', withProjections: false },
  { startDate: '2026-09-15', decisionDate: '2026-09-16', withProjections: true },
  { startDate: '2026-10-27', decisionDate: '2026-10-28', withProjections: false },
  { startDate: '2026-12-08', decisionDate: '2026-12-09', withProjections: true }
];

/** FOMC 성명 발표 시각(미 동부). 기자회견은 30분 뒤다. */
export const FOMC_STATEMENT_ET = '14:00';
