import type { RequirementCategory } from '@/shared/lib/dividendTarget';

export type TickerRequirementGridProps = {
  readonly categories: readonly RequirementCategory[];
  /** 지금 자세히 보는 종목. */
  readonly selectedTicker: string;
  /** 세후 월 목표(원) — 리드 문장용. */
  readonly monthlyAfterTax: number;
  readonly onSelect: (ticker: string) => void;
};
