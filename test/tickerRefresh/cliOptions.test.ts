import { describe, expect, it } from 'vitest';
import { createFmpProvider, DEFAULT_CLI_OPTIONS, parseCliArgs, serializeSnapshot } from '@/scripts/tickerRefresh';
import type { FetchLike } from '@/scripts/tickerRefresh';

const okResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  json: async () => body
});

describe('parseCliArgs', () => {
  it('defaults to a dry run, so an accidental run cannot rewrite the snapshot', () => {
    const parsed = parseCliArgs([]);
    expect(parsed).toEqual({ ok: true, value: DEFAULT_CLI_OPTIONS });
    expect(parsed.ok && parsed.value.dryRun).toBe(true);
  });

  it('writes only when asked', () => {
    const parsed = parseCliArgs(['--write']);
    expect(parsed.ok && parsed.value.dryRun).toBe(false);
  });

  it('parses --only into upper-cased tickers', () => {
    const parsed = parseCliArgs(['--only=schd, jepi']);
    expect(parsed.ok && parsed.value.only).toEqual(['SCHD', 'JEPI']);
  });

  it('parses the remaining flags', () => {
    const parsed = parseCliArgs(['--variant=legacy', '--cagr-years=3', '--delay=0', '--as-of=2026-01-02']);
    expect(parsed.ok && parsed.value).toMatchObject({
      variant: 'legacy',
      cagrYears: 3,
      delayMs: 0,
      asOf: '2026-01-02'
    });
  });

  it.each([
    ['--only='],
    ['--variant=yahoo'],
    ['--cagr-years=0'],
    ['--cagr-years=abc'],
    ['--delay=-1'],
    ['--as-of=2026/01/02'],
    ['--nope']
  ])('rejects %s', (arg) => {
    expect(parseCliArgs([arg]).ok).toBe(false);
  });
});

describe('serializeSnapshot', () => {
  it('sorts tickers so generated diffs stay reviewable', () => {
    const json = serializeSnapshot({
      asOf: '2026-07-14',
      source: 'fmp',
      entries: { JEPI: { a: 1 }, SCHD: { a: 2 }, AAPL: { a: 3 } }
    });

    expect(Object.keys(JSON.parse(json).entries)).toEqual(['AAPL', 'JEPI', 'SCHD']);
    expect(json.endsWith('\n')).toBe(true);
  });
});

describe('createFmpProvider', () => {
  it('reads the stable endpoint shape', async () => {
    const urls: string[] = [];
    const fetchImpl: FetchLike = async (url) => {
      urls.push(url);
      if (url.includes('/stable/quote')) return okResponse([{ price: 32.1 }]);
      return okResponse([{ date: '2026-06-20', dividend: 0.3, adjDividend: 0.28 }]);
    };

    const provider = createFmpProvider({ apiKey: 'k', variant: 'stable', fetchImpl });

    expect(await provider.fetchQuote('SCHD')).toBe(32.1);
    expect(await provider.fetchDividends('SCHD')).toEqual([{ date: '2026-06-20', amount: 0.28 }]);
    expect(provider.name).toBe('fmp:stable');
    expect(urls[0]).toContain('/stable/quote?symbol=SCHD');
  });

  it('reads the legacy endpoint shape', async () => {
    const fetchImpl: FetchLike = async (url) => {
      if (url.includes('/api/v3/quote/')) return okResponse([{ price: 32.1 }]);
      return okResponse({ symbol: 'SCHD', historical: [{ date: '2026-06-20', dividend: 0.3 }] });
    };

    const provider = createFmpProvider({ apiKey: 'k', variant: 'legacy', fetchImpl });

    expect(await provider.fetchQuote('SCHD')).toBe(32.1);
    expect(await provider.fetchDividends('SCHD')).toEqual([{ date: '2026-06-20', amount: 0.3 }]);
    expect(provider.name).toBe('fmp:legacy');
  });

  it('turns a 429 into a rate_limit error', async () => {
    const fetchImpl: FetchLike = async () => ({ ok: false, status: 429, json: async () => ({}) });
    const provider = createFmpProvider({ apiKey: 'k', fetchImpl });

    await expect(provider.fetchQuote('SCHD')).rejects.toThrow('Rate limited');
  });

  it('turns a 401 into an auth error', async () => {
    const fetchImpl: FetchLike = async () => ({ ok: false, status: 401, json: async () => ({}) });
    const provider = createFmpProvider({ apiKey: 'bad', fetchImpl });

    await expect(provider.fetchQuote('SCHD')).rejects.toThrow('rejected the API key');
  });

  it('surfaces an FMP error body returned with a 200', async () => {
    const fetchImpl: FetchLike = async () => okResponse({ 'Error Message': 'Invalid API KEY' });
    const provider = createFmpProvider({ apiKey: 'bad', fetchImpl });

    await expect(provider.fetchQuote('SCHD')).rejects.toThrow('Invalid API KEY');
  });

  it('treats an empty quote array as an error rather than a zero price', async () => {
    const fetchImpl: FetchLike = async () => okResponse([]);
    const provider = createFmpProvider({ apiKey: 'k', fetchImpl });

    await expect(provider.fetchQuote('NOPE')).rejects.toThrow('no quote');
  });

  it('rejects a null price instead of passing it downstream', async () => {
    const fetchImpl: FetchLike = async () => okResponse([{ price: null }]);
    const provider = createFmpProvider({ apiKey: 'k', fetchImpl });

    await expect(provider.fetchQuote('SCHD')).rejects.toThrow('no usable price');
  });

  it('errors on an unexpected payload shape', async () => {
    const fetchImpl: FetchLike = async () => okResponse({ unexpected: true });
    const provider = createFmpProvider({ apiKey: 'k', fetchImpl });

    await expect(provider.fetchQuote('SCHD')).rejects.toThrow('Unexpected quote payload');
  });

  it('drops unusable dividend records', async () => {
    const fetchImpl: FetchLike = async () =>
      okResponse([
        { date: '2026-06-20', dividend: 0.3, adjDividend: null },
        { date: '2026-03-20', dividend: null, adjDividend: null },
        { date: '2026-01-20', dividend: 0, adjDividend: 0 }
      ]);
    const provider = createFmpProvider({ apiKey: 'k', fetchImpl });

    expect(await provider.fetchDividends('SCHD')).toEqual([{ date: '2026-06-20', amount: 0.3 }]);
  });

  it('converts a network throw into a ProviderError', async () => {
    const fetchImpl: FetchLike = async () => {
      throw new Error('ECONNRESET');
    };
    const provider = createFmpProvider({ apiKey: 'k', fetchImpl });

    await expect(provider.fetchQuote('SCHD')).rejects.toThrow('Request failed: ECONNRESET');
  });
});
