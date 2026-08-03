import type { TickerAccentTheme } from '@/shared/constants/tickers';

export type HubTickerCard = {
  ticker: string;
  slug: string;
  koreanName: string;
  englishName: string;
  /**
   * 티커별 액센트(선택) — 상세 페이지가 이미 쓰는 **같은 큐레이션 데이터**다.
   * 허브에서는 카드 왼쪽 레일 색으로만 쓴다(장식). 없는 티커는 카테고리 색으로 폴백한다.
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
  /** 핵심 stat: 배당률. */
  dividendYield: string;
  /**
   * 운용보수(총보수) — 페이지 제목·lede 가 "배당률·배당성장·운용보수·구성 기준을 정리했다"고
   * 약속하는데 카드에는 없던 값이다(2026-07-30 감사).
   *
   * ⚠ **선택 필드다.** 콘텐츠에 값이 없는 티커가 있을 수 있고, 그때는 뷰가 이 스탯을 **통째로
   * 뺀다** — 빈 값·`-`·`0%` 로 자리를 채우지 마라(숫자를 지어내는 것이다).
   */
  expenseRatio?: string;
  frequencyLabel: string;
};

export type HubCategory = {
  id: string;
  label: string;
  tickers: HubTickerCard[];
};

export type TickerHubViewModel = {
  categories: HubCategory[];
  totalCount: number;
};

/**
 * 히어로가 읽는 요약 수치. 뷰가 `viewModel` 에서 매번 다시 세지 않도록 컨테이너가 아니라
 * 뷰모델 빌더가 소유한다(문서 제목·메타 설명이 쓰는 `totalCount` 와 같은 원천).
 */
export type TickerHubSummary = {
  tickerCount: number;
  categoryCount: number;
};

export type TickerHubViewProps = {
  viewModel: TickerHubViewModel;
};
