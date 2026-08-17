/**
 * SEO 랜딩 허브(`/ticker/all`)에서 티커를 묶는 카테고리 라벨.
 * 티커 콘텐츠는 여러 카테고리에 동시에 속할 수 있다(예: 배당성장이면서 코어 지수 성격도 있는 경우).
 * 새 카테고리가 필요하면 이 맵에 한 줄 추가한다 — `TickerCategoryId`는 여기서 파생되므로
 * 다른 파일을 손댈 필요가 없다.
 *
 * ⚠ 라벨을 추가하면 `TICKER_CATEGORY_META` 에도 같은 키가 있어야 한다(타입이 강제한다).
 */
export const TICKER_CATEGORY_LABEL = {
  'dividend-growth': '배당성장 ETF',
  'high-dividend': '고배당 ETF',
  'covered-call': '커버드콜·옵션인컴 ETF',
  reit: '리츠(REITs)',
  international: '해외 배당 ETF',
  'core-index': '코어 지수 ETF',
  /**
   * 레버리지 ETF(2026-08-17). 코어 지수와 같은 칸에 두지 않는 이유는 상품 성격이 다르기 때문이다 —
   * 일간 목표 상품이라 보유 기간이 길어질수록 기초지수 배수와 멀어지고, 이 앱의 결정론적 계산
   * 모델이 그 위험을 표현하지 못한다. 묶음을 갈라야 `caution` 한 줄로 그 사실을 먼저 말할 수 있다.
   */
  leveraged: '레버리지 ETF',
  'dividend-stock': '개별 배당주',
  /**
   * 성장주(2026-08-17). '개별 배당주' 와 가르는 기준은 **배당 이력의 길이**다 — AAPL(15년)·
   * MSFT(24년)처럼 오래 늘려 온 종목은 배당주로 두고, 배당이 없거나(AMZN·TSLA) 도입한 지
   * 2년 남짓인(GOOGL·META·NVDA) 종목을 여기 모은다. 배당 목적으로 검색해 들어온 사람이
   * 두 묶음을 같은 것으로 읽지 않게 하는 것이 이 칸의 목적이다.
   */
  'growth-stock': '성장주(무배당·저배당)'
} as const;

export type TickerCategoryId = keyof typeof TICKER_CATEGORY_LABEL;

/** 카테고리 허브 경로. `/ticker/all`(전체)과 `/ticker/:slug`(개별) 사이의 중간 계층이다. */
export const TICKER_CATEGORY_PATH_PREFIX = '/ticker/category';

export const tickerCategoryPath = (categoryId: TickerCategoryId): string =>
  `${TICKER_CATEGORY_PATH_PREFIX}/${categoryId}`;

/** 문자열이 실재하는 카테고리 id 인지 — URL 파라미터 검증용(모르는 값은 허브로 보낸다). */
export const isTickerCategoryId = (value: string): value is TickerCategoryId =>
  Object.prototype.hasOwnProperty.call(TICKER_CATEGORY_LABEL, value);

export const TICKER_CATEGORY_IDS = Object.keys(TICKER_CATEGORY_LABEL) as TickerCategoryId[];

type TickerCategoryMeta = {
  /** 검색결과 제목의 앞자리. 사이트명 접미는 표면이 붙인다. */
  metaTitle: string;
  /** meta description·og:description 이자 화면 리드 문장. */
  description: string;
  /**
   * 이 묶음을 고를 때 **먼저 알아야 할 트레이드오프** 한 줄.
   * 🔴 장점만 적지 않는다 — 이 사이트의 자산은 "트레이드오프를 먼저 말하는 톤"이고, 카테고리
   * 페이지는 초심자가 가장 먼저 닿는 자리라 여기서 톤이 무너지면 아래 개별 티커 글도 같이 값을 잃는다.
   */
  caution: string;
};

/**
 * 카테고리 허브(`/ticker/category/:id`)의 문구 정본.
 *
 * ## 왜 이 페이지가 필요한가
 * 티커 페이지 109개가 허브 하나(`/ticker/all`)에만 매달려 있어 **토픽 클러스터가 형성되지 않는다** —
 * 개별 티커 페이지로 가는 내부 링크가 한 단계뿐이라 권위가 분산되고, "커버드콜 ETF 비교" 같은
 * **묶음 단위 검색어**를 받을 페이지가 아예 없다.
 *
 * ⚠ 숫자를 적지 않는다. 배당률·보수는 종목마다 다르고 갱신되는 값이라, 여기 적으면 그 순간부터
 *   낡기 시작한다 — 숫자는 개별 티커 페이지와 비교 화면이 소유한다.
 */
export const TICKER_CATEGORY_META: Record<TickerCategoryId, TickerCategoryMeta> = {
  'dividend-growth': {
    metaTitle: '배당성장 ETF 모음 — 배당이 늘어나는 속도로 고르는 종목',
    description:
      '지금의 배당률보다 배당이 해마다 늘어나는 속도를 우선하는 ETF를 모았습니다. 각 종목의 선별 기준과 배당성장률, 구성 방식을 정리했습니다.',
    caution:
      '배당성장 ETF는 당장의 배당률이 고배당 상품보다 낮습니다. 지금 받을 현금이 필요한 경우와 시간을 들여 늘릴 경우는 선택이 갈립니다.'
  },
  'high-dividend': {
    metaTitle: '고배당 ETF 모음 — 지금 받는 배당이 큰 종목',
    description:
      '현재 배당률이 높은 ETF를 모았습니다. 어떤 방식으로 높은 분배금을 만드는지, 그 재원이 무엇인지 종목별로 정리했습니다.',
    caution:
      '높은 배당률은 주가가 내려서 생기기도 합니다. 배당률만 보고 고르면 배당은 받되 원금이 줄어드는 조합을 고를 수 있습니다.'
  },
  'covered-call': {
    metaTitle: '커버드콜·옵션인컴 ETF 모음 — 분배금이 큰 대신 무엇을 내주나',
    description:
      '콜옵션 매도로 분배금을 만드는 ETF를 모았습니다. 프리미엄을 어떻게 수취하는지와 그 대가로 무엇을 포기하는지를 종목별로 정리했습니다.',
    caution:
      '커버드콜은 프리미엄을 받는 대신 **주가 상승분을 일부 내줍니다**. 분배율이 높다고 총수익이 높은 것은 아닙니다.'
  },
  reit: {
    metaTitle: '리츠(REITs) 모음 — 부동산 임대수익을 배당으로 받는 종목',
    description:
      '부동산에서 나오는 임대수익을 배당으로 돌려주는 리츠를 모았습니다. 보유 자산의 성격과 배당 재원을 종목별로 정리했습니다.',
    caution:
      '리츠는 금리에 민감합니다. 금리가 오르면 조달 비용이 늘고 배당 여력이 줄어들 수 있습니다.'
  },
  international: {
    metaTitle: '해외 배당 ETF 모음 — 미국 밖으로 넓히는 배당 포트폴리오',
    description:
      '미국 외 지역의 배당주에 투자하는 ETF를 모았습니다. 어느 지역을 담는지와 통화·과세가 어떻게 달라지는지 정리했습니다.',
    caution:
      '지역을 넓히면 분산은 늘지만 환율과 현지 원천징수라는 변수가 함께 늘어납니다.'
  },
  'core-index': {
    metaTitle: '코어 지수 ETF 모음 — 배당 포트폴리오의 기준선',
    description:
      '시장 전체를 따라가는 지수 ETF를 모았습니다. 배당이 주목적은 아니지만 배당 포트폴리오의 비교 기준으로 자주 쓰입니다.',
    caution:
      '코어 지수 ETF는 배당률이 낮습니다. 월 배당 현금흐름이 목적이라면 이 묶음만으로는 목표에 닿지 않습니다.'
  },
  leveraged: {
    metaTitle: '레버리지 ETF 모음 — 배수는 하루치에만 걸린다',
    description:
      '지수의 하루치 수익률을 2배·3배로 추종하는 ETF를 모았습니다. 일간 재조정이 무엇을 만드는지, 배수를 올릴수록 장기 기대값이 어떻게 달라지는지 종목별로 정리했습니다.',
    caution:
      '레버리지 ETF의 배수는 **하루치 수익률에만** 걸립니다. 매일 재조정하기 때문에 횡보 구간에서는 지수가 제자리여도 원금이 줄고, 배수가 클수록 그 손실이 제곱으로 커집니다.'
  },
  'growth-stock': {
    metaTitle: '성장주 모음 — 배당보다 주가로 답하는 종목',
    description:
      '배당이 없거나 배당을 시작한 지 얼마 되지 않은 대형 성장주를 모았습니다. 배당 이력이 어디까지 쌓였는지와, 배당이 없는 종목이 이 시뮬레이터에서 어떻게 계산되는지 정리했습니다.',
    caution:
      '이 묶음의 종목들은 배당 현금흐름을 만들지 못합니다. 배당이 0이면 시뮬레이터의 결과가 전액 주가 성장 가정에 의존하며, 보유하는 동안 들어오는 돈은 없습니다.'
  },
  'dividend-stock': {
    metaTitle: '개별 배당주 모음 — 종목 하나를 직접 고를 때',
    description:
      'ETF가 아니라 개별 기업의 배당주를 모았습니다. 배당을 얼마나 오래 이어 왔는지와 그 재원을 종목별로 정리했습니다.',
    caution:
      '개별 종목은 분산이 없습니다. 배당은 약속이 아니라 회사의 결정이라 한 종목의 배당 중단이 그대로 포트폴리오에 옵니다.'
  }
};
