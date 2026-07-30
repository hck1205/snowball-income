// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync, readdirSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { handler } from '@/server/handlers/MarketIndices';
import { MARKET_INDEX_SYMBOLS, type MarketIndexSymbol } from '@/shared/lib/marketIndices';
import { apiRequest, restoreApiTestEnvironment, stubFetchRoutes, type FetchRoute } from './apiHarness';

/**
 * `/api/market-indices` — 표시 전용 주요 지수 시세 프록시.
 *
 * 핸들러 시그니처가 웹 표준(`(Request) => Promise<Response>`)이라 Vitest 에서 그대로 호출한다.
 * upstream(Yahoo chart) 은 전역 `fetch` 스텁으로 심볼별로 주입한다 — 실제 네트워크는 절대 나가지 않는다.
 */

/** 실측(2026-07-27) 값 그대로. 스텁 응답을 프로덕션 형태와 같게 유지한다. */
const FIXTURE: Record<MarketIndexSymbol, { price: number; previousClose: number; currency: string }> = {
  '^GSPC': { price: 7419.65, previousClose: 7408.3, currency: 'USD' },
  '^IXIC': { price: 24953.08, previousClose: 25137.69, currency: 'USD' },
  '^KS11': { price: 6755.75, previousClose: 7096.89, currency: 'KRW' },
  '^KQ11': { price: 764.86, previousClose: 790.28, currency: 'KRW' },
  '^N225': { price: 64931.19, previousClose: 64611.15, currency: 'JPY' }
};

const MARKET_TIME_SECONDS = 1_785_000_000;

const chartBody = (symbol: MarketIndexSymbol, overrides: Record<string, unknown> = {}) => ({
  chart: {
    result: [
      {
        meta: {
          currency: FIXTURE[symbol].currency,
          symbol,
          regularMarketPrice: FIXTURE[symbol].price,
          chartPreviousClose: FIXTURE[symbol].previousClose,
          regularMarketTime: MARKET_TIME_SECONDS,
          ...overrides
        }
      }
    ],
    error: null
  }
});

/** upstream URL 은 `^` 가 인코딩돼 있어(`%5E`) 매칭도 인코딩된 형태로 한다. */
const encoded = (symbol: MarketIndexSymbol) => encodeURIComponent(symbol);

const okRoute = (symbol: MarketIndexSymbol, body: unknown = chartBody(symbol)): FetchRoute => ({
  when: encoded(symbol),
  respond: () => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
});

const statusRoute = (symbol: MarketIndexSymbol, status: number): FetchRoute => ({
  when: encoded(symbol),
  respond: () => new Response('nope', { status })
});

const throwingRoute = (symbol: MarketIndexSymbol): FetchRoute => ({
  when: encoded(symbol),
  respond: () => {
    throw new TypeError(`${symbol} unreachable`);
  }
});

const allOkRoutes = (): FetchRoute[] => MARKET_INDEX_SYMBOLS.map((symbol) => okRoute(symbol));

type ResponseBody = {
  asOf: string;
  requested: MarketIndexSymbol[];
  indices: { symbol: MarketIndexSymbol; price: number; previousClose?: number; currency?: string; asOf?: string }[];
};

afterEach(restoreApiTestEnvironment);

describe('api/market-indices', () => {
  it('5심볼이 모두 성공하면 200 + 레지스트리 순서대로 5개를 싣는다', async () => {
    stubFetchRoutes(allOkRoutes());

    const res = await handler(apiRequest('/api/market-indices'));
    const body = (await res.json()) as ResponseBody;

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(body.indices.map((quote) => quote.symbol)).toEqual([...MARKET_INDEX_SYMBOLS]);
    expect(body.requested).toEqual([...MARKET_INDEX_SYMBOLS]);
    expect(body.indices[0]).toEqual({
      symbol: '^GSPC',
      price: 7419.65,
      previousClose: 7408.3,
      currency: 'USD',
      asOf: new Date(MARKET_TIME_SECONDS * 1000).toISOString()
    });
    expect(Number.isNaN(new Date(body.asOf).getTime())).toBe(false);
  });

  it('완전 성공 응답에 15분/24시간 ISR 캐시 헤더를 붙인다', async () => {
    stubFetchRoutes(allOkRoutes());

    const res = await handler(apiRequest('/api/market-indices'));
    const cache = res.headers.get('cache-control') ?? '';

    expect(cache).toContain('s-maxage=900');
    expect(cache).toContain('stale-while-revalidate=86400');
  });

  it('심볼의 ^ 를 %5E 로 인코딩해 심볼당 한 번씩만 조회한다', async () => {
    const stub = stubFetchRoutes(allOkRoutes());

    await handler(apiRequest('/api/market-indices'));

    expect(stub.calls).toHaveLength(MARKET_INDEX_SYMBOLS.length);
    for (const call of stub.calls) {
      expect(call.url).toContain('%5E');
      expect(call.url).not.toMatch(/chart\/\^/);
      expect(call.url).toContain('range=2d');
    }
  });

  it('upstream 요청에 브라우저 형태의 User-Agent 를 반드시 싣는다', async () => {
    const stub = stubFetchRoutes(allOkRoutes());

    await handler(apiRequest('/api/market-indices'));

    // 빠지면 Yahoo 가 거부해 **프로덕션에서만** 조용히 죽는다.
    for (const call of stub.calls) {
      expect(call.headers['user-agent'] ?? '').toContain('Mozilla/5.0');
    }
  });

  it('일부만 성공하면(네트워크 장애·비200·형태 이상) 성공분만 200 으로 싣고 5분 캐시를 건다', async () => {
    stubFetchRoutes([
      okRoute('^GSPC'),
      okRoute('^IXIC'),
      okRoute('^KS11'),
      throwingRoute('^KQ11'),
      statusRoute('^N225', 503)
    ]);

    const res = await handler(apiRequest('/api/market-indices'));
    const body = (await res.json()) as ResponseBody;
    const cache = res.headers.get('cache-control') ?? '';

    expect(res.status).toBe(200);
    expect(body.indices.map((quote) => quote.symbol)).toEqual(['^GSPC', '^IXIC', '^KS11']);
    expect(body.requested).toEqual([...MARKET_INDEX_SYMBOLS]);
    // 빠진 심볼은 키 자체가 없다(0 으로 위장하지 않는다).
    expect(body.indices.some((quote) => quote.symbol === '^KQ11')).toBe(false);
    expect(cache).toContain('s-maxage=300');
    expect(cache).toContain('stale-while-revalidate=86400');
  });

  it('응답 형태가 어긋난 심볼(결과 배열 없음·가격 없음)만 빠지고 나머지는 산다', async () => {
    stubFetchRoutes([
      okRoute('^GSPC'),
      okRoute('^IXIC', { chart: { result: null, error: null } }),
      okRoute('^KS11', { chart: { result: [{ meta: { currency: 'KRW' } }], error: null } }),
      okRoute('^KQ11', { chart: { result: [], error: { code: 'Not Found' } } }),
      okRoute('^N225', 'not json at all')
    ]);

    const res = await handler(apiRequest('/api/market-indices'));
    const body = (await res.json()) as ResponseBody;

    expect(res.status).toBe(200);
    expect(body.indices.map((quote) => quote.symbol)).toEqual(['^GSPC']);
  });

  it('chartPreviousClose 가 없는 심볼은 previousClose 키 없이 실린다(전체 실패 아님)', async () => {
    stubFetchRoutes([
      okRoute('^GSPC', chartBody('^GSPC', { chartPreviousClose: null })),
      okRoute('^IXIC'),
      okRoute('^KS11'),
      okRoute('^KQ11'),
      okRoute('^N225')
    ]);

    const res = await handler(apiRequest('/api/market-indices'));
    const body = (await res.json()) as ResponseBody;
    const sp500 = body.indices.find((quote) => quote.symbol === '^GSPC');

    expect(res.status).toBe(200);
    expect(sp500?.price).toBe(7419.65);
    expect(sp500 && 'previousClose' in sp500).toBe(false);
    expect(body.indices).toHaveLength(5);
  });

  it('regularMarketTime 이 없으면 asOf 키를 지어내지 않는다', async () => {
    stubFetchRoutes([
      okRoute('^GSPC', chartBody('^GSPC', { regularMarketTime: undefined })),
      okRoute('^IXIC'),
      okRoute('^KS11'),
      okRoute('^KQ11'),
      okRoute('^N225')
    ]);

    const res = await handler(apiRequest('/api/market-indices'));
    const body = (await res.json()) as ResponseBody;
    const sp500 = body.indices.find((quote) => quote.symbol === '^GSPC');

    expect(sp500 && 'asOf' in sp500).toBe(false);
  });

  it('전부 실패하면 가짜 시세 없이 502 + no-store 로 정직하게 실패한다', async () => {
    stubFetchRoutes(MARKET_INDEX_SYMBOLS.map((symbol) => throwingRoute(symbol)));

    const res = await handler(apiRequest('/api/market-indices'));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(body).toEqual({ error: 'market_indices_unavailable' });
    expect(body).not.toHaveProperty('indices');
  });
});

/**
 * 주석은 검사 대상이 아니다 — 아래 두 가드가 보는 폴더의 주석이 바로 이 제약을 **설명**하고 있기 때문이다
 * (설명 문장에 걸려 거짓 실패하면, 다음 사람이 가드를 무력화하는 쪽으로 "고치게" 된다).
 * 블록 주석 + 줄 주석 둘 다 지우되, 줄 주석은 `https://` 같은 URL 을 자르지 않게 `:` 뒤는 건드리지 않는다.
 */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/**
 * import 지정자 추출기 — **정적 3형태**와 **동적 1형태**를 나눠 둔다. 아래 두 가드가 같은 정규식을
 * 공유하되 판정만 다르게 한다.
 *   · `shared/lib/marketIndices` 순수성 → 네 형태 **전부** 금지(외부 모듈을 아예 안 들인다)
 *   · `jotai/snowball/atoms/*` 계측 지연 → **정적 3형태만** 금지, 동적 import 는 오히려 정답
 *
 * ⚠ `matchAll` 은 정규식을 복제해 돌리므로(원본 `lastIndex` 불변) 모듈 스코프에서 공유해도 안전하다.
 */
const STATIC_SPECIFIER_PATTERNS = [
  /\bfrom\s*['"]([^'"]+)['"]/g, // import / re-export (`import x from` · `export * from`)
  /\bimport\s+['"]([^'"]+)['"]/g, // 사이드이펙트 import (from 절이 없다)
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g // CJS
];

/**
 * `await import('…')` · `typeof import('…')` — 번들러가 별도 청크로 떼어내 **모듈 평가를 호출 시점까지
 * 미룬다**. 서버 번들에 실려도 그 코드가 실행되지 않는 한 평가되지 않는다.
 */
const DYNAMIC_SPECIFIER_PATTERN = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

/**
 * 폴더 안의 소스 파일 경로를 **하위 폴더까지** 모은다.
 *
 * `readdirSync` 는 기본이 비재귀라, 폴더가 자라 `…/sub/x.ts` 가 생기는 순간 그 파일이 조용히 검사 밖에
 * 남는다(가드가 초록인 채로 커버리지만 줄어드는 최악의 실패 방식). 윈도우는 `\` 로 돌려주므로
 * `/` 로 정규화해 메시지·경로 조립을 플랫폼과 무관하게 만든다.
 */
const sourceFilesIn = (directory: string): string[] =>
  readdirSync(directory, { encoding: 'utf8', recursive: true })
    .map((name) => name.replace(/\\/g, '/'))
    .filter((name) => /\.tsx?$/.test(name))
    .map((name) => `${directory}/${name}`);

/**
 * 🔴 서버 번들 안전장치.
 *
 * 핸들러가 `@/shared/lib/marketIndices` 를 import 하므로, 그 폴더에 React·`import.meta.env`·다른 앱 배럴이
 * (전이 의존으로라도) 새어 들어오면 Vercel Node 함수가 **모듈 평가 단계에서** 죽는다 — 그때는 테스트도
 * 빌드도 통과한 뒤라 프로덕션에서만 드러난다. 그래서 그 폴더의 import 문 자체를 기계적으로 막는다.
 */
describe('shared/lib/marketIndices 순수성(서버 번들 안전)', () => {
  const DIRECTORY = 'shared/lib/marketIndices';

  /**
   * 🔴 순수성 위반 스캐너.
   *
   * `from '…'` 하나만 보면 **구멍이 세 개** 난다(2026-07-28 뮤테이션 테스트로 실증: 아래 셋을 넣어도
   * 가드가 초록이었다). 셋 다 번들러가 그대로 끌고 오므로 `import.meta.env` 를 전이로 들여오는
   * 실제 벡터다 — 특히 `import '@/shared/lib/analytics'` 는 그 파일이 모듈 최상단에서
   * `import.meta.env.VITE_*` 를 읽어 Vercel Node 런타임을 모듈 평가 단계에 죽인다.
   *   ① 사이드이펙트 import — `import '@/…'` (from 절이 없다)
   *   ② 동적 import      — `await import('@/…')`
   *   ③ 큰따옴표 지정자   — `from "@/…"` (prettier 가 고쳐 주지만 가드가 그걸 믿으면 안 된다)
   * 여기에 `require('…')` 까지 더해 네 형태를 전부 본다.
   */
  const findPurityViolations = (rawSource: string): string[] => {
    const source = stripComments(rawSource);
    const violations: string[] = [];

    const SPECIFIER_PATTERNS = [...STATIC_SPECIFIER_PATTERNS, DYNAMIC_SPECIFIER_PATTERN];

    for (const pattern of SPECIFIER_PATTERNS) {
      for (const match of source.matchAll(pattern)) {
        // 같은 폴더 안의 상대 import 만 허용한다(외부 배럴·패키지 전면 금지).
        if (!match[1].startsWith('./')) violations.push(`외부 모듈 import: ${match[1]}`);
      }
    }
    if (source.includes('import.meta')) violations.push('import.meta 접근');

    return violations;
  };

  it('폴더 안 모든 파일이 외부 모듈을 import 하지 않고 import.meta 도 읽지 않는다', () => {
    // 하위 폴더까지 훑는다 — 비재귀 스캔이면 `shared/lib/marketIndices/sub/x.ts` 가 조용히 검사 밖에 남는다.
    const files = sourceFilesIn(DIRECTORY);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const violations = findPurityViolations(readFileSync(file, 'utf8'));
      expect(violations, `${file}: ${violations.join(' / ')}`).toEqual([]);
    }
  });

  /**
   * 🔴 **가드를 지키는 가드**. 위 테스트는 "초록"이 두 가지를 뜻할 수 있다 — 폴더가 정말 순수하거나,
   * 스캐너가 죽었거나. 주석 제거를 넣는 순간 후자로 미끄러지기 쉬워서(주석 속 설명에 걸려 거짓 실패 →
   * 검사 완화) 스캐너 자체를 합성 소스로 검증한다. 실제 코드에 위반을 심어 빨개지는지 보는
   * 뮤테이션 테스트와 같은 목적이고, 이건 매 실행 자동이다.
   */
  it('스캐너가 살아 있다 — 네 가지 import 형태와 import.meta 를 모두 잡고, 주석 속 설명은 통과시킨다', () => {
    // 진짜 위반 (전부 잡혀야 한다)
    expect(findPurityViolations('export const mode = import.meta.env.MODE;')).toHaveLength(1);
    expect(findPurityViolations("import { clampPercent } from '@/shared/utils';")).toHaveLength(1);
    expect(findPurityViolations('import { clampPercent } from "@/shared/utils";')).toHaveLength(1);
    expect(findPurityViolations("import '@/shared/lib/analytics';")).toHaveLength(1);
    expect(findPurityViolations("const f = async () => await import('@/shared/lib/analytics');")).toHaveLength(1);
    expect(findPurityViolations("const react = require('react');")).toHaveLength(1);
    expect(findPurityViolations("export * from '@/shared/lib/fx';")).toHaveLength(1);

    // 위반 아님 (거짓 실패를 만들면 안 된다)
    expect(findPurityViolations('/** `import.meta.env` 를 읽지 마라. */\nexport const a = 1;')).toEqual([]);
    expect(findPurityViolations('// import.meta.env 금지\nexport const a = 1;')).toEqual([]);
    expect(findPurityViolations('export const a = 1; // import.meta.env 금지')).toEqual([]);
    expect(findPurityViolations("import { b } from './quotes';\nexport * from './registry';")).toEqual([]);
    // 줄 주석 제거가 URL 을 자르지 않는다(자르면 그 뒤 코드가 사라져 검사가 새는 쪽으로 조용히 완화된다).
    expect(findPurityViolations("export const u = 'https://example.test/x';\nexport const v = 2;")).toEqual([]);
  });
});

/**
 * 🔴 **실제로 사고가 났던 경로**를 덮는 가드.
 *
 * 위 순수성 가드는 `shared/lib/marketIndices` 만 본다. 그런데 `api/og.js` 를 죽였던 전파 경로는 그쪽이
 * 아니라 **클라이언트 상태 파일**이다:
 *   `jotai/snowball/atoms/**` → `@/jotai` 배럴 → `pages/Main/hooks/persistence/shareLink.ts`
 *   → `server/handlers/Og` → **`api/og.js` 번들**
 * 그래서 시세·환율 atom 은 계측을 `await import('@/shared/lib/analytics')` 로 **미룬다**. 누군가 그 줄을
 * 파일 상단 정적 import 로 "정리"하면 OG 이미지가 전면 500 이 되는데, **Vitest 는 Vite 환경이라
 * `import.meta.env` 가 늘 정의돼 있어 구조적으로 재현하지 못한다**(그래서 실행이 아니라 import 문 형태로 막는다).
 */
describe('jotai/snowball/atoms 계측 지연(서버 번들 안전)', () => {
  /** 계측을 동적 import 로 미루는 것이 계약인 폴더 — 둘 다 `@/jotai` 배럴을 통해 서버 번들에 실린다. */
  const DEFERRED_ANALYTICS_DIRECTORIES = ['jotai/snowball/atoms/fx', 'jotai/snowball/atoms/marketIndices'];

  /** 상대 경로 우회(`'../../../shared/lib/analytics'`)도 같이 잡히도록 별칭이 아니라 경로 조각으로 본다. */
  const ANALYTICS_MODULE = 'shared/lib/analytics';

  /**
   * 걸린 사람이 **메시지만 읽고 고칠 수 있어야** 한다 — 무음/불친절 실패는 가드를 무력화하는 쪽으로
   * "고치게" 만든다. 그래서 금지 이유(사고 경로)와 정답(동적 import)을 실패 메시지에 그대로 싣는다.
   */
  const STATIC_ANALYTICS_HELP = [
    '',
    '🔴 `@/shared/lib/analytics` 는 **정적 import 금지**다. 대신 쓰는 지점에서 동적 import 로 미뤄라:',
    "     const { ANALYTICS_EVENT, trackEvent } = await import('@/shared/lib/analytics');",
    '',
    '왜: 이 파일은 `@/jotai` 배럴 → persistence/shareLink → server/handlers/Og 를 타고 `api/og.js` 번들에 실린다.',
    '    analytics.ts 는 모듈 최상단에서 `import.meta.env.VITE_*` 를 읽는데 Node ESM 에서 `import.meta.env` 는',
    '    undefined 라, 정적 import 면 **핸들러가 호출되기도 전에 모듈 평가 단계**에서 TypeError 로 죽는다',
    '    (try/catch 로도 못 잡는다 = 모든 공유 링크·포폴 글의 OG 이미지가 500).',
    '    동적 import 는 번들에 실려도 그 코드가 실행될 때만 평가된다 — catch 안은 브라우저에서만 도니 안전하다.',
    '',
    '타입만 필요해도 정적 `import type` 을 쓰지 마라(보수적으로 함께 막는다). `typeof import(...)` 를 써라.',
    ''
  ].join('\n');

  /**
   * 🔴 **정적/동적을 가르는** 스캐너. 위 순수성 스캐너와 정규식을 공유하되(STATIC_SPECIFIER_PATTERNS)
   * 동적 형태는 **일부러 보지 않는다** — 여기서 동적 import 는 위반이 아니라 정답이기 때문이다.
   * react·jotai·`@/shared/lib/marketIndices` 같은 다른 정적 import 는 당연히 허용(그건 서버에서도 안전).
   */
  const findStaticAnalyticsImports = (rawSource: string): string[] => {
    const source = stripComments(rawSource);
    const violations: string[] = [];

    for (const pattern of STATIC_SPECIFIER_PATTERNS) {
      for (const match of source.matchAll(pattern)) {
        if (match[1].includes(ANALYTICS_MODULE)) violations.push(`정적 import: ${match[0].trim()}`);
      }
    }

    return violations;
  };

  it('환율·지수 atom 은 analytics 를 정적 import 하지 않는다 (동적 import 가 정답)', () => {
    for (const directory of DEFERRED_ANALYTICS_DIRECTORIES) {
      const files = sourceFilesIn(directory);
      // 폴더가 사라지거나 이름이 바뀌면 검사가 조용히 비는 것을 막는다.
      expect(files.length, `${directory} 에 스캔할 소스가 없다`).toBeGreaterThan(0);

      for (const file of files) {
        const violations = findStaticAnalyticsImports(readFileSync(file, 'utf8'));
        expect(violations, `${file}\n${violations.join('\n')}\n${STATIC_ANALYTICS_HELP}`).toEqual([]);
      }
    }
  });

  /**
   * 두 폴더만이 아니라 **atoms 트리 전체**가 같은 배럴을 통해 서버 번들에 실린다 — 새 atom 폴더가
   * 생겨도 자동으로 덮이도록 한 겹 더 넓게 본다(위 테스트는 "이 두 폴더가 존재한다"까지 못 박는 역할).
   */
  it('atoms 트리 어디에도 analytics 정적 import 가 없다 (배럴 전체가 api/og.js 에 실린다)', () => {
    const files = sourceFilesIn('jotai/snowball/atoms');
    expect(files.length).toBeGreaterThan(DEFERRED_ANALYTICS_DIRECTORIES.length);

    for (const file of files) {
      const violations = findStaticAnalyticsImports(readFileSync(file, 'utf8'));
      expect(violations, `${file}\n${violations.join('\n')}\n${STATIC_ANALYTICS_HELP}`).toEqual([]);
    }
  });

  /**
   * 🔴 **가드를 지키는 가드**(위 순수성 스캐너와 같은 이유). 이 가드의 핵심 가치는 "정적은 잡고 동적은
   * 통과시킨다"는 **구분**이라, 그 구분이 살아 있는지 합성 소스로 직접 태운다 — 실제 파일을 임시로
   * 망가뜨리지 않고도 매 실행 자동으로 증명된다.
   */
  it('스캐너가 살아 있다 — 정적 4형태를 잡고, 동적 import·다른 모듈·주석 속 설명은 통과시킨다', () => {
    // 잡아야 하는 것 (이렇게 "정리"되는 순간 OG 이미지가 죽는다)
    expect(findStaticAnalyticsImports("import { trackEvent } from '@/shared/lib/analytics';")).toHaveLength(1);
    expect(findStaticAnalyticsImports('import { trackEvent } from "@/shared/lib/analytics";')).toHaveLength(1);
    expect(findStaticAnalyticsImports("import '@/shared/lib/analytics';")).toHaveLength(1);
    expect(findStaticAnalyticsImports("const a = require('@/shared/lib/analytics');")).toHaveLength(1);
    expect(findStaticAnalyticsImports("export { trackEvent } from '@/shared/lib/analytics';")).toHaveLength(1);
    // 별칭을 피한 상대 경로 우회도 같은 사고를 낸다.
    expect(findStaticAnalyticsImports("import { trackEvent } from '../../../shared/lib/analytics';")).toHaveLength(1);
    // 여러 줄로 흩어진 정적 import (prettier 가 자동으로 만드는 형태다).
    expect(
      findStaticAnalyticsImports("import {\n  ANALYTICS_EVENT,\n  trackEvent\n} from '@/shared/lib/analytics';")
    ).toHaveLength(1);
    // `import type` 은 컴파일에 지워지지만 보수적으로 함께 막는다(대안은 `typeof import(...)`).
    expect(findStaticAnalyticsImports("import type { AnalyticsEvent } from '@/shared/lib/analytics';")).toHaveLength(1);

    // 통과시켜야 하는 것 — 이게 거짓 실패하면 다음 사람이 정답 코드를 "고치려" 든다.
    expect(
      findStaticAnalyticsImports("const { ANALYTICS_EVENT, trackEvent } = await import('@/shared/lib/analytics');")
    ).toEqual([]);
    expect(findStaticAnalyticsImports("const m: typeof import('@/shared/lib/analytics') = x;")).toEqual([]);
    expect(
      findStaticAnalyticsImports(
        "import { atom } from 'jotai/vanilla';\nimport { parseFxRate } from '@/shared/lib/fx';"
      )
    ).toEqual([]);
    // 실제 두 파일의 주석이 바로 이 규칙을 설명한다 — 설명 문장에 걸리면 안 된다.
    expect(
      findStaticAnalyticsImports("// analytics 정적 import 금지: import { trackEvent } from '@/shared/lib/analytics'")
    ).toEqual([]);
    expect(
      findStaticAnalyticsImports("/** import { trackEvent } from '@/shared/lib/analytics' 를 쓰지 마라. */")
    ).toEqual([]);
  });
});
