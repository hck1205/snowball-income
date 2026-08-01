// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import middleware, { config as middlewareConfig } from '@/middleware';
import { SIMULATOR_PATH } from '@/shared/constants/routes';

/**
 * middleware(Edge) **회귀 고정**.
 *
 * SEO ISR(PR-A)의 새 경로(`/community/:kind/:id` 상세 메타, `/sitemap-posts.xml`)는 **vercel.json
 * rewrite** 로 푼다. `dist/` 에 대응 파일이 없어 파일시스템이 미스하므로 rewrite 가 정상 발동하기
 * 때문이다 (반면 `/?share=` 는 경로가 `/` 라 `dist/index.html` 이 먼저 히트해 rewrite 에 도달하지
 * 못한다 — middleware.ts 상단 주석). 그래서 matcher 는 **공유 링크가 실제로 착지하는 경로만**
 * 담는다. 함부로 넓히면 위험하다:
 *   ① 기존 `/`(배포된 공유 링크) 동작을 깨기 쉽고,
 *   ② 넓힌 matcher 에 middleware/함수가 fetch 하는 경로가 걸리면 508 INFINITE_LOOP 이다.
 *
 * 2026-08-01 이전(`/` → `/simulator`)으로 matcher 가 **두 경로**가 되었다. 이유는 하나뿐이다:
 * 이전 후 새로 만들어지는 공유 링크는 `/simulator?share=…`·`/simulator?s=…` 인데, matcher 가
 * `/` 하나면 그 링크들의 OG 카드가 **기본 카드로 폴백**한다(카카오·페이스북 미리보기 무의미).
 * 그러면서도 `/` 는 남아 있어야 이미 배포된 링크가 계속 산다.
 *
 * 이 스위트는 그 결정을 잠근다 — 두 경로가 다 매칭되고, 서버가 fetch 하는 경로는 하나도 들어
 * 있지 않으며, `?share=`/`?s=` 분기가 두 경로에서 똑같이 동작하는지 확인한다.
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

/** matcher 를 항상 배열로 본다 — 문자열 하나로 되돌리는 축소도 이 함수를 통해 잡힌다. */
const matcherPaths = (): string[] =>
  Array.isArray(middlewareConfig.matcher) ? [...middlewareConfig.matcher] : [middlewareConfig.matcher];

describe('middleware matcher (재귀 방지 계약)', () => {
  it("matcher 는 공유 링크가 착지하는 두 경로다 — '/'(배포된 링크)와 '/simulator'(신규 링크)", () => {
    expect(matcherPaths()).toEqual(['/', '/simulator']);
  });

  it('matcher 의 시뮬레이터 항목은 라우트 상수와 같은 경로다 — 한쪽만 바뀌면 신규 링크 OG 가 죽는다', () => {
    // config 는 빌드가 정적으로 읽으므로 리터럴이어야 한다 → 상수와의 동기화를 여기서 잠근다.
    expect(matcherPaths()).toContain(SIMULATOR_PATH);
  });

  it('middleware/함수가 fetch 하는 경로는 matcher 에 하나도 없다 (508 INFINITE_LOOP 회피)', () => {
    const fetchedByServer = ['/index.html', '/api/share-html', '/api/post-html', '/api/sitemap', '/api/og'];
    for (const path of fetchedByServer) {
      expect(matcherPaths()).not.toContain(path);
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
    // 🔴 og:url 은 **요청 경로가 아니라** 시나리오의 정본 주소(`/simulator`)다. 루트로 하드코딩된
    //    상태(`https://snowball.test/?share=…`)로 되돌아가면 여기서 잡힌다.
    expect(html).toContain('content="https://snowball.test/simulator?share=N4IgLgpg"');
    expect(html).not.toContain('content="https://snowball.test/?share=N4IgLgpg"');
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

/**
 * 🔴 **이전 후 새로 만들어지는 링크**의 경로. 생산자(`usePortfolioPersistence`)가
 * `window.location.href` 를 베이스로 쓰므로, 사용자가 `/simulator` 에서 공유하면 링크도
 * `/simulator?share=…` 가 된다. matcher 가 `/` 하나로 축소되면 아래가 전부 빨개진다
 * — 그때 실제로 죽는 것은 카카오·페이스북·네이버 미리보기 카드다.
 */
describe('`/simulator` 공유 링크도 같은 대접을 받는다 (신규 링크 OG)', () => {
  it('`/simulator?share=` 에 og:image/og:url 메타가 박힌다', async () => {
    const res = await middleware(new Request('https://snowball.test/simulator?share=N4IgLgpg'));
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(html).toContain('content="https://snowball.test/api/og?share=N4IgLgpg"');
    expect(html).toContain('content="https://snowball.test/simulator?share=N4IgLgpg"');
  });

  it('`/simulator?s=` 는 api/share-html 로 rewrite 된다', async () => {
    const res = await middleware(new Request('https://snowball.test/simulator?s=abcdefghijklmnopqrstuv'));
    const target = res.headers.get('x-middleware-rewrite');

    expect(target).toContain('/api/share-html');
    expect(target).toContain('s=abcdefghijklmnopqrstuv');
  });

  it('공유 파라미터 없는 `/simulator` 방문은 손대지 않는다 (일반 방문자 비용 0)', async () => {
    const stub = stubShell();
    const res = await middleware(new Request('https://snowball.test/simulator'));

    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    expect(res.headers.get('content-type')).toBeNull();
    expect(stub).not.toHaveBeenCalled();
  });
});
