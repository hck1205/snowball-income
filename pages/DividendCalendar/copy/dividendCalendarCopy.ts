/**
 * `/dividend/calendar` 화면의 모든 문자열.
 *
 * 뷰·컴포넌트에 리터럴을 두지 않는다(카피 수정이 한 파일로 끝나야 한다). 페이지 폴더가 아니라
 * **형제 폴더**에 두는 이유: 달력 부품(`components/*`)도 같은 카피를 읽는데, 페이지 폴더 배럴에서
 * 가져오면 `페이지 → 컴포넌트 → 페이지` 런타임 순환이 된다.
 */
export const DIVIDEND_CALENDAR_COPY = {
  meta: {
    title: '배당 지급 월 캘린더 — 종목별 배당 지급 월 한눈에',
    description:
      'SCHD·JEPI·리얼티 인컴 등 배당 ETF와 종목의 지급 월을 골라 1~12월 캘린더로 확인하세요. 과거 지급 이력에서 관측한 월 기준입니다.',
    pathname: '/dividend/calendar'
  },
  hero: {
    title: '배당 지급 월 캘린더',
    lede: '관심 종목을 고르면 1월부터 12월까지 어느 달에 배당이 들어오는지 한 화면에서 확인할 수 있습니다. 비는 달을 찾아 조합을 채워 보세요.',
    asOf: (date: string) => `데이터 기준일: ${date}`,
    asOfUnknown: '데이터 기준일 정보 없음'
  },
  disclaimer: {
    title: '지급 월 데이터에 대해',
    body: '지급 월은 과거 지급 이력에서 관측한 값입니다. "추정"은 배당락일 기준이라 실제 입금 달과 다를 수 있고, "실측"이라도 운용사 사정에 따라 일정이 바뀔 수 있습니다. 정확한 지급일과 지급 여부는 운용사 공시를 확인하세요.',
    monthOnly: '이 캘린더는 월 단위입니다. 며칠에 들어오는지는 다루지 않습니다.'
  },
  badge: {
    /** 실제 입금일 이력에서 관측. */
    pay: '실측',
    /** 배당락일에서 추정. */
    ex: '추정',
    unavailable: '데이터 준비 중',
    currentMonth: '이번 달'
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
  board: {
    heading: '연간 지급 월',
    monthLabel: (month: number) => `${month}월`,
    payingCount: (n: number) => `${n}종목 지급`,
    noPayout: '지급 없음',
    coverage: (selected: number, months: number) => `선택 ${selected}종 · 지급 있는 달 ${months}개월`,
    coverageFull: '12개월 모두 지급되는 조합입니다.',
    coverageGap: (months: number[]) => `지급이 없는 달: ${months.map((month) => `${month}월`).join(', ')}`
  },
  empty: {
    title: '아직 선택한 종목이 없습니다',
    body: '위(데스크톱은 왼쪽) 검색에서 종목을 추가하면 지급 월이 캘린더에 표시됩니다.',
    quickPickLabel: '이런 종목으로 시작해 보세요',
    allUnavailable: '선택한 종목은 아직 지급월 데이터가 없습니다. 데이터가 있는 종목을 추가하면 캘린더가 채워집니다.'
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
    selectionSummary: (selected: number, months: number) => `선택 ${selected}종, 지급 있는 달 ${months}개월.`,
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
