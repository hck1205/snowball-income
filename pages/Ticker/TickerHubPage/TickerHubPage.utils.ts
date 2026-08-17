import {
  listTickerContentByCategory,
  renderTickerContentTemplate,
  resolveTickerEngineFacts,
  TICKER_CATEGORY_LABEL,
  TICKER_CONTENT_LIST,
  type TickerCategoryId,
  type TickerContent
} from '@/shared/constants/tickers';
import { assignSeries } from '@/shared/lib/tickerSeries';
import { DIVIDEND_UNIVERSE, type PresetTickerKey } from '@/shared/constants/presets';
import type { Frequency } from '@/shared/types';
import type {
  HubFilterState,
  SimulatorOnlyRow,
  SimulatorOnlySort,
  SimulatorOnlySortKey,
  HubFrequencyKey,
  HubLibraryStats,
  HubResult,
  HubSortKey,
  HubTickerCard,
  TickerHubViewModel
} from './TickerHubPage.types';

/**
 * 엔진의 지급 주기 → 필터 축. 반기·연1회·무배당은 전부 `other` 로 접는다 —
 * 각자 칩을 세우면 해당 종목이 0~1개인 칩이 세 개 생기고, 그건 고르는 데 도움이 되지 않는다.
 */
const toFrequencyKey = (frequency: string): HubFrequencyKey => {
  if (frequency === 'monthly') return 'monthly';
  if (frequency === 'quarterly') return 'quarterly';
  return 'other';
};

const toCard = (content: TickerContent, seriesVar: string, categoryLabel: string): HubTickerCard => {
  const facts = resolveTickerEngineFacts(content.ticker);
  const tagline = renderTickerContentTemplate(content.heroTagline, facts);

  return {
    seriesVar,
    categoryLabel,
    ticker: content.ticker,
    slug: content.slug,
    koreanName: facts.koreanName,
    englishName: facts.englishName,
    tagline,
    dividendYield: facts.dividendYieldDisplay,
    dividendYieldPercent: facts.dividendYieldPercent,
    /* 상세 히어로의 "연 배당성장률(계산 가정)"과 **같은 함수·같은 포맷**이다 — 두 화면이 갈릴 수 없다. */
    dividendGrowth: facts.dividendGrowthDisplay,
    dividendGrowthPercent: facts.dividendGrowthPercent,
    /*
     * 값이 **없는**(undefined) 티커는 그대로 undefined 로 둬 뷰가 지표를 통째로 뺀다 — '-'·'미정'
     * 같은 placeholder 로 자리를 채우지 않는다.
     * ⚠ `0` 은 없는 값이 아니라 **진짜 값**이다(무보수 ETF 는 실존한다). 그래서 '0%' 로 렌더되고
     * 그게 맞다 — 뷰의 truthy 가드를 "0 을 숨기는 버그"로 읽지 마라.
     */
    expenseRatio:
      content.reference.expenseRatioPercent !== undefined ? `${content.reference.expenseRatioPercent}%` : undefined,
    expenseRatioPercent: content.reference.expenseRatioPercent,
    frequencyLabel: facts.frequencyLabel,
    frequencyKey: toFrequencyKey(facts.frequency),
    // 상세 페이지와 **같은 출처**의 액센트를 그대로 넘긴다(허브에서 새 색을 만들지 않는다).
    accent: content.accent,
    /*
     * 검색 건초더미. 검색으로 들어온 사람은 티커('SCHD')로도, 한글명('슈왑 배당')으로도,
     * 성격('월배당')으로도 친다 — 다섯 축을 한 문자열로 접어 두면 매칭이 한 번의 includes 다.
     */
    searchText:
      `${content.ticker} ${content.slug} ${facts.koreanName} ${facts.englishName} ${tagline} ${categoryLabel}`.toLowerCase()
  };
};

/**
 * 수록 전체를 훑어 매스트헤드 스펙 줄이 읽을 수치를 만든다.
 *
 * 🔴 어떤 값도 추정하지 않는다. 배당률 범위는 **실제 최소·최대 티커의 표시값 그대로**이고,
 * 매월 지급 수는 엔진 주기를 센 것이다. 티커가 없으면 범위는 undefined 로 남고 뷰가 그 칸을 뺀다.
 */
const summarizeLibrary = (cards: readonly HubTickerCard[], categoryCount: number): HubLibraryStats => {
  const unique = new Map<string, HubTickerCard>();
  for (const card of cards) if (!unique.has(card.ticker)) unique.set(card.ticker, card);
  const list = [...unique.values()];

  const sortedByYield = [...list].sort((a, b) => a.dividendYieldPercent - b.dividendYieldPercent);
  const lowest = sortedByYield[0];
  const highest = sortedByYield[sortedByYield.length - 1];

  return {
    categoryCount,
    tickerCount: list.length,
    yieldMinDisplay: lowest?.dividendYield,
    yieldMaxDisplay: highest?.dividendYield,
    monthlyCount: list.filter((card) => card.frequencyKey === 'monthly').length
  };
};

/**
 * 카테고리별로 그룹핑한 허브 뷰모델을 만든다. 티커가 하나도 없는 카테고리는 건너뛴다 —
 * 카테고리 라벨 맵(`TICKER_CATEGORY_LABEL`)이 유일한 순서 원천이라, 카테고리를 추가/재정렬하면
 * 이 화면도 자동으로 따라온다(이 파일은 손대지 않는다).
 */
export const buildTickerHubViewModel = (): TickerHubViewModel => {
  const categoryIds = Object.keys(TICKER_CATEGORY_LABEL) as TickerCategoryId[];

  const categories = categoryIds
    .map((id) => {
      const label = TICKER_CATEGORY_LABEL[id];
      const contents = listTickerContentByCategory(id);
      /*
       * 폴백 색은 **카테고리 단위**로 배정한다 — 사용자가 한 번에 눈으로 훑는 덩어리가 격자 하나이고,
       * 8색 팔레트로 27종 전체의 무충돌을 만들 수는 없기 때문이다(assignSeries 는 9번째부터 겹친다).
       * 카테고리 안에서만 겹치지 않으면 "같은 줄에 같은 색이 둘"이라는 실제 혼동은 생기지 않는다.
       */
      const seriesByTicker = assignSeries(contents.map((content) => content.ticker));
      return {
        id,
        label,
        tickers: contents.map((content) => toCard(content, seriesByTicker.get(content.ticker) ?? '', label))
      };
    })
    .filter((category) => category.tickers.length > 0);

  const allCards = categories.flatMap((category) => category.tickers);

  return {
    categories,
    totalCount: TICKER_CONTENT_LIST.length,
    simulatorOnly: buildSimulatorOnlyRows(),
    stats: summarizeLibrary(allCards, categories.length)
  };
};

/**
 * **소개 글은 없지만 시뮬레이터에서는 계산되는 종목**들.
 *
 * 두 데이터가 다르다는 사실이 이 목록의 존재 이유다:
 *  - `TICKER_CONTENT_LIST` — 사람이 쓴 소개 페이지(출처·조회일까지 붙은 조사 결과)
 *  - `DIVIDEND_UNIVERSE`   — 시뮬레이터 프리셋(주가·배당률이 매월 자동 갱신)
 *
 * 프리셋이 훨씬 많아서, 소개 페이지만 보면 "스타벅스는 없네"로 읽힌다 — 실제로는 계산이 된다.
 * 🔴 그렇다고 프리셋마다 **얇은 소개 페이지를 자동 생성하지 않는다.** 같은 뼈대에 숫자만 바뀐
 *    페이지 수백 개는 검색엔진이 얇은 콘텐츠로 판정해 **잘 있는 페이지까지 끌어내린다.**
 *    목록으로만 보여 주고 상세는 조사한 것만 쓴다 — 그게 이 함수가 표 하나로 끝나는 이유다.
 *
 * ⚠ 숫자는 `DIVIDEND_UNIVERSE` 에서 그대로 온다(프리셋 + 시장데이터 오버레이). 여기서 다시
 *   계산하지 않으므로 매월 갱신이 자동으로 반영된다.
 */
const buildSimulatorOnlyRows = (): SimulatorOnlyRow[] => {
  const documented = new Set(TICKER_CONTENT_LIST.map((content) => content.ticker.toUpperCase()));
  const keys = Object.keys(DIVIDEND_UNIVERSE) as PresetTickerKey[];

  return keys
    .filter((key) => !documented.has(key.toUpperCase()))
    /* 🔴 값 조립을 여기서 다시 하지 않는다 — 상세 페이지가 쓰는 그 함수를 그대로 쓴다.
       한글명·주기 라벨·배당률 표기가 두 화면에서 갈리지 않는 유일한 방법이다. */
    .map((key) => {
      const facts = resolveTickerEngineFacts(key);
      return {
        ticker: facts.ticker,
        name: facts.koreanName ?? facts.englishName ?? facts.ticker,
        dividendYield: facts.dividendYieldPercent,
        frequencyLabel: facts.frequencyLabel,
        frequencyRank: FREQUENCY_RANK[facts.frequency]
      };
    })
    .sort((left, right) => left.ticker.localeCompare(right.ticker));
};

/**
 * 지급 주기의 정렬 순서 — **자주 주는 것이 먼저**다.
 *
 * ⚠ `none`(배당 없음)은 "가장 드물게"가 아니라 **없는 것**이라 맨 끝이다. 0회로 읽어 숫자 축에
 *   섞으면 "연 0회"라는 없는 개념이 생긴다(FREQUENCY_LABEL_KO 가 같은 이유로 그 문구를 피한다).
 */
const FREQUENCY_RANK: Record<Frequency, number> = {
  monthly: 0,
  quarterly: 1,
  semiannual: 2,
  annual: 3,
  none: 4
};

/** 시뮬레이터 전용 표의 초기 정렬 — 티커 오름차순(표가 처음부터 그 순서로 만들어져 있다). */
export const DEFAULT_SIMULATOR_ONLY_SORT: SimulatorOnlySort = { key: 'ticker', direction: 'asc' };

/** 열 정의 = 머리 글자 + 정렬 축 + 숫자 열 여부. 뷰가 이 배열 하나로 머리 행을 그린다. */
export const SIMULATOR_ONLY_COLUMNS: readonly {
  key: SimulatorOnlySortKey;
  label: string;
  numeric: boolean;
}[] = [
  { key: 'ticker', label: '티커', numeric: false },
  { key: 'name', label: '종목명', numeric: false },
  { key: 'yield', label: '배당률', numeric: true },
  { key: 'frequency', label: '지급 주기', numeric: false }
];

/**
 * 같은 열을 다시 누르면 방향만 뒤집고, 다른 열을 누르면 **오름차순부터** 시작한다.
 * 배당 목록 표(`nextDividendListSort`)와 **같은 규칙**이다 — 두 표에서 같은 손짓이 같게 동작한다.
 */
export const nextSimulatorOnlySort = (
  current: SimulatorOnlySort,
  key: SimulatorOnlySortKey
): SimulatorOnlySort =>
  current.key === key
    ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
    : { key, direction: 'asc' };

/**
 * 227종을 고른 축으로 정렬한다.
 *
 * 🔴 값이 같을 때는 **항상 티커**로 갈라 순서를 확정한다. 동률을 그대로 두면(예: 배당 없음 47종)
 * 정렬을 껐다 켤 때마다 줄 순서가 미묘하게 달라져 "같은 조건인데 다른 표"로 읽힌다.
 * ⚠ 원본 배열을 건드리지 않는다(뷰모델은 마운트당 한 번 만든 값이라 공유된다).
 */
export const sortSimulatorOnlyRows = (
  rows: readonly SimulatorOnlyRow[],
  sort: SimulatorOnlySort
): SimulatorOnlyRow[] => {
  const factor = sort.direction === 'asc' ? 1 : -1;

  return [...rows].sort((left, right) => {
    let primary = 0;
    if (sort.key === 'yield') primary = left.dividendYield - right.dividendYield;
    else if (sort.key === 'frequency') primary = left.frequencyRank - right.frequencyRank;
    else if (sort.key === 'name') primary = left.name.localeCompare(right.name, 'ko');
    else primary = left.ticker.localeCompare(right.ticker, 'ko');

    if (primary !== 0) return primary * factor;
    return left.ticker.localeCompare(right.ticker, 'ko');
  });
};

/** 필터의 초기값 — 컨테이너와 "필터 지우기" 버튼이 **같은 상수**를 쓴다(초기화가 두 벌로 갈리지 않게). */
export const DEFAULT_HUB_FILTERS: HubFilterState = {
  query: '',
  minYieldPercent: null,
  frequency: 'all',
  sort: 'default',
  /*
   * 🔴 기본은 **표**다(2026-08-03 사용자 지시: "카드가 아니라 표가 default인게 더 좋다").
   * 이 허브는 '고르는' 화면이 아니라 **비교해서 찾는** 화면이다 — 배당률·운용보수·주기를
   * 나란히 훑는 일이 카드 격자보다 표에서 훨씬 빠르다. 카드 보기는 전환으로 남는다.
   */
  view: 'table'
};

/** 정렬 셀렉트의 선택지. 라벨이 곧 계약이라 뷰가 문자열을 손으로 적지 않는다. */
export const HUB_SORT_OPTIONS: readonly { value: HubSortKey; label: string }[] = [
  { value: 'default', label: '기본 순서' },
  { value: 'yield-desc', label: '배당률 높은 순' },
  { value: 'growth-desc', label: '배당성장 높은 순' },
  { value: 'expense-asc', label: '운용보수 낮은 순' },
  { value: 'ticker-asc', label: '티커 이름순' }
];

/** 지급 주기 칩. `전체` 를 포함해 **항상 하나가 눌려 있는** 라디오형 묶음이다. */
export const HUB_FREQUENCY_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'monthly', label: '매월' },
  { value: 'quarterly', label: '분기' }
] as const;

/**
 * 배당률 하한 칩의 계단.
 *
 * 🔴 값은 **라이브러리 실제 분포**에서 왔다(2026-08-17 실측, 고유 105종): 2% 이상 67종 ·
 * 4% 이상 25종 · 6% 이상 12종. 어느 칸을 눌러도 결과가 0이 되거나 거의 안 줄지 않는 계단이어야
 * 칩이 쓸모가 있다(1% 이상은 90종이라 거의 안 줄고, 10% 이상은 5종이라 표가 사라진다).
 * ⚠ 라이브러리가 크게 바뀌면 이 계단도 다시 재라 — 한 칸이 0종이 되는 순간 그 칩은 함정이 된다.
 */
export const HUB_YIELD_STEPS = [2, 4, 6] as const;

/**
 * 정렬 비교자.
 *
 * 🔴 값이 **없는** 운용보수는 오름차순에서 맨 뒤로 보낸다 — undefined 를 0 으로 읽으면
 * "보수를 모르는 티커"가 "보수가 가장 싼 티커"로 둔갑한다(숫자를 지어내는 것과 같다).
 */
const comparatorFor = (sort: HubSortKey): ((a: HubTickerCard, b: HubTickerCard) => number) | undefined => {
  if (sort === 'yield-desc') return (a, b) => b.dividendYieldPercent - a.dividendYieldPercent;
  /* 배당성장은 프리셋 가정치라 **모든 티커에 값이 있다** — 운용보수처럼 없는 값을 뒤로 밀 일이 없다. */
  if (sort === 'growth-desc') return (a, b) => b.dividendGrowthPercent - a.dividendGrowthPercent;
  if (sort === 'ticker-asc') return (a, b) => a.ticker.localeCompare(b.ticker);
  if (sort === 'expense-asc') {
    return (a, b) => {
      const left = a.expenseRatioPercent ?? Number.POSITIVE_INFINITY;
      const right = b.expenseRatioPercent ?? Number.POSITIVE_INFINITY;
      return left - right;
    };
  }
  return undefined;
};

/**
 * 검색어·주기로 거르고 정렬한다.
 *
 * 🔴 **카테고리 칸은 하나도 버리지 않는다.** 섹션은 해시 앵커의 목적지이고 그 앵커가 이 화면의
 * 유일한 목차다 — 결과가 0이면 뷰가 그 자리에 한 줄을 세울 뿐, 섹션 자체는 문서에 남는다.
 */
export const filterTickerHub = (viewModel: TickerHubViewModel, filters: HubFilterState): HubResult => {
  const needle = filters.query.trim().toLowerCase();
  const compare = comparatorFor(filters.sort);
  const matchedTickers = new Set<string>();

  const categories = viewModel.categories.map((category) => {
    const matched = category.tickers.filter((card) => {
      if (needle && !card.searchText.includes(needle)) return false;
      /* "이상" 사다리 — 같은 축의 두 칸이 동시에 걸리는 일이 없으므로 비교가 한 번이다. */
      if (filters.minYieldPercent !== null && card.dividendYieldPercent < filters.minYieldPercent) return false;
      if (filters.frequency !== 'all' && card.frequencyKey !== filters.frequency) return false;
      return true;
    });

    for (const card of matched) matchedTickers.add(card.ticker);

    return { ...category, matched: compare ? [...matched].sort(compare) : matched };
  });

  return {
    categories,
    matchedCount: matchedTickers.size,
    totalCount: viewModel.stats.tickerCount,
    filtered: needle.length > 0 || filters.minYieldPercent !== null || filters.frequency !== 'all'
  };
};
