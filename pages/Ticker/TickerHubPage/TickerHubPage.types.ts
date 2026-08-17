import type { TickerAccentTheme } from '@/shared/constants/tickers';

/**
 * 지급 주기 필터의 축. 엔진의 `Frequency` 를 **사용자가 실제로 고르는 단위**로 접은 것이다 —
 * 반기·연1회·무배당을 각자 칩으로 세우면 27종 중 해당 종목이 0~1개인 칩이 세 개 생긴다.
 */
export type HubFrequencyKey = 'monthly' | 'quarterly' | 'other';

export type HubTickerCard = {
  ticker: string;
  slug: string;
  koreanName: string;
  englishName: string;
  /**
   * 티커별 액센트(선택) — 상세 페이지가 이미 쓰는 **같은 큐레이션 데이터**다.
   * 카드 상단 리본·심볼 글자·표 행의 귀가 이 색을 읽는다. 없는 티커는 아래 시리즈 색으로 폴백한다.
   */
  accent?: TickerAccentTheme;
  /**
   * 액센트가 **없는** 티커의 폴백 색(`var(--sb-chart-series-N)`).
   *
   * 왜 카테고리 색이 아니라 시리즈 색인가: 종전 폴백은 "그 섹션의 카테고리 색"이라 액센트 없는
   * 티커가 여럿이면 **같은 칸에서 색이 겹쳐** 색이 길찾기 단서 노릇을 못 했다. `assignSeries`
   * (shared/lib/tickerSeries)는 같은 집합 안에서 색이 겹치지 않도록 배정하므로 그 문제가 없다.
   *
   * ⚠ 현재 레지스트리의 티커는 전부 큐레이션 액센트를 갖고 있어 이 값은 **쓰이지 않는다.**
   * 액센트 없는 티커가 하나라도 들어오는 순간을 위한 안전망이고, 그때 무채색으로 무너지지 않는다.
   */
  seriesVar: string;
  /** 히어로 후크 카피(토큰 치환됨) — 한 줄 소개. */
  tagline: string;
  /** 핵심 지표: 배당률 표시값(`3.15%`). */
  dividendYield: string;
  /** 같은 값의 숫자 — **정렬 전용**이다. 화면에는 위 표시값만 나간다(포맷 규칙 이중화 금지). */
  dividendYieldPercent: number;
  /**
   * 연 배당성장률 표시값(`6.87%`).
   *
   * 🔴 **시뮬레이터 계산 프리셋의 가정치**다(엔진의 `dividendGrowth`) — 과거 실적 CAGR 이 아니다.
   * 상세 페이지 히어로가 "연 배당성장률(계산 가정)"이라고 부르는 바로 그 값이라, 허브에서 본 숫자와
   * 상세에서 본 숫자가 같다. 열 머리 옆의 각주가 이 사실을 화면에서도 말한다.
   * ⚠ 과거 배당성장 CAGR(`reference.historicalDividendCagrPercent`)과 **다른 값**이다. 두 값을
   *   같은 열에 섞지 마라 — 하나는 가정이고 하나는 이력이다.
   */
  dividendGrowth: string;
  /** 같은 값의 숫자 — 정렬 전용. */
  dividendGrowthPercent: number;
  /**
   * 운용보수(총보수).
   *
   * ⚠ **선택 필드다.** 콘텐츠에 값이 없는 티커가 있을 수 있고, 그때는 뷰가 이 지표를 **통째로
   * 뺀다** — 빈 값·`-`·`0%` 로 자리를 채우지 마라(숫자를 지어내는 것이다).
   */
  expenseRatio?: string;
  /** 정렬 전용 숫자. 값이 없는 티커는 undefined 이고, 오름차순 정렬에서 **맨 뒤로** 간다. */
  expenseRatioPercent?: number;
  frequencyLabel: string;
  frequencyKey: HubFrequencyKey;
  /** 이 카드가 서 있는 카테고리의 라벨 — 표 보기의 열과 검색 건초더미가 함께 쓴다. */
  categoryLabel: string;
  /** 검색 건초더미(소문자). 티커·한글명·영문명·소개·카테고리를 한 문자열로 접어 둔다. */
  searchText: string;
};

export type HubCategory = {
  id: string;
  label: string;
  tickers: HubTickerCard[];
};

/**
 * 매스트헤드의 스펙 줄이 읽는 수치. 전부 레지스트리에서 **읽어서 센 값**이고 어떤 숫자도
 * 새로 만들지 않는다(배당률 범위는 실제 최소·최대 티커의 표시값 그대로다).
 */
export type HubLibraryStats = {
  tickerCount: number;
  categoryCount: number;
  /** 수록 종목 중 배당률 최저/최고 표시값. 티커가 하나도 없으면 undefined. */
  yieldMinDisplay?: string;
  yieldMaxDisplay?: string;
  /** 매월 지급 종목 수 — 월배당을 찾아 들어오는 검색 유입이 가장 많은 축이다. */
  monthlyCount: number;
};

/** 소개 글은 없지만 시뮬레이터에서는 계산되는 종목 한 줄. 숫자는 프리셋에서 그대로 온다. */
export type SimulatorOnlyRow = {
  ticker: string;
  name: string;
  dividendYield: number;
  frequencyLabel: string;
  /**
   * 지급 주기의 **순서값**(매월 0 → 배당 없음 4).
   *
   * 🔴 라벨 문자열로 정렬하지 않는다. "매월 · 반기(연 2회) · 분기(연 4회) · 연 1회"를 가나다순으로
   * 세우면 매월 → 반기 → 분기 → 연1회가 되어, **자주 주는 순**이라는 이 열의 유일한 의미가
   * 사라진다(반기가 분기보다 앞에 선다). 순서는 지급 빈도가 정한다.
   */
  frequencyRank: number;
};

/** 시뮬레이터 전용 표의 정렬 축. 네 열 모두 값이 갈리므로 전부 정렬 가능하다. */
export type SimulatorOnlySortKey = 'ticker' | 'name' | 'yield' | 'frequency';

export type SimulatorOnlySort = {
  key: SimulatorOnlySortKey;
  direction: 'asc' | 'desc';
};

export type TickerHubViewModel = {
  categories: HubCategory[];
  totalCount: number;
  /** 🔴 여기에 얇은 소개 페이지를 자동 생성하지 않는다 — 근거는 buildSimulatorOnlyRows 주석. */
  simulatorOnly: SimulatorOnlyRow[];
  stats: HubLibraryStats;
};

/** 정렬 축. `default` 는 레지스트리 순서(큐레이션 순서)다. */
export type HubSortKey = 'default' | 'yield-desc' | 'growth-desc' | 'expense-asc' | 'ticker-asc';

/** 보기 형태. `grid` = 고르는 카드 격자, `table` = 읽는 표(밀도 우선). */
export type HubViewMode = 'grid' | 'table';

/** 지급 주기 필터. `other`(반기·연1회)는 칩을 두지 않으므로 필터 값에서도 뺀다. */
export type HubFrequencyFilter = 'all' | 'monthly' | 'quarterly';

export type HubFilterState = {
  query: string;
  /**
   * 배당률 하한(%). `null` = 전체.
   *
   * 🔴 **글자를 치지 않고 후보를 좁히는 축**이다(2026-08-17 사용자 요청: "입력 대신 클릭으로
   * 필터되는 UI"). 105종 라이브러리에서 검색은 찾을 티커를 이미 아는 사람만 쓸 수 있는데,
   * 대부분의 방문자는 "4% 넘는 것"처럼 조건만 들고 온다.
   * ⚠ "이상" 사다리라 값이 **하나만** 걸린다 — 배당 목록 화면의 같은 축과 같은 문법이다
   *   (4% 이상은 2% 이상을 이미 포함하므로 다중 선택이 의미가 없다).
   */
  minYieldPercent: number | null;
  frequency: HubFrequencyFilter;
  sort: HubSortKey;
  view: HubViewMode;
};

/**
 * 필터를 통과한 카테고리 한 칸.
 *
 * 🔴 `matched` 가 비어도 **이 칸은 사라지지 않는다.** 카테고리 섹션은 해시 앵커(`#high-dividend`)의
 * 목적지이고, 그 앵커는 이 화면의 유일한 목차다 — 필터에 따라 섹션이 사라지면 링크가 조용히
 * 아무 데도 못 간다. 대신 뷰가 그 자리에 "일치하는 티커가 없다"는 한 줄을 세운다.
 */
export type HubResultCategory = HubCategory & {
  matched: HubTickerCard[];
};

export type HubResult = {
  categories: HubResultCategory[];
  /** 필터를 통과한 **고유 티커 수**(한 티커가 두 카테고리에 서므로 카드 장수와 다르다). */
  matchedCount: number;
  totalCount: number;
  /** 검색어·주기 필터 중 하나라도 걸려 있는가. 정렬·보기 전환은 결과 집합을 바꾸지 않으므로 뺀다. */
  filtered: boolean;
};

export type TickerHubViewProps = {
  viewModel: TickerHubViewModel;
  filters: HubFilterState;
  result: HubResult;
  onQueryChange: (query: string) => void;
  onYieldChange: (minYieldPercent: number | null) => void;
  onFrequencyChange: (frequency: HubFrequencyFilter) => void;
  onSortChange: (sort: HubSortKey) => void;
  onViewChange: (view: HubViewMode) => void;
  onReset: () => void;
};
