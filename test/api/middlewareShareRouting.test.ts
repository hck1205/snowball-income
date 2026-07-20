import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import middleware, { config as middlewareConfig } from '@/middleware';

/**
 * middleware(Edge) **회귀 고정** — SEO ISR(PR-A)이 middleware 를 건드리지 않았음을 못박는다.
 *
 * PR-A 의 새 경로(`/community/:kind/:id` 상세 메타, `/sitemap-posts.xml`)는 **vercel.json rewrite** 로
 * 푼다. `dist/` 에 대응 파일이 없어 파일시스템이 미스하므로 rewrite 가 정상 발동하기 때문이다
 * (반면 `/?share=` 는 경로가 `/` 라 `dist/index.html` 이 먼저 히트해 rewrite 에 도달하지 못한다
 *  — middleware.ts:24-26). 그래서 matcher 를 넓힐 이유가 없고, 넓히면 오히려 위험하다:
 *   ① 기존 `/`(공유 링크) 동작을 깨기 쉽고,
 *   ② 넓힌 matcher 에 middleware/함수가 fetch 하는 경로가 걸리면 508 INFINITE_LOOP 이다.
 *
 * 이 스위트는 그 결정을 테스트로 잠근다 — matcher 가 `/` 하나로 남아 있고, `?share=`/`?s=` 분기가
 * 그대로 동작하는지 확인한다.
 */

const SHELL = `<!doctype html><html><head>
  <meta property="og:image" content="https://snowball.test/og-image.png" />
  <meta name="twitter:image" content="https://snowball.test/og-image.png" />
  <meta id="og-url" property="og:url" content="https://snowball.test/" />
</head><body><div id="root"></div></body></html>`;

const stubShell = () => {
  const stub = vi.fn(async () => new Response(SHELL, { status: 200 }));
  vi.stubGlobal('fetch', stub);
  return stub;
};

beforeEach(() => {
  stubShell();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('middleware matcher (재귀 방지 계약)', () => {
  it("matcher 는 여전히 '/' 하나다 — PR-A 는 이걸 넓히지 않았다", () => {
    expect(middlewareConfig.matcher).toBe('/');
  });

  it("matcher 가 '/' 라서 middleware/함수가 fetch 하는 경로에 재진입하지 않는다", () => {
    // 508 INFINITE_LOOP 회피의 근거. 아래 경로들이 matcher 에 걸리면 안 된다.
    const fetchedByServer = ['/index.html', '/api/share-html', '/api/post-html', '/api/sitemap'];
    for (const path of fetchedByServer) {
      expect(middlewareConfig.matcher).not.toBe(path);
    }
  });
});

describe('middleware `?s=`(DB key) 회귀', () => {
  it('key 형식이면 api/share-html 로 rewrite 한다', async () => {
    const res = await middleware(new Request('https://snowball.test/?s=abcdefghijklmnopqrstuv'));
    const target = res.headers.get('x-middleware-rewrite');

    expect(target).toContain('/api/share-html');
    expect(target).toContain('s=abcdefghijklmnopqrstuv');
  });

  it('key 형식이 아니면 rewrite 하지 않는다', async () => {
    const res = await middleware(new Request('https://snowball.test/?s=%20not%20a%20key%20'));
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
  });
});

describe('middleware `?share=`(lz-string) 회귀', () => {
  it('공유 코드면 og:image/twitter:image/og:url 을 치환한 HTML 을 직접 반환한다', async () => {
    const res = await middleware(new Request('https://snowball.test/?share=N4IgLgpg'));
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(html).toContain('content="https://snowball.test/api/og?share=N4IgLgpg"');
    expect(html).toContain('content="https://snowball.test/?share=N4IgLgpg"');
  });

  it('엣지 캐시 헤더가 그대로다 (s-maxage=86400 / swr=604800)', async () => {
    const res = await middleware(new Request('https://snowball.test/?share=N4IgLgpg'));
    const cache = res.headers.get('cache-control') ?? '';

    expect(cache).toContain('s-maxage=86400');
    expect(cache).toContain('stale-while-revalidate=604800');
  });

  it('share/s 파라미터가 없는 일반 방문은 손대지 않는다 (정적 셸 그대로, 비용 0)', async () => {
    const stub = stubShell();
    const res = await middleware(new Request('https://snowball.test/'));

    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    // next()는 본문 없는 pass-through 라 content-type 자체가 없다(치환 HTML 을 만들지 않았다는 증거).
    expect(res.headers.get('content-type')).toBeNull();
    // 셸을 fetch 하지도 않는다.
    expect(stub).not.toHaveBeenCalled();
  });

  it('두 파라미터가 함께 오면 `?s=` 가 이긴다', async () => {
    const res = await middleware(new Request('https://snowball.test/?share=N4IgLgpg&s=abcdefghijklmnopqrstuv'));
    expect(res.headers.get('x-middleware-rewrite')).toContain('/api/share-html');
  });
});
