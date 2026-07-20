import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler as postHtmlHandler } from '@/server/handlers/PostHtml';
import { handler as postListHandler } from '@/server/handlers/PostList';

/**
 * 주입 헬퍼 견고성 — 정화된 본문/목록을 `#root` 여는 태그 직후에 꽂는 서버 주입이, 적대적 셸·본문에서도
 * 셸 구조를 깨지 않는지 실제 핸들러로 구동해 검증한다(injectPostBody/injectPostList 는 미export 라 핸들러
 * 경유). postHtml.test.ts/postList.test.ts 의 정상 셸 케이스를 **적대적 변형**으로 보강한다.
 */

const POST_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

const bodyOf = (root: string) =>
  `<!doctype html><html lang="ko"><head><title>배당 재투자 시뮬레이터 - Snowball Income</title>` +
  `<meta name="description" content="기본 설명" /><link rel="canonical" href="https://snowball.test/" />` +
  `<meta property="og:title" content="기본 제목" /><meta property="og:description" content="d" />` +
  `<meta property="og:url" content="https://snowball.test/" /><meta name="twitter:title" content="t" />` +
  `<meta name="twitter:description" content="d" /></head>` +
  `<body>${root}<script type="module" src="/main.tsx"></script></body></html>`;

/** 셸 텍스트를 커스터마이즈할 수 있는 fetch 스텁(post-html.test 의 하네스를 셸 가변으로 확장). */
const stubFetch = (rows: unknown, shell: string) => {
  const stub = vi.fn(async (input: unknown) => {
    const url = String(input);
    if (url.endsWith('/index.html')) return new Response(shell, { status: 200 });
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  });
  vi.stubGlobal('fetch', stub);
  return stub;
};

const publicRow = (overrides: Record<string, unknown> = {}) => ({
  id: POST_ID,
  kind: 'board',
  title: '제목',
  description: '설명',
  updated_at: '2026-07-19T00:00:00Z',
  ...overrides
});

const callHtml = () => postHtmlHandler(new Request(`https://snowball.test/api/post-html?kind=board&id=${POST_ID}`));
const callList = () => postListHandler(new Request('https://snowball.test/api/post-list?kind=board'));

const rootInner = (html: string): string => {
  const open = html.match(/<div\s+id="root"[^>]*>/i);
  return open ? html.slice((open.index ?? 0) + open[0].length) : '';
};

const countRoots = (html: string): number => (html.match(/id="root"/gi) ?? []).length;

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

describe('injectPostBody 견고성 — 적대적 셸/본문', () => {
  it('속성 있는 root(<div id="root" class=.. data-..>)에도 여는 태그 직후 주입한다', async () => {
    stubFetch([publicRow({ title: '안녕', body: '<p>본문</p>' })], bodyOf('<div id="root" class="app" data-hydrate="true"></div>'));
    const html = await (await callHtml()).text();

    expect(rootInner(html).startsWith('<article><h1>안녕</h1>')).toBe(true);
    // 원래 여는 태그의 속성은 보존된다(치환이 아니라 삽입).
    expect(html).toContain('<div id="root" class="app" data-hydrate="true">');
    expect(countRoots(html)).toBe(1);
  });

  it('root 없는 셸(방어)은 article 없이 원문 그대로 200 을 반환한다', async () => {
    stubFetch([publicRow({ body: '<p>본문</p>' })], bodyOf('<main id="app"></main>'));
    const res = await callHtml();
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).not.toContain('<article>');
    expect(html).toContain('<main id="app"></main>');
    expect(html).toContain('<script type="module" src="/main.tsx"></script>');
  });

  it('본문에 </div>/</script> 리터럴이 있어도 셸 구조가 안 깨진다(DOMPurify 가 제거)', async () => {
    stubFetch(
      [publicRow({ body: '<p>앞</p></div><script>alert(1)</script></div><p>뒤</p>' })],
      bodyOf('<div id="root"></div>')
    );
    const html = await (await callHtml()).text();

    // 조기 종료 </div>/</script> 는 정화 단계에서 사라져 셸 잡동사니로 남지 않는다.
    expect(html).not.toContain('alert(1)');
    expect(html).not.toContain('<script>alert(1)');
    // 셸의 부트 스크립트는 그대로, root 는 여전히 하나.
    expect(html).toContain('<script type="module" src="/main.tsx"></script>');
    expect(countRoots(html)).toBe(1);
    expect(rootInner(html).startsWith('<article>')).toBe(true);
    expect(html).toContain('<p>앞</p>');
    expect(html).toContain('<p>뒤</p>');
  });

  it('본문이 가짜 root(<div id="root">)를 심어도 두 번째 root 를 만들지 못한다', async () => {
    stubFetch(
      [publicRow({ body: '<div id="root">가짜</div><p>진짜</p>' })],
      bodyOf('<div id="root"></div>')
    );
    const html = await (await callHtml()).text();

    // 본문의 div/id 는 정화로 제거되어 텍스트만 남고, 실제 root 는 하나뿐.
    expect(countRoots(html)).toBe(1);
    expect(rootInner(html)).toContain('가짜'); // 텍스트는 보존(무해)
    expect(rootInner(html)).toContain('<p>진짜</p>');
    expect(rootInner(html)).not.toContain('<div id="root">가짜');
  });

  it('제목이 h1 마크업을 탈출하려 해도 텍스트 이스케이프된다', async () => {
    stubFetch(
      [publicRow({ title: '</h1><img src=x onerror=alert(1)>', body: '<p>x</p>' })],
      bodyOf('<div id="root"></div>')
    );
    const html = await (await callHtml()).text();

    // `<` 가 `&lt;` 로 escape 되어 live 태그가 아니다 — escape 된 텍스트 안에 "onerror=" 문자열이
    // 남는 것은 무해하다(마크업이 아니므로 실행되지 않는다). 보안 계약은 "live <img 태그가 없다".
    expect(html).toContain('<h1>&lt;/h1&gt;&lt;img src=x onerror=alert(1)&gt;</h1>');
    expect(html).not.toMatch(/<img/i);
  });
});

describe('injectPostList 견고성 — 제목 이스케이프/셸', () => {
  it('<script> 제목은 링크 텍스트로 이스케이프되어 실행 벡터가 안 생긴다', async () => {
    stubFetch([{ id: POST_ID, kind: 'board', title: '<script>alert(1)</script>' }], bodyOf('<div id="root"></div>'));
    const html = await (await callList()).text();

    expect(rootInner(html)).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(rootInner(html)).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('<script type="module" src="/main.tsx"></script>');
    expect(countRoots(html)).toBe(1);
  });

  it('img onerror 제목도 이스케이프되어 이벤트 핸들러가 살지 않는다', async () => {
    stubFetch(
      [{ id: POST_ID, kind: 'board', title: '<img src=x onerror=alert(1)>탈출' }],
      bodyOf('<div id="root"></div>')
    );
    const html = await (await callList()).text();
    const inner = rootInner(html);

    // escape 된 텍스트라 live 태그가 아니다(위 h1 케이스와 동일 논리) — "<img" live 태그만 없으면 된다.
    expect(inner).toContain('&lt;img src=x onerror=alert(1)&gt;탈출');
    expect(inner).not.toMatch(/<img/i);
  });

  it('root 없는 셸(방어)은 nav 없이 원문 그대로 반환한다', async () => {
    stubFetch([{ id: POST_ID, kind: 'board', title: '유효' }], bodyOf('<main id="app"></main>'));
    const html = await (await callList()).text();

    expect(html).not.toContain('<nav');
    expect(html).toContain('<main id="app"></main>');
  });
});
