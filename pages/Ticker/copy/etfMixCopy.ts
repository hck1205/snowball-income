import { MAX_OVERLAP_ETFS } from '../utils';
import type { OverlapLevel } from '../utils';

/**
 * `/ticker/overlap`(ETF 조합 짜기)의 모든 문구. 🔴 컴포넌트에 문자열 리터럴을 박지 않는다(`.cursor/rules`).
 *
 * 🔴 **카피 규율** — 비교 화면과 같다.
 *  - "좋다·나쁘다·추천"을 쓰지 않는다. 겹침은 **사실**이다("몰려 있다"는 사실, "위험하다"는 판단).
 *  - 계산의 가정(정한 비중대로 산다고 본다 — 기본은 같은 금액씩)을 숨기지 않는다 — 결론 바로 아래와 각주에 둘 다 적는다.
 *  - "눈덩이/스노우볼" 비유 금지(확정 결정). 격식체.
 */
export const ETF_MIX_COPY = {
  meta: {
    title: 'ETF 조합 짜기 — 담은 ETF가 얼마나 같은 종목에 몰리나',
    description: `ETF를 최대 ${MAX_OVERLAP_ETFS}개까지 담고 비중을 정해, 같은 종목에 중복으로 투자되는 비중을 확인합니다. 담거나 비중을 바꿀 때마다 중복률·겹치는 종목이 다시 계산되고, 그 조합 그대로 배당 시뮬레이션으로 이어갈 수 있습니다.`
  },

  hero: {
    title: 'ETF 조합 짜기',
    lede: 'ETF를 담고 비중을 정해 보세요. 바꿀 때마다 같은 종목에 중복으로 투자되는 비중이 다시 계산되고, 마음에 드는 조합은 배당 시뮬레이션으로 이어갈 수 있습니다.'
  },

  picker: {
    title: 'ETF 고르기',
    searchLabel: 'ETF 검색',
    searchPlaceholder: '티커나 이름으로 검색 (예: SCHD, dividend)',
    browseTitle: (count: string) => `전체 ETF ${count}개`,
    browseAvailableTitle: (count: string) => `담을 수 있는 ETF ${count}개`,
    onlyAvailable: '담을 수 있는 ETF만',
    browseEmpty: '아직 보유 종목을 모은 ETF가 없습니다. ‘담을 수 있는 ETF만’을 끄면 전체 목록을 볼 수 있습니다.',
    listLabel: 'ETF 목록',
    resultsTitle: (count: number) => `검색 결과 ${count}개`,
    noResults: (query: string) => `‘${query}’에 맞는 ETF가 없습니다. 티커 철자를 확인해 주세요.`,
    enterHint: 'Enter를 누르면 맨 위 결과를 담습니다.',
    add: '담기',
    addAria: (ticker: string) => `${ticker} 바구니에 담기`,
    remove: '빼기',
    removeAria: (ticker: string) => `${ticker} 바구니에서 빼기`,
    /** 보유 종목 파일이 없는 ETF — 검색에는 나오지만 담을 수 없다. 이유를 함께 말한다. */
    unavailable: '보유 종목 준비 중',
    unavailableTitle: '아직 보유 종목을 모으지 않았거나, 금·원자재처럼 주식을 담지 않는 상품입니다.',
    atLimit: `${MAX_OVERLAP_ETFS}개를 모두 담았습니다. 다른 ETF를 담으시려면 하나를 빼 주세요.`,
    previewAria: (ticker: string, delta: string) => `${ticker}를 담으면 중복률 ${delta}%p`,
    previewLabel: (delta: string) => `겹침 ${delta}%p`,
    previewFlat: '변화 없음',
    loadingList: 'ETF 목록을 불러오는 중입니다.',
    listError: 'ETF 목록을 불러오지 못했습니다. 잠시 뒤 새로고침해 주세요.'
  },

  basket: {
    title: '내 바구니',
    count: (count: number) => `${count} / ${MAX_OVERLAP_ETFS}`,
    countLabel: '담은 ETF 수',
    slotsLabel: '담은 ETF',
    emptySlot: '빈 자리',
    loading: '불러오는 중',
    loadError: '불러오지 못함',
    weightTitle: '비중',
    weightHint: '막대를 움직여 비중을 정하세요. 몫은 합이 100%가 되도록 자동으로 맞춥니다.',
    weightAria: (ticker: string) => `${ticker} 비중`,
    weightValue: (share: string) => `${share}%`,
    equalize: '균등하게'
  },

  verdict: {
    eyebrow: '중복률',
    unit: '%',
    valueLabel: (value: string) => `중복률 ${value}퍼센트`,
    /** 방금 한 동작과 그 결과. 부호는 글자로 붙는다(`formatDelta`). */
    changeAdded: (ticker: string, delta: string) => `${ticker} 담음 · ${delta}%p`,
    changeRemoved: (ticker: string, delta: string) => `${ticker} 뺌 · ${delta}%p`,
    sentence: {
      none: 'ETF를 담으면 여기서 겹침을 알려 드립니다.',
      single: 'ETF를 하나 담았습니다. 하나 더 담으면 겹침을 비교할 수 있습니다.',
      low: '겹침이 적습니다. 서로 다른 종목에 고르게 나뉘어 있습니다.',
      medium: '겹치는 부분이 꽤 있습니다. 서로 목적이 다른 ETF인지 확인해 보세요.',
      high: '투자금의 절반 이상이 두 개 이상의 ETF가 함께 가진 종목에 들어갑니다.'
    } satisfies Record<OverlapLevel, string>,
    /** 짝끼리도 많이 겹친다 — 정말로 비슷한 ETF 다. */
    similar: (a: string, b: string, overlap: string) =>
      `${a}와 ${b}는 ${overlap}%가 같은 종목입니다. 비슷한 ETF를 함께 담은 셈입니다.`,
    /** 짝 겹침은 작은데 한쪽이 다른 쪽에 거의 들어 있다 — 포함 관계. */
    contained: (inner: string, outer: string, containment: string, overlap: string) =>
      `${inner}가 담은 종목의 ${containment}%를 ${outer}도 담고 있습니다. 두 ETF가 함께 싣는 비중은 ${overlap}%로 작지만, ${inner} 쪽에서 보면 대부분이 중복입니다.`,
    assumption:
      '중복률은 정한 비중대로 샀을 때 투자금 중 두 개 이상의 ETF가 함께 가진 종목에 들어가는 몫입니다. 아래 ‘두 ETF끼리 겹치는 비중’은 두 ETF가 같은 종목에 함께 싣는 크기라, 한 ETF의 종목이 다른 ETF에 작은 비중으로 들어 있으면 짝의 겹침은 작아도 중복률은 높게 나올 수 있습니다.',
    stats: {
      unique: '전체 종목',
      shared: '겹치는 종목',
      top: '가장 많이 겹친 종목',
      topValue: (name: string, count: number) => `${name} (${count}곳)`,
      topPair: '가장 많이 겹친 두 ETF',
      topPairValue: (a: string, b: string, overlap: string) => `${a}·${b} ${overlap}%`,
      none: '없음'
    }
  },

  matrix: {
    title: '두 ETF끼리 겹치는 비중',
    hint: '칸의 숫자는 두 ETF가 같은 종목에 함께 싣는 비중입니다. 종목마다 두 비중 중 작은 쪽을 골라 더했습니다.',
    needTwo: 'ETF를 두 개 이상 담으면 짝마다 겹치는 비중이 보입니다.',
    cellAria: (a: string, b: string, value: string, count: number) =>
      `${a}와 ${b}는 ${value}퍼센트 겹칩니다. 겹치는 종목 ${count}개.`,
    sharedCount: (count: number) => `${count}종목`,
    self: '같은 ETF'
  },

  stocks: {
    title: '종목별 중복',
    showSingles: '한 ETF에만 있는 종목도 보기',
    hideSingles: '겹치는 종목만 보기',
    exposureHeader: '합친 비중',
    holdersAria: (tickers: string) => `보유: ${tickers}`,
    none: '겹치는 종목이 없습니다.',
    needOne: 'ETF를 담으면 종목이 여기에 나옵니다.',
    moreHidden: (count: number) => `외 ${count}종목은 비중이 작아 줄였습니다.`
  },

  simulate: {
    title: '이 조합으로 배당 시뮬레이션',
    lede: '담은 ETF를 정한 비중 그대로 시뮬레이터 새 탭에 싣습니다. 투자금·기간은 시뮬레이터에서 정하세요.',
    button: '배당 시뮬레이션 해보기',
    /** 시뮬레이터 새 탭 이름. */
    scenarioName: 'ETF 조합',
    excluded: (tickers: string) => `${tickers}는 시뮬레이터에 배당 정보가 없어 빼고 넘깁니다. 남은 ETF의 비중을 다시 100%로 맞춥니다.`,
    noneKnown: '담은 ETF가 모두 시뮬레이터에 배당 정보가 없어 넘길 수 없습니다.',
    needOne: 'ETF를 담으면 그 조합으로 배당 시뮬레이션을 해볼 수 있습니다.'
  },

  footnote: {
    title: '이 화면의 자료',
    source: '보유 종목은 SEC EDGAR 에 공시된 N-PORT(분기말 기준, 공개는 약 60일 뒤)에서 가져왔습니다. 현금·파생상품·공매도 포지션은 담지 않았습니다.',
    asOf: (items: string) => `기준일 — ${items}`,
    truncated: 'ETF마다 비중이 큰 순으로 최대 500종목까지만 계산에 썼습니다. 그 밖의 아주 작은 비중은 결과를 거의 바꾸지 않습니다.',
    disclaimer: '겹침은 과거 공시를 옮긴 사실이며, 투자 권유나 자문이 아닙니다.'
  }
} as const;
