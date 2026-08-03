/**
 * `/dividend/portfolio` 화면의 모든 문자열.
 *
 * 뷰·컴포넌트에 리터럴을 두지 않는다. 페이지 폴더가 아니라 **형제 폴더**에 두는 이유:
 * 하위 부품도 같은 카피를 읽는데 페이지 배럴에서 가져오면 페이지→컴포넌트→페이지 순환이 된다.
 *
 * 어법 규칙: ①추정을 확정형으로 쓰지 않는다("예상"·"기준") ②값이 없으면 빈칸 대신 사유를 말한다
 * ③1인칭·투자 자문형 문구 금지 ④"눈덩이/스노우볼" 비유 금지.
 */

const DASH = '—';

/**
 * 하이드레이션 전(저장소를 아직 못 읽음) 편집 거절 안내.
 *
 * 수동 추가 폼의 인라인 사유와 라이브 리전이 **같은 문장**을 쓴다 — 같은 거절을 두 표면이 다른 말로
 * 설명하면 사용자는 두 가지 일이 일어났다고 읽는다.
 */
const NOT_READY = '저장된 보유 목록을 아직 불러오는 중입니다. 잠시 후 다시 추가해 주세요.';

export const PORTFOLIO_COPY = {
  meta: {
    title: '나의 배당 포트폴리오 — 보유 종목으로 배당을 계산',
    description:
      '보유 종목과 수량만 넣으면 평가 금액·연 배당·월 배당·이번 달 예상 배당을 계산해 보여 줍니다. 계산은 브라우저 안에서만 이루어집니다.',
    pathname: '/dividend/portfolio'
  },

  hero: {
    title: '나의 배당 포트폴리오',
    lede: '종목과 보유 수량만 넣으면 지금 받는 배당이 얼마인지, 다음 배당은 언제인지 한 화면에서 확인할 수 있습니다.',
    asOfPrice: (date: string) => `시세 기준일 ${date}`,
    asOfFx: (rate: string, date: string) => `환율 $1 ≈ ${rate}원 · ${date} 기준`,
    asOfFxStale: '환율 업데이트 실패',
    asOfFxLoading: '환율을 불러오는 중입니다',
    asOfFxMissing: '환율 정보 없음',
    /** 세 조각을 ' · '로 잇는다. 없는 조각은 빠진다. */
    asOf: (parts: string[]) => parts.join(' · '),

    /**
     * 히어로의 **다음 배당 D-Day**. 데이터는 이미 있던 것(요약 타일 #7 과 같은 지급일)이고,
     * 표시만 앞으로 당긴 것이다 — 두 자리가 다른 날짜를 말하면 신뢰가 깨지므로 같은 선택 규칙을 쓴다.
     *
     * 어법: **지급 '예정'일**이라고 쓴다. 이 날짜는 과거 지급 이력에서 계산한 추정치라
     * "받습니다" 같은 단정형을 쓸 수 없다(각주 `footnote.schedule` 과 같은 근거).
     * 🔴 예상 **일자**를 아는 종목에만 붙는다 — "N월 중"만 아는 종목으로 D-Day 를 만들면 날짜 날조다.
     */
    dDay: {
      label: '다음 배당 지급 예정일까지',
      /** 오늘이 지급 예정일이면 "며칠 남았다"가 아니다 — 문장 자체를 바꾼다. */
      todayLabel: '다음 배당 지급 예정일이 오늘입니다',
      value: (days: number) => `D-${days}`,
      todayValue: 'D-DAY'
    }
  },

  summary: {
    title: '지금 받는 배당',
    tiles: {
      monthlyNet: '월 배당(세후)',
      monthlyNetHint: '연 배당을 12로 나눈 월 평균',
      monthlyNetHintEmpty: '수량을 입력하면 계산됩니다',
      marketValue: '평가 금액',
      marketValueHint: (date: string) => `${date} 종가 기준`,
      /** 시세 스냅샷 기준일을 모르는 구성(수동 입력만 있는 경우)에서 쓰는 대체 힌트. */
      marketValueHintUnknown: '보유 수량 × 현재 주가',
      annualNet: '연 배당(세후)',
      annualNetHint: (taxPercent: number) => `세후 ${taxPercent}% 기준`,
      yield: '배당수익률',
      yieldHint: '세전 · 평가 금액 기준 가중평균',
      thisMonth: '이번 달 예상 배당',
      thisMonthHint: (month: number, count: number) => `${month}월 지급 예정 ${count}종 · 균등 분배 가정`,
      thisMonthNone: '이번 달 지급 없음',
      thisMonthNoneHint: '분기·반기 배당 종목은 지급 달에만 들어옵니다',
      thisMonthUnknown: '계산할 수 없음',
      thisMonthUnknownHint: '보유 종목에 지급월 데이터가 없습니다',
      nextPayout: '다음 예상 지급일',
      nextPayoutDay: (month: number, day: number) => `${month}월 ${day}일 예상`,
      /** 지급 연도가 **올해가 아닐 때만**. 같은 해에도 연도를 붙이면 매 화면에 소음이 는다. */
      nextPayoutDayWithYear: (year: number, month: number, day: number) => `${year}년 ${month}월 ${day}일 예상`,
      nextPayoutMonthOnly: (month: number) => `${month}월 지급 예정`,
      nextPayoutMonthOnlyWithYear: (year: number, month: number) => `${year}년 ${month}월 지급 예정`,
      nextPayoutMonthOnlyHint: (tickers: string) => `날짜 미정 · ${tickers}`,
      nextPayoutNone: '지급일 데이터 없음',
      nextPayoutNoneHint: '보유 종목의 지급 일정 데이터가 아직 없습니다',
      /** 여러 종목이 같은 날 지급될 때. */
      tickerSummary: (first: string, count: number) => (count > 1 ? `${first} 외 ${count - 1}종` : first),
      empty: DASH
    },
    /** 월 평균(#1)과 이번 달(#5)이 다른 개념임을 말한다. 이번 달이 0일 때만 렌더. */
    monthlyVsThisMonthNote:
      '월 배당은 1년치를 12로 나눈 평균이고, 이번 달 예상은 이번 달에 실제 지급되는 금액입니다. 분기 배당 종목만 있으면 지급이 없는 달도 있습니다.',
    /**
     * 비중 도넛 + 범례.
     *
     * 🔴 도넛은 **장식(`aria-hidden`)** 이고, 같은 사실을 범례가 글자로 말한다 — 색이 단독 채널이
     * 되면 회색조·색각이상에서 이 블록은 아무 정보도 주지 않는다. 색은 보유 표의 종목 귀와
     * **같은 값**(`assignSeries`)이라 "이 색 = 그 종목"이 화면 안에서 한 번만 정의된다.
     */
    composition: {
      title: '종목별 비중',
      /* 범례 한 줄에 `aria-label` 을 붙이지 않는다 — `listitem` 은 이름을 붙여도 되는 역할이 아니고,
         보이는 글자("SCHD  42.1%")가 위 제목 아래에서 이미 같은 말을 한다. */
      /** 상위 N종을 넘긴 나머지를 하나로 접는다. 조각이 20개면 도넛도 범례도 못 읽는다. */
      others: '그 외',
      /**
       * 도넛 한가운데 숫자의 라벨.
       *
       * 🔴 여기에 `holdings.title`('보유 종목')을 쓰지 마라 — 도넛이 세는 것은 **비중이 잡힌 종목**
       * 이고, 보유 카드 제목 옆 배지는 **저장된 종목 전체**(`holdingsCount`)를 센다. 수량을 비운 행이
       * 하나라도 있으면 두 숫자가 갈리는데, 라벨이 같으면 한 화면에서 "보유 종목 5종"과
       * "3 보유 종목"이 나란히 서서 둘 중 하나가 거짓말이 된다. 라벨이 세는 대상을 말한다.
       */
      centerLabel: '집계 종목',
      percent: (percent: number) => `${percent.toFixed(1)}%`
    },
    staleTickerNote: (count: number) =>
      `시세가 갱신되지 않은 종목 ${count}종이 포함돼 평가 금액이 실제와 크게 다를 수 있습니다.`,
    manualExcludedNote: (count: number) =>
      `직접 추가한 종목 ${count}종은 지급 일정 데이터가 없어 이번 달·지급일 계산에서 빠졌습니다.`,
    missingScheduleNote: (count: number) =>
      `지급월 데이터가 없는 종목 ${count}종은 이번 달·지급일 계산에서 빠졌습니다.`
  },

  cta: {
    simulate: '이 포트폴리오로 시뮬레이션',
    simulateDisabledFx: '환율을 불러오지 못해 원화로 환산할 수 없습니다. 환율이 복구되면 다시 사용할 수 있습니다.',
    /**
     * 조회 **중**(아직 실패한 게 아니다). 실패 문구와 섞으면 "복구되면"이라는 말이 붙어
     * 없는 실패를 알린 셈이 된다 — 로딩은 로딩이라고만 말한다.
     */
    simulateDisabledFxLoading: '환율을 불러오는 중입니다. 잠시 후 시뮬레이션할 수 있습니다.',
    simulateDisabledEmpty: '보유 수량을 하나 이상 입력하면 시뮬레이션할 수 있습니다.',
    /**
     * 스펙 §11 추가 — 보유는 있는데 **시뮬레이터가 아는 종목이 하나도 없을 때**(직접 추가한 종목만 보유).
     * 무음 비활성 금지 규칙상 이 경우에도 사유를 말해야 한다.
     */
    simulateDisabledUnsupported: '직접 추가한 종목은 시뮬레이터에서 계산할 수 없어 시뮬레이션을 시작할 수 없습니다.',
    /**
     * 스펙 §11 추가 — 일부만 유니버스 밖일 때. 비중이 조용히 왜곡되지 않게 화면이 먼저 말한다.
     *
     * 두 번째 문장은 프리필 계약의 사실이다: 비중은 남은 종목으로 재정규화하지만 초기 투자금은
     * **총 평가금액**이라 제외 종목의 금액까지 실린다(shared/constants/portfolioPrefill).
     * 이 사실을 숨기면 사용자는 시뮬레이터의 초기 투자금이 왜 더 큰지 알 방법이 없다.
     */
    simulateExcluded: (count: number) =>
      `직접 추가한 종목 ${count}종은 시뮬레이션 비중에서 빠집니다. 제외된 종목의 평가 금액은 초기 투자금에 포함됩니다.`,
    calendar: '지급일 달력에서 보기',
    calendarManualExcluded: '직접 추가한 종목은 달력에 표시할 수 없어 제외됩니다.',
    /** 스펙 §11 추가 — 달력에 실을 수 있는 종목이 하나도 없을 때. */
    calendarDisabled: '달력에 표시할 수 있는 종목이 없습니다.',
    /**
     * 수량이 하나도 없을 때의 **달력 쪽** 사유(2026-08-03 리워크에서 분리).
     *
     * 🔴 종전에는 이 경우 달력도 `simulateDisabledEmpty`("…시뮬레이션할 수 있습니다")를 그대로
     * 썼다. 두 버튼이 요약 카드 안에 나란히 있고 뷰가 **같은 문장을 한 번만** 그렸기 때문에 그 사실이
     * 드러나지 않았을 뿐, 문장 자체가 달력에 대해 거짓이었다. 진입이 두 카드로 갈리면서
     * ①같은 문장이 화면에 두 번 뜨고 ②달력 카드가 시뮬레이터 이야기를 하는 문제가 함께 드러났다.
     */
    calendarDisabledEmpty: '보유 수량을 하나 이상 입력하면 달력에서 볼 수 있습니다.'
  },

  holdings: {
    title: '보유 종목',
    /** 카드 제목 옆 보유 종수 배지. 0종이면 애초에 빈 상태 카드가 이 카드를 대체한다. */
    countBadge: (count: number) => `${count}종`,
    /** 로컬 전용 고지 — 화면에서 한 번만 말한다(각주에서 반복 금지). */
    localOnly: '보유 목록은 이 기기의 브라우저에만 저장됩니다.',
    /**
     * 행 안의 비중 한 줄. 🔴 **색 귀와 같은 사실을 글자로** 말한다 — 종목 색은 길찾기 단서일 뿐
     * 값이 아니므로, 비중은 언제나 숫자로도 읽혀야 한다(회색조에서도 표가 성립해야 한다).
     */
    share: (percent: string) => `비중 ${percent}`,
    add: '종목 추가',
    addAria: (count: number) => (count > 0 ? `종목 추가 열기, 현재 ${count}종 보유` : '종목 추가 열기'),
    caption: '보유 종목과 수량. 수량을 바꾸면 위 요약이 바로 갱신됩니다.',
    columnTicker: '종목',
    columnQuantity: '보유 수량',
    columnMarketValue: '평가 금액',
    columnAnnualNet: '연 배당(세후)',
    columnActions: '삭제',
    quantityAria: (ticker: string) => `${ticker} 보유 수량`,
    quantityUnit: '주',
    deleteAria: (ticker: string) => `${ticker} 삭제`,
    rowNeedsQuantity: '수량을 넣으면 계산에 포함됩니다',
    rowManualExcluded: '지급 일정 데이터가 없어 이번 달·지급일 계산에서 제외됩니다',
    rowNoSchedule: '지급월 데이터가 없어 이번 달·지급일 계산에서 제외됩니다',
    /** 스펙 §11 추가 — 시장 데이터를 못 찾은 행(저장 데이터에 남은 옛 심볼 등). 값 대신 사유를 말한다. */
    rowNoMarketData: '시세 데이터를 찾을 수 없어 계산에서 제외됩니다'
  },

  badge: {
    /* 스냅샷(기본값)에는 배지를 달지 않는다 — 기본에 배지를 달면 소음이다(캘린더 선례). */
    stalePrice: '시세 미갱신',
    manual: '수동',
    held: '보유 중'
  },

  picker: {
    heading: '종목 추가',
    close: '종목 추가 닫기',
    searchLabel: '종목 검색',
    searchPlaceholder: '티커 또는 한글 이름 (예: SCHD, 리얼티)',
    resultCount: (n: number) => `${n}종목`,
    addAria: (ticker: string) => `${ticker} 추가`,
    heldAria: (ticker: string) => `${ticker} 보유 중, 수량 수정하기`,
    noResult: '검색어와 일치하는 종목이 없습니다. 아래에서 직접 추가할 수 있습니다.'
  },

  manual: {
    summary: '찾는 종목이 없다면 직접 추가하기',
    body: '목록에 없는 종목은 주가와 배당률을 직접 넣어 추가할 수 있습니다. 지급 일정 데이터가 없어 이번 달 예상 배당과 지급일 계산에는 들어가지 않습니다.',
    fieldTicker: '티커',
    /** 실제 거래되는 심볼로 보인다 — 형식(영문 대문자)을 예시 하나로 말한다. */
    fieldTickerPlaceholder: '예: MAIN',
    fieldPrice: '현재 주가',
    /** 소수점을 써도 된다는 사실을 예시로 말한다(정수만 받는 줄 알고 반올림해 넣지 않게). */
    fieldPricePlaceholder: '예: 60.5',
    fieldPriceHint: '미국 달러(USD) 기준 주가',
    fieldYield: '배당률',
    submit: '추가',
    /** 실제 패턴과 문구가 같아야 한다 — `/^[A-Z0-9][A-Z0-9.-]{0,9}$/`(ManualTickerForm). */
    invalidTicker: '티커를 입력하세요. 영문·숫자로 시작하고 마침표(.)와 하이픈(-)까지 쓸 수 있으며, 최대 10자입니다.',
    invalidPrice: '현재 주가는 0보다 커야 합니다.',
    invalidYield: '배당률은 0 이상 100 이하로 입력하세요.',
    duplicateInUniverse: (ticker: string) => `${ticker}는 위 검색에서 찾을 수 있습니다. 검색으로 추가해 주세요.`,
    duplicateInHoldings: (ticker: string) => `${ticker}는 이미 보유 목록에 있습니다.`,
    /** 하이드레이션 전 거절 — "이미 보유 중"으로 접으면 있지도 않은 행을 알린 셈이 된다. */
    notReady: NOT_READY,
    /** 스펙 §11 추가 — 입력 단위 기호(장식). 뷰에 리터럴을 두지 않기 위한 자리. */
    priceUnit: '$',
    yieldUnit: '%'
  },

  empty: {
    /** 빈 상태는 첫 방문자가 보는 **유일한 화면**이다 — 부재를 알리는 데서 멈추지 않고 무엇을 얻는지 말한다. */
    title: '보유 종목을 등록하면 여기서 배당을 확인합니다',
    body: '종목과 보유 수량만 넣으면 평가 금액과 배당은 자동으로 계산해 드립니다. 입력한 값은 이 기기의 브라우저에만 저장됩니다.',
    cta: '종목 추가',
    quickPickLabel: '이런 종목으로 시작해 보세요',
    /** 유니버스에 실재하는 심볼만(스냅샷 보유 종목). */
    quickPicks: ['SCHD', 'JEPI', 'O', 'VIG'],

    /**
     * 등록 뒤에 무엇이 보이는지 미리 말하는 세 줄.
     *
     * 🔴 문구는 요약 타일·목표 카드의 라벨과 **일부러 다르게** 쓴다 — 같은 문자열이면 값이 있는 화면에서
     * 텍스트로 타일을 찾는 테스트가 두 곳을 잡는다(빈 상태와 요약은 동시에 뜨지 않지만, 문자열이
     * 갈려 있어야 나중에 둘을 한 화면에 두더라도 안전하다).
     */
    previewLabel: '등록하면 이런 것을 볼 수 있습니다',
    previews: [
      { term: '한 달에 들어오는 배당', body: '보유 수량과 최근 배당률로 계산한 세후 월 평균' },
      { term: '다음 배당이 들어오는 날', body: '과거 지급 이력에서 계산한 예상 지급일까지 남은 날짜' },
      { term: '목표까지 남은 거리', body: '목표 월배당을 정해 두면 달성률과 남은 금액' }
    ]
  },

  assumptions: {
    summary: (taxPercent: number) => `이 계산에 쓰인 가정 · 세율 ${taxPercent}%`,
    taxLabel: '배당소득세',
    taxHint: '기본값은 국내 배당소득세 15.4%입니다.',
    priceBasis: '주가 기준',
    priceBasisValue: (date: string) => `${date} 종가 스냅샷`,
    /** 스펙 §11 추가 — 스냅샷 기준일을 모르는 구성(수동 입력만). */
    priceBasisUnknown: '기준일 정보 없음',
    fxBasis: '환율 기준',
    fxBasisValue: (rate: string, date: string) => `$1 ≈ ${rate}원 · ${date}`,
    fxBasisMissing: '환율 정보 없음 (달러로 표시 중)',
    distribution: '월 분배',
    distributionValue: '연 배당을 지급월에 균등 분배',
    stalePrice: '시세 미갱신 종목',
    stalePriceValue: (count: number) => `${count}종`,
    manual: '직접 추가한 종목',
    manualValue: (count: number) => `${count}종`
  },

  /**
   * 목표 달성 카드(요약 카드 아래 두 번째 카드) — 구 `/dividend/goal` 화면을 이 페이지로 흡수하면서
   * `GOAL_COPY` 에서 옮겨 온 문자열이다.
   *
   * ⚠ 이 카드에는 **현재 예상 월배당 타일이 없다** — 그 숫자는 위 요약 카드의 hero(`월 배당(세후)`)가
   * 이미 말한다. 달성률의 현재값은 미터 병기 문장이 문장 안에서 말하고, 그 값의 **기준**(지금 보유 /
   * 시뮬레이터에 저장된 조건)은 `basis` 한 줄이 말한다. 같은 말을 두 번 하지 않는다.
   *
   * 어법: ①추정을 확정형으로 쓰지 않는다("닿습니다"·"예상") ②값이 없으면 사유를 말한다
   * ③1인칭·투자 자문형 금지 ④"눈덩이/스노우볼" 비유 금지.
   */
  goal: {
    /** 카드 제목(h2, aria-labelledby 대상). 구 페이지 이름을 그대로 카드 이름으로 승격했다. */
    title: '목표 달성',
    /** 카드 헤더 우측 액션 — 목표를 이미 정한 상태에서만. 값 쓰기는 시뮬레이터에서만 일어난다. */
    editTarget: '목표 수정',

    tiles: {
      target: '목표 월배당',
      remaining: '남은 금액',
      remainingHint: '목표까지 더 필요한 월배당',
      eta: '예상 달성',
      etaNotReached: '기간 내 미도달',
      etaAlready: '이미 달성',
      etaMonth: (year: number, month: number) => `${year}년 ${month}월`,
      etaHintYearIndex: (yearIndex: number) => `투자 ${yearIndex}년차`,
      etaHintDuration: (years: number) => `투자 ${years}년 기준`,
      /** E′ — 시뮬 도달월이 오늘 이전. 지난 날짜를 "예상 달성"이라 말하지 않는다. */
      etaPast: '예상 시점 없음',
      etaPastHint: '저장된 투자 조건이 지금 보유와 많이 다릅니다'
    },

    /**
     * 카드 머리의 상태 배지. 🔴 아래 `status` 문장과 **다른 층**이다 — 배지는 훑어볼 때
     * 한 낱말로 읽히는 자리이고, 문장은 근거를 말하는 자리다. 색 단독 금지 규칙에 따라
     * 배지는 언제나 **글자**를 갖는다(테두리·색은 거들 뿐이다).
     */
    badge: {
      reached: '목표 도달',
      inProgress: '목표까지 진행 중'
    },

    meter: {
      label: '달성률',
      /** progressbar 접근명 — 카드 문맥 없이도 무엇의 비율인지 읽히게. */
      ariaLabel: '목표 월배당 달성률',
      value: (percent: number) => `${percent}%`,
      /** 색·바 없이도 같은 사실이 읽히도록 붙는 병기 문장. **현재값은 여기서만 숫자로 나온다.** */
      sentence: (target: string, current: string) => `목표 월배당 ${target} 중 ${current}까지 왔습니다.`,
      sentenceReached: (target: string) => `목표 월배당 ${target}에 도달했습니다.`
    },

    status: {
      /** E 도달 — 시점의 근거(저장된 투자 조건)를 문장 안에서 밝힌다. */
      reached: (month: string, target: string) =>
        `저장된 투자 조건대로 이어 가면 ${month}에 목표 월배당 ${target}에 닿습니다.`,
      /** D 미도달. */
      notReached: (years: number, target: string) =>
        `저장된 투자 조건으로는 투자 ${years}년 안에 목표 월배당 ${target}에 닿지 않습니다.`,
      /** F 이미 달성(실측) — 판정 기준을 문장이 밝힌다. */
      already: (target: string) =>
        `지금 보유한 종목에서 나오는 배당이 이미 목표 월배당 ${target}을 넘어섭니다. 목표를 더 높게 잡아 보세요.`,
      /** F 이미 달성(폴백) — 보유 기준이 아니므로 "지금 보유한"이라 말하면 거짓이다. */
      alreadyFallback: (target: string) =>
        `저장된 투자 조건으로는 이미 목표 월배당 ${target}을 넘어섭니다. 목표를 더 높게 잡아 보세요.`,
      /** E′ — 이미 지난 시점을 예상이라 부르지 않는다. */
      etaPast:
        '저장된 투자 조건으로는 이미 지났을 시점이라 예상 달성 시점을 보여 드리지 않습니다. 시뮬레이터에서 조건을 지금 보유에 맞춰 보세요.',
      etaPastCta: '시뮬레이터에서 조건 맞추기',
      /** D의 이어지는 행동 — 미도달 상태에서 사용자가 알고 싶은 것은 "얼마를 더 넣으면 닿나"다. */
      changeConditions: '매월 얼마를 더 넣으면 닿을지 확인하기'
    },

    /** 기준 안내 — 한 슬롯에 **한 문장만** 렌더한다(우선순위는 GoalCard.utils 가 정한다). */
    basis: {
      /** 실측 + 시뮬 시점이 한 화면에 있을 때. 각 숫자가 어디서 왔는지 한 문장으로. */
      mixed:
        '달성률과 남은 금액은 지금 보유한 종목으로, 예상 달성 시점은 시뮬레이터에 저장된 투자 조건으로 계산했습니다.',
      /** 보유 목록이 비었다 — 유일하게 "지금 여기서" 할 일이 있는 폴백이라 여기만 액션을 단다. */
      noHoldings: '보유 종목을 등록하기 전이라 달성률을 시뮬레이터에 저장된 투자 조건으로 계산했습니다.',
      noHoldingsAction: '종목 추가',
      /** 행은 있는데 수량이 전부 비었다 — 할 일은 바로 아래 표 안에 있다(액션 버튼 없음). */
      noQuantity:
        '수량이 들어간 보유 종목이 없어 달성률을 시뮬레이터에 저장된 투자 조건으로 계산했습니다.',
      /** 환율이 없으면 달러→원 환산이 불가능하다. 위 요약이 달러로 표시 중이므로 원화 기준임을 함께 말한다. */
      fxUnavailable:
        '환율을 불러오지 못해 보유 종목을 원화로 환산할 수 없어, 달성률은 시뮬레이터에 저장된 투자 조건(원화 기준)으로 계산했습니다.'
      /* read-failed 는 문구를 두지 않는다 — 위 저장 실패 배너가 이미 말했고, 목표 쪽에서 사용자가
         할 수 있는 일이 없다. 사실은 GA(operation_error)로만 남는다. */
    },

    /**
     * 목표 미설정.
     *
     * ⚠ 칩·직접 입력은 **이 화면에서 값을 저장하지 않는다** — 고른 값을 라우터 state 에 실어
     * 시뮬레이터로 보내고, 커밋은 하이드레이션 게이트 하위에서 한 번만 일어난다. 그래서 카피도
     * "설정했습니다"가 아니라 "정하면 시뮬레이터에서 이어 본다"는 흐름으로 쓴다.
     */
    setup: {
      title: '목표 월배당을 정해 보세요',
      body: '목표를 정하면 지금 보유한 종목으로 얼마나 왔는지 보여 드리고, 언제쯤 닿을지는 시뮬레이터에서 이어서 계산해 드립니다.',
      /** 누르면 화면이 바뀐다는 사실을 **누르기 전에** 말한다. */
      pickLead: '목표를 고르면 시뮬레이터로 옮겨 저장하고, 도달 시점까지 이어서 계산해 드립니다.',
      chipsLabel: '목표 월배당 빠른 설정',
      /** 단위는 입력 옆 suffix('만원')가 말한다 — 라벨에 중복해 적지 않는다. */
      inputLabel: '직접 입력',
      inputPlaceholder: '예: 150',
      /** 상한은 공용 상수에서 파생해 넘긴다 — 문구와 검증이 갈리지 않게. */
      inputInvalid: (maxManWon: number) => `1만원 이상 ${maxManWon.toLocaleString()}만원 이하로 적어 주세요.`,
      submit: '설정'
    },

    /** `AssumptionsDetails` 안의 두 번째 그룹 — 예상 달성 시점이 어떤 조건에서 나왔는지. */
    conditions: {
      groupTitle: '예상 달성 시점 계산 조건',
      groupNote: '시뮬레이터에 저장된 활성 시나리오의 조건입니다.',
      initialInvestment: '초기 투자금',
      monthlyContribution: '월 적립액',
      duration: '투자 기간',
      durationValue: (years: number) => `${years}년`,
      startDate: '투자 시작',
      reinvest: '배당 재투자',
      reinvestOn: (percent: number) => `재투자 ${percent}%`,
      reinvestOff: '재투자 안 함',
      taxRate: '배당소득세',
      taxRateValue: (percent: number) => `${percent}%`,
      taxRateUnknown: '기본값',
      tickerCount: '종목 수',
      tickerCountValue: (count: number) => `${count}종`
    },

    /** 라이브 리전 — 페이지 문구 **뒤에 한 조각**만 덧붙인다(새 리전을 만들지 않는다). */
    live: {
      progress: (percent: number) => `목표 달성률 ${percent}%.`
    }
  },

  /**
   * 가계부(`/ledger`) 진입 카드. 요약 카드 **아래**·가정 요약 **위**에 선다.
   *
   * 🔴 여기에 숫자·통계를 넣지 마라 — 가계부 값을 미리 보여 주려면 시트를 읽어야 하고, 그러면
   * 이 화면이 구글 인증에 묶인다. 이 카드는 "그런 화면이 있다"만 말한다.
   * ⚠ 환경변수가 없으면(가계부 비활성) 이 카드 자체를 렌더하지 않는다 — "준비 중" 표시도 하지 않는다.
   */
  ledgerEntry: {
    title: '가계부',
    body: '수입과 지출을 내 구글 시트에 기록합니다. 기록은 사용자의 드라이브에 남고, 앱은 선택한 시트 1개만 읽고 씁니다.',
    cta: '가계부 열기'
  },

  /**
   * 배당 캘린더 진입 카드(2026-08-03 리워크) — 종전에는 요약 카드 안 두 번째 버튼이었다.
   *
   * 🔴 **버튼 라벨·핸들러는 그대로다**(`cta.calendar` · `onOpenCalendar`) — 자리와 위계만 바뀌었다.
   * 요약 카드는 좁은 레일에 서면서 1급 행동(시뮬레이션) 하나만 갖고, "다른 화면으로 간다"는
   * 성격의 진입 둘(달력·가계부)은 아래 진입 격자에서 같은 무게로 나란히 선다.
   * 비활성 사유(`cta.calendarDisabled` 등)는 이 카드 안에서 버튼 바로 아래에 남는다 — 무음 비활성 금지.
   */
  calendarEntry: {
    title: '배당 캘린더',
    body: '보유 종목의 지급 예정일을 달력 한 장에서 봅니다. 어느 달에 어떤 종목이 들어오는지 한눈에 확인할 수 있습니다.'
  },

  undo: {
    deleted: (ticker: string) => `${ticker}를 목록에서 삭제했습니다.`,
    action: '실행 취소'
    /* 복원 안내는 라이브 리전 한 곳에서만 말한다(`live.restored`) — 배너에는 복원 문구가 없다. */
  },

  error: {
    readFailed:
      '저장된 보유 목록을 불러오지 못했습니다. 브라우저 저장소 접근이 제한된 환경일 수 있습니다. 지금 입력한 내용은 저장되지 않습니다.',
    writeFailed:
      '보유 목록을 저장하지 못했습니다. 브라우저 저장소 접근이 제한된 환경일 수 있습니다. 화면의 값은 그대로 계산됩니다.',
    fxFailed: '환율을 불러오지 못해 금액을 달러로 표시하고 있습니다. 환율이 복구되면 원화 환산이 자동으로 돌아옵니다.'
  },

  footnote: {
    title: '이 숫자에 대해',
    estimate:
      '모든 숫자는 저장된 시세 스냅샷과 최근 배당률을 그대로 적용한 추정치입니다. 실제 배당은 종목의 정책·실적·환율·세금에 따라 달라집니다.',
    schedule:
      '지급일은 과거 지급 이력에서 계산한 예상일입니다. 이력이 없는 종목은 날짜를 지어내지 않고 "날짜 미정"으로 표시합니다.',
    /*
     * ⚠ 구 `notAdvice`("이 화면은 투자 자문이 아니며…")는 **삭제됐다**(2026-07-31 리뷰 m1).
     * 공용 `PageFooter` 의 사이트 공통 고지가 같은 말을 하고 있어 한 화면에 두 번 나왔다.
     * 되살리지 마라 — 면책 문구를 화면마다 반복하면 어느 것이 정본인지 아무도 모르게 된다.
     */
    /** 목표 카드가 렌더될 때만 그린다 — 두 숫자의 계열이 다르다는 사실을 각주에서 한 번 더 못 박는다. */
    goal:
      '예상 달성 시점은 시뮬레이터에 저장된 투자 조건이 그대로 이어진다고 가정한 추정치입니다. 지금 보유한 종목과 조건이 다르면 실제와 크게 달라집니다.'
  },

  live: {
    loading: '저장된 보유 목록을 불러오는 중입니다.',
    empty: '등록된 보유 종목이 없습니다. 종목을 추가할 수 있습니다.',
    added: (ticker: string) => `${ticker}를 추가했습니다. 수량을 입력하세요.`,
    alreadyHeld: (ticker: string) => `${ticker}는 이미 보유 목록에 있습니다. 수량 입력으로 이동합니다.`,
    /** 하이드레이션 전 거절(훅이 `reason: 'loading'`). 무음이면 사용자는 클릭이 먹은 줄 안다. */
    notReady: NOT_READY,
    removed: (ticker: string) => `${ticker}를 삭제했습니다. 실행 취소할 수 있습니다.`,
    restored: (ticker: string) => `${ticker}를 다시 추가했습니다.`,
    noResult: '검색 결과가 없습니다.',
    summary: (monthly: string, count: number) => `보유 ${count}종. 월 배당 ${monthly}.`,
    fxFailed: '환율을 불러오지 못해 달러로 표시합니다.'
  }
} as const;
