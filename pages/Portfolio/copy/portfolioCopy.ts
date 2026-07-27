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

export const PORTFOLIO_COPY = {
  meta: {
    title: '내 포트폴리오 — 보유 종목으로 배당을 계산',
    description:
      '보유 종목과 수량만 넣으면 평가 금액·연 배당·월 배당·이번 달 예상 배당을 계산해 보여 줍니다. 계산은 브라우저 안에서만 이루어집니다.',
    pathname: '/dividend/portfolio'
  },

  hero: {
    title: '내 포트폴리오',
    lede: '종목과 보유 수량만 넣으면 지금 받는 배당이 얼마인지, 다음 배당은 언제인지 한 화면에서 확인할 수 있습니다.',
    asOfPrice: (date: string) => `시세 기준일 ${date}`,
    asOfFx: (rate: string, date: string) => `환율 $1 ≈ ${rate}원 · ${date} 기준`,
    asOfFxStale: '환율 업데이트 실패',
    asOfFxLoading: '환율을 불러오는 중입니다',
    asOfFxMissing: '환율 정보 없음',
    /** 세 조각을 ' · '로 잇는다. 없는 조각은 빠진다. */
    asOf: (parts: string[]) => parts.join(' · ')
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
      nextPayoutMonthOnly: (month: number) => `${month}월 지급 예정`,
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
    simulateDisabledEmpty: '보유 수량을 하나 이상 입력하면 시뮬레이션할 수 있습니다.',
    /**
     * 스펙 §11 추가 — 보유는 있는데 **시뮬레이터가 아는 종목이 하나도 없을 때**(직접 추가한 종목만 보유).
     * 무음 비활성 금지 규칙상 이 경우에도 사유를 말해야 한다.
     */
    simulateDisabledUnsupported: '직접 추가한 종목은 시뮬레이터에서 계산할 수 없어 시뮬레이션을 시작할 수 없습니다.',
    /** 스펙 §11 추가 — 일부만 유니버스 밖일 때. 비중이 조용히 왜곡되지 않게 화면이 먼저 말한다. */
    simulateExcluded: (count: number) => `직접 추가한 종목 ${count}종은 시뮬레이션 비중에서 빠집니다.`,
    goal: '목표까지 얼마나 왔는지 보기',
    calendar: '지급일 달력에서 보기',
    calendarManualExcluded: '직접 추가한 종목은 달력에 표시할 수 없어 제외됩니다.',
    /** 스펙 §11 추가 — 달력에 실을 수 있는 종목이 하나도 없을 때. */
    calendarDisabled: '달력에 표시할 수 있는 종목이 없습니다.'
  },

  holdings: {
    title: '보유 종목',
    /** 로컬 전용 고지 — 화면에서 한 번만 말한다(각주에서 반복 금지). */
    localOnly: '보유 목록은 이 기기의 브라우저에만 저장됩니다.',
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
    summary: '찾는 종목이 없나요? 직접 추가하기',
    body: '목록에 없는 종목은 주가와 배당률을 직접 넣어 추가할 수 있습니다. 지급 일정 데이터가 없어 이번 달 예상 배당과 지급일 계산에는 들어가지 않습니다.',
    fieldTicker: '티커',
    fieldTickerPlaceholder: '예: TIGER200',
    fieldName: '종목 이름 (선택)',
    fieldNamePlaceholder: '예: 타이거 200',
    fieldPrice: '현재 주가',
    fieldPriceHint: '달러 기준으로 입력하세요',
    fieldYield: '배당률',
    submit: '추가',
    invalidTicker: '티커를 입력하세요. 영문·숫자만 사용할 수 있습니다.',
    invalidPrice: '현재 주가는 0보다 커야 합니다.',
    invalidYield: '배당률은 0 이상 100 이하로 입력하세요.',
    duplicateInUniverse: (ticker: string) => `${ticker}는 위 검색에서 찾을 수 있습니다. 검색으로 추가해 주세요.`,
    duplicateInHoldings: (ticker: string) => `${ticker}는 이미 보유 목록에 있습니다.`,
    /** 스펙 §11 추가 — 입력 단위 기호(장식). 뷰에 리터럴을 두지 않기 위한 자리. */
    priceUnit: '$',
    yieldUnit: '%'
  },

  empty: {
    title: '아직 등록한 보유 종목이 없습니다',
    body: '종목과 보유 수량만 넣으면 평가 금액과 배당은 자동으로 계산해 드립니다.',
    cta: '종목 추가',
    quickPickLabel: '이런 종목으로 시작해 보세요',
    /** 유니버스에 실재하는 심볼만(스냅샷 보유 종목). */
    quickPicks: ['SCHD', 'JEPI', 'O', 'VIG']
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

  undo: {
    deleted: (ticker: string) => `${ticker}를 목록에서 삭제했습니다.`,
    action: '실행 취소',
    restored: (ticker: string) => `${ticker}를 다시 추가했습니다.`
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
    notAdvice: '이 화면은 투자 자문이 아니며, 특정 종목의 매수·매도를 권유하지 않습니다.'
  },

  live: {
    loading: '저장된 보유 목록을 불러오는 중입니다.',
    empty: '등록된 보유 종목이 없습니다. 종목을 추가할 수 있습니다.',
    added: (ticker: string) => `${ticker}를 추가했습니다. 수량을 입력하세요.`,
    alreadyHeld: (ticker: string) => `${ticker}는 이미 보유 목록에 있습니다. 수량 입력으로 이동합니다.`,
    removed: (ticker: string) => `${ticker}를 삭제했습니다. 실행 취소할 수 있습니다.`,
    restored: (ticker: string) => `${ticker}를 다시 추가했습니다.`,
    noResult: '검색 결과가 없습니다.',
    summary: (monthly: string, count: number) => `보유 ${count}종. 월 배당 ${monthly}.`,
    fxFailed: '환율을 불러오지 못해 달러로 표시합니다.'
  }
} as const;
