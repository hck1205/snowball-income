/**
 * 미국 증시 캘린더의 문구.
 *
 * 🔴 이 화면의 존재 이유는 **시차 환산을 사용자 머릿속에서 꺼내 오는 것**이다. "9:30 ET" 는
 * 한국 사람에게 아무 정보가 아니다. 그래서 시각을 말하는 자리마다 한국시각이 먼저 오고,
 * 날짜를 넘기면("다음 날 05:00") 그 사실을 글자로 말한다.
 *
 * ⚠ 격식체(-습니다). 투자 판단을 부추기는 말은 쓰지 않는다.
 */
export const MARKET_CALENDAR_COPY = {
  meta: {
    title: '미국 증시 캘린더 — 휴장일·개장 시간·주요 일정 (한국시간)',
    description:
      '미국 증시가 언제 열고 닫는지 한국시간으로 알려 드립니다. 휴장일과 조기 폐장일, FOMC와 주요 경제지표 발표 일정, 실적 발표를 한 달력에 모았습니다.'
  },
  hero: {
    title: '미국 증시 캘린더',
    lede: '미국 시장이 언제 열고 닫는지, 무엇이 발표되는지 한국시간으로 정리했습니다.',
    notice: '모든 시각은 한국시간입니다. 미 동부시각은 괄호 안에 함께 적었습니다.'
  },

  today: {
    heading: '오늘과 다음 거래일',
    todayLabel: '오늘',
    nextLabel: '다음 거래일',
    sessionLabel: '정규장 (한국시간)',
    etLabel: '미 동부시각',
    dstLabel: '서머타임',
    closedToday: '오늘은 장이 서지 않습니다.'
  },

  month: {
    heading: '월간 달력',
    subtitle: '휴장일과 조기 폐장일, 그날 있는 주요 일정을 함께 표시합니다.',
    previous: '이전 달',
    next: '다음 달',
    thisMonth: '이번 달',
    title: (year: number, month: number) => `${year}년 ${month}월`,
    weekdays: ['일', '월', '화', '수', '목', '금', '토'],
    legendHoliday: '휴장',
    legendEarly: '조기 폐장',
    legendEvent: '주요 발표',
    legendEarnings: '실적 발표',
    /**
     * 칸에 다 못 담은 일정 수.
     * 🔴 접힌 것을 숫자로라도 말한다 — 안 그러면 그 칸은 "일정이 둘뿐"이라고 거짓말한다.
     */
    moreEvents: (count: number) => `+${count}건 더`,
    summary: (holidays: number, early: number) =>
      holidays === 0 && early === 0
        ? '이 달에는 휴장일이 없습니다.'
        : `휴장 ${holidays}일 · 조기 폐장 ${early}일`,
    notCurated: '이 달은 아직 확정된 휴장일 자료가 없습니다.',
    /** 🔴 "일정 없음"이 아니라 "아직 알려지지 않음"이다 — 둘을 같은 말로 쓰면 거짓이 된다. */
    beyondRange: '이 시기의 발표 일정은 아직 공개되지 않았습니다.',
    /** 칸이 눌린다는 것을 격자 위에서 한 번 말한다(칸마다 적으면 42번 반복된다). */
    dayHint: '날짜를 누르면 그날 일정을 전부 볼 수 있습니다.'
  },

  /**
   * 날짜 칸을 눌렀을 때 열리는 드로어(2026-08-05 신설, 사용자 지시).
   *
   * 🔴 달력 칸은 좁아서 일정을 **접는다**("+2건 더"). 접힌 것을 펴 보는 자리가 없으면 그 칸은
   * 사용자에게 "무언가 더 있다"만 말하고 끝난다. 이 드로어가 그 답이다.
   * ⚠ 없는 것은 없다고 말한다 — 일정이 없는 날에도 열리고, 그때는 "표시할 일정이 없다"고 적는다.
   *   큐레이션 구간 밖이면 그것은 "없다"가 아니라 **"아직 모른다"** 라서 문장이 다르다.
   */
  day: {
    closeLabel: '닫기',
    /** 드로어 제목 — 날짜와 요일. 어느 날을 보고 있는지가 제목이어야 한다. */
    title: (month: number, day: number, weekday: string) => `${month}월 ${day}일 (${weekday})`,
    statusHeading: '거래',
    sessionLabel: '정규장',
    fomcHeading: 'FOMC',
    fomcNote: '성명서는 회의 마지막 날 발표됩니다.',
    economicHeading: '주요 발표',
    earningsHeading: '실적 발표',
    majorTag: '주요',
    empty: '이 날에는 표시할 일정이 없습니다.',
    unknown: '이 날의 자료는 아직 수집 구간 밖입니다.',
    /** 이 앱에 소개 페이지가 있는 종목만 링크가 된다. */
    tickerLinkHint: '종목 이름을 누르면 소개 페이지로 이동합니다.'
  },

  upcoming: {
    heading: '다가오는 주요 일정',
    subtitle: 'FOMC와 주요 경제지표, 휴장일입니다. 실적 발표는 아래에 따로 있습니다.',
    columnDate: '날짜',
    columnEvent: '일정',
    columnKst: '한국시간',
    columnEt: '미 동부',
    allDay: '종일',
    empty: '앞으로의 일정 자료가 없습니다.'
  },

  earnings: {
    heading: '실적 발표',
    subtitle: '우리가 다루는 종목과 시가총액이 매우 큰 기업만 추렸습니다.',
    columnDate: '날짜',
    columnTicker: '종목',
    columnName: '이름',
    columnSession: '발표 시점',
    session: {
      beforeOpen: '개장 전',
      afterClose: '마감 후',
      unknown: '미정'
    },
    sessionHint: '개장 전은 한국시간 밤, 마감 후는 다음 날 새벽입니다.',
    empty: '수집한 구간에 실적 발표 일정이 없습니다.'
  },

  holidays: {
    heading: '휴장일과 조기 폐장',
    subtitle: '거래소가 미리 공시한 일정이라 바뀌는 일이 거의 없습니다.',
    columnDate: '날짜',
    columnWeekday: '요일',
    columnName: '이름',
    columnKind: '구분',
    kindHoliday: '휴장',
    kindEarly: '조기 폐장',
    observedTag: '대체',
    yearLabel: (year: number) => `${year}년`
  },

  /** 🔴 네 문장이 이 화면의 정직성이다. */
  limits: {
    heading: '읽기 전에 알아야 할 것',
    items: [
      '**휴장일과 FOMC 는 1년 앞까지 확정된 일정입니다.** 거래소와 연준이 미리 공시한 것을 그대로 옮겼습니다.',
      '**실적과 경제지표는 몇 주 앞까지만 알 수 있습니다.** 기업이 발표일을 3~4주 전에야 알리기 때문에, 그 뒤가 비어 있는 것은 일정이 없어서가 아니라 아직 정해지지 않아서입니다.',
      '**여기 없는 발표도 있습니다.** 모아 오는 자료가 미국의 모든 지표를 담고 있지는 않습니다.',
      '**시각은 서머타임에 따라 한 시간 달라집니다.** 3월 둘째 일요일부터 11월 첫째 일요일까지는 한 시간 일찍 열고 닫습니다.'
    ]
  },

  source: {
    heading: '출처와 기준',
    holidaysLabel: '휴장일·거래시간',
    holidaysName: '뉴욕증권거래소 공시',
    holidaysUrl: 'https://www.nyse.com/trade/hours-calendars',
    fomcLabel: 'FOMC 일정',
    fomcName: '미국 연방준비제도',
    fomcUrl: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
    collectedLabel: '경제지표·실적 수집일',
    rangeLabel: '수집 구간'
  }
} as const;
