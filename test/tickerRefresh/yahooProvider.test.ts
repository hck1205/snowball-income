import { describe, expect, it } from 'vitest';
import { createYahooProvider, ProviderError } from '@/scripts/tickerRefresh';
import type { FetchLike } from '@/scripts/tickerRefresh';

const okResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  json: async () => body
});

/**
 * Shape observed against the real (unofficial) endpoint:
 * `https://query1.finance.yahoo.com/v8/finance/chart/SCHD?interval=1d&range=1y&events=div`.
 * Dates/amounts below are SCHD's actual last three quarterly payments.
 */
const SCHD_CHART_RESPONSE = {
  chart: {
    result: [
      {
        meta: { regularMarketPrice: 32.91, currency: 'USD' },
        events: {
          dividends: {
            '1765324800': { amount: 0.278, date: 1765324800 }, // 2025-12-10
            '1774396800': { amount: 0.257, date: 1774396800 }, // 2026-03-25
            '1782259200': { amount: 0.253, date: 1782259200 } // 2026-06-24
          }
        }
      }
    ],
    error: null
  }
};

describe('createYahooProvider', () => {
  it('reads price and dividends from a single chart response', async () => {
    const urls: string[] = [];
    const fetchImpl: FetchLike = async (url) => {
      urls.push(url);
      return okResponse(SCHD_CHART_RESPONSE);
    };

    const provider = createYahooProvider({ fetchImpl });

    expect(provider.name).toBe('yahoo');
    expect(await provider.fetchQuote('SCHD')).toBe(32.91);
    expect(await provider.fetchDividends('SCHD')).toEqual(
      expect.arrayContaining([
        { date: '2025-12-10', amount: 0.278 },
        { date: '2026-03-25', amount: 0.257 },
        { date: '2026-06-24', amount: 0.253 }
      ])
    );
    expect(urls[0]).toContain('/v8/finance/chart/SCHD');
    expect(urls[0]).toContain('events=div');
  });

  it('fetches a given ticker only once, serving fetchQuote and fetchDividends from the same cache', async () => {
    let calls = 0;
    const fetchImpl: FetchLike = async () => {
      calls += 1;
      return okResponse(SCHD_CHART_RESPONSE);
    };

    const provider = createYahooProvider({ fetchImpl });
    await provider.fetchQuote('SCHD');
    await provider.fetchDividends('SCHD');

    expect(calls).toBe(1);
  });

  it('caches per ticker, so a second ticker still triggers its own request', async () => {
    let calls = 0;
    const fetchImpl: FetchLike = async () => {
      calls += 1;
      return okResponse(SCHD_CHART_RESPONSE);
    };

    const provider = createYahooProvider({ fetchImpl });
    await provider.fetchQuote('SCHD');
    await provider.fetchQuote('JEPI');

    expect(calls).toBe(2);
  });

  it('drops a dividend event with a non-finite or non-positive amount', async () => {
    const fetchImpl: FetchLike = async () =>
      okResponse({
        chart: {
          result: [
            {
              meta: { regularMarketPrice: 32.91 },
              events: {
                dividends: {
                  '1765324800': { amount: 0.278, date: 1765324800 },
                  '1774396800': { amount: 0, date: 1774396800 }
                }
              }
            }
          ],
          error: null
        }
      });

    const provider = createYahooProvider({ fetchImpl });
    expect(await provider.fetchDividends('SCHD')).toEqual([{ date: '2025-12-10', amount: 0.278 }]);
  });

  it('returns no dividends when the chart has no events block (e.g. a non-dividend ticker)', async () => {
    const fetchImpl: FetchLike = async () =>
      okResponse({
        chart: { result: [{ meta: { regularMarketPrice: 100 } }], error: null }
      });

    const provider = createYahooProvider({ fetchImpl });
    expect(await provider.fetchDividends('QQQ')).toEqual([]);
  });

  it('rejects when regularMarketPrice is missing', async () => {
    const fetchImpl: FetchLike = async () =>
      okResponse({ chart: { result: [{ meta: {} }], error: null } });

    const provider = createYahooProvider({ fetchImpl });
    await expect(provider.fetchQuote('SCHD')).rejects.toThrow('no usable price');
  });

  it('rejects when regularMarketPrice is not positive', async () => {
    const fetchImpl: FetchLike = async () =>
      okResponse({ chart: { result: [{ meta: { regularMarketPrice: 0 } }], error: null } });

    const provider = createYahooProvider({ fetchImpl });
    await expect(provider.fetchQuote('SCHD')).rejects.toThrow('no usable price');
  });

  it('rejects when chart.result is empty (unknown ticker)', async () => {
    const fetchImpl: FetchLike = async () => okResponse({ chart: { result: [], error: null } });

    const provider = createYahooProvider({ fetchImpl });
    await expect(provider.fetchQuote('NOPE')).rejects.toThrow('no chart result');
  });

  it('rejects when chart.result is null (unknown ticker, alternate shape)', async () => {
    const fetchImpl: FetchLike = async () => okResponse({ chart: { result: null, error: null } });

    const provider = createYahooProvider({ fetchImpl });
    await expect(provider.fetchQuote('NOPE')).rejects.toThrow('no chart result');
  });

  it('surfaces a Yahoo-reported chart.error', async () => {
    const fetchImpl: FetchLike = async () =>
      okResponse({ chart: { result: null, error: { code: 'Not Found', description: 'No data found, symbol may be delisted' } } });

    const provider = createYahooProvider({ fetchImpl });
    await expect(provider.fetchQuote('DELISTED')).rejects.toThrow('No data found, symbol may be delisted');
  });

  it('turns a 429 into a rate_limit error', async () => {
    const fetchImpl: FetchLike = async () => ({ ok: false, status: 429, json: async () => ({}) });
    const provider = createYahooProvider({ fetchImpl });

    await expect(provider.fetchQuote('SCHD')).rejects.toThrow('Rate limited');
  });

  it('turns a 403 into an auth error', async () => {
    const fetchImpl: FetchLike = async () => ({ ok: false, status: 403, json: async () => ({}) });
    const provider = createYahooProvider({ fetchImpl });

    await expect(provider.fetchQuote('SCHD')).rejects.toThrow('rejected the request');
  });

  it('errors on an unexpected payload shape', async () => {
    const fetchImpl: FetchLike = async () => okResponse({ unexpected: true });
    const provider = createYahooProvider({ fetchImpl });

    await expect(provider.fetchQuote('SCHD')).rejects.toThrow('Unexpected chart payload');
  });

  it('turns a non-JSON body into a malformed error', async () => {
    const fetchImpl: FetchLike = async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('not json');
      }
    });
    const provider = createYahooProvider({ fetchImpl });

    await expect(provider.fetchQuote('SCHD')).rejects.toThrow('non-JSON body');
  });

  it('converts a network throw into a ProviderError', async () => {
    const fetchImpl: FetchLike = async () => {
      throw new Error('ECONNRESET');
    };
    const provider = createYahooProvider({ fetchImpl });

    await expect(provider.fetchQuote('SCHD')).rejects.toBeInstanceOf(ProviderError);
    await expect(provider.fetchQuote('SCHD')).rejects.toThrow('Request failed: ECONNRESET');
  });
});
