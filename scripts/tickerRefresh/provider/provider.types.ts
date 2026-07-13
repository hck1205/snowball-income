import type { DividendPayment } from '../derive';

/** Minimal `fetch` shape, so tests can inject a fake without pulling in DOM/undici types. */
export type FetchLike = (url: string) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

/**
 * The only network surface of the pipeline. Everything else is pure, so swapping this out
 * (a different vendor, or a fixture in tests) exercises the whole pipeline offline.
 */
export type TickerDataProvider = {
  readonly name: string;
  /** Current price per share. */
  fetchQuote: (ticker: string) => Promise<number>;
  /** Full dividend payment history (most recent years are what matter). */
  fetchDividends: (ticker: string) => Promise<DividendPayment[]>;
};

export type ProviderErrorCode = 'http' | 'rate_limit' | 'empty' | 'malformed' | 'auth';

/** A network/provider failure, normalized so the CLI can report it without vendor specifics. */
export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly ticker: string | null;

  constructor(code: ProviderErrorCode, message: string, ticker: string | null = null) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.ticker = ticker;
  }
}
