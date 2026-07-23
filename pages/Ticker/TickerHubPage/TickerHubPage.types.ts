export type HubTickerCard = {
  ticker: string;
  slug: string;
  koreanName: string;
  englishName: string;
  /** 히어로 후크 카피(토큰 치환됨) — 한 줄 소개. */
  tagline: string;
  /** 핵심 stat: 배당률. */
  dividendYield: string;
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
