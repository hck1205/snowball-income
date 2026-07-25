import { z } from 'zod';
import type { DividendScheduleRecord } from '../derive';
import { ProviderError } from './provider.types';
import type { FetchLike } from './provider.types';

/**
 * Alpha Vantage `DIVIDENDS` — the only source we found that gives the **payment date** for the
 * whole universe.
 *
 * Why not the existing Yahoo provider: its chart endpoint returns ex-dates only. Why not Nasdaq's
 * (keyless, good data): it serves Nasdaq-listed symbols only, and this universe is mostly NYSE Arca
 * (SCHD, VYM, VIG, JEPI, O, SPY all return "not available"). Both were probed before choosing.
 *
 * ## Quota is the design constraint
 * The free tier is **25 requests per day** — a hard daily total, not a rate, and enforced per IP as
 * well as per key (measured; see `ALPHA_VANTAGE_FREE_DAILY_LIMIT`). So this lives behind its own CLI
 * command instead of the daily price refresh: pay dates barely move (SCHD has paid exactly 5 days
 * after the ex-date for years), while prices need refreshing every day.
 */
export type AlphaVantageProviderOptions = {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
};

export type DividendScheduleProvider = {
  readonly name: string;
  /** Full history with both dates, newest first (as the vendor returns it). */
  fetchDividendSchedule: (ticker: string) => Promise<DividendScheduleRecord[]>;
};

const DEFAULT_BASE_URL = 'https://www.alphavantage.co';

/**
 * Free-tier daily request allowance, per Alpha Vantage's support page.
 *
 * ⚠ **Measured**: this cap is enforced per *IP*, not only per key. Two keys were tried from one
 * machine and both stopped at a combined 25 requests — so adding keys buys nothing. Anything that
 * looks like "just use more keys" has already been tested and does not work.
 */
export const ALPHA_VANTAGE_FREE_DAILY_LIMIT = 25;

const recordSchema = z.object({
  ex_dividend_date: z.string(),
  payment_date: z.string(),
  amount: z.string()
});

const responseSchema = z.object({
  symbol: z.string().optional(),
  data: z.array(recordSchema).optional()
});

/**
 * Alpha Vantage signals quota exhaustion and bad keys with **HTTP 200** plus an advisory field
 * (`Information` / `Note` / `Error Message`) — the same trap FMP sets with its `Error Message`.
 *
 * This must be checked *before* parsing: a body with no `data` array would otherwise look like
 * "this ticker has no dividends", and the caller would happily overwrite a real schedule with
 * nothing. Treating it as an error is what makes the pipeline's "on failure, keep the previous
 * value" rule actually protect the data.
 */
const advisoryOf = (body: unknown): string | null => {
  if (typeof body !== 'object' || body === null) return null;
  for (const key of ['Information', 'Note', 'Error Message'] as const) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
};

/**
 * Strips API keys out of a vendor message before it is ever logged.
 *
 * ⚠ Not hypothetical: Alpha Vantage's quota notice literally reads *"We have detected your API key
 * as ABCD1234 and our standard API rate limit is 25 requests per day"*. Printing that verbatim puts
 * the key in terminal scrollback, CI logs, and any transcript — so redaction happens at the point
 * the message enters our code, not at each call site that might forget.
 */
export const redactKey = (message: string, key: string): string =>
  key.length >= 8 ? message.split(key).join('***') : message;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const toRecord = (raw: z.infer<typeof recordSchema>): DividendScheduleRecord | null => {
  // `payment_date` is "None" for a declared-but-unpaid distribution — a real value in the feed,
  // not an error. Skip the row; the rest of the history is still good.
  if (!ISO_DATE.test(raw.ex_dividend_date) || !ISO_DATE.test(raw.payment_date)) return null;

  const amount = Number(raw.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return { exDate: raw.ex_dividend_date, payDate: raw.payment_date, amount };
};

export const createAlphaVantageProvider = ({
  apiKey,
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl
}: AlphaVantageProviderOptions): DividendScheduleProvider => {
  const key = apiKey.trim();
  if (key.length === 0) {
    throw new Error('createAlphaVantageProvider needs an API key');
  }

  const doFetch: FetchLike = fetchImpl ?? ((url) => fetch(url));

  return {
    name: 'alphavantage',

    fetchDividendSchedule: async (ticker: string): Promise<DividendScheduleRecord[]> => {
      const url = `${baseUrl}/query?function=DIVIDENDS&symbol=${encodeURIComponent(ticker)}&apikey=${key}`;

      let response: Awaited<ReturnType<FetchLike>>;
      try {
        response = await doFetch(url);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new ProviderError('http', `network error: ${reason}`, ticker);
      }

      if (!response.ok) {
        throw new ProviderError('http', `HTTP ${response.status}`, ticker);
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new ProviderError('malformed', 'response was not JSON', ticker);
      }

      const advisory = advisoryOf(body);
      if (advisory !== null) {
        // "rate limit" / "25 requests per day" phrasing varies; anything advisory means no data.
        const code = /limit|frequency|premium/i.test(advisory) ? 'rate_limit' : 'auth';
        throw new ProviderError(code, redactKey(advisory, key).slice(0, 200), ticker);
      }

      const parsed = responseSchema.safeParse(body);
      if (!parsed.success) {
        throw new ProviderError('malformed', 'unexpected response shape', ticker);
      }

      const rows = parsed.data.data ?? [];
      return rows.map(toRecord).filter((record): record is DividendScheduleRecord => record !== null);
    }
  };
};
