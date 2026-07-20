import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '@/server/handlers/PostList';

/**
 * `/api/post-list` — 커뮤니티 목록 페이지의 제목·링크 ISR.
 *
 * ⚠ post-html.test.ts 와 같은 규약: `dist/index.html` 이 아니라 아래 픽스처 셸을 쓴다.
 */

const SHELL = `<!doctype html>
<html lang="ko">
  <head>
    <title>배당 재투자 시뮬레이터 - Snowball Income</title>
    <meta name="description" content="기본 설명" />
    <link rel="canonical" href="https://snowball.test/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Snowball Income" />
    <meta property="og:title" content="기본 제목" />
    <meta property="og:description" content="기본 og 설명" />
    <meta property="og:url" content="https://snowball.test/" />
    <meta property="og:image" content="https://snowball.test/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="기본 트위터 제목" />
    <meta name="twitter:description" content="기본 트위터 설명" />
  </head>
  <body><div id="root"></div><script type="module" src="/main.tsx"></script></body>
</html>`;

const ID_A = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const ID_B = '11111111-2222-3333-4444-555555555555';

type RestReply = { rows: unknown; ok?: boolean };

const stubFetch = (rest: RestReply | 'network-error', options: { shellOk?: boolean } = {}) => {
  const stub = vi.fn(async (input: unknown) => {
    const url = String(input);
    if (url.endsWith('/index.html')) {
      return new Response(options.shellOk === false ? 'nope' : SHELL, {
        status: options.shellOk === false ? 500 : 200
      });
    }
    if (rest === 'network-error') throw new Error('network down');
    return new Response(JSON.stringify(rest.rows), {
      status: rest.ok === false ? 500 : 200,
      headers: { 'content-type': 'application/json' }
    });
  });
  vi.stubGlobal('fetch', stub);
  return stub;
};

const call = (query: string) => handler(new Request(`https://snowball.test/api/post-list?${query}`));

/** `<div id="root">` 여는 태그 직후 삽입분을 뽑는다. */
const rootInner = (html: string): string => {
  const open = html.match(/<div\s+id="root"[^>]*>/i);
  return open ? html.slice((open.index ?? 0) + open[0].length) : '';
};

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://project.supabase.test');
  vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key');
  vi.stubEnv('SITE_URL', 'https://snowball.test');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('api/post-list — 목록 주입', () => {
  it('공개 글 제목·링크를 #root 안에 nav/ul/li 로 주입한다', async () => {
    stubFetch({
      rows: [
        { id: ID_A, kind: 'portfolio', title: 'SCHD 30년' },
        { id: ID_B, kind: 'portfolio', title: 'JEPI 배당' }
      ]
    });
    const html = await (await call('kind=portfolio')).text();
    const inner = rootInner(html);

    expect(inner.startsWith('<nav')).toBe(true);
    expect(html).toContain(`<a href="/community/portfolio/${ID_A}">SCHD 30년</a>`);
    expect(html).toContain(`<a href="/community/portfolio/${ID_B}">JEPI 배당</a>`);
  });

  it('kind 별 title·canonical 을 치환한다', async () => {
    stubFetch({ rows: [{ id: ID_A, kind: 'board', title: '안녕하세요' }] });
    const html = await (await call('kind=board')).text();

    expect(html).toContain('<title>자유게시판 - Snowball Income</title>');
    expect(html).toContain('href="https://snowball.test/community/board"');
    expect(html).toContain('content="https://snowball.test/community/board"');
    expect(html).toMatch(/property="og:title"\s+content="자유게시판 - Snowball Income"/);
  });

  it('포트폴리오 목록 title 은 갤러리 카피다', async () => {
    stubFetch({ rows: [{ id: ID_A, kind: 'portfolio', title: 'x' }] });
    const html = await (await call('kind=portfolio')).text();
    expect(html).toContain('<title>포트폴리오 갤러리 - Snowball Income</title>');
  });

  it('제목의 <script> 는 텍스트로 이스케이프한다(마크업 실행 불가)', async () => {
    stubFetch({ rows: [{ id: ID_A, kind: 'board', title: '<script>alert(1)</script>' }] });
    const html = await (await call('kind=board')).text();

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(rootInner(html)).not.toContain('<script>alert(1)</script>');
    // 셸의 앱 부트 스크립트는 그대로 살아 있다.
    expect(html).toContain('<script type="module" src="/main.tsx"></script>');
  });

  it('형식이 깨진 행(id 아님·빈 제목)은 걸러내고 유효한 것만 넣는다', async () => {
    stubFetch({
      rows: [
        { id: 'not-a-uuid', kind: 'board', title: '무효' },
        { id: ID_A, kind: 'board', title: '' },
        { id: ID_B, kind: 'board', title: '유효' }
      ]
    });
    const html = await (await call('kind=board')).text();

    expect(html).toContain('>유효</a>');
    expect(html).not.toContain('무효');
    expect(html).not.toContain(ID_A);
  });

  it('성공 목록은 s-maxage=60 (새 글이 1분 내 노출)', async () => {
    stubFetch({ rows: [{ id: ID_A, kind: 'portfolio', title: 'x' }] });
    const cache = (await call('kind=portfolio')).headers.get('cache-control') ?? '';

    expect(cache).toContain('s-maxage=60');
    expect(cache).toContain('stale-while-revalidate=3600');
  });

  it('is_public=eq.true 를 명시해 조회한다', async () => {
    const stub = stubFetch({ rows: [] });
    await call('kind=board');

    const restCall = stub.mock.calls.map((c) => String(c[0])).find((u) => u.includes('/rest/v1/posts'));
    expect(restCall).toContain('kind=eq.board');
    expect(restCall).toContain('is_public=eq.true');
    expect(restCall).toContain('order=updated_at.desc');
  });
});

describe('api/post-list — 빈 목록·실패 처리', () => {
  it('빈 목록은 메타만 붙은 셸 200(주입 없음)', async () => {
    stubFetch({ rows: [] });
    const res = await call('kind=portfolio');
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain('<title>포트폴리오 갤러리 - Snowball Income</title>');
    expect(html).toContain('<div id="root"></div>');
    expect(html).not.toContain('<nav');
  });

  it('일시적 조회 실패는 메타 셸 200 + no-store(장애를 캐시하지 않는다)', async () => {
    stubFetch({ rows: null, ok: false });
    const res = await call('kind=board');

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.text()).not.toContain('<nav');
  });

  it('네트워크 예외도 5xx 가 아니라 셸 200', async () => {
    stubFetch('network-error');
    const res = await call('kind=portfolio');

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('env 미설정도 메타 셸 200 (조회 스킵)', async () => {
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_ANON_KEY', '');
    const stub = stubFetch({ rows: [] });

    const res = await call('kind=board');
    expect(res.status).toBe(200);
    // 조회 자체를 안 친다.
    expect(stub.mock.calls.map((c) => String(c[0])).some((u) => u.includes('/rest/v1/posts'))).toBe(false);
  });

  it('알 수 없는 kind 는 무치환 셸 200', async () => {
    stubFetch({ rows: [] });
    const res = await call('kind=nope');

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.text()).toContain('<title>배당 재투자 시뮬레이터 - Snowball Income</title>');
  });

  it('셸을 못 읽는 극단은 루트로 302', async () => {
    stubFetch({ rows: [] }, { shellOk: false });
    const res = await call('kind=board');

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://snowball.test/');
  });
});
