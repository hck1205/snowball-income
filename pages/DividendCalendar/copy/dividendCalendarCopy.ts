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
      '"추정" 배지가 붙은 종목은 배당락일에서 역산한 값이라 실제 입금 달과 다를 수 있습니다. 배지가 없는 종목은 실제 입금 이력 기반이지만, 그래도 일정은 바뀔 수 있습니다.',
    undatedNote: '지급일을 추정할 이력이 없는 종목은 날짜에 놓지 않고 "날짜 미정"으로 따로 표시합니다.'
  },
  badge: {
    /* '실측'(pay) 배지는 삭제했다(2026-07-26) — 기본값이라 표기하지 않고, 예외에만 배지를 단다. */
    /** 배당락일에서 추정. */
    ex: '추정',
    /** 지급월 데이터가 **아직** 없다 — 갱신되면 사라질 상태. */
    unavailable: '데이터 준비 중',
    /**
     * 배당을 지급하지 않는 종목 — 기다려도 데이터가 생기지 않는다(해당 없음).
     * "준비 중"과 반드시 다른 단어여야 한다: 사용자가 곧 들어올 데이터로 오해하면 계속 기다린다.
     */
    nonDividend: '배당 없음'
  },
  picker: {
    heading: '종목 선택',
    /** 우측 드로어를 여는 버튼 — 몇 종을 골라 둔 상태인지 접근명에도 담는다(배지 숫자만으론 안 읽힌다). */
    open: (n: number) => (n > 0 ? `종목 선택 열기, 현재 ${n}종 선택됨` : '종목 선택 열기'),
    openShort: '종목 선택',
    close: '종목 선택 닫기',
    searchLabel: '종목 검색',
    searchPlaceholder: '티커 또는 한글 이름 (예: SCHD, 리얼티)',
    resultCount: (n: number) => `${n}종목`,
    /**
     * 목록에 남아 있지만 지급월 데이터가 없어 고를 수 없는 종목 수 — 총 개수 바로 오른쪽에 적는다.
     * 기준은 목록 항목의 `데이터 준비 중` 배지(`badge.unavailable`)와 **같다**(`source === null`):
     * 같은 화면에서 숫자와 배지가 어긋나면 둘 다 신뢰를 잃는다.
     */
    unavailableCount: (n: number) => `준비 중 ${n}종`,
    /**
     * 배당을 지급하지 않아 캘린더에 놓을 수 없는 종목 수. 위 `unavailableCount` 와 **합치지 않는다** —
     * 하나로 세면 "준비 중"이라는 잘못된 기대를 다시 만든다. 기준은 `배당 없음` 배지와 같다.
     */
    nonDividendCount: (n: number) => `배당 없음 ${n}종`,
    /* 달력 위 "선택 N종" 텍스트는 삭제했다(사용자 결정 2026-07-25 — 필터 버튼 배지와 중복).
       개수는 `picker.open` 접근명과 라이브 리전(`status.selectionSummary`)이 계속 말한다. */
    clear: '선택 비우기',
    noResult: '검색어와 일치하는 종목이 없습니다. 티커(SCHD)나 한글 이름(슈왑)으로 검색해 보세요.',
    noResultLive: '검색 결과가 없습니다.',
    /* 선택 불가 사유 안내문은 삭제했다(사용자 결정 2026-07-25) — "데이터 준비 중" 배지가 이미 말한다. */
    removeChip: (ticker: string) => `${ticker} 선택 해제`
  },
  nav: {
    groupLabel: '월 이동',
    prev: (label: string) => `이전 달로 이동, ${label}`,
    next: (label: string) => `다음 달로 이동, ${label}`,
    /* 버튼의 보이는 텍스트('이번 달')는 삭제했다(2026-07-26) — 아이콘 전용, 접근명(todayAria)만 남는다. */
    todayAria: (label: string) => `이번 달로 돌아가기, ${label}`,
    monthLabel: (year: number, month: number) => `${year}년 ${month}월`
  },
  board: {
    /**
     * 달력 카드 머리 띠의 이름. 월 제목(`<h2>` "2026년 7월")과 **다른 말을 한다** — 저건 "언제"를,
     * 이건 "이 판이 무엇인지"를 말한다. 제목이 아니라 라벨이므로 헤딩 태그로 올리지 않는다
     * (이 페이지의 헤딩 순서는 h1 히어로 → h2 월 → h3 상세로 이미 완결돼 있다).
     */
    sectionLabel: '월간 지급 달력',
    caption: (label: string) =>
      `${label} 배당 지급 예정 캘린더. 날짜 칸에 그 날 지급 예정 종목이 표시됩니다. 지급 예정이 있는 날짜는 눌러서 아래 지급 일정 목록으로 이동할 수 있습니다.`,
    weekdays: ['일', '월', '화', '수', '목', '금', '토'],
    weekdayFull: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    today: '오늘',
    /** 이월(앞뒤 달) 날짜 앞에 붙는 sr-only 접두 — "28"만 읽히면 어느 달인지 알 수 없다. */
    outOfMonthPrefix: (month: number) => `${month}월 `,
    moreCount: (n: number) => `+${n}`,
    moreCountAria: (n: number) => `외 ${n}종, 아래 지급 일정 목록 참고`,
    /* 개수 배지 카피(dayCountAria)는 삭제했다(2026-07-26) — 배지 자체가 폐기됐다(칩이 전 폭에서 나열). */
    /** 종목별 12개월 표(연간 리듬)의 열 머리. */
    monthLabel: (month: number) => `${month}월`,
    summary: (label: string, dated: number, undated: number) =>
      `${label} 지급 예정 ${dated}건 · 날짜 미정 ${undated}종`,
    summaryNone: (label: string) => `${label}에는 선택한 종목의 지급 예정이 없습니다.`,
    /**
     * 날짜 칸을 덮는 투명 버튼의 접근명 — "무엇을 누르는지 + 무슨 일이 일어나는지"를 한 문장으로.
     * 칸 안의 숫자·점만으로는 버튼의 목적지를 알 수 없다.
     */
    dayJump: (month: number, day: number, count: number) =>
      `${month}월 ${day}일 지급 예정 ${count}종, 아래 지급 일정 목록에서 보기`,
    /** 마우스 툴팁 — 좁은 폭에서 칩이 점으로 줄어도 종목명은 hover로 확인할 수 있다(칩별 title 대체). */
    dayTooltip: (month: number, day: number, tickers: readonly string[]) =>
      `${month}월 ${day}일 예상 지급: ${tickers.join(', ')}`,
    /** 칩 커스텀 툴팁(hover/클릭) — 잘린 티커의 전체 이름과 예상 지급일을 말한다. */
    chipTooltip: (ticker: string, month: number, day: number) => `${ticker} — ${month}월 ${day}일 예상 지급`,
    chipTooltipUndated: (ticker: string) => `${ticker} — 이 달 지급 예상, 날짜 미정`,
    /** 모바일 전용 발견 가능성 힌트 — 데스크톱은 커서·호버 링이 이미 말한다. */
    jumpHint: '지급 예정이 있는 날짜를 누르면 아래 목록에서 그 날 일정을 볼 수 있습니다.'
  },
  /**
   * 상세 카드 머리의 미정 보기 토글(aria-pressed). 미정이 0건이면 렌더하지 않는다.
   * 구 2버튼 탭(groupLabel·agenda)은 폐기(2026-07-26) — "지급 일정 목록" 라벨은 카드 제목 한 곳만.
   */
  detailTabs: {
    undated: (n: number) => `날짜 미정 ${n}종`
  },
  undated: {
    heading: '이 달 지급 예정 · 날짜 미정',
    count: (n: number) => `${n}종`,
    hint: '지급일을 추정할 이력이 없어 날짜 칸에 놓지 않았습니다. 지급 자체는 이 달에 예상됩니다.'
  },
  agenda: {
    heading: '지급 일정 목록',
    dayLabel: (month: number, day: number, weekday: string) => `${month}월 ${day}일 (${weekday})`,
    /* 날짜별 종목 수 배지는 삭제했다(사용자 결정 2026-07-25) — 티커가 바로 아래 나열돼 중복이다. */
    /* 칩별 native title(`chipTitle`/`chipTitleUndated`)은 삭제했다(2026-07-26) — 넓은 폭의 칩은
       커스텀 툴팁(`board.chipTooltip`)이, 좁은 폭은 칸 전체를 덮는 `board.dayTooltip`이 말한다. */
    empty: '이 달에는 지급 예정이 없습니다. 다른 달로 이동하거나 종목을 추가해 보세요.',
    /** 날짜 있는 건 0 + 미정만 있을 때 — "지급이 없다"로 읽히면 거짓말이 된다. */
    undatedOnly: '날짜를 추정할 수 있는 지급이 없습니다. "날짜 미정" 탭을 확인하세요.'
  },
  /**
   * 종목 미선택일 때 격자에 깔리는 **예시 미리보기**의 문구.
   *
   * 🔴 예시임을 **색(흐림)만으로 말하지 않는다** — 흐림은 저시력·고대비 모드에서 사라지고
   * 스크린리더에는 애초에 도달하지 않는다. 그래서 (a) 보이는 라벨 텍스트와 (b) 표의 접근명·캡션이
   * 각각 같은 사실을 말한다. 둘 중 하나라도 지우면 예시가 실제 데이터로 읽힌다.
   */
  preview: {
    label: '예시 · 실제 데이터가 아닙니다',
    tableLabel: (monthLabel: string) => `${monthLabel} 예시 달력, 실제 데이터가 아닙니다`,
    caption: (monthLabel: string) =>
      `${monthLabel} 배당 지급 예정 예시입니다. 실제 데이터가 아니며, 종목을 고르면 고른 종목의 예상 지급일로 바뀝니다.`
  },
  empty: {
    title: '아직 선택한 종목이 없습니다',
    body: '관심 종목을 고르면 이 달력에 지급 예정일이 표시됩니다.',
    quickPickLabel: '이런 종목으로 시작해 보세요',
    /**
     * "아직 지급월 데이터가 없습니다"로 쓰지 않는다 — 배당을 지급하지 않는 종목에는 거짓이고
     * (기다려도 데이터가 생기지 않는다), 사유는 이미 목록 배지가 종목별로 말한다.
     * 두 부류를 모두 참으로 덮는 한 문장이라 분기가 필요 없다.
     */
    allUnavailable:
      '선택한 종목은 캘린더에 표시할 지급 일정이 없습니다. 지급 일정이 있는 종목을 추가하면 캘린더가 채워집니다.'
  },
  legend: {
    summary: '종목별 지급 월 표로 보기',
    /**
     * 가로 스크롤 영역의 접근명. 좁은 폭에서 이 표는 12개월 중 3개월만 보이므로 스크롤이 필수인데,
     * 이름 없는 스크롤 상자는 스크린리더에서 "무엇을 미는 중인지" 알 수 없다.
     * 여는 문구(`summary`)와 달리 동작이 아니라 **대상**을 가리키므로 "보기"를 뺐다.
     */
    regionLabel: '종목별 지급 월 표',
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
  }
} as const;
