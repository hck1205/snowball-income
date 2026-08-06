/**
 * 미국 증시 캘린더의 타입 — **네 종류의 사실**을 한 축에 모은다.
 *
 * 이 폴더가 다루는 것은 "그 날 미국 시장에 무슨 일이 있는가" 하나뿐이고, 그 답은 성격이 다른
 * 네 갈래에서 온다. 갈래마다 **누가 소유하고 언제 낡는지**가 달라서 타입을 나눠 둔다:
 *
 * ```
 *   갈래        소유         갱신 주기        낡으면 생기는 일
 *   휴장·조기폐장 사람(큐레이션) 연 1회(NYSE 공시)  없는 거래일을 열려 있다고 말한다
 *   FOMC        사람(큐레이션) 연 1회(연준 공시)   금리 발표를 놓친다
 *   경제지표     스크립트       주 1회             지난 달 일정이 남는다
 *   실적 발표    스크립트       주 1회             지난 분기 일정이 남는다
 * ```
 *
 * 🔴 **사람이 소유하는 두 갈래를 스크립트로 덮지 마라.** 휴장일은 거래소가 1년 전에 확정 공시하는
 * 값이고, 그것을 매주 긁는 것은 "확정된 사실을 불안정한 경로로 다시 가져오는" 손해다.
 * 반대로 경제지표·실적은 수시로 바뀌므로 사람이 적으면 반드시 낡는다.
 */

/** `YYYY-MM-DD`. 로컬 생성자로만 만든다(`toISOString()` 금지 — KST 에서 하루 밀린다). */
export type CalendarDate = string;

/**
 * 그 날 시장이 어떤 상태인가.
 *
 * ⚠ `weekend` 를 `closed` 와 합치지 않는다. 주말은 **규칙**이라 설명이 필요 없고, 휴장은 **이유**가
 *   있어서 화면이 그 이름("추수감사절")을 말해야 한다. 하나로 뭉치면 그 구분이 사라진다.
 */
export type TradingDayStatus = 'open' | 'early' | 'closed' | 'weekend';

/** 휴장일 한 건. `nameKo` 는 화면에, `nameEn` 은 원문 대조용으로 남긴다. */
export type MarketHoliday = {
  readonly date: CalendarDate;
  readonly nameKo: string;
  readonly nameEn: string;
  /** 원래 날짜가 주말이라 앞뒤로 옮겨 쉬는 날. 화면이 "대체 휴장"이라고 말할 근거다. */
  readonly observed?: boolean;
};

/** 조기 폐장일. 미국 동부시각 기준 폐장 시각을 함께 들고 다닌다(현재는 전부 13:00). */
export type MarketEarlyClose = {
  readonly date: CalendarDate;
  readonly nameKo: string;
  /** 24시간제 `HH:MM`, 미국 동부시각. */
  readonly closeEt: string;
  readonly reasonKo: string;
};

/**
 * FOMC 정례회의 한 회차.
 *
 * 🔴 **발표는 둘째 날이다.** 회의는 이틀이고 성명서는 마지막 날 14:00 ET 에 나온다 — 첫날을
 * "금리 발표일"로 그리면 하루 이른 거짓이 된다.
 */
export type FomcMeeting = {
  /** 회의 첫날. */
  readonly startDate: CalendarDate;
  /** 회의 마지막 날 = **성명 발표일**. */
  readonly decisionDate: CalendarDate;
  /** 경제전망요약(SEP·점도표)이 함께 나오는 회차인가. 시장이 더 크게 반응하는 회차다. */
  readonly withProjections: boolean;
};

/** 경제지표 발표 한 건(생성물). */
export type EconomicEvent = {
  readonly date: CalendarDate;
  /** 미국 동부시각 `HH:MM`. 대부분 08:30 이다. */
  readonly timeEt: string;
  readonly nameKo: string;
  readonly nameEn: string;
  /** 이 앱이 굵게 다루는 지표인지. 시장 영향이 큰 소수만 true 다. */
  readonly major: boolean;
};

/** 실적 발표 한 건(생성물). */
export type EarningsEvent = {
  readonly date: CalendarDate;
  readonly ticker: string;
  readonly nameEn: string;
  /** 장 시작 전 / 장 마감 후 / 미정. 한국 투자자에게는 "새벽에 보는가"가 이 값에 달렸다. */
  readonly session: 'beforeOpen' | 'afterClose' | 'unknown';
  /** 우리 앱이 소개 페이지를 가진 종목인가. 있으면 화면이 그리로 링크한다. */
  readonly hasTickerPage: boolean;
};

/** 스크립트가 만드는 부분. 사람이 소유하는 부분(휴장·FOMC)은 여기 없다. */
export type MarketCalendarSnapshot = {
  /** 생성 시각(YYYY-MM-DD). 화면의 "언제 기준"이 이 값이다. */
  readonly generatedAt: CalendarDate;
  /** 수집 구간 — 이 밖은 "자료 없음"이지 "일정 없음"이 아니다. */
  readonly rangeStart: CalendarDate;
  readonly rangeEnd: CalendarDate;
  readonly economic: readonly EconomicEvent[];
  readonly earnings: readonly EarningsEvent[];
};

/** 한 거래일의 완성된 설명. 화면과 테스트가 함께 보는 단일 형태다. */
export type TradingDay = {
  readonly date: CalendarDate;
  readonly status: TradingDayStatus;
  /** 휴장·조기폐장일 때의 이름. 정상 거래일이면 `null`. */
  readonly labelKo: string | null;
  /** 미국 동부시각 개장·폐장(`HH:MM`). 휴장·주말이면 `null`. */
  readonly openEt: string | null;
  readonly closeEt: string | null;
  /** 한국시각 개장·폐장. 폐장은 거의 언제나 **다음 날**이라 날짜를 함께 준다. */
  readonly openKst: KstMoment | null;
  readonly closeKst: KstMoment | null;
  /** 미국이 서머타임 중인가. 한국시각이 한 시간 당겨지는 이유다. */
  readonly daylightSaving: boolean;
};

/** 한국시각 한 점. `dayOffset` 은 미국 날짜 대비 며칠 뒤인지(0 또는 1). */
export type KstMoment = {
  readonly time: string;
  readonly dayOffset: 0 | 1;
};
