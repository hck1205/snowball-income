import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { handler } from '@/server/handlers/SeoHtml/SeoHtml';
import { GUIDES } from '@/shared/constants/guides';
import { API_BUNDLES } from '../../tools/apiBundle/manifest.mjs';

/**
 * `/api/seo-html` — 정적 콘텐츠 지면 셋(티커·배당 목록·가이드)을 한 함수로 모은 진입점.
 *
 * 🔴 **이 파일이 지키는 것은 "몇 개인가"와 "어디로 가는가" 둘이다.**
 * 개수: Vercel Hobby 는 배포당 서버리스 함수 12개가 상한이고, 13개가 되던 날 배포가 죽었다
 * (빌드는 통과하고 "Deploying outputs" 에서 `exceeded_serverless_functions_per_deployment`).
 * 그 사고는 **유닛테스트가 전부 초록인 채로** 났다 — 그래서 개수를 여기서 센다.
 * 분기: rewrite 의 `surface` 값과 이 디스패처가 어긋나면 크롤러가 빈 셸만 받는다.
 *
 * ⚠ 각 지면의 **내용**은 자기 테스트가 본다(tickerHtml·guideHtml). 여기서는 배선만 본다.
 */
const SHELL = '<!doctype html><html><head><title>x</title></head><body><div id="root"></div></body></html>';

const request = (query: string) => new Request(`https://hungry-hippo.xyz/api/seo-html?${query}`);

beforeEach(() => {
  // 세 핸들러 모두 셸을 가져오려고 /index.html 을 fetch 한다.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(SHELL, { status: 200, headers: { 'content-type': 'text/html' } }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('서버리스 함수 예산', () => {
  /**
   * 🔴 이 단정이 빨개지면 **배포가 죽는다.** 늘리기 전에 SeoHtml 처럼 묶을 수 있는지 먼저 보라.
   */
  it('배포 함수가 Vercel Hobby 상한(12개) 이하다', () => {
    expect(API_BUNDLES.length).toBeLessThanOrEqual(12);
  });

  it('합쳐진 진입점이 매니페스트에 하나로 들어 있다 — 옛 세 항목이 남아 있으면 안 된다', () => {
    const outputs = API_BUNDLES.map((bundle) => bundle.out);
    expect(outputs).toContain('api/seo-html.js');
    expect(outputs).not.toContain('api/ticker-html.js');
    expect(outputs).not.toContain('api/dividend-list-html.js');
    expect(outputs).not.toContain('api/guide-html.js');
  });
});

describe('api/seo-html — 지면 분기', () => {
  it('surface=guide 는 그 가이드의 본문을 그린다', async () => {
    const guide = GUIDES[0]!;
    const html = await (await handler(request(`surface=guide&slug=${guide.slug}`))).text();

    expect(html).toContain(`<h1>${guide.title}`);
    expect(html).toContain(guide.sections[0]!.heading);
  });

  it('surface=ticker 는 그 티커의 본문을 그린다', async () => {
    const html = await (await handler(request('surface=ticker&name=schd'))).text();

    expect(html).toContain('SCHD');
    expect(html).toMatch(/<h1[^>]*>/);
  });

  it('surface=dividend-list 는 그 목록의 본문을 그린다', async () => {
    const html = await (await handler(request('surface=dividend-list&list=kings'))).text();

    expect(html).toMatch(/<h1[^>]*>/);
    expect(html.length).toBeGreaterThan(SHELL.length);
  });

  it('세 지면이 서로 다른 문서를 낸다 — 배선이 한 곳으로 쏠리면 여기서 잡힌다', async () => {
    const [guide, ticker, list] = await Promise.all([
      handler(request('surface=guide&slug=what-is-dividend')).then((r) => r.text()),
      handler(request('surface=ticker&name=schd')).then((r) => r.text()),
      handler(request('surface=dividend-list&list=kings')).then((r) => r.text())
    ]);

    expect(new Set([guide, ticker, list]).size).toBe(3);
  });

  it('모르는 surface 는 루트로 보내고 캐시하지 않는다', async () => {
    const response = await handler(request('surface=nope'));

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://hungry-hippo.xyz/');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('surface 가 없으면 파라미터로 추측하지 않는다 — 추측은 언젠가 틀린 지면을 그린다', async () => {
    const response = await handler(request('name=schd'));

    expect(response.status).toBe(302);
  });
});
