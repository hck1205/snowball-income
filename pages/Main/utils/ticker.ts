import type { Frequency } from '@/shared/types';
import type { TickerDraft } from '@/shared/types/snowball';

export const toTickerDraft = (values: {
  ticker: string;
  initialPrice: number;
  dividendYield: number;
  dividendGrowth: number;
  expectedTotalReturn: number;
  frequency: Frequency;
}): TickerDraft => ({
  ticker: values.ticker,
  initialPrice: values.initialPrice,
  dividendYield: values.dividendYield,
  dividendGrowth: values.dividendGrowth,
  expectedTotalReturn: values.expectedTotalReturn,
  frequency: values.frequency
});
