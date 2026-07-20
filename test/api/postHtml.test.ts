import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '@/api/post-html';

/**
 * `/api/post-html` — 글 상세의 메타태그 ISR.
 *
 * ⚠ `dist/index.html` 에 의존하지 않는다 — 셸은 아래 픽스처다(빌드 산출물에 테스트를 묶으면
 * 빌드 없이는 못 돌고, index.html 이 바뀔 때마다 테스트가 흔들린다).
 */

const SHELL = `<!doctype html>
<html lang="ko">
  <head>
    <title>배당 재투자 시뮬레이터 - Snowball Income</title>
    <meta name="description" content="기본 설명" />
    <link id="canonical-link" rel="canonical" href="https://snowball.test/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Snowball Income" />
    <meta
      property="og:title"
      content="기본 제목"
    />
    <meta property="og:description" content="기본 og 설명" />
    <meta id="og-url" property="og:url" content="https://snowball.test/" />
    <meta property="og:image" content="https://snowball.test/og-image.png" />
    <meta property="og:image:alt" content="기본 alt" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="기본 트위터 제목" />
    <meta name="twitter:description" content="기본 트위터 설명" />
    <meta name="twitter:image" content="https://snowball.test/og-image.png" />
  </head>
  <body><div id="root"></div><script type="module" src="/main.tsx"></script></body>
</html>`;

const POST_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

type RestReply = { rows: unknown; ok?: boolean };

/**
 * 핸들러가 치는 요청은 두 종류다: ① `/index.html` 셸, ② Supabase REST.
 * 하나의 스텁으로 URL 을 보고 갈라 준다. `shellOk:false` 로 셸 장애도 재현한다.
 */
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

const publicRow = (overrides: Record<string, unknown> = {}) => ({
  id: POST_ID,
  kind: 'board',
  title: '내 배당 포트폴리오',
  description: '월 300만원 목표로 굴리는 중',
  updated_at: '2026-07-19T00:00:00Z',
  ...overrides
});

const call = (query: string) => handler(new Request(`https://snowball.test/api/post-html?${query}`));

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

describe('api/post-html — 공개 글', () => {
  it('제목·설명·canonical·og·twitter 메타를 그 글로 치환한다', async () => {
    stubFetch({ rows: [publicRow()] });
    const res = await call(`kind=board&id=${POST_ID}`);
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain('<title>내 배당 포트폴리오 - Snowball Income</title>');
    expect(html).toContain('content="월 300만원 목표로 굴리는 중"');
    expect(html).toContain(`href="https://snowball.test/community/board/${POST_ID}"`);
    expect(html).toContain(`content="https://snowball.test/community/board/${POST_ID}"`);
    expect(html).toMatch(/property="og:title"\s+content="내 배당 포트폴리오 - Snowball Income"/);
    expect(html).toContain('name="twitter:title" content="내 배당 포트폴리오 - Snowball Income"');
  });

  it('불변식: og:type·site_name·twitter:card·이미지는 건드리지 않는다 (본문·script 도 그대로)', async () => {
    stubFetch({ rows: [publicRow()] });
    const html = await (await call(`kind=board&id=${POST_ID}`)).text();

    expect(html).toContain('property="og:type" content="website"');
    expect(html).toContain('property="og:site_name" content="Snowball Income"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('property="og:image" content="https://snowball.test/og-image.png"');
    expect(html).toContain('property="og:image:alt" content="기본 alt"');
    expect(html).toContain('<script type="module" src="/main.tsx"></script>');
  });

  it('크롤러 전용 분기가 없다 — User-Agent 가 달라도 같은 HTML 을 준다 (클로킹 금지)', async () => {
    stubFetch({ rows: [publicRow()] });
    const bot = await handler(
      new Request(`https://snowball.test/api/post-html?kind=board&id=${POST_ID}`, {
        headers: { 'user-agent': 'Yeti/1.1 (+http://naver.me/spd)' }
      })
    );
    stubFetch({ rows: [publicRow()] });
    const human = await call(`kind=board&id=${POST_ID}`);

    expect(await bot.text()).toBe(await human.text());
  });

  it('제목의 HTML 특수문자를 이스케이프한다', async () => {
    stubFetch({ rows: [publicRow({ title: '<script>&"위험"', description: 'a & b' })] });
    const html = await (await call(`kind=board&id=${POST_ID}`)).text();

    expect(html).toContain('<title>&lt;script&gt;&amp;"위험" - Snowball Income</title>');
    expect(html).toContain('content="a &amp; b"');
    expect(html).not.toContain('<script>&"위험"');
  });

  it('description 이 없으면 종류별 기본 설명으로 채운다', async () => {
    stubFetch({ rows: [publicRow({ kind: 'portfolio', description: null })] });
    const html = await (await call(`kind=portfolio&id=${POST_ID}`)).text();

    expect(html).toContain('배당 포트폴리오 시나리오');
  });

  it('상세 성공은 s-maxage=300 / swr=604800 (수정이 5분 내 반영)', async () => {
    stubFetch({ rows: [publicRow()] });
    const cache = (await call(`kind=board&id=${POST_ID}`)).headers.get('cache-control') ?? '';

    expect(cache).toContain('s-maxage=300');
    expect(cache).toContain('stale-while-revalidate=604800');
  });

  it('kind 를 쿼리에 실어 교차 경로(/board/<포트폴리오 글>)를 막는다', async () => {
    const stub = stubFetch({ rows: [] });
    await call(`kind=portfolio&id=${POST_ID}`);

    const restCall = stub.mock.calls.map((c) => String(c[0])).find((u) => u.includes('/rest/v1/posts'));
    expect(restCall).toContain('kind=eq.portfolio');
    expect(restCall).toContain(`id=eq.${POST_ID}`);
    expect(restCall).toContain('is_public=eq.true');
  });
});

describe('api/post-html — 실패 종류 구분', () => {
  it('없는 글/비공개 글은 404 이고 절대 캐시하지 않는다', async () => {
    // RLS 가 비공개를 걸러 빈 배열이 온다 — 없는 글과 구분하지 않는다(존재 여부 누출 방지).
    stubFetch({ rows: [] });
    const res = await call(`kind=board&id=${POST_ID}`);

    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toBe('no-store');
    // 사람이 열면 앱이 떠야 하므로 본문은 여전히 셸이다.
    expect(await res.text()).toContain('<div id="root">');
  });

  it('일시적 조회 실패는 404 가 아니라 무치환 셸 200 + no-store 다', async () => {
    stubFetch({ rows: null, ok: false });
    const res = await call(`kind=board&id=${POST_ID}`);

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.text()).toContain('<title>배당 재투자 시뮬레이터 - Snowball Income</title>');
  });

  it('네트워크 예외도 무치환 셸 200 이다 (5xx 를 내지 않는다)', async () => {
    stubFetch('network-error');
    const res = await call(`kind=board&id=${POST_ID}`);

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('env 미설정도 unavailable — 셸 200, 404 아님', async () => {
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_ANON_KEY', '');
    stubFetch({ rows: [] });

    const res = await call(`kind=board&id=${POST_ID}`);
    expect(res.status).toBe(200);
  });

  it('예약 세그먼트(/community/portfolio/write)는 404 가 아니라 셸 200 — 글쓰기 화면이 살아야 한다', async () => {
    const stub = stubFetch({ rows: [] });
    const res = await call('kind=portfolio&id=write');

    expect(res.status).toBe(200);
    // uuid 가 아니면 DB 를 아예 치지 않는다.
    expect(stub.mock.calls.map((c) => String(c[0])).some((u) => u.includes('/rest/v1/posts'))).toBe(false);
  });

  it('알 수 없는 kind 는 셸 200 (앱 라우터가 처리)', async () => {
    stubFetch({ rows: [] });
    const res = await call(`kind=nope&id=${POST_ID}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('셸을 못 읽는 극단은 5xx 가 아니라 루트로 302', async () => {
    stubFetch({ rows: [publicRow()] }, { shellOk: false });
    const res = await call(`kind=board&id=${POST_ID}`);

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://snowball.test/');
  });
});
