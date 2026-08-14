import type { TickerCategoryId, TickerContent, TICKER_CATEGORY_META } from '@/shared/constants/tickers';

export type TickerCategoryMetaModel = (typeof TICKER_CATEGORY_META)[TickerCategoryId];

export type TickerCategorySibling = {
  id: TickerCategoryId;
  label: string;
  to: string;
};

export type TickerCategoryViewProps = {
  /** 카테고리 라벨(목록 제목에 쓴다). 메타의 긴 제목과 달리 짧다. */
  label: string;
  meta: TickerCategoryMetaModel;
  entries: TickerContent[];
  siblings: TickerCategorySibling[];
};
