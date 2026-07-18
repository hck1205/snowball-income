import { z } from 'zod';
import type { DividendPayment } from '../derive';
import { ProviderError } from './provider.types';
import type { FetchLike, TickerDataProvider } from './provider.types';

/**
 * FMP is migrating from the legacy `/api/v3/...` endpoints to `/stable/...`, and the two return
 * different shapes. Both are implemented so the pipeline can be switched with one env var instead
 * of a code change when the migration completes.
 */
export type FmpApiVariant = 'stable' | 'legacy';

export type FmpProviderOptions = {
  apiKey: string;
  variant?: FmpApiVariant;
  baseUrl?: string;
  fetchImpl?: FetchLike;
};

const DEFAULT_BASE_URL = 'https://financialmodelingprep.com';

/** FMP reports errors as a 200 with an `Error Message` body, so it needs an explicit check. */
const fmpErrorSchema = z.object({ 'Error Message': z.string() });

const stableQuoteSchema = z.array(z.object({ price: z.number().nullable() }));
const legacyQuoteSchema = z.array(z.object({ price: z.number().nullable() }));

const dividendRecordSchema = z.object({
  date: z.string(),
  dividend: z.number().nullable().optional(),
  adjDividend: z.number().nullable().optional()
});

const stableDividendsSchema = z.array(dividendRecordSchema);
const legacyDividendsSchema = z.object({ historical: z.array(dividendRecordSchema).optional() });

/** Prefers the split-adjusted amount so a historical split cannot fake a dividend cut in the CAGR. */
const toPayment = (record: z.infer<typeof dividendRecordSchema>): DividendPayment | null => {
  const adjusted = record.adjDividend;
  const raw = record.dividend;
  const amount =
    typeof adjusted === 'number' && Number.isFinite(adjusted) && adjusted > 0 ? adjusted : raw;

  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null;
  return { date: record.date, amount };
};

export const createFmpProvider = ({
  apiKey,
  variant = 'stable',
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl
}: FmpProviderOptions): TickerDataProvider => {
  const doFetch: FetchLike = fetchImpl ?? ((url) => fetch(url));

  const requestJson = async (url: string, ticker: string): Promise<unknown> => {
    let response: Awaited<ReturnType<FetchLike>>;
    try {
      response = await doFetch(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ProviderError('http', `Request failed: ${message}`, ticker);
    }

    if (response.status === 429) {
      throw new ProviderError('rate_limit', 'Rate limited by FMP (429)', ticker);
    }
    if (response.status === 401 || response.status === 403) {
      throw new ProviderError('auth', `FMP rejected the API key (${response.status})`, ticker);
    }
    if (!response.ok) {
      throw new ProviderError('http', `FMP returned HTTP ${response.status}`, ticker);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ProviderError('malformed', 'FMP returned a non-JSON body', ticker);
    }

    const asError = fmpErrorSchema.safeParse(body);
    if (asError.success) {
      throw new ProviderError('auth', `FMP error: ${asError.data['Error Message']}`, ticker);
    }

    return body;
  };

  const quoteUrl = (ticker: string): string =>
    variant === 'stable'
      ? `${baseUrl}/stable/quote?symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`
      : `${baseUrl}/api/v3/quote/${encodeURIComponent(ticker)}?apikey=${apiKey}`;

  const dividendsUrl = (ticker: string): string =>
    variant === 'stable'
      ? `${baseUrl}/stable/dividends?symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`
      : `${baseUrl}/api/v3/historical-price-full/stock_dividend/${encodeURIComponent(ticker)}?apikey=${apiKey}`;

  return {
    name: `fmp:${variant}`,

    fetchQuote: async (ticker) => {
      const body = await requestJson(quoteUrl(ticker), ticker);
      const schema = variant === 'stable' ? stableQuoteSchema : legacyQuoteSchema;
      const parsed = schema.safeParse(body);

      if (!parsed.success) {
        throw new ProviderError('malformed', 'Unexpected quote payload shape', ticker);
      }
      if (parsed.data.length === 0) {
        throw new ProviderError('empty', 'FMP returned no quote (unknown ticker?)', ticker);
      }

      const price = parsed.data[0].price;
      if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
        throw new ProviderError('empty', `FMP returned no usable price (${String(price)})`, ticker);
      }

      return price;
    },

    fetchDividends: async (ticker) => {
      const body = await requestJson(dividendsUrl(ticker), ticker);

      const records =
        variant === 'stable'
          ? stableDividendsSchema.safeParse(body).data
          : legacyDividendsSchema.safeParse(body).data?.historical;

      if (records === undefined) {
        throw new ProviderError('malformed', 'Unexpected dividends payload shape', ticker);
      }

      return records
        .map(toPayment)
        .filter((payment): payment is DividendPayment => payment !== null);
    }
  };
};
