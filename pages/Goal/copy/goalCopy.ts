/**
 * `/dividend/goal` 화면의 모든 문자열.
 *
 * 뷰·컴포넌트에 리터럴을 두지 않는다(카피 수정이 한 파일로 끝나야 한다). 페이지 폴더가 아니라
 * **형제 폴더**에 두는 이유: 목표 부품(`components/*`)도 같은 카피를 읽는데, 페이지 폴더 배럴에서
 * 가져오면 `페이지 → 컴포넌트 → 페이지` 런타임 순환이 된다(배당 캘린더 선례).
 *
 * 어법 규칙: ①추정을 확정형으로 쓰지 않는다(“도달합니다”가 아니라 “닿습니다 / 예상”),
 * ②값이 없으면 빈칸 대신 사유를 말한다(“기간 내 미도달”), ③눈덩이·스노우볼 비유 금지.
 */

/** 표시 자리를 지키는 값 없음 기호. 로딩·계산 불가에서 공통으로 쓴다. */
const DASH = '—';

export const GOAL_COPY = {
  meta: {
    title: '목표 달성 — 월 배당 목표까지 얼마나 왔는지 확인',
    description:
      '저장해 둔 포트폴리오와 투자 조건으로 목표 월배당까지 얼마나 왔는지, 언제쯤 닿을지 한 화면에서 확인하세요. 계산은 브라우저 안에서만 이루어집니다.',
    pathname: '/dividend/goal'
  },
  hero: {
    title: '목표 달성',
    /* v2 허브 서사: 이 화면은 "지금 어디까지 왔는가"를 말하고, "언제 닿는가"는 시뮬레이터로 잇는다. */
    lede: '지금 내 배당이 목표까지 얼마나 왔는지 확인하고, 언제쯤 닿을지는 시뮬레이터에서 이어서 계산해 보세요.',
    /** 시나리오명 · 종목 요약 · 기준일. 앞의 두 조각은 없으면 빠진다. */
    asOf: (parts: string[]) => parts.join(' · '),
    asOfEvaluated: (year: number, month: number) => `${year}년 ${month}월 기준`,
    /** 종목 요약 — 1종이면 티커만, 여러 종이면 “SCHD 외 2종”. */
    tickerSummary: (first: string, count: number) => (count > 1 ? `${first} 외 ${count - 1}종` : first)
  },
  card: {
    /** GoalCard 섹션 제목(aria-labelledby 대상). */
    title: '목표 월배당',
    /** 카드 헤더 우측 액션 — 목표를 이미 정한 상태에서만 뜬다. */
    editTarget: '목표 수정'
  },
  tiles: {
    target: '목표 월배당',
    current: '현재 예상 월배당',
    /** 롤링 12개월 창이 꽉 찼을 때. */
    currentHint: '최근 12개월 세후 평균',
    /** 투자 시작 전이거나 12개월이 아직 안 지났을 때(폴백 정의를 그대로 노출한다). */
    currentHintBeforeStart: '투자 첫 해 세후 평균',
    /** 목표 − 현재 예상 월배당. 도달·이미 달성 상태에서는 렌더하지 않는다(음수·0원 표기 금지). */
    remaining: '남은 금액',
    remainingHint: '목표까지 더 필요한 월배당',
    eta: '예상 달성',
    etaNotReached: '기간 내 미도달',
    etaAlready: '이미 달성',
    /** 도달 월 값 표기. */
    etaMonth: (year: number, month: number) => `${year}년 ${month}월`,
    /** 도달이 투자 몇 년차인지. */
    etaHintYearIndex: (yearIndex: number) => `투자 ${yearIndex}년차`,
    /** 미도달일 때 “무엇을 기준으로 미도달인지”를 밝힌다. */
    etaHintDuration: (years: number) => `투자 ${years}년 기준`,
    empty: DASH
  },
  meter: {
    label: '달성률',
    /** progressbar 접근명 — 카드 문맥 없이도 무엇의 비율인지 읽히게. */
    ariaLabel: '목표 월배당 달성률',
    value: (percent: number) => `${percent}%`,
    /** 색·바 없이도 같은 사실이 읽히도록 붙는 병기 문장. */
    sentence: (target: string, current: string) => `목표 월배당 ${target} 중 ${current}까지 왔습니다.`,
    sentenceReached: (target: string) => `목표 월배당 ${target}에 도달했습니다.`
  },
  status: {
    /** E 도달 — 추정형 어법(“닿습니다”). 확정 표현을 쓰지 않는다. */
    reached: (month: string, target: string) => `${month}에 목표 월배당 ${target}에 닿습니다.`,
    /** D 미도달 — 무엇을 기준으로 미도달인지(기간)와 목표값을 함께 말한다. */
    notReached: (years: number, target: string) =>
      `투자 ${years}년 안에는 목표 월배당 ${target}에 닿지 않습니다.`,
    /** F 이미 달성. */
    already: (target: string) => `지금 조건이라면 이미 목표 월배당 ${target}을 넘어섭니다. 목표를 더 높게 잡아 보세요.`,
    /**
     * D의 이어지는 행동 — v2 허브 프레이밍(질문형·추정형).
     * 구 "시뮬레이터에서 조건 바꾸기"(설명형)를 대체한다: 미도달 상태에서 사용자가 실제로 알고 싶은 것은
     * "어디를 눌러야 하나"가 아니라 "얼마를 더 넣으면 닿나"다.
     */
    changeConditions: '매월 얼마를 더 넣으면 닿을까요?'
  },
  /**
   * C 목표 미설정.
   *
   * ⚠ 칩·직접 입력은 **이 화면에서 값을 저장하지 않는다** — 고른 값을 라우터 state에 실어 시뮬레이터로
   * 보내고, 커밋은 시뮬레이터 안(자동저장·클라우드 동기화가 살아 있는 곳)에서만 일어난다.
   * 그래서 카피도 "설정했습니다"가 아니라 "정하고 시뮬레이터에서 이어 본다"는 흐름으로 쓴다.
   */
  setup: {
    title: '목표 월배당을 정해 보세요',
    body: '목표를 정하면 지금 조건으로 언제쯤 닿는지, 지금은 얼마나 왔는지 이어서 보여 드립니다.',
    /** 칩 줄 위 안내 — 고르면 무슨 일이 일어나는지 먼저 말한다. */
    pickLead: '목표를 고르면 시뮬레이터에서 바로 계산해 드립니다.',
    chipsLabel: '목표 월배당 빠른 설정',
    /** 단위는 입력 옆 suffix('만원')가 말한다 — 라벨에 중복해 적지 않는다. */
    inputLabel: '직접 입력',
    inputPlaceholder: '예: 150',
    /** 상한은 공용 상수(`TARGET_MONTHLY_DIVIDEND_MAX`)에서 파생해 넘긴다 — 문구와 검증이 갈리지 않게. */
    inputInvalid: (maxManWon: number) => `1만원 이상 ${maxManWon.toLocaleString()}만원 이하로 적어 주세요.`,
    submit: '설정',
    /** 값 없이 시뮬레이터로 — 목표 입력에 포커스만 옮긴다. */
    cta: '언제 목표를 달성할까요?'
  },
  /** B 포트폴리오 없음. 카드 자리를 통째로 대체한다(카드 안 카드 금지). */
  empty: {
    title: '아직 저장된 포트폴리오가 없습니다',
    body: '시뮬레이터에서 종목과 투자 조건을 입력하면, 이 화면이 목표까지 얼마나 왔는지 이어서 보여 드립니다.',
    cta: '시뮬레이터에서 시작하기',
    /** 예고 블록 — 로딩(값이 곧 온다)과 구분되도록 라벨만 흐리게 보여 준다. */
    previewLabel: '여기에 표시될 내용',
    previewItems: ['목표 월배당', '현재 예상 월배당', '달성률', '예상 달성']
  },
  /** G 저장 데이터를 쓸 수 없음. 두 사유는 사실이 다르므로 문장을 나눈다. */
  error: {
    title: '목표 달성을 계산할 수 없습니다',
    /** 저장 payload는 읽었지만 계산이 불가능(폼 검증 실패). */
    invalidData:
      '저장된 투자 조건에 계산할 수 없는 값이 있습니다. 시뮬레이터에서 조건을 다시 확인해 주세요.',
    /** 저장소 자체를 못 읽음(프라이빗 모드·저장소 차단). 저장된 데이터는 그대로다. */
    readFailed:
      '저장된 데이터를 불러오지 못했습니다. 브라우저 저장소 접근이 제한된 환경일 수 있습니다.',
    cta: '시뮬레이터에서 시작하기'
  },
  conditions: {
    summary: '이 계산에 쓰인 투자 조건',
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
    tickerCountValue: (count: number) => `${count}종`,
    currencyNote: '금액은 시뮬레이터의 표시 통화 설정을 따릅니다.'
  },
  footnote: {
    title: '이 숫자에 대해',
    estimate:
      '모든 숫자는 입력한 조건이 그대로 이어진다고 가정한 추정치입니다. 실제 배당은 종목의 정책·실적·환율·세금에 따라 달라집니다.',
    notAdvice: '이 화면은 투자 자문이 아니며, 특정 종목의 매수·매도를 권유하지 않습니다.'
  },
  /** LiveRegion — 항상 마운트하되 말은 하이드레이션이 끝났을 때 한 번만 한다. */
  live: {
    loading: '저장된 시나리오를 불러오는 중입니다.',
    empty: '저장된 포트폴리오가 없습니다. 시뮬레이터에서 시작할 수 있습니다.',
    error: '저장된 데이터로 목표 달성을 계산할 수 없습니다.',
    noTarget: '목표 월배당이 아직 설정되지 않았습니다.',
    reached: (percent: number, month: string) => `달성률 ${percent}%. ${month}에 목표에 닿습니다.`,
    notReached: (percent: number) => `달성률 ${percent}%. 투자 기간 안에는 목표에 닿지 않습니다.`,
    already: '현재 예상 월배당이 이미 목표를 넘었습니다.'
  }
} as const;
