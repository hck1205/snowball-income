import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '@/api/sitemap';

/**
 * `/api/sitemap` — 공개 글 동적 사이트맵.
 *
 * 핸들러 시그니처가 웹 표준(`(Request) => Promise<Response>`)이라 Vitest 에서 직접 호출한다.
 * Supabase 조회는 전역 `fetch` 스텁으로 주입한다(SDK 를 안 쓰고 plain REST 라 이게 전부다).
 */

const SUPABASE_URL = 'https://project.supabase.test';

type FetchStub = ReturnType<typeof vi.fn>;

const stubRest = (rows: unknown, ok = true): FetchStub => {
  const stub = vi.fn(async () =>
    new Response(JSON.stringify(rows), {
      status: ok ? 200 : 500,
      headers: { 'content-type': 'application/json' }
    })
  );
  vi.stubGlobal('fetch', stub);
  return stub;
};

const uuid = (n: number): string => `0000000${n}-1111-2222-3333-444444444444`;

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', SUPABASE_URL);
  vi.stubEnv('SUPABASE_ANON_KEY', 'anon-key');
  vi.stubEnv('SITE_URL', 'https://snowball.test');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('api/sitemap', () => {
  it('공개 글을 kind별 상세 URL로 내보낸다', async () => {
    stubRest([
      { id: uuid(1), kind: 'board', updated_at: '2026-07-19T00:00:00Z' },
      { id: uuid(2), kind: 'portfolio', updated_at: '2026-07-20T10:30:00Z' }
    ]);

    const res = await handler(new Request('https://x.test/api/sitemap'));
    const xml = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/xml');
    expect(xml).toContain(`<loc>https://snowball.test/community/board/${uuid(1)}</loc>`);
    expect(xml).toContain(`<loc>https://snowball.test/community/portfolio/${uuid(2)}</loc>`);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset');
  });

  it('is_public=true 만 요청한다 (RLS 위에 코드 게이트를 이중으로 건다)', async () => {
    const stub = stubRest([]);
    await handler(new Request('https://x.test/api/sitemap'));

    const requested = String(stub.mock.calls[0]?.[0]);
    expect(requested).toContain(`${SUPABASE_URL}/rest/v1/posts`);
    expect(requested).toContain('is_public=eq.true');
  });

  it('lastmod 를 updated_at 의 ISO 형태로 넣는다', async () => {
    stubRest([{ id: uuid(3), kind: 'board', updated_at: '2026-07-19 04:05:06+00' }]);

    const xml = await (await handler(new Request('https://x.test/api/sitemap'))).text();
    expect(xml).toContain('<lastmod>2026-07-19T04:05:06.000Z</lastmod>');
  });

  it('파싱 불가한 updated_at 은 lastmod 를 생략한다 (틀린 날짜보다 없는 편이 낫다)', async () => {
    stubRest([{ id: uuid(4), kind: 'board', updated_at: 'not-a-date' }]);

    const xml = await (await handler(new Request('https://x.test/api/sitemap'))).text();
    expect(xml).toContain(`<loc>https://snowball.test/community/board/${uuid(4)}</loc>`);
    expect(xml).not.toContain('<lastmod>');
  });

  it('형식이 깨진 행은 조용히 버리고 나머지는 살린다', async () => {
    stubRest([
      { id: 'not-a-uuid', kind: 'board', updated_at: '2026-07-19T00:00:00Z' },
      { id: uuid(5), kind: 'unknown-kind', updated_at: '2026-07-19T00:00:00Z' },
      { id: uuid(6), kind: 'portfolio', updated_at: '2026-07-19T00:00:00Z' }
    ]);

    const xml = await (await handler(new Request('https://x.test/api/sitemap'))).text();
    expect(xml).toContain(uuid(6));
    expect(xml).not.toContain('not-a-uuid');
    expect(xml).not.toContain(uuid(5));
  });

  it('성공 응답은 ISR 캐시 헤더를 붙인다 (s-maxage=3600 / swr=86400)', async () => {
    stubRest([]);
    const res = await handler(new Request('https://x.test/api/sitemap'));

    const cache = res.headers.get('cache-control') ?? '';
    expect(cache).toContain('s-maxage=3600');
    expect(cache).toContain('stale-while-revalidate=86400');
  });

  it('조회 실패는 5xx 가 아니라 빈 사이트맵 200 이고, 실패를 엣지에 박제하지 않는다', async () => {
    stubRest({ message: 'boom' }, false);
    const res = await handler(new Request('https://x.test/api/sitemap'));

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.text()).toContain('<urlset');
  });

  it('env 미설정이면 네트워크를 치지 않고 빈 사이트맵 200 을 준다', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_ANON_KEY', '');
    const stub = stubRest([]);

    const res = await handler(new Request('https://x.test/api/sitemap'));
    expect(stub).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('SITE_URL 미설정이면 요청 origin 으로 폴백한다', async () => {
    vi.stubEnv('SITE_URL', '');
    vi.stubEnv('VITE_SITE_URL', '');
    stubRest([{ id: uuid(7), kind: 'board', updated_at: '2026-07-19T00:00:00Z' }]);

    const xml = await (await handler(new Request('https://preview.vercel.app/api/sitemap'))).text();
    expect(xml).toContain(`<loc>https://preview.vercel.app/community/board/${uuid(7)}</loc>`);
  });
});
