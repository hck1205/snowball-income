import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '@/server/handlers/DividendListHtml';
import { DIVIDEND_LIST_IDS, DIVIDEND_LISTS } from '@/shared/constants/dividendLists';
import { DIVIDEND_LIST_COPY } from '@/pages/DividendList/copy';
import {
  apiRequest,
  indexHtmlRoute,
  indexHtmlThrowingRoute,
  readMetaContent,
  restoreApiTestEnvironment,
  stubFetchRoutes
} from './apiHarness';

/**
 * `/api/dividend-list-html` — 배당 목록 화면(`/dividend/lists`·`/dividend/kings` 등)의 진입 HTML.
 *
 * 🔴 이 핸들러가 존재하는 이유가 곧 이 테스트가 잠그는 것이다: **앱의 표는 React 가 그려서 JS 를
 * 실행하지 않는 크롤러에겐 빈 셸이다.** 종목·기준·출처가 이 HTML 안에 텍스트로 없으면 검색엔진과
 * AI 요약은 이 페이지에서 아무것도 못 읽는다 — 그리고 그 손실은 **화면 확인으로는 절대 드러나지 않는다**.
 *
 * `TickerHtml` 과 마찬가지로 외부 I/O 는 `/index.html` 셸 fetch 하나뿐이다(목록은 커밋된 데이터).
 */

beforeEach(() => {
  // 로컬 `.env` 의 실 VITE_SITE_URL 이 canonical 을 테스트 오리진과 다르게 만든다 — 다른 api 테스트와 동일 고정.
  vi.stubEnv('SITE_URL', 'https://snowball.test');
  vi.stubEnv('VITE_SITE_URL', '');
});

afterEach(() => {
  restoreApiTestEnvironment();
  vi.unstubAllEnvs();
});

/**
 * 카피에 들어 있는 `&`(예: "S&P 500")는 HTML 텍스트 노드로 나갈 때 `&amp;` 로 이스케이프된다.
 * 원문 그대로 찾으면 **정상 동작인데 테스트만 빨개진다** — 비교 전에 같은 규칙을 적용한다.
 */
const asHtmlText = (raw: string): string => raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const jsonLdBlocks = (html: string): unknown[] =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) =>
    JSON.parse(match[1])
  );

describe('/api/dividend-list-html — 목록 상세', () => {
  it.each(DIVIDEND_LIST_IDS)('%s: 모든 종목이 서버 HTML 안에 텍스트로 있다', async (id) => {
    stubFetchRoutes([indexHtmlRoute()]);
    const response = await handler(apiRequest('/api/dividend-list-html', { list: id }));
    const html = await response.text();

    expect(response.status).toBe(200);
    for (const member of DIVIDEND_LISTS[id].members) {
      expect(html).toContain(`<td>${member.ticker}</td>`);
    }
  });

  it('제목·설명·canonical 이 그 목록의 값으로 치환된다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const response = await handler(apiRequest('/api/dividend-list-html', { list: 'kings' }));
    const html = await response.text();

    expect(html).toContain(`<title>${DIVIDEND_LIST_COPY.lists.kings.metaTitle} - Hungry Hippo</title>`);
    expect(readMetaContent(html, 'property', 'og:title')).toBe(
      `${DIVIDEND_LIST_COPY.lists.kings.metaTitle} - Hungry Hippo`
    );
    expect(readMetaContent(html, 'property', 'og:url')).toBe('https://snowball.test/dividend/kings');
    expect(html).toContain('<link rel="canonical" href="https://snowball.test/dividend/kings" />');
  });

  it('🔴 출처·기준일이 본문에 있다 — 목록만 있고 근거가 없는 HTML 을 내지 않는다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const response = await handler(apiRequest('/api/dividend-list-html', { list: 'aristocrats' }));
    const html = await response.text();

    const list = DIVIDEND_LISTS.aristocrats;
    expect(html).toContain(list.asOf);
    for (const source of list.sources) {
      expect(html).toContain(source.url);
      expect(html).toContain(source.label);
    }
    // 외부 출처에 색인 신호를 넘기지 않는다.
    expect(html).toContain('rel="nofollow noopener"');
    expect(html).toContain(asHtmlText(list.coverageNote.slice(0, 20)));
  });

  it('시뮬레이터로 가는 링크가 있다 — 크롤러에게 막다른 길이 되지 않게', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/dividend-list-html', { list: 'kings' }))).text();
    expect(html).toContain('href="/simulator"');
  });

  it('JSON-LD 는 ItemList 이고 종목 수가 실제 목록과 같다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/dividend-list-html', { list: 'champions' }))).text();

    const itemList = jsonLdBlocks(html).find(
      (block): block is { '@type': string; numberOfItems: number; itemListElement: unknown[] } =>
        typeof block === 'object' && block !== null && (block as { '@type'?: string })['@type'] === 'ItemList'
    );
    expect(itemList).toBeDefined();
    expect(itemList?.numberOfItems).toBe(DIVIDEND_LISTS.champions.members.length);
    expect(itemList?.itemListElement).toHaveLength(DIVIDEND_LISTS.champions.members.length);
  });

  it('정적 콘텐츠라 길게 캐시한다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const response = await handler(apiRequest('/api/dividend-list-html', { list: 'kings' }));
    expect(response.headers.get('cache-control')).toContain('s-maxage=86400');
  });
});

describe('/api/dividend-list-html — 허브', () => {
  it('세 목록을 전부 링크하고 기준·규모를 표로 낸다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/dividend-list-html', { list: 'hub' }))).text();

    for (const id of DIVIDEND_LIST_IDS) {
      expect(html).toContain(`href="/dividend/${id}"`);
      expect(html).toContain(asHtmlText(DIVIDEND_LIST_COPY.lists[id].criterionLabel));
    }
    expect(html).toContain('<link rel="canonical" href="https://snowball.test/dividend/lists" />');
  });
});

describe('/api/dividend-list-html — 방어 갈래', () => {
  it('모르는 목록은 404 가 아니라 무치환 셸 200 + no-store 다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const response = await handler(apiRequest('/api/dividend-list-html', { list: 'nope' }));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    // 본문이 주입되지 않았다 — 앱이 부팅해 라우터가 판단한다.
    expect(html).not.toContain('<article>');
  });

  it('셸을 못 읽으면 루트로 302 한다 (다른 핸들러와 같은 폴백)', async () => {
    stubFetchRoutes([indexHtmlThrowingRoute()]);
    const response = await handler(apiRequest('/api/dividend-list-html', { list: 'kings' }));
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://snowball.test/');
  });
});
