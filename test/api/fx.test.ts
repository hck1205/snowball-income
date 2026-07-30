// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { afterEach, describe, expect, it } from 'vitest';
import { handler } from '@/server/handlers/Fx';
import { apiRequest, restoreApiTestEnvironment, stubFetchRoutes } from './apiHarness';

/**
 * `/api/fx` — 표시 전용 원↔달러 환율 프록시.
 *
 * 핸들러 시그니처가 웹 표준(`(Request) => Promise<Response>`)이라 Vitest 에서 직접 호출한다.
 * upstream 세 곳(Yahoo 1순위 / open.er-api.com 폴백1 / frankfurter 폴백2)은 전역 `fetch` 스텁으로 주입한다.
 * ⚠ 실제 네트워크로 나가는 호출은 하나도 없다(하네스가 미스텁 URL 을 에러로 떨어뜨린다).
 */

const YAHOO = 'query1.finance.yahoo.com';
const ER_API = 'open.er-api.com';
const FRANKFURTER = 'frankfurter.dev';

/** 2026-07-27 실측 응답의 축약본. `meta` 한 곳에 당일가·전일종가·갱신시각이 다 있다. */
const yahooBody = (meta: Record<string, unknown>) => ({ chart: { result: [{ meta }], error: null } });

const YAHOO_META = {
  currency: 'KRW',
  symbol: 'KRW=X',
  regularMarketPrice: 1469.98,
  chartPreviousClose: 1474.04,
  /** 2026-07-27T00:00:00.000Z (unix 초 — Yahoo 는 as-of 를 이 형태로 준다) */
  regularMarketTime: 1785110400
};

const YAHOO_AS_OF = '2026-07-27T00:00:00.000Z';

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

/** 전일 종가로 실을 수 없는 값들(유한한 양수만 싣는 계약). */
const INVALID_PREVIOUS_CLOSE: Array<[string, unknown]> = [
  ['0', 0],
  ['음수', -12],
  ['숫자가 아닌 값', '1474.04'],
  ['null', null]
];

const throwingRoute = (when: string) => ({
  when,
  respond: () => {
    throw new TypeError(`${when} unreachable`);
  }
});

afterEach(restoreApiTestEnvironment);

describe('api/fx', () => {
  it('1순위(Yahoo) 성공은 당일 환율과 전일 종가를 같은 스냅샷으로 싣는다', async () => {
    stubFetchRoutes([
      jsonRoute(YAHOO, yahooBody(YAHOO_META)),
      jsonRoute(ER_API, erApiBody),
      jsonRoute(FRANKFURTER, frankfurterBody)
    ]);

    const res = await handler(apiRequest('/api/fx'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(body).toEqual({
      rate: 1469.98,
      base: 'USD',
      quote: 'KRW',
      asOf: YAHOO_AS_OF,
      previousClose: 1474.04
    });
  });

  it('Yahoo 는 브라우저 UA 를 붙여 부른다(없으면 거부당한다)', async () => {
    const stub = stubFetchRoutes([jsonRoute(YAHOO, yahooBody(YAHOO_META)), jsonRoute(ER_API, erApiBody)]);

    await handler(apiRequest('/api/fx'));

    const [yahooCall] = stub.callsMatching(YAHOO);
    expect(yahooCall).toBeDefined();
    expect(yahooCall.headers['user-agent']).toContain('Mozilla/5.0');
  });

  it('Yahoo 는 KRW=X chart 를 range=2d 로 부른다 (전일 종가가 같은 응답에 실리는 조건)', async () => {
    const stub = stubFetchRoutes([jsonRoute(YAHOO, yahooBody(YAHOO_META)), jsonRoute(ER_API, erApiBody)]);

    await handler(apiRequest('/api/fx'));

    /*
     * range 를 1d 로 줄이거나 심볼을 바꾸면 `chartPreviousClose` 가 사라져 **변동률만 조용히 증발**한다
     * (환율 자체는 계속 나와서 화면상 정상으로 보인다 = 회귀를 눈으로 못 잡는 종류).
     */
    const [yahooCall] = stub.callsMatching(YAHOO);
    expect(yahooCall.url).toContain('/v8/finance/chart/KRW=X');
    expect(yahooCall.url).toContain('range=2d');
  });

  it('Yahoo 와 er-api 를 병렬로 부른다(순차였다면 Yahoo 성공 시 er-api 호출이 없다)', async () => {
    const stub = stubFetchRoutes([jsonRoute(YAHOO, yahooBody(YAHOO_META)), jsonRoute(ER_API, erApiBody)]);

    await handler(apiRequest('/api/fx'));

    expect(stub.callsMatching(YAHOO)).toHaveLength(1);
    expect(stub.callsMatching(ER_API)).toHaveLength(1);
    // 1순위가 완비돼 있으면 폴백2(frankfurter)는 추가 4초를 쓰지 않는다.
    expect(stub.callsMatching(FRANKFURTER)).toHaveLength(0);
  });

  it('성공 응답에 6h/24h ISR 캐시 헤더를 붙인다', async () => {
    stubFetchRoutes([jsonRoute(YAHOO, yahooBody(YAHOO_META)), jsonRoute(ER_API, erApiBody)]);

    const res = await handler(apiRequest('/api/fx'));
    const cache = res.headers.get('cache-control') ?? '';

    expect(cache).toContain('s-maxage=21600');
    expect(cache).toContain('stale-while-revalidate=86400');
  });

  it('Yahoo 가 실패하면 er-api 로 폴백하고 previousClose 키 자체가 없다(부분 실패 허용)', async () => {
    stubFetchRoutes([throwingRoute(YAHOO), jsonRoute(ER_API, erApiBody), jsonRoute(FRANKFURTER, frankfurterBody)]);

    const res = await handler(apiRequest('/api/fx'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ rate: 1478.49, base: 'USD', quote: 'KRW', asOf: '2026-07-23T00:02:31.000Z' });
    expect(body).not.toHaveProperty('previousClose');
  });

  it('Yahoo 가 chartPreviousClose 를 안 주면 환율만 싣는다(전체 실패로 만들지 않는다)', async () => {
    const { chartPreviousClose: _dropped, ...metaWithoutPreviousClose } = YAHOO_META;
    stubFetchRoutes([
      jsonRoute(YAHOO, yahooBody(metaWithoutPreviousClose)),
      jsonRoute(ER_API, erApiBody),
      jsonRoute(FRANKFURTER, frankfurterBody)
    ]);

    const res = await handler(apiRequest('/api/fx'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).not.toHaveProperty('previousClose');
    // 전일 종가가 없으면 Yahoo 를 고집하지 않고 er-api(rate only)를 채택한다.
    expect(body.rate).toBe(1478.49);
  });

  it('Yahoo 에 전일 종가가 없고 er-api 도 실패하면 Yahoo 의 환율만 쓴다(frankfurter 까지 안 간다)', async () => {
    const { chartPreviousClose: _dropped, ...metaWithoutPreviousClose } = YAHOO_META;
    const stub = stubFetchRoutes([
      jsonRoute(YAHOO, yahooBody(metaWithoutPreviousClose)),
      throwingRoute(ER_API),
      jsonRoute(FRANKFURTER, frankfurterBody)
    ]);

    const body = await (await handler(apiRequest('/api/fx'))).json();

    expect(body).toEqual({ rate: 1469.98, base: 'USD', quote: 'KRW', asOf: YAHOO_AS_OF });
    expect(stub.callsMatching(FRANKFURTER)).toHaveLength(0);
  });

  it.each(INVALID_PREVIOUS_CLOSE)('Yahoo 의 chartPreviousClose 가 %s 면 그 키를 생략한다', async (_label, chartPreviousClose) => {
    stubFetchRoutes([
      jsonRoute(YAHOO, yahooBody({ ...YAHOO_META, chartPreviousClose })),
      throwingRoute(ER_API),
      jsonRoute(FRANKFURTER, frankfurterBody)
    ]);

    const body = await (await handler(apiRequest('/api/fx'))).json();

    expect(body.rate).toBe(1469.98);
    expect(body).not.toHaveProperty('previousClose');
  });

  it('Yahoo 가 regularMarketTime 을 안 주면 as-of 를 지어내지 않고 폴백한다', async () => {
    const { regularMarketTime: _dropped, ...metaWithoutTime } = YAHOO_META;
    stubFetchRoutes([
      jsonRoute(YAHOO, yahooBody(metaWithoutTime)),
      jsonRoute(ER_API, erApiBody),
      jsonRoute(FRANKFURTER, frankfurterBody)
    ]);

    const body = await (await handler(apiRequest('/api/fx'))).json();

    expect(body).toEqual({ rate: 1478.49, base: 'USD', quote: 'KRW', asOf: '2026-07-23T00:02:31.000Z' });
  });

  it('Yahoo 응답 형태가 어긋나도(chart.result 없음) 폴백으로 살아남는다', async () => {
    stubFetchRoutes([
      jsonRoute(YAHOO, { chart: { result: null, error: { code: 'Not Found' } } }),
      jsonRoute(ER_API, erApiBody),
      jsonRoute(FRANKFURTER, frankfurterBody)
    ]);

    const body = await (await handler(apiRequest('/api/fx'))).json();
    expect(body.rate).toBe(1478.49);
  });

  it('Yahoo·er-api 가 모두 실패하면 frankfurter 폴백으로 넘어간다', async () => {
    stubFetchRoutes([throwingRoute(YAHOO), throwingRoute(ER_API), jsonRoute(FRANKFURTER, frankfurterBody)]);

    const res = await handler(apiRequest('/api/fx'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ rate: 1472.72, base: 'USD', quote: 'KRW', asOf: '2026-07-22T00:00:00.000Z' });
  });

  it("er-api 가 result!=='success' 면 폴백한다", async () => {
    stubFetchRoutes([
      throwingRoute(YAHOO),
      jsonRoute(ER_API, { result: 'error', 'error-type': 'unsupported-code' }),
      jsonRoute(FRANKFURTER, frankfurterBody)
    ]);

    const res = await handler(apiRequest('/api/fx'));
    expect((await res.json()).rate).toBe(1472.72);
  });

  it('er-api 응답에 KRW 가 없으면 폴백한다', async () => {
    stubFetchRoutes([
      throwingRoute(YAHOO),
      jsonRoute(ER_API, { result: 'success', time_last_update_utc: 'Thu, 23 Jul 2026 00:02:31 +0000', rates: { USD: 1 } }),
      jsonRoute(FRANKFURTER, frankfurterBody)
    ]);

    const res = await handler(apiRequest('/api/fx'));
    expect((await res.json()).rate).toBe(1472.72);
  });

  it('셋 다 실패하면 가짜 환율 없이 502 + no-store 로 정직하게 실패한다', async () => {
    stubFetchRoutes([throwingRoute(YAHOO), throwingRoute(ER_API), throwingRoute(FRANKFURTER)]);

    const res = await handler(apiRequest('/api/fx'));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(body).toEqual({ error: 'fx_unavailable' });
    expect(body).not.toHaveProperty('rate');
    expect(body).not.toHaveProperty('previousClose');
  });
});
