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

export type TickerHubViewProps = {
  viewModel: TickerHubViewModel;
};
