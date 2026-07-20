import handler from '@/api/share-html';
import { EMPTY_INVESTMENT_SETTINGS, type PersistedInvestmentSettings, type PersistedScenarioState } from '@/jotai';
import { buildOgShareText } from '@/pages/Main/utils/ogCard';
import { buildOgCardModel } from '@/pages/Main/utils';
import type { TickerProfile } from '@/shared/types/snowball';
import {
  apiRequest,
  buildIndexHtmlShell,
  clearSupabaseRestEnv,
  indexHtmlRoute,
  indexHtmlThrowingRoute,
  readMetaContent,
  restoreApiTestEnvironment,
  seedSupabaseRestEnv,
  SHELL_DEFAULT,
  SHELL_INVARIANT_TAGS,
  stubFetchRoutes,
  SUPABASE_RPC_MATCHER,
  supabaseRpcRoute,
  TEST_ORIGIN
} from './apiHarness';

/**
 * `api/share-html` 계약 테스트.
 *
 * 이 핸들러의 존재 이유는 "SNS 크롤러가 미리보기를 포기하지 않게 하는 것"이라, **정상 동작보다 실패 동작이
 * 더 중요한** 드문 코드다. 그래서 아래 스위트는 성공 경로 1개 : 실패 경로 여러 개 비율로 짜여 있고,
 * 매 케이스마다 status / cache-control / 메타 치환 여부 3가지를 함께 못박는다.
 *
 * 특히 **cache-control 분기**가 핵심 계약이다:
 *   - 성공  → `public, max-age=0, s-maxage=86400, stale-while-revalidate=604800` (엣지가 하루 캐시)
 *   - 실패  → `no-store` (일시 장애를 엣지에 박제하지 않는다. 이걸 잘못 바꾸면 조회 실패 시점의
 *             "기본 카드"가 하루 동안 모든 공유 링크에 굳는다 — 사용자 눈엔 공유 기능 고장으로 보인다)
 */

const CACHE_SCENARIO = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800';
const CACHE_FALLBACK = 'no-store';

/** DB_SHARE_KEY_PATTERN(base64url 16자 이상)을 만족하는 key. */
const VALID_KEY = 'AbC123_xyz-KEY0123456';

const profile = (id: string, ticker: string, dividendYield: number, dividendGrowth: number): TickerProfile => ({
  id,
  ticker,
  name: '',
  initialPrice: 100,
  dividendYield,
  dividendGrowth,
  expectedTotalReturn: dividendYield + dividendGrowth,
  frequency: 'quarterly'
});

const buildScenario = (settings: Partial<PersistedInvestmentSettings> = {}): PersistedScenarioState => ({
  id: 'shared-tab',
  name: '공유 탭',
  portfolio: {
    tickerProfiles: [profile('t1', 'SCHD', 3.5, 5), profile('t2', 'JEPI', 7.2, 0)],
    includedTickerIds: ['t1', 't2'],
    weightByTickerId: { t1: 60, t2: 40 },
    fixedByTickerId: {},
    selectedTickerId: null
  },
  investmentSettings: {
    ...EMPTY_INVESTMENT_SETTINGS,
    initialInvestment: 10_000_000,
    monthlyContribution: 1_000_000,
    targetMonthlyDividend: 2_000_000,
    investmentStartDate: '2024-01-01',
    durationYears: 20,
    reinvestDividends: true,
    reinvestDividendPercent: 100,
    taxRate: 15.4,
    ...settings
  }
});

const envelopeOf = (scenario: PersistedScenarioState) => ({ v: 1, scenario });

/** 모든 실패 경로가 만족해야 하는 계약: 200 + no-store + 셸 무치환. */
const expectUntouchedShell = async (response: Response): Promise<string> => {
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe(CACHE_FALLBACK);
  expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');

  const html = await response.text();
  expect(html).toBe(buildIndexHtmlShell());
  return html;
};

afterEach(restoreApiTestEnvironment);

describe('api/share-html — 성공 경로 (?s= 조회 성공)', () => {
  const setupSuccess = (scenario = buildScenario()) => {
    seedSupabaseRestEnv();
    return stubFetchRoutes([indexHtmlRoute(), supabaseRpcRoute({ body: envelopeOf(scenario) })]);
  };

  it('200 + 엣지 캐시 헤더를 준다', async () => {
    setupSuccess();

    const response = await handler(apiRequest('/api/share-html', { s: VALID_KEY }));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(CACHE_SCENARIO);
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
  });

  it('og:title / og:description 을 시나리오 요약 텍스트로 치환한다 (og:image 카드와 같은 문구)', async () => {
    const scenario = buildScenario();
    setupSuccess(scenario);

    const html = await (await handler(apiRequest('/api/share-html', { s: VALID_KEY }))).text();

    // 카드 이미지(api/og)와 **같은 모델·같은 포맷터**로 만든 문구여야 한다.
    const model = buildOgCardModel(scenario);
    expect(model).not.toBeNull();
    const { title, description, imageAlt } = buildOgShareText(model!);

    expect(readMetaContent(html, 'property', 'og:title')).toBe(title);
    expect(readMetaContent(html, 'property', 'og:description')).toBe(description);
    expect(readMetaContent(html, 'property', 'og:image:alt')).toBe(imageAlt);
    expect(readMetaContent(html, 'name', 'twitter:title')).toBe(title);
    expect(readMetaContent(html, 'name', 'twitter:description')).toBe(description);
    expect(readMetaContent(html, 'name', 'twitter:image:alt')).toBe(imageAlt);
  });

  it('og:url 은 `?s=<key>` 를, og:image 는 `/api/og?s=<key>` 를 가리킨다', async () => {
    setupSuccess();

    const html = await (await handler(apiRequest('/api/share-html', { s: VALID_KEY }))).text();

    expect(readMetaContent(html, 'property', 'og:url')).toBe(`${TEST_ORIGIN}/?s=${VALID_KEY}`);
    expect(readMetaContent(html, 'property', 'og:image')).toBe(`${TEST_ORIGIN}/api/og?s=${VALID_KEY}`);
    expect(readMetaContent(html, 'name', 'twitter:image')).toBe(`${TEST_ORIGIN}/api/og?s=${VALID_KEY}`);
  });

  it('불변식 태그(canonical/og:type/og:locale/og:site_name/og:image 규격/twitter:card)는 그대로 둔다', async () => {
    setupSuccess();

    const html = await (await handler(apiRequest('/api/share-html', { s: VALID_KEY }))).text();

    for (const tag of SHELL_INVARIANT_TAGS) expect(html).toContain(tag);
    // canonical 은 클린 루트를 유지한다 — og:url 만 공유 URL 이다.
    expect(html).toContain(`<link rel="canonical" href="${TEST_ORIGIN}/" />`);
  });

  it('앱 부팅 태그(script/link)를 건드리지 않는다 — 셸이 그대로 React 앱으로 부팅해야 한다', async () => {
    setupSuccess();

    const html = await (await handler(apiRequest('/api/share-html', { s: VALID_KEY }))).text();

    expect(html).toContain('<script type="module" crossorigin src="/assets/index-abc123.js"></script>');
    expect(html).toContain('<link rel="stylesheet" crossorigin href="/assets/index-abc123.css" />');
    expect(html).toContain('<div id="root"></div>');
  });

  it('Supabase RPC 를 anon 키 plain REST 로 호출한다 (p_key 인자)', async () => {
    const stub = setupSuccess();

    await handler(apiRequest('/api/share-html', { s: VALID_KEY }));

    const [rpcCall] = stub.callsMatching(SUPABASE_RPC_MATCHER);
    expect(rpcCall).toBeDefined();
    expect(rpcCall.method).toBe('POST');
    expect(rpcCall.url).toBe('https://project.supabase.test/rest/v1/rpc/get_shared_snapshot');
    expect(JSON.parse(rpcCall.body ?? 'null')).toEqual({ p_key: VALID_KEY });
    expect(rpcCall.headers.apikey).toBe('anon-test-key');
    expect(rpcCall.headers.authorization).toBe('Bearer anon-test-key');
  });

  it('VITE_* 폴백 env 만 있어도 조회한다 (Vercel 이 브라우저 변수를 서버에도 노출하는 실제 배포 형태)', async () => {
    seedSupabaseRestEnv({ variant: 'vite' });
    stubFetchRoutes([indexHtmlRoute(), supabaseRpcRoute({ body: envelopeOf(buildScenario()) })]);

    const response = await handler(apiRequest('/api/share-html', { s: VALID_KEY }));

    expect(response.headers.get('cache-control')).toBe(CACHE_SCENARIO);
  });
});

describe('api/share-html — 절대 5xx 를 내지 않는다 (전부 200 + no-store + 무치환 셸)', () => {
  it('key 가 아예 없다', async () => {
    seedSupabaseRestEnv();
    const stub = stubFetchRoutes([indexHtmlRoute(), supabaseRpcRoute({ body: envelopeOf(buildScenario()) })]);

    await expectUntouchedShell(await handler(apiRequest('/api/share-html')));

    // key 형식 가드에서 끊기므로 조회 자체를 하지 않는다(불필요한 DB 왕복 금지).
    expect(stub.callsMatching(SUPABASE_RPC_MATCHER)).toHaveLength(0);
  });

  it('key 형식이 아니다 (구 lz-string 코드 / 너무 짧은 값 / 빈 문자열)', async () => {
    for (const key of ["N4Ig+dg$.", 'short', '']) {
      seedSupabaseRestEnv();
      const stub = stubFetchRoutes([indexHtmlRoute(), supabaseRpcRoute({ body: envelopeOf(buildScenario()) })]);

      await expectUntouchedShell(await handler(apiRequest('/api/share-html', { s: key })));
      expect(stub.callsMatching(SUPABASE_RPC_MATCHER)).toHaveLength(0);

      restoreApiTestEnvironment();
    }
  });

  it('env 미설정 — 조회를 건너뛴다 (네트워크 호출 0)', async () => {
    clearSupabaseRestEnv();
    const stub = stubFetchRoutes([indexHtmlRoute(), supabaseRpcRoute({ body: envelopeOf(buildScenario()) })]);

    await expectUntouchedShell(await handler(apiRequest('/api/share-html', { s: VALID_KEY })));

    expect(stub.callsMatching(SUPABASE_RPC_MATCHER)).toHaveLength(0);
  });

  it('env 가 공백 문자열이면 미설정으로 본다', async () => {
    seedSupabaseRestEnv({ url: '   ', anonKey: '   ' });
    const stub = stubFetchRoutes([indexHtmlRoute(), supabaseRpcRoute({ body: envelopeOf(buildScenario()) })]);

    await expectUntouchedShell(await handler(apiRequest('/api/share-html', { s: VALID_KEY })));

    expect(stub.callsMatching(SUPABASE_RPC_MATCHER)).toHaveLength(0);
  });

  it('조회가 5xx 로 실패한다 — 실패를 엣지에 박제하지 않는다', async () => {
    seedSupabaseRestEnv();
    stubFetchRoutes([indexHtmlRoute(), supabaseRpcRoute({ status: 500 })]);

    await expectUntouchedShell(await handler(apiRequest('/api/share-html', { s: VALID_KEY })));
  });

  it('조회 네트워크가 통째로 throw 한다', async () => {
    seedSupabaseRestEnv();
    stubFetchRoutes([indexHtmlRoute(), supabaseRpcRoute({ throws: true })]);

    await expectUntouchedShell(await handler(apiRequest('/api/share-html', { s: VALID_KEY })));
  });

  it('key 는 유효하지만 스냅샷이 부재/만료다 (RPC 가 null 을 준다)', async () => {
    seedSupabaseRestEnv();
    stubFetchRoutes([indexHtmlRoute(), supabaseRpcRoute({ body: null })]);

    await expectUntouchedShell(await handler(apiRequest('/api/share-html', { s: VALID_KEY })));
  });

  it('응답 본문이 JSON 이 아니다 (스키마 드리프트/프록시 HTML)', async () => {
    seedSupabaseRestEnv();
    stubFetchRoutes([indexHtmlRoute(), supabaseRpcRoute({ rawBody: '<html>gateway timeout</html>' })]);

    await expectUntouchedShell(await handler(apiRequest('/api/share-html', { s: VALID_KEY })));
  });

  it('envelope 형태가 아닌 임의 객체가 저장돼 있다 (서버 CHECK 는 jsonb object 만 강제한다)', async () => {
    seedSupabaseRestEnv();
    stubFetchRoutes([indexHtmlRoute(), supabaseRpcRoute({ body: { foo: 1 } })]);

    await expectUntouchedShell(await handler(apiRequest('/api/share-html', { s: VALID_KEY })));
  });

  it('scenario 가 깨져 시뮬레이션이 성립하지 않는다 (포함 종목 0)', async () => {
    const scenario = buildScenario();
    scenario.portfolio.includedTickerIds = [];
    seedSupabaseRestEnv();
    stubFetchRoutes([indexHtmlRoute(), supabaseRpcRoute({ body: envelopeOf(scenario) })]);

    await expectUntouchedShell(await handler(apiRequest('/api/share-html', { s: VALID_KEY })));
  });

  it('scenario 필드가 통째로 null 이라 접근이 터진다 (신뢰불가 payload)', async () => {
    seedSupabaseRestEnv();
    stubFetchRoutes([indexHtmlRoute(), supabaseRpcRoute({ body: { v: 1, scenario: { portfolio: null } } })]);

    await expectUntouchedShell(await handler(apiRequest('/api/share-html', { s: VALID_KEY })));
  });
});

describe('api/share-html — 셸을 못 읽는 극단만 302', () => {
  it('셸 fetch 가 !ok 면 루트로 302 한다 (5xx 아님)', async () => {
    seedSupabaseRestEnv();
    stubFetchRoutes([indexHtmlRoute({ ok: false }), supabaseRpcRoute({ body: envelopeOf(buildScenario()) })]);

    const response = await handler(apiRequest('/api/share-html', { s: VALID_KEY }));

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(`${TEST_ORIGIN}/`);
    expect(response.headers.get('cache-control')).toBe(CACHE_FALLBACK);
  });

  it('셸 fetch 가 throw 해도 302 한다', async () => {
    seedSupabaseRestEnv();
    stubFetchRoutes([indexHtmlThrowingRoute(), supabaseRpcRoute({ body: envelopeOf(buildScenario()) })]);

    const response = await handler(apiRequest('/api/share-html', { s: VALID_KEY }));

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(`${TEST_ORIGIN}/`);
  });

  it('셸은 자기 오리진에서 가져온다 (middleware matcher 재진입 없는 /index.html)', async () => {
    seedSupabaseRestEnv();
    const stub = stubFetchRoutes([indexHtmlRoute(), supabaseRpcRoute({ body: envelopeOf(buildScenario()) })]);

    await handler(apiRequest('/api/share-html', { s: VALID_KEY }));

    expect(stub.calls[0].url).toBe(`${TEST_ORIGIN}/index.html`);
  });
});

describe('api/share-html — 셸에 메타 태그가 없어도 안전하다', () => {
  it('치환 대상 태그가 하나도 없는 셸이면 원문을 그대로 200 으로 준다', async () => {
    const bareShell = '<!doctype html><html><head><title>x</title></head><body><div id="root"></div></body></html>';
    seedSupabaseRestEnv();
    stubFetchRoutes([
      indexHtmlRoute({ html: bareShell }),
      supabaseRpcRoute({ body: envelopeOf(buildScenario()) })
    ]);

    const response = await handler(apiRequest('/api/share-html', { s: VALID_KEY }));

    expect(response.status).toBe(200);
    // 조회는 성공했으므로 캐시 헤더는 성공 경로다(치환할 태그가 없었을 뿐).
    expect(response.headers.get('cache-control')).toBe(CACHE_SCENARIO);
    expect(await response.text()).toBe(bareShell);
  });

  it('셸 기본 메타는 실패 경로에서 센티넬 그대로 남는다', async () => {
    clearSupabaseRestEnv();
    stubFetchRoutes([indexHtmlRoute()]);

    const html = await (await handler(apiRequest('/api/share-html', { s: VALID_KEY }))).text();

    expect(readMetaContent(html, 'property', 'og:title')).toBe(SHELL_DEFAULT.ogTitle);
    expect(readMetaContent(html, 'property', 'og:url')).toBe(SHELL_DEFAULT.ogUrl);
    expect(readMetaContent(html, 'property', 'og:image')).toBe(SHELL_DEFAULT.ogImage);
  });
});
