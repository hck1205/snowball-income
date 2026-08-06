import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '@/server/handlers/GuideHtml';
import { GUIDES } from '@/shared/constants/guides';
import { apiRequest, indexHtmlRoute, stubFetchRoutes } from './apiHarness';

/**
 * `/api/guide-html` — 검색어 랜딩(`/guide/:slug`)의 진입 HTML.
 *
 * 🔴 이 핸들러가 죽거나 본문을 빼먹으면 **그 페이지의 존재 이유가 통째로 사라진다** — 검색 유입이
 * 유일한 목적인 페이지이고, JS 를 실행하지 않는 크롤러에게는 이 HTML 이 전부다. 그래서 "글이 실제로
 * 들어 있는가"를 문장 단위로 확인한다(메타 치환만 보는 것으로는 부족하다).
 */

beforeEach(() => {
  vi.stubEnv('SITE_URL', 'https://snowball.test');
  vi.stubEnv('VITE_SITE_URL', '');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('api/guide-html', () => {
  it('레지스트리가 비어 있지 않다 (비면 아래 검사가 전부 무의미해진다)', () => {
    expect(GUIDES.length).toBeGreaterThanOrEqual(2);
  });

  it.each(GUIDES.map((guide) => guide.slug))('%s: 제목·설명·canonical 을 그 가이드로 치환한다', async (slug) => {
    const guide = GUIDES.find((entry) => entry.slug === slug);
    if (!guide) throw new Error('픽스처 전제: 슬러그가 레지스트리에 있다');

    stubFetchRoutes([indexHtmlRoute()]);
    const res = await handler(apiRequest('/api/guide-html', { slug }));
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain(guide.metaTitle);
    expect(html).toContain(`href="https://snowball.test/guide/${slug}"`);
    expect(html).toContain(`property="og:url" content="https://snowball.test/guide/${slug}"`);
  });

  it.each(GUIDES.map((guide) => guide.slug))('%s: 본문 문단·표·FAQ 가 HTML 안에 텍스트로 들어간다', async (slug) => {
    const guide = GUIDES.find((entry) => entry.slug === slug);
    if (!guide) throw new Error('픽스처 전제: 슬러그가 레지스트리에 있다');

    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/guide-html', { slug }))).text();

    expect(html).toContain(`<h1>${guide.title}`);
    /* 모든 장의 제목과 첫 문단이 들어 있어야 한다 — 하나라도 빠지면 그 장은 크롤러에게 없는 글이다. */
    for (const section of guide.sections) {
      expect(html, `${slug}/${section.id} 제목`).toContain(section.heading);
      expect(html, `${slug}/${section.id} 첫 문단`).toContain(section.paragraphs[0].slice(0, 24));
    }
    /* 🔴 표는 **전제(note)와 함께**여야 한다 — 요약기가 숫자만 떼어 가는 것을 막는 유일한 줄이다. */
    for (const section of guide.sections) {
      if (!section.table) continue;
      expect(html, `${slug}/${section.id} 표 캡션`).toContain(section.table.caption);
      if (section.table.note) expect(html, `${slug}/${section.id} 표 전제`).toContain(section.table.note.slice(0, 20));
    }
    for (const faq of guide.faqs) {
      expect(html, `${slug} FAQ`).toContain(faq.question);
    }
  });

  it('FAQPage JSON-LD 의 질문이 화면에 보이는 질문과 같다 (구글 가이드라인)', async () => {
    const guide = GUIDES[0];
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/guide-html', { slug: guide.slug }))).text();

    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    const injected = JSON.parse(blocks[blocks.length - 1][1]) as Array<{
      '@type': string;
      mainEntity?: Array<{ name: string }>;
    }>;
    const faqPage = injected.find((entry) => entry['@type'] === 'FAQPage');

    expect(faqPage?.mainEntity?.map((entry) => entry.name)).toEqual(guide.faqs.map((faq) => faq.question));
  });

  it('다른 가이드로 가는 내부 링크가 있다 (크롤러가 이 가족을 찾아가는 유일한 경로)', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/guide-html', { slug: GUIDES[0].slug }))).text();

    for (const other of GUIDES.slice(1)) {
      expect(html).toContain(`href="/guide/${other.slug}"`);
    }
  });

  it('모르는 슬러그는 무치환 셸 200 + no-store (404 를 만들지 않는다)', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const res = await handler(apiRequest('/api/guide-html', { slug: 'does-not-exist' }));

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.text()).not.toContain('<article>');
  });

  it('성공 응답은 s-maxage=86400 / swr=604800 (본문은 배포에만 바뀐다)', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const cache =
      (await handler(apiRequest('/api/guide-html', { slug: GUIDES[0].slug }))).headers.get('cache-control') ?? '';

    expect(cache).toContain('s-maxage=86400');
    expect(cache).toContain('stale-while-revalidate=604800');
  });
});
