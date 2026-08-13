import { MAX_COMPARE_TICKERS, MIN_COMPARE_TICKERS } from '../utils';

/**
 * `/ticker/compare` 의 모든 문구. 🔴 컴포넌트에 문자열 리터럴을 박지 않는다(`.cursor/rules`).
 *
 * 🔴 **카피 규율** — 이 화면은 숫자를 나란히 놓는 화면이라 문구 하나가 투자 조언처럼 읽히기 쉽다.
 *  - "좋다·유리하다·추천"을 쓰지 않는다. 표는 **사실만** 말한다("가장 높음"은 사실, "가장 좋음"은 판단).
 *  - 가정치를 관측치처럼 부르지 않는다. `basis` 라벨이 그 구분을 지고, 여기 문구가 그것을 풀어 쓴다.
 *  - "눈덩이/스노우볼" 비유 금지(확정 결정). 격식체.
 */
export const TICKER_COMPARE_COPY = {
  meta: {
    title: '배당 ETF·종목 비교 — 배당률·지급월·성장률 한눈에',
    description: `배당 ETF와 배당주를 최대 ${MAX_COMPARE_TICKERS}종까지 나란히 비교합니다. 배당률과 지급 주기는 물론, 지급월이 서로 어떻게 겹치고 비는지까지 확인할 수 있습니다.`
  },

  hero: {
    title: '종목 비교',
    lede: '관심 있는 배당 ETF와 종목을 나란히 놓고, 배당률·지급 주기·지급월을 한 화면에서 확인합니다.'
  },

  picker: {
    title: '비교할 종목',
    /** 선택 개수 안내. 상한에 닿았을 때와 아닐 때를 나눠 말한다. */
    hint: `최대 ${MAX_COMPARE_TICKERS}종까지 고를 수 있습니다.`,
    atLimit: `${MAX_COMPARE_TICKERS}종을 모두 골랐습니다. 다른 종목을 보시려면 하나를 지워 주세요.`,
    addLabel: '종목 추가',
    addPlaceholder: '종목을 고르세요',
    removeAria: (ticker: string) => `${ticker} 비교에서 빼기`,
    /** 지급월 데이터가 없는 종목을 목록에서 구분한다 — 고를 수는 있다. */
    noScheduleSuffix: ' (지급월 자료 없음)'
  },

  empty: {
    title: '비교할 종목을 골라 주세요',
    body: `${MIN_COMPARE_TICKERS}종 이상을 고르면 배당률과 지급월을 나란히 비교할 수 있습니다.`,
    /** 처음 온 사용자가 바로 눌러 볼 수 있는 조합. 값을 보여주는 것이 설명보다 빠르다. */
    suggestionTitle: '이렇게 비교해 보세요'
  },

  table: {
    caption: '선택한 종목의 지표 비교',
    metricHeader: '항목',
    /** 값이 가장 크다/작다는 **사실 진술**이다. "좋다"로 바꾸지 마라. */
    highest: '가장 높음',
    lowest: '가장 낮음'
  },

  /** 숫자의 출처 배지. 이 세 줄이 이 화면의 정직성을 진다. */
  basis: {
    observed: { label: '실측', description: '시장 데이터에서 확인한 값입니다.' },
    assumed: { label: '계산 가정', description: '시뮬레이터가 쓰는 가정값입니다. 관측이나 예측이 아닙니다.' },
    reference: { label: '참고', description: '실제 이력에서 계산했지만 시뮬레이터 계산에는 쓰지 않는 값입니다.' }
  },

  /**
   * "이 종목으로 계산" — 비교에서 시뮬레이터로 넘기는 액션.
   * 🔴 **추천이 아니라 도구로 넘기는 안내다.** "유리·추천·좋다"를 쓰지 않는다 — 어느 종목이 나은지
   *    말하지 않고, 고른 종목을 계산기에 담아 준다는 사실만 말한다.
   */
  actions: {
    title: '이 종목으로 계산해 보기',
    lede: '고른 종목 하나를 시뮬레이터에 담아 장기 배당과 재투자를 계산합니다.',
    /** 각 종목 버튼 라벨(짧게 — 종목명은 버튼 왼쪽에 이미 있다). */
    simulate: '이 종목으로 계산',
    /** 스크린리더용 — 버튼만 훑을 때 어느 종목인지 말한다. */
    simulateAria: (ticker: string) => `${ticker}을(를) 시뮬레이터로 보내 계산하기`
  },

  coverage: {
    title: '지급월이 어떻게 겹치나',
    subtitle: '고른 종목이 각 달에 배당을 지급하는지 보여 줍니다.',
    everyMonth: '고른 조합은 12개월 모두 지급월이 있습니다.',
    /** 빈 달이 있으면 그 달을 정확히 말한다 — "일부 달"로 뭉뚱그리지 않는다. */
    gaps: (months: string) => `${months}에는 지급월이 있는 종목이 없습니다.`,
    unknown: (tickers: string) => `${tickers}은(는) 지급월 자료가 없어 이 비교에서 빠졌습니다.`,
    noneLabel: '지급 없음',
    monthAria: (month: string, tickers: string) => `${month} 지급: ${tickers}`
  },

  footnote: {
    /** 공용 `PageFooter` 의 각주 슬롯 제목. 숫자를 다루는 화면은 포트폴리오와 같은 문장을 쓴다. */
    title: '이 숫자에 대해',
    asOf: (date: string) => `실측값 기준일: ${date}`,
    /*
     * ⚠ 구 문장 끝의 "투자 자문이 아니며 참고용입니다."는 **뺐다** — 공용 `PageFooter` 의
     * 사이트 공통 고지가 같은 말을 하고 있어 한 화면에 두 번 나온다(포트폴리오와 같은 처방).
     */
    disclaimer:
      '표의 숫자는 저장된 시세 스냅샷과 과거 지급 이력에서 계산한 값입니다. 실제 배당은 종목의 정책·실적·환율·세금에 따라 달라집니다.'
  }
} as const;
