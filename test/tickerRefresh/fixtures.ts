import type { DividendPayment, TickerDataProvider } from '@/scripts/tickerRefresh';
import { ProviderError } from '@/scripts/tickerRefresh';

/** Builds a regular payment history: `perYear` payments a year, splitting each year's total. */
const regularHistory = (
  totalsByYear: Readonly<Record<number, number>>,
  monthsOfYear: readonly number[],
  dayOfMonth: number
): DividendPayment[] =>
  Object.entries(totalsByYear).flatMap(([year, total]) =>
    monthsOfYear.map((month) => ({
      date: `${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`,
      amount: total / monthsOfYear.length
    }))
  );

export const quarterlyHistory = (totalsByYear: Readonly<Record<number, number>>): DividendPayment[] =>
  regularHistory(totalsByYear, [3, 6, 9, 12], 20);

export const monthlyHistory = (totalsByYear: Readonly<Record<number, number>>): DividendPayment[] =>
  regularHistory(totalsByYear, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 15);

/** SCHD-like: quarterly, steadily growing, with 2026 only partially paid out as of `2026-07-14`. */
export const SCHD_DIVIDENDS: DividendPayment[] = [
  ...quarterlyHistory({ 2020: 0.72, 2021: 0.8, 2022: 0.88, 2023: 0.94, 2024: 1.0, 2025: 1.06 }),
  { date: '2026-03-20', amount: 0.28 },
  { date: '2026-06-20', amount: 0.28 }
];

/** JEPI-like: monthly distributions. */
export const JEPI_DIVIDENDS: DividendPayment[] = [
  ...monthlyHistory({ 2021: 4.2, 2022: 5.4, 2023: 5.0, 2024: 4.6, 2025: 4.4 }),
  ...[1, 2, 3, 4, 5, 6].map((month) => ({
    date: `2026-${String(month).padStart(2, '0')}-15`,
    amount: 0.37
  }))
];

/** VTI-like: quarterly, low yield. */
export const VTI_DIVIDENDS: DividendPayment[] = quarterlyHistory({
  2020: 2.5,
  2021: 2.7,
  2022: 2.9,
  2023: 3.1,
  2024: 3.3,
  2025: 3.5
});

export type FakeQuotes = Readonly<Record<string, number | ProviderError>>;
export type FakeDividends = Readonly<Record<string, DividendPayment[] | ProviderError>>;

/**
 * A provider backed by fixtures. Because the provider is the pipeline's only network surface,
 * injecting this exercises fetch -> derive -> guard -> merge end to end with zero network.
 */
export const createFixtureProvider = ({
  quotes,
  dividends,
  name = 'fixture'
}: {
  quotes: FakeQuotes;
  dividends: FakeDividends;
  name?: string;
}): TickerDataProvider => ({
  name,
  fetchQuote: async (ticker) => {
    const quote = quotes[ticker];
    if (quote === undefined) throw new ProviderError('empty', 'No fixture quote', ticker);
    if (quote instanceof ProviderError) throw quote;
    return quote;
  },
  fetchDividends: async (ticker) => {
    const history = dividends[ticker];
    if (history === undefined) throw new ProviderError('empty', 'No fixture dividends', ticker);
    if (history instanceof ProviderError) throw history;
    return history;
  }
});

/** Tests inject this so the rate-limit delay does not actually sleep. */
export const noSleep = async (): Promise<void> => {};
