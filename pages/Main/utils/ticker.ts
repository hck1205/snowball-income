import type { Frequency } from '@/shared/types';
import type { TickerDraft } from '@/shared/types/snowball';

export const toTickerDraft = (values: {
  ticker: string;
  initialPrice: number;
  dividendYield: number;
  dividendGrowth: number;
  priceGrowth: number;
  frequency: Frequency;
}): TickerDraft => ({
  ticker: values.ticker,
  initialPrice: values.initialPrice,
  dividendYield: values.dividendYield,
  dividendGrowth: values.dividendGrowth,
  priceGrowth: values.priceGrowth,
  frequency: values.frequency
});
