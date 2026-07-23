import { afterEach, describe, expect, it } from 'vitest';
import { handler } from '@/server/handlers/Fx';
import { apiRequest, restoreApiTestEnvironment, stubFetchRoutes } from './apiHarness';

/**
 * `/api/fx` — 표시 전용 원↔달러 환율 프록시.
 *
 * 핸들러 시그니처가 웹 표준(`(Request) => Promise<Response>`)이라 Vitest 에서 직접 호출한다.
 * upstream 두 곳(open.er-api.com 1순위 / frankfurter 폴백)은 전역 `fetch` 스텁으로 주입한다.
 */

const ER_API = 'open.er-api.com';
const FRANKFURTER = 'frankfurter.dev';

const erApiBody = {
  result: 'success',
  time_last_update_utc: 'Thu, 23 Jul 2026 00:02:31 +0000',
  base_code: 'USD',
  rates: { USD: 1, KRW: 1478.49 }
};

const frankfurterBody = { amount: 1, base: 'USD', date: '2026-07-22', rates: { KRW: 1472.72 } };

const jsonRoute = (when: string, body: unknown, status = 200) => ({
  when,
  respond: () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
});

const throwingRoute = (when: string) => ({
  when,
  respond: () => {
    throw new TypeError(`${when} unreachable`);
  }
});

afterEach(restoreApiTestEnvironment);

describe('api/fx', () => {
  it('1순위(open.er-api.com) 성공을 rate/base/quote/asOf 로 정규화한다', async () => {
    stubFetchRoutes([jsonRoute(ER_API, erApiBody), jsonRoute(FRANKFURTER, frankfurterBody)]);

    const res = await handler(apiRequest('/api/fx'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(body).toEqual({ rate: 1478.49, base: 'USD', quote: 'KRW', asOf: '2026-07-23T00:02:31.000Z' });
  });

  it('성공 응답에 6h/24h ISR 캐시 헤더를 붙인다', async () => {
    stubFetchRoutes([jsonRoute(ER_API, erApiBody)]);

    const res = await handler(apiRequest('/api/fx'));
    const cache = res.headers.get('cache-control') ?? '';

    expect(cache).toContain('s-maxage=21600');
    expect(cache).toContain('stale-while-revalidate=86400');
  });

  it('1순위가 네트워크 장애면 frankfurter 폴백으로 넘어간다', async () => {
    stubFetchRoutes([throwingRoute(ER_API), jsonRoute(FRANKFURTER, frankfurterBody)]);

    const res = await handler(apiRequest('/api/fx'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ rate: 1472.72, base: 'USD', quote: 'KRW', asOf: '2026-07-22T00:00:00.000Z' });
  });

  it("1순위가 result!=='success' 면 폴백한다", async () => {
    stubFetchRoutes([
      jsonRoute(ER_API, { result: 'error', 'error-type': 'unsupported-code' }),
      jsonRoute(FRANKFURTER, frankfurterBody)
    ]);

    const res = await handler(apiRequest('/api/fx'));
    expect((await res.json()).rate).toBe(1472.72);
  });

  it('1순위 응답에 KRW 가 없으면 폴백한다', async () => {
    stubFetchRoutes([
      jsonRoute(ER_API, { result: 'success', time_last_update_utc: 'Thu, 23 Jul 2026 00:02:31 +0000', rates: { USD: 1 } }),
      jsonRoute(FRANKFURTER, frankfurterBody)
    ]);

    const res = await handler(apiRequest('/api/fx'));
    expect((await res.json()).rate).toBe(1472.72);
  });

  it('둘 다 실패하면 가짜 환율 없이 502 + no-store 로 정직하게 실패한다', async () => {
    stubFetchRoutes([throwingRoute(ER_API), throwingRoute(FRANKFURTER)]);

    const res = await handler(apiRequest('/api/fx'));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(body).toEqual({ error: 'fx_unavailable' });
    expect(body).not.toHaveProperty('rate');
  });
});
