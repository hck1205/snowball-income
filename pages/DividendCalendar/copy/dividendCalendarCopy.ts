/**
 * `/dividend/calendar` 화면의 모든 문자열.
 *
 * 뷰·컴포넌트에 리터럴을 두지 않는다(카피 수정이 한 파일로 끝나야 한다). 페이지 폴더가 아니라
 * **형제 폴더**에 두는 이유: 달력 부품(`components/*`)도 같은 카피를 읽는데, 페이지 폴더 배럴에서
 * 가져오면 `페이지 → 컴포넌트 → 페이지` 런타임 순환이 된다.
 *
 * 어법 규칙: 확정되지 않은 것을 확정형으로 쓰지 않는다("지급일" 아님 → **"예상 지급일"**),
 * 데이터 부재는 "준비 중 / 미정"으로 명시한다.
 */
export const DIVIDEND_CALENDAR_COPY = {
  meta: {
    title: '배당 지급 캘린더 — 종목별 예상 지급일 달력으로 확인',
    description:
      'SCHD·JEPI·리얼티 인컴 등 배당 ETF와 종목을 골라 며칠에 배당이 들어올지 달력에서 확인하세요. 과거 지급 이력에서 계산한 예상일이라 실제 입금일과 다를 수 있습니다.',
    pathname: '/dividend/calendar'
  },
  hero: {
    title: '배당 지급 캘린더',
    lede: '관심 종목을 고르면 이번 달 어느 날짜에 배당이 들어올지 달력에서 확인할 수 있습니다. 달을 넘겨 앞으로의 일정도 볼 수 있습니다.',
    asOf: (date: string) => `데이터 기준일: ${date}`,
    asOfUnknown: '데이터 기준일 정보 없음'
  },
  disclaimer: {
    title: '예상 지급일에 대해',
    body: '달력의 날짜는 과거 지급 이력에서 계산한 예상일입니다. 주말·공휴일이나 운용사 사정으로 실제 입금일은 달라질 수 있고, 지급 여부와 금액도 공시에 따라 바뀔 수 있습니다. 정확한 일정은 운용사 공시를 확인하세요.',
    monthSource:
      '"추정"은 배당락일에서 역산한 값이라 실제 입금 달과 다를 수 있고, "실측"이라도 일정이 바뀔 수 있습니다.',
    undatedNote: '지급일을 추정할 이력이 없는 종목은 날짜에 놓지 않고 "날짜 미정"으로 따로 표시합니다.'
  },
  badge: {
    /** 실제 입금일 이력에서 관측. */
    pay: '실측',
    /** 배당락일에서 추정. */
    ex: '추정',
    unavailable: '데이터 준비 중'
  },
  picker: {
    heading: '종목 선택',
    searchLabel: '종목 검색',
    searchPlaceholder: '티커 또는 한글 이름 (예: SCHD, 리얼티)',
    resultCount: (n: number) => `${n}종목`,
    selectedCount: (n: number) => `선택 ${n}종`,
    clear: '선택 비우기',
    noResult: '검색어와 일치하는 종목이 없습니다. 티커(SCHD)나 한글 이름(슈왑)으로 검색해 보세요.',
    noResultLive: '검색 결과가 없습니다.',
    unavailableHint: '지급 이력 데이터가 아직 없어 캘린더에 넣을 수 없습니다.',
    removeChip: (ticker: string) => `${ticker} 선택 해제`
  },
  nav: {
    groupLabel: '월 이동',
    prev: (label: string) => `이전 달로 이동, ${label}`,
    next: (label: string) => `다음 달로 이동, ${label}`,
    today: '이번 달',
    todayAria: (label: string) => `이번 달로 돌아가기, ${label}`,
    monthLabel: (year: number, month: number) => `${year}년 ${month}월`
  },
  board: {
    caption: (label: string) => `${label} 배당 지급 예정 캘린더. 날짜 칸에 그 날 지급 예정 종목이 표시됩니다.`,
    weekdays: ['일', '월', '화', '수', '목', '금', '토'],
    weekdayFull: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    today: '오늘',
    /** 이월(앞뒤 달) 날짜 앞에 붙는 sr-only 접두 — "28"만 읽히면 어느 달인지 알 수 없다. */
    outOfMonthPrefix: (month: number) => `${month}월 `,
    moreCount: (n: number) => `+${n}`,
    moreCountAria: (n: number) => `외 ${n}종, 아래 지급 일정 목록 참고`,
    dayCountAria: (n: number) => `지급 예정 ${n}종`,
    /** 종목별 12개월 표(연간 리듬)의 열 머리. */
    monthLabel: (month: number) => `${month}월`,
    summary: (label: string, dated: number, undated: number) =>
      `${label} 지급 예정 ${dated}건 · 날짜 미정 ${undated}종`,
    summaryNone: (label: string) => `${label}에는 선택한 종목의 지급 예정이 없습니다.`
  },
  undated: {
    heading: '이 달 지급 예정 · 날짜 미정',
    count: (n: number) => `${n}종`,
    hint: '지급일을 추정할 이력이 없어 날짜 칸에 놓지 않았습니다. 지급 자체는 이 달에 예상됩니다.'
  },
  agenda: {
    heading: '지급 일정 목록',
    dayLabel: (month: number, day: number, weekday: string) => `${month}월 ${day}일 (${weekday})`,
    chipTitle: (ticker: string, month: number, day: number) => `${ticker} 예상 지급일 ${month}월 ${day}일`,
    chipTitleUndated: (ticker: string) => `${ticker} 이 달 지급 예정, 날짜 미정`,
    empty: '이 달에는 지급 예정이 없습니다. 다른 달로 이동하거나 종목을 추가해 보세요.',
    /** 날짜 있는 건 0 + 미정만 있을 때 — "지급이 없다"로 읽히면 거짓말이 된다. */
    undatedOnly: '날짜를 추정할 수 있는 지급이 없습니다. 위 "날짜 미정" 목록을 확인하세요.'
  },
  empty: {
    title: '아직 선택한 종목이 없습니다',
    body: '위(데스크톱은 왼쪽) 검색에서 종목을 추가하면 예상 지급일이 달력에 표시됩니다.',
    quickPickLabel: '이런 종목으로 시작해 보세요',
    allUnavailable:
      '선택한 종목은 아직 지급월 데이터가 없습니다. 데이터가 있는 종목을 추가하면 캘린더가 채워집니다.'
  },
  legend: {
    summary: '종목별 지급 월 표로 보기',
    tickerColumn: '종목',
    payingCell: (month: number) => `${month}월 지급`
  },
  unavailableSection: {
    summary: (n: number) => `지급월 데이터가 아직 없는 종목 (${n}종)`,
    body: '지급 이력을 확보하는 대로 캘린더에 추가됩니다. 없는 데이터를 추측해서 채우지 않습니다.'
  },
  status: {
    loading: '저장된 종목 선택을 불러오는 중입니다.',
    monthChanged: (label: string, dated: number, undated: number) =>
      `${label}. 지급 예정 ${dated}건, 날짜 미정 ${undated}종.`,
    selectionSummary: (selected: number, dated: number) => `선택 ${selected}종, 이 달 지급 예정 ${dated}건.`,
    cleared: '선택을 모두 해제했습니다.'
  },
  error: {
    unknownTickers: (tickers: string[]) =>
      `주소에 있던 종목 중 ${tickers.length}개는 목록에 없어 제외했습니다: ${tickers.join(', ')}`
  },
  cta: {
    toSimulator: '시뮬레이터에서 내 조건으로 계산하기'
  }
} as const;
