import { z } from 'zod';
import type { DividendPayment } from '../derive';
import { ProviderError } from './provider.types';
import type { FetchLike, TickerDataProvider } from './provider.types';

export type YahooProviderOptions = {
  baseUrl?: string;
  fetchImpl?: FetchLike;
  /**
   * Yahoo `range` query param. Needs to cover enough calendar years for `computeDividendCagr`
   * (default `cagrYears` is 5, which reaches back up to 6 complete years), so the default here is
   * generous rather than matching the 1y window used to spot-check the shape of the API.
   */
  range?: string;
};

const DEFAULT_BASE_URL = 'https://query1.finance.yahoo.com';
const DEFAULT_RANGE = '10y';

// Yahoo's chart endpoint is unauthenticated but rejects requests with no browser-like UA.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const yahooDividendEventSchema = z.object({
  amount: z.number(),
  date: z.number()
});

const yahooChartResultSchema = z.object({
  meta: z.object({
    regularMarketPrice: z.number().nullable().optional(),
    currency: z.string().optional()
  }),
  events: z
    .object({
      dividends: z.record(z.string(), yahooDividendEventSchema).optional()
    })
    .optional()
});

const yahooChartResponseSchema = z.object({
  chart: z.object({
    result: z.array(yahooChartResultSchema).nullable(),
    error: z
      .object({
        code: z.string().optional(),
        description: z.string().optional()
      })
      .nullable()
      .optional()
  })
});

type ChartData = {
  price: number;
  dividends: DividendPayment[];
};

/** Unix seconds -> ISO date (UTC), matching how `derive.ts` parses every other provider's dates. */
const toIsoDate = (unixSeconds: number): string | null => {
  const date = new Date(unixSeconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

const toDividendPayments = (
  dividends: Record<string, z.infer<typeof yahooDividendEventSchema>> | undefined
): DividendPayment[] => {
  if (dividends === undefined) return [];

  return Object.values(dividends)
    .map((event) => {
      const date = toIsoDate(event.date);
      if (date === null) return null;
      if (!Number.isFinite(event.amount) || event.amount <= 0) return null;
      return { date, amount: event.amount };
    })
    .filter((payment): payment is DividendPayment => payment !== null);
};

const fetchChart = async (
  ticker: string,
  doFetch: FetchLike,
  baseUrl: string,
  range: string
): Promise<ChartData> => {
  const url = `${baseUrl}/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=${range}&events=div`;

  let response: Awaited<ReturnType<FetchLike>>;
  try {
    response = await doFetch(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ProviderError('http', `Request failed: ${message}`, ticker);
  }

  if (response.status === 429) {
    throw new ProviderError('rate_limit', 'Rate limited by Yahoo Finance (429)', ticker);
  }
  if (response.status === 401 || response.status === 403) {
    throw new ProviderError('auth', `Yahoo Finance rejected the request (${response.status})`, ticker);
  }
  if (!response.ok) {
    throw new ProviderError('http', `Yahoo Finance returned HTTP ${response.status}`, ticker);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ProviderError('malformed', 'Yahoo Finance returned a non-JSON body', ticker);
  }

  const parsed = yahooChartResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new ProviderError('malformed', 'Unexpected chart payload shape', ticker);
  }

  if (parsed.data.chart.error) {
    const description = parsed.data.chart.error.description ?? parsed.data.chart.error.code ?? 'unknown error';
    throw new ProviderError('empty', `Yahoo Finance error: ${description}`, ticker);
  }

  const result = parsed.data.chart.result?.[0];
  if (result === undefined) {
    throw new ProviderError('empty', 'Yahoo Finance returned no chart result (unknown ticker?)', ticker);
  }

  const price = result.meta.regularMarketPrice;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    throw new ProviderError('empty', `Yahoo Finance returned no usable price (${String(price)})`, ticker);
  }

  return { price, dividends: toDividendPayments(result.events?.dividends) };
};

/**
 * Yahoo Finance's unofficial `chart` endpoint: free, no API key, and (unlike FMP's free tier)
 * actually serves the tickers this app tracks. It is not a documented/supported API, so it has no
 * SLA and its shape can change without notice — `fetchChart`'s guards turn any deviation into a
 * `ProviderError` rather than a bad number.
 *
 * One request per ticker carries both price and dividend history, so `fetchQuote` and
 * `fetchDividends` share a per-ticker cache instead of doubling the request count against an
 * unofficial host regardless of which one (or both) the caller invokes.
 */
export const createYahooProvider = ({
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl,
  range = DEFAULT_RANGE
}: YahooProviderOptions = {}): TickerDataProvider => {
  const doFetch: FetchLike = fetchImpl ?? ((url) => fetch(url, { headers: { 'User-Agent': USER_AGENT } }));
  const cache = new Map<string, Promise<ChartData>>();

  const chartFor = (ticker: string): Promise<ChartData> => {
    const cached = cache.get(ticker);
    if (cached !== undefined) return cached;

    const promise = fetchChart(ticker, doFetch, baseUrl, range);
    cache.set(ticker, promise);
    return promise;
  };

  return {
    name: 'yahoo',

    fetchQuote: async (ticker) => {
      const { price } = await chartFor(ticker);
      return price;
    },

    fetchDividends: async (ticker) => {
      const { dividends } = await chartFor(ticker);
      return dividends;
    }
  };
};
