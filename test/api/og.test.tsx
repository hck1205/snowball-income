import handler from '@/api/og';
import {
  apiRequest,
  restoreApiTestEnvironment,
  seedSupabaseRestEnv,
  stubFetchRoutes,
  SUPABASE_RPC_MATCHER,
  supabaseRpcRoute,
  TEST_ORIGIN,
  type FetchRoute
} from './apiHarness';

/**
 * `api/og` — **부분 계약만** 고정한다.
 *
 * ## 왜 렌더 결과를 검증하지 않는가
 * 이 핸들러의 본체는 `@vercel/og`(satori + resvg.wasm)로 1200×630 PNG 를 굽는 것이다. 유닛에서 그걸 돌리려면
 *   (a) Pretendard **otf 바이트**(런타임에 `/fonts/*.otf` 로 fetch — dist 빌드 산출물이라 테스트가 의존하면 안 된다),
 *   (b) jsdom 안에서 wasm 래스터라이저 실행(수 초 + 플랫폼 의존),
 *   (c) PNG 바이트 비교(폰트/wasm 버전이 바뀌면 무의미하게 깨지는 골든)
 * 이 필요하다. 즉 **비용은 크고 회귀 검출력은 낮다**(지식 기반 pitfalls: "api/og 핸들러는 fetch+ImageResponse 라
 * 유닛 미대상"). 카드에 그려지는 **숫자·문구**는 이미 순수 함수 쪽에서 고정돼 있다
 * (test/main/ogCard.test.ts, test/main/ogShareText.test.ts) — 여기서 다시 재현할 이유가 없다.
 *
 * ## 그래서 여기서 고정하는 것 — 값싸고 실제로 깨지는 것들만
 * 1. **모듈 평가 스모크**: import 만으로 죽지 않는다. 이 파일 상단의 정적 import 자체가 검증이다
 *    (`import.meta.env` 를 모듈 스코프에서 읽는 코드가 딸려오면 Vercel Node 런타임에서 함수가 즉사한다 —
 *    실제로 겪은 사고라 소스 주석에 규약으로 박혀 있다).
 * 2. **5xx 금지 계약의 실패 절반**: 폰트를 못 받으면 → 302 `/og-image.png`. 렌더 없이 도달 가능한 경로다.
 * 3. **`?s=` 조회 배선**: 유효 key + env 설정이면 RPC 를 부르고, 형식 불일치면 안 부른다.
 *
 * 성공 경로(200 PNG + `immutable` 캐시)는 **프리뷰 배포에서 눈으로** 확인한다.
 */

/** `?s=` 형식 가드(DB_SHARE_KEY_PATTERN)를 통과하는 key. */
const VALID_KEY = 'AbC123_xyz-KEY0123456';

/**
 * 폰트 라우트를 항상 실패시킨다.
 *
 * ⚠ `loadFonts` 는 **모듈 스코프 `fontsPromise` 에 캐시**된다. 실패 시에만 캐시를 비우므로(소스 주석 참고),
 *   이 파일은 폰트를 절대 성공시키지 않는다 — 한 번이라도 성공시키면 이후 테스트가 그 캐시를 재사용해
 *   케이스 간 격리가 깨진다.
 */
const failingFontsRoute = (mode: 'not-ok' | 'throw' = 'not-ok'): FetchRoute => ({
  when: (url) => url.pathname.startsWith('/fonts/'),
  respond: () => {
    if (mode === 'throw') throw new TypeError('font CDN unreachable');
    return new Response('missing', { status: 404 });
  }
});

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // 폴백 경로는 의도적으로 console.error 를 남긴다(운영 로그). 테스트 출력만 조용히 시킨다.
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  restoreApiTestEnvironment();
});

describe('api/og — 모듈 평가 스모크', () => {
  it('핸들러를 import 하는 것만으로 죽지 않는다 (모듈 스코프 import.meta.env 금지 규약)', () => {
    expect(typeof handler).toBe('function');
  });
});

describe('api/og — 폰트 실패는 5xx 가 아니라 정적 이미지 302', () => {
  it('폰트가 !ok 면 /og-image.png 로 302 한다', async () => {
    stubFetchRoutes([failingFontsRoute('not-ok')]);

    const response = await handler(apiRequest('/api/og'));

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(`${TEST_ORIGIN}/og-image.png`);
    // 코드 배포로 복구될 수 있는 장애라 짧게만 캐시한다(성공 카드의 1년 immutable 과 다른 값).
    expect(response.headers.get('cache-control')).toBe('public, no-transform, max-age=300');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('폰트 fetch 가 throw 해도 302 한다', async () => {
    stubFetchRoutes([failingFontsRoute('throw')]);

    const response = await handler(apiRequest('/api/og'));

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(`${TEST_ORIGIN}/og-image.png`);
  });

  it('실패한 폰트 로드를 캐시하지 않는다 — 다음 요청이 다시 시도한다', async () => {
    const first = stubFetchRoutes([failingFontsRoute()]);
    await handler(apiRequest('/api/og'));
    const firstFontCalls = first.callsMatching('/fonts/').length;
    expect(firstFontCalls).toBeGreaterThan(0);

    const second = stubFetchRoutes([failingFontsRoute()]);
    await handler(apiRequest('/api/og'));

    // 캐시했다면 두 번째 요청에서 폰트 fetch 가 0건이었을 것이다(컨테이너가 사는 동안 영구 폴백).
    expect(second.callsMatching('/fonts/').length).toBeGreaterThan(0);
  });
});

describe('api/og — ?s= 조회 배선', () => {
  it('유효 key + env 설정이면 get_shared_snapshot 을 부른다', async () => {
    seedSupabaseRestEnv();
    const stub = stubFetchRoutes([failingFontsRoute(), supabaseRpcRoute({ body: null })]);

    await handler(apiRequest('/api/og', { s: VALID_KEY }));

    const [rpcCall] = stub.callsMatching(SUPABASE_RPC_MATCHER);
    expect(rpcCall).toBeDefined();
    expect(JSON.parse(rpcCall.body ?? 'null')).toEqual({ p_key: VALID_KEY });
  });

  it('key 형식이 아니면 조회하지 않는다 (구 lz-string 코드가 DB 조회를 유발하면 안 된다)', async () => {
    seedSupabaseRestEnv();
    const stub = stubFetchRoutes([failingFontsRoute(), supabaseRpcRoute({ body: null })]);

    await handler(apiRequest('/api/og', { s: 'N4Ig+dg$.' }));

    expect(stub.callsMatching(SUPABASE_RPC_MATCHER)).toHaveLength(0);
  });

  it('?s= 가 없으면 조회하지 않는다', async () => {
    seedSupabaseRestEnv();
    const stub = stubFetchRoutes([failingFontsRoute(), supabaseRpcRoute({ body: null })]);

    await handler(apiRequest('/api/og', { share: 'not-a-real-share-code' }));

    expect(stub.callsMatching(SUPABASE_RPC_MATCHER)).toHaveLength(0);
  });
});
