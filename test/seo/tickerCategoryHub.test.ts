// @vitest-environment node — 서버 핸들러를 직접 부르는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { categoryHandler } from '@/server/handlers/TickerHtml/TickerHtml';
import {
  listTickerContentByCategory,
  TICKER_CATEGORY_IDS,
  TICKER_CATEGORY_LABEL,
  TICKER_CATEGORY_META,
  tickerCategoryPath
} from '@/shared/constants/tickers';

/**
 * **카테고리 허브(`/ticker/category/:id`)가 토픽 클러스터를 만든다**는 계약 (2026-08-14).
 *
 * 🔴 왜 필요한가: 티커 페이지 109개가 허브 하나(`/ticker/all`)에만 매달려 있으면 개별 페이지로 가는
 * 내부 링크가 한 단계뿐이라 권위가 분산되고, "커버드콜 ETF" 같은 **묶음 단위 검색어**를 받을 페이지가
 * 아예 없다. 그리고 이 화면의 콘텐츠는 목록이라 **React 가 그리면 크롤러에겐 빈 셸**이다 —
 * 서버가 텍스트로 내야 한다.
 *
 * ⚠ **새 서버리스 함수가 아니다.** `SeoHtml` 이 지면으로 갈라 부르므로 함수 칸(12/12)을 쓰지 않는다.
 */

const TEST_ORIGIN = 'https://hungry-hippo.xyz';

/** 최소 셸 — 실제 index.html 의 치환 지점만 갖춘다(api 하네스와 같은 방식). */
const SHELL = [
  '<!doctype html><html lang="ko"><head>',
  '<title>SHELL_TITLE</title>',
  '<meta name="description" content="SHELL_DESC" />',
  '<link rel="canonical" href="https://hungry-hippo.xyz/" />',
  '<meta property="og:title" content="SHELL_OG_TITLE" />',
  '<meta property="og:description" content="SHELL_OG_DESC" />',
  '<meta property="og:url" content="https://hungry-hippo.xyz/" />',
  '<meta name="twitter:title" content="SHELL_TW_TITLE" />',
  '<meta name="twitter:description" content="SHELL_TW_DESC" />',
  '</head><body><div id="root"></div></body></html>'
].join('');

beforeEach(() => {
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    if (String(input).endsWith('/index.html')) {
      return new Response(SHELL, { status: 200, headers: { 'content-type': 'text/html' } });
    }
    return new Response('{}', { status: 200 });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const render = async (id: string): Promise<{ status: number; html: string }> => {
  const response = await categoryHandler(
    new Request(`${TEST_ORIGIN}/api/seo-html?surface=ticker-category&id=${id}`)
  );
  return { status: response.status, html: await response.text() };
};

describe('메타 정본', () => {
  it('모든 카테고리에 메타가 있다 (라벨만 추가하고 문구를 빠뜨릴 수 없다)', () => {
    for (const id of TICKER_CATEGORY_IDS) {
      expect(TICKER_CATEGORY_META[id], id).toBeDefined();
      expect(TICKER_CATEGORY_META[id].metaTitle.length, id).toBeGreaterThan(5);
      expect(TICKER_CATEGORY_META[id].description.length, id).toBeGreaterThan(40);
    }
  });

  it('🔴 묶음마다 트레이드오프 한 줄이 있다 — 장점만 적은 카테고리가 없어야 한다', () => {
    for (const id of TICKER_CATEGORY_IDS) {
      expect(TICKER_CATEGORY_META[id].caution.length, id).toBeGreaterThan(20);
    }
  });

  it('제목에 사이트명 접미가 들어 있지 않다 (표면이 붙인다)', () => {
    for (const id of TICKER_CATEGORY_IDS) {
      expect(TICKER_CATEGORY_META[id].metaTitle, id).not.toContain('Hungry Hippo');
    }
  });
});

describe('서버 렌더 — 크롤러가 읽는 HTML', () => {
  it.each(TICKER_CATEGORY_IDS)('%s — 제목·canonical 이 그 묶음 것이다', async (id) => {
    const { status, html } = await render(id);

    expect(status).toBe(200);
    expect(html).toContain(`<title>${TICKER_CATEGORY_META[id].metaTitle} - Hungry Hippo</title>`);
    expect(html).toContain(`href="${TEST_ORIGIN}${tickerCategoryPath(id)}"`);
    expect(html).not.toContain('SHELL_TITLE');
  });

  it.each(TICKER_CATEGORY_IDS)('%s — 소속 티커가 텍스트 링크로 들어 있다', async (id) => {
    const { html } = await render(id);
    const entries = listTickerContentByCategory(id);

    expect(entries.length, `${id} 에 티커가 없다 — 빈 카테고리는 링크 가치가 없다`).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(html, `${id}/${entry.slug}`).toContain(`href="/ticker/${entry.slug}"`);
    }
  });

  it('트레이드오프 문장이 목록보다 먼저 나온다', async () => {
    const { html } = await render('covered-call');
    const cautionAt = html.indexOf(TICKER_CATEGORY_META['covered-call'].caution.slice(0, 20));
    const listAt = html.indexOf('id="members"');

    expect(cautionAt).toBeGreaterThan(0);
    expect(cautionAt).toBeLessThan(listAt);
  });

  it('형제 묶음과 전체 허브로 가는 링크가 있다 — 크롤러가 이 가족을 다 찾아간다', async () => {
    const { html } = await render('reit');

    expect(html).toContain('href="/ticker/all"');
    expect(html).toContain(`href="${tickerCategoryPath('high-dividend')}"`);
    // 자기 자신은 형제 목록에 넣지 않는다.
    const selfLinks = html.split(`href="${tickerCategoryPath('reit')}"`).length - 1;
    expect(selfLinks).toBe(0);
  });

  it('BreadcrumbList 로 계층을 선언한다 (전체 허브 → 이 묶음)', async () => {
    const { html } = await render('dividend-growth');

    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('"@type":"ItemList"');
    expect(html).toContain(`${TEST_ORIGIN}/ticker/all`);
  });

  it('시뮬레이터로 가는 CTA 가 있다 — 이 페이지의 최종 목적지다', async () => {
    const { html } = await render('high-dividend');
    expect(html).toContain('href="/simulator"');
  });

  it('모르는 카테고리는 무치환 셸 200 — 앱이 부팅해 라우터가 판단한다', async () => {
    const { status, html } = await render('does-not-exist');

    expect(status).toBe(200);
    expect(html).toContain('SHELL_TITLE');
  });
});

describe('배선', () => {
  const readRepoFile = (relativePath: string): string =>
    readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');

  it('SeoHtml 이 이 지면을 안다 — 없으면 rewrite 가 302 로 떨어진다', () => {
    const source = readRepoFile('../../server/handlers/SeoHtml/SeoHtml.ts');
    expect(source).toContain("'ticker-category'");
  });

  it('🔴 새 서버리스 함수를 만들지 않았다 — api 진입점은 12개 그대로다', () => {
    const manifest = readRepoFile('../../tools/apiBundle/manifest.mjs');
    const entries = manifest.match(/name:\s*'[^']+'/g) ?? [];
    expect(entries.length).toBeLessThanOrEqual(12);
  });

  it('vercel.json 이 카테고리를 seo-html 로 보낸다', () => {
    const vercel = JSON.parse(readRepoFile('../../vercel.json')) as {
      rewrites: { source: string; destination: string }[];
    };
    const rule = vercel.rewrites.find((item) => item.source === '/ticker/category/:id');

    expect(rule?.destination).toContain('surface=ticker-category');
  });

  it('🔴 `/ticker/:name` 보다 앞에 있다 — 뒤면 티커 핸들러가 삼킨다', () => {
    const vercel = JSON.parse(readRepoFile('../../vercel.json')) as {
      rewrites: { source: string; destination: string }[];
    };
    const categoryIndex = vercel.rewrites.findIndex((item) => item.source === '/ticker/category/:id');
    const tickerIndex = vercel.rewrites.findIndex((item) => item.source === '/ticker/:name');

    expect(categoryIndex).toBeGreaterThanOrEqual(0);
    expect(tickerIndex).toBeGreaterThan(categoryIndex);
  });

  it('SPA 라우트가 있다 — 서버 HTML 만 있으면 하이드레이션 후 404 가 된다', () => {
    const routes = readRepoFile('../../router/routes.tsx');
    expect(routes).toContain("'/ticker/category/:categoryId'");
  });

  it('사이트맵이 카테고리를 파생으로 싣는다 (손으로 나열하지 않는다)', () => {
    const config = readRepoFile('../../vite.config.ts');
    expect(config).toContain('buildTickerCategorySitemapRoutes');
    expect(config).toContain('TICKER_CATEGORY_IDS');
  });

  it('개별 티커 페이지가 묶음으로 되올라간다 — 클러스터는 양방향이어야 성립한다', () => {
    const source = readRepoFile('../../server/handlers/TickerHtml/TickerHtml.ts');
    expect(source).toContain('renderCategoryBacklinks');
  });

  it('화면과 서버가 같은 문구 정본을 읽는다', () => {
    const view = readRepoFile('../../pages/Ticker/TickerCategoryPage/TickerCategoryPage.tsx');
    expect(view).toContain('TICKER_CATEGORY_META');
    expect(Object.keys(TICKER_CATEGORY_LABEL).length).toBe(TICKER_CATEGORY_IDS.length);
  });
});
