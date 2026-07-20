/**
 * `api/*` 서버리스 핸들러 계약 테스트 공용 하네스.
 *
 * Vercel 의 Node 핸들러는 웹 표준 시그니처(`(request: Request) => Promise<Response>`)라
 * Vitest 에서 **그대로 호출**할 수 있다. 다만 핸들러들은 실행 중 두 가지 외부 의존을 건드린다:
 *
 *   1. 전역 `fetch` — ① 자기 도메인의 `/index.html` 셸, ② Supabase REST(rpc), ③ `/fonts/*.otf`
 *   2. `process.env` — `readSupabaseRestConfig()` 가 `SUPABASE_URL`/`SUPABASE_ANON_KEY`(또는 `VITE_*` 폴백)
 *
 * 이 파일은 그 둘을 테스트가 결정론적으로 통제할 수 있게 해 준다. 새 핸들러(`api/sitemap.ts`,
 * `api/post-html.ts` 등)도 같은 유틸을 import 해서 쓴다.
 *
 * ⚠ **`dist/index.html` 에 의존하지 않는다.** 빌드 산출물은 테스트 실행 시점에 없을 수도, 낡았을 수도 있다.
 *   셸은 아래 `buildIndexHtmlShell()` 픽스처(불변식 태그를 전부 포함한 최소 HTML)로 고정한다.
 *
 * 사용 예:
 * ```ts
 * afterEach(restoreApiTestEnvironment);
 *
 * it('...', async () => {
 *   seedSupabaseRestEnv();
 *   const fetchStub = stubFetchRoutes([
 *     indexHtmlRoute(),
 *     supabaseRpcRoute({ v: 1, scenario })
 *   ]);
 *   const res = await handler(apiRequest('/api/share-html', { s: KEY }));
 *   expect(res.status).toBe(200);
 *   expect(fetchStub.calls).toHaveLength(2);
 * });
 * ```
 */

/* ------------------------------------------------------------------ */
/* 요청 만들기                                                         */
/* ------------------------------------------------------------------ */

/** 테스트에서 쓰는 기본 오리진. 핸들러는 `new URL(request.url).origin` 으로 자기 도메인을 유도한다. */
export const TEST_ORIGIN = 'https://snowball.test';

/**
 * 핸들러에 넘길 `Request` 를 만든다.
 * @param path   `/api/share-html` 같은 경로(또는 절대 URL)
 * @param query  쿼리스트링. `undefined` 값은 아예 붙이지 않는다.
 */
export const apiRequest = (
  path: string,
  query: Record<string, string | undefined> = {},
  init?: RequestInit
): Request => {
  const url = new URL(path, TEST_ORIGIN);
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(name, value);
  }
  return new Request(url.toString(), init);
};

/* ------------------------------------------------------------------ */
/* index.html 셸 픽스처                                                */
/* ------------------------------------------------------------------ */

/**
 * 치환 **대상**(og/twitter 텍스트·URL) 기본값. 테스트는 "이 값이 그대로면 무치환"으로 판정한다.
 * 실제 index.html 의 정확한 카피가 아니라, 구분 가능한 센티넬이면 충분하다.
 */
export const SHELL_DEFAULT = {
  ogTitle: 'SHELL_DEFAULT_OG_TITLE',
  ogDescription: 'SHELL_DEFAULT_OG_DESCRIPTION',
  ogUrl: `${TEST_ORIGIN}/`,
  ogImage: `${TEST_ORIGIN}/og-image.png`,
  ogImageAlt: 'SHELL_DEFAULT_OG_IMAGE_ALT',
  twitterTitle: 'SHELL_DEFAULT_TWITTER_TITLE',
  twitterDescription: 'SHELL_DEFAULT_TWITTER_DESCRIPTION',
  twitterImage: `${TEST_ORIGIN}/og-image.png`,
  twitterImageAlt: 'SHELL_DEFAULT_TWITTER_IMAGE_ALT'
} as const;

/**
 * 셸의 **불변식 태그** — 어떤 경로에서도 치환되면 안 되는 것들.
 * (share-html 소스 주석 "## 불변식" 을 그대로 옮긴 목록)
 */
export const SHELL_INVARIANT_TAGS = [
  `<link rel="canonical" href="${TEST_ORIGIN}/" />`,
  '<meta property="og:type" content="website" />',
  '<meta property="og:locale" content="ko_KR" />',
  '<meta property="og:site_name" content="Snowball Income" />',
  '<meta property="og:image:type" content="image/png" />',
  '<meta property="og:image:width" content="1200" />',
  '<meta property="og:image:height" content="630" />',
  '<meta name="twitter:card" content="summary_large_image" />'
] as const;

/**
 * og/twitter 메타를 갖춘 **최소 index.html 셸**. 실제 셸처럼 script/link 태그도 하나 끼워 두어
 * "핸들러가 앱 부팅 태그를 건드리지 않는다"까지 단정할 수 있게 한다.
 */
export const buildIndexHtmlShell = (overrides: Partial<typeof SHELL_DEFAULT> = {}): string => {
  const value = { ...SHELL_DEFAULT, ...overrides };

  return [
    '<!doctype html>',
    '<html lang="ko">',
    '  <head>',
    '    <meta charset="UTF-8" />',
    '    <title>Snowball Income</title>',
    ...SHELL_INVARIANT_TAGS.map((tag) => `    ${tag}`),
    `    <meta property="og:title" content="${value.ogTitle}" />`,
    `    <meta property="og:description" content="${value.ogDescription}" />`,
    `    <meta property="og:url" content="${value.ogUrl}" />`,
    `    <meta property="og:image" content="${value.ogImage}" />`,
    `    <meta property="og:image:alt" content="${value.ogImageAlt}" />`,
    `    <meta name="twitter:title" content="${value.twitterTitle}" />`,
    `    <meta name="twitter:description" content="${value.twitterDescription}" />`,
    `    <meta name="twitter:image" content="${value.twitterImage}" />`,
    `    <meta name="twitter:image:alt" content="${value.twitterImageAlt}" />`,
    '    <script type="module" crossorigin src="/assets/index-abc123.js"></script>',
    '    <link rel="stylesheet" crossorigin href="/assets/index-abc123.css" />',
    '  </head>',
    '  <body>',
    '    <div id="root"></div>',
    '  </body>',
    '</html>'
  ].join('\n');
};

/** `<meta ... content="...">` 에서 content 값을 읽는다. 테스트 단정용(치환 여부 판정). */
export const readMetaContent = (html: string, attribute: 'property' | 'name', key: string): string | null => {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta[^>]*\\b${attribute}=["']${escapedKey}["'][^>]*>`, 'i');
  const tag = pattern.exec(html)?.[0];
  if (!tag) return null;
  return /\bcontent=["']([^"']*)["']/i.exec(tag)?.[1] ?? null;
};

/* ------------------------------------------------------------------ */
/* fetch 스텁                                                          */
/* ------------------------------------------------------------------ */

/** 스텁이 기록한 호출 1건. */
export type RecordedFetchCall = {
  url: string;
  method: string;
  headers: Record<string, string>;
  /** 요청 본문(문자열일 때만). 그 외는 null. */
  body: string | null;
};

export type FetchRouteContext = {
  url: URL;
  call: RecordedFetchCall;
};

/** URL 매칭 조건: 부분 문자열 / 정규식 / 술어. */
export type FetchRouteMatcher = string | RegExp | ((url: URL) => boolean);

export type FetchRoute = {
  when: FetchRouteMatcher;
  /** 응답. 함수를 주면 호출 시점에 만든다(throw 하면 네트워크 장애를 재현한다). */
  respond: Response | ((context: FetchRouteContext) => Response | Promise<Response>);
};

export type FetchStub = {
  /** 스텁이 관측한 모든 fetch 호출(순서 유지). */
  calls: RecordedFetchCall[];
  /** 특정 매처에 걸린 호출만. */
  callsMatching: (matcher: FetchRouteMatcher) => RecordedFetchCall[];
};

const matchesUrl = (matcher: FetchRouteMatcher, url: URL): boolean => {
  if (typeof matcher === 'function') return matcher(url);
  if (matcher instanceof RegExp) return matcher.test(url.toString());
  return url.toString().includes(matcher);
};

let activeFetchStub = false;

/**
 * 전역 `fetch` 를 URL 패턴 라우팅 스텁으로 바꾼다. **`restoreApiTestEnvironment()` 로 복원**한다
 * (`afterEach(restoreApiTestEnvironment)` 권장).
 *
 * 어떤 라우트에도 안 걸린 URL 은 **테스트를 실패시키는 에러를 던진다** — 테스트가 모르는 사이에 실제
 * 네트워크로 나가거나, 핸들러가 예상 밖의 호출을 하는 것을 조용히 넘기지 않기 위해서다.
 */
export const stubFetchRoutes = (routes: FetchRoute[]): FetchStub => {
  const calls: RecordedFetchCall[] = [];

  const stub = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl = input instanceof Request ? input.url : String(input);
    const url = new URL(rawUrl);
    const headers: Record<string, string> = {};
    new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)).forEach((headerValue, name) => {
      headers[name.toLowerCase()] = headerValue;
    });

    const call: RecordedFetchCall = {
      url: rawUrl,
      method: (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase(),
      headers,
      body: typeof init?.body === 'string' ? init.body : null
    };
    calls.push(call);

    const route = routes.find((candidate) => matchesUrl(candidate.when, url));
    if (!route) throw new Error(`[apiHarness] unstubbed fetch: ${call.method} ${rawUrl}`);

    return typeof route.respond === 'function' ? route.respond({ url, call }) : route.respond.clone();
  };

  vi.stubGlobal('fetch', stub);
  activeFetchStub = true;

  return {
    calls,
    callsMatching: (matcher) => calls.filter((call) => matchesUrl(matcher, new URL(call.url)))
  };
};

/** `/index.html` 셸 라우트. 기본은 200 + 픽스처 셸. */
export const indexHtmlRoute = (options: { html?: string; ok?: boolean; status?: number } = {}): FetchRoute => ({
  when: (url) => url.pathname === '/index.html',
  respond: () => {
    const status = options.status ?? (options.ok === false ? 404 : 200);
    if (status >= 400) return new Response('not found', { status });
    return new Response(options.html ?? buildIndexHtmlShell(), {
      status,
      headers: { 'content-type': 'text/html; charset=utf-8' }
    });
  }
});

/** 셸 fetch 자체가 네트워크 레벨에서 터지는 경우. */
export const indexHtmlThrowingRoute = (message = 'network down'): FetchRoute => ({
  when: (url) => url.pathname === '/index.html',
  respond: () => {
    throw new TypeError(message);
  }
});

/** Supabase `get_shared_snapshot` RPC URL 매처. */
export const SUPABASE_RPC_MATCHER = '/rest/v1/rpc/get_shared_snapshot';

/**
 * Supabase RPC 라우트. `body` 를 주면 그 JSON 을 200 으로 돌려준다(`null` 도 유효한 응답 — 부재/만료).
 * `status` 로 조회 실패(500 등)를, `throws` 로 네트워크 장애를 재현한다.
 */
export const supabaseRpcRoute = (
  options: { body?: unknown; status?: number; throws?: boolean; rawBody?: string } = {}
): FetchRoute => ({
  when: SUPABASE_RPC_MATCHER,
  respond: () => {
    if (options.throws) throw new TypeError('supabase unreachable');
    const status = options.status ?? 200;
    if (status >= 400) return new Response(JSON.stringify({ message: 'boom' }), { status });
    const payload = options.rawBody ?? JSON.stringify(options.body ?? null);
    return new Response(payload, { status, headers: { 'content-type': 'application/json' } });
  }
});

/* ------------------------------------------------------------------ */
/* process.env 시딩                                                    */
/* ------------------------------------------------------------------ */

/** `readSupabaseRestConfig()` 가 읽는 모든 변수(우선순위 순). */
export const SUPABASE_REST_ENV_KEYS = [
  'SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY'
] as const;

const originalEnv = new Map<string, string | undefined>();

const rememberEnv = (name: string): void => {
  if (!originalEnv.has(name)) originalEnv.set(name, process.env[name]);
};

/** 임의 env 를 설정한다(원본은 자동 기억 → `restoreApiTestEnvironment()` 로 복원). */
export const setEnv = (name: string, value: string | undefined): void => {
  rememberEnv(name);
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
};

/** Supabase REST 관련 env 를 **전부 지운다** = "미설정" 상태(조회 스킵 → 폴백). */
export const clearSupabaseRestEnv = (): void => {
  for (const name of SUPABASE_REST_ENV_KEYS) setEnv(name, undefined);
};

/**
 * "설정됨" 상태를 만든다. 기본은 서버 변수(`SUPABASE_URL`/`SUPABASE_ANON_KEY`).
 * `variant: 'vite'` 로 주면 Vercel 실제 배포처럼 `VITE_*` 폴백만 있는 상태를 만든다.
 */
export const seedSupabaseRestEnv = (
  options: { url?: string; anonKey?: string; variant?: 'server' | 'vite' } = {}
): { url: string; anonKey: string } => {
  const url = options.url ?? 'https://project.supabase.test';
  const anonKey = options.anonKey ?? 'anon-test-key';

  clearSupabaseRestEnv();
  if (options.variant === 'vite') {
    setEnv('VITE_SUPABASE_URL', url);
    setEnv('VITE_SUPABASE_PUBLISHABLE_KEY', anonKey);
  } else {
    setEnv('SUPABASE_URL', url);
    setEnv('SUPABASE_ANON_KEY', anonKey);
  }

  return { url, anonKey };
};

/**
 * fetch 스텁과 `process.env` 를 원상 복구한다. **모든 api 테스트 파일이 `afterEach` 에 걸어야 한다.**
 */
export const restoreApiTestEnvironment = (): void => {
  if (activeFetchStub) {
    vi.unstubAllGlobals();
    activeFetchStub = false;
  }
  for (const [name, value] of originalEnv) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  originalEnv.clear();
};
