import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '@/server/handlers/TickerHtml';
import { TICKER_CONTENT_LIST } from '@/shared/constants/tickers';
import { apiRequest, buildIndexHtmlShell, indexHtmlRoute, indexHtmlThrowingRoute, stubFetchRoutes } from './apiHarness';

/**
 * `/api/ticker-html` — 티커 SEO 랜딩(`/ticker/:name`, 허브 `/ticker/all`)의 진입 HTML.
 *
 * `PostHtml`과 달리 DB 조회가 없다(`shared/constants/tickers`는 코드에 커밋된 정적 데이터) — 그래서
 * 스텁할 외부 I/O는 `/index.html` 셸 fetch 하나뿐이다.
 */

const SCHD_JSON_LD = (html: string): unknown[] => {
  const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  // 첫 매치는 index.html 셸 자체의 #structured-data(WebSite/WebApplication) — 우리가 주입한 건 마지막.
  return matches.map((match) => (JSON.parse(match[1]) as { '@graph'?: unknown[] })['@graph'] ?? JSON.parse(match[1]));
};

/**
 * `apiHarness.buildIndexHtmlShell()` 은 `<meta name="description">` 태그를 포함하지 않는다(og/twitter
 * 계열만). `<meta name="description">` 치환(검색결과 스니펫에 직결)을 검증하려면 그 태그가 있는 셸이
 * 따로 필요하다 — post-html.test.ts 가 자체 SHELL 리터럴을 쓰는 것과 같은 이유.
 */
const SHELL_WITH_DESCRIPTION = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>배당 재투자 시뮬레이터 - Hungry Hippo</title>
    <meta name="description" content="기본 설명" />
    <link rel="canonical" href="https://snowball.test/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Hungry Hippo" />
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

// 로컬 `.env`의 실 VITE_SITE_URL(vercel 프로덕션 도메인)이 resolveSiteUrl 폴백보다 우선해 canonical이
// 테스트 오리진(TEST_ORIGIN)과 달라진다 — post-html/sitemap 테스트와 동일하게 SITE_URL을 명시 고정한다.
beforeEach(() => {
  vi.stubEnv('SITE_URL', 'https://snowball.test');
  vi.stubEnv('VITE_SITE_URL', '');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('api/ticker-html — 개별 티커(SCHD)', () => {
  it('title·description·canonical·og·twitter 를 그 티커로 치환한다', async () => {
    stubFetchRoutes([indexHtmlRoute({ html: SHELL_WITH_DESCRIPTION })]);
    const res = await handler(apiRequest('/api/ticker-html', { name: 'schd' }));
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain('SCHD 배당률·배당성장·구성 총정리 — 슈왑 미국 배당주 ETF - Hungry Hippo');
    expect(html).toMatch(/name="description"\s+content="SCHD\(슈왑 미국 배당주 ETF\)/);
    expect(html).toContain('href="https://snowball.test/ticker/schd"');
    expect(html).toMatch(/property="og:title"\s+content="SCHD 배당률·배당성장·구성 총정리 — 슈왑 미국 배당주 ETF - Hungry Hippo"/);
    expect(html).toContain('property="og:url" content="https://snowball.test/ticker/schd"');
    expect(html).toContain('name="twitter:title" content="SCHD 배당률·배당성장·구성 총정리 — 슈왑 미국 배당주 ETF - Hungry Hippo"');
  });

  it('불변식: og:type·site_name·twitter:card·이미지·script 는 건드리지 않는다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'schd' }))).text();

    expect(html).toContain('property="og:type" content="website"');
    expect(html).toContain('property="og:site_name" content="Hungry Hippo"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain(`content="${'https://snowball.test/og-image.png'}"`);
    expect(html).toContain('<script type="module" crossorigin src="/assets/index-abc123.js"></script>');
  });

  it('#root 안에 히어로·섹션·FAQ·관련 티커·disclaimer 를 텍스트로 주입하고, 토큰이 실제 프리셋 값으로 치환된다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'schd' }))).text();

    // hero
    expect(html).toContain('<h1>SCHD');
    // 섹션 heading + 토큰 치환(배당률 숫자, {{}}가 그대로 남지 않아야 한다)
    expect(html).toContain('id="overview"');
    expect(html).toContain('id="dividend-yield"');
    expect(html).not.toMatch(/\{\{\s*\w+\s*\}\}/); // 미치환 토큰이 없어야 한다
    // FAQ
    expect(html).toContain('SCHD 배당률은 얼마인가요?');
    // 관련 티커 — 2026-07-23 10종 추가로 SCHD의 관련 티커(VIG·DGRO·HDV·JEPI) 전원이 콘텐츠를 갖게 됐다.
    // "콘텐츠 없는 티커는 텍스트로만" 계약의 반대편(있으면 링크)이 실제로 반영됐는지 여기서 확인한다.
    expect(html).toContain('더 넓은 대형주 배당성장을 원한다면 — VIG');
    expect(html).toContain('href="/ticker/vig"');
    // disclaimer
    expect(html).toContain('이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다');
  });

  /**
   * 🔴 히어로 CTA 는 이 페이지의 **최종 목적지**이고, 그걸 읽는 것은 사용자가 아니라 크롤러다
   * (앱 쪽 `TickerDetailPage.view.tsx` 의 `PrimaryCta` 와 한 쌍). 시뮬레이터 경로가 옮겨 갔을 때
   * 여기만 `/` 로 남아도 화면·전 스위트가 그린이라 아무도 모른다 — 그래서 정확일치로 잠근다.
   */
  it('히어로 CTA 가 시뮬레이터를 가리킨다 (크롤러가 읽는 서버 HTML)', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'schd' }))).text();

    expect(html).toContain('<p class="hero-cta"><a href="/simulator">SCHD로 계산해 보기</a></p>');
  });

  it('FinancialProduct + FAQPage JSON-LD 를 주입한다(파싱 가능한 유효 JSON)', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'schd' }))).text();
    const graphs = SCHD_JSON_LD(html);
    const injected = graphs[graphs.length - 1] as Array<{ '@type': string }>;

    const product = injected.find((entry) => entry['@type'] === 'FinancialProduct') as
      | { name: string; url: string; additionalProperty: Array<{ name: string; value: string }> }
      | undefined;
    const faqPage = injected.find((entry) => entry['@type'] === 'FAQPage') as
      | { mainEntity: Array<{ '@type': string; name: string }> }
      | undefined;

    expect(product?.name).toContain('SCHD');
    expect(product?.url).toBe('https://snowball.test/ticker/schd');
    expect(product?.additionalProperty.some((p) => p.name === '운용보수(총보수)' && p.value === '0.06%')).toBe(true);
    expect(faqPage?.mainEntity.length).toBeGreaterThan(0);
    expect(faqPage?.mainEntity[0]?.['@type']).toBe('Question');
  });

  it('대소문자를 구분하지 않는다(name=SCHD도 동일 콘텐츠)', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'SCHD' }))).text();
    expect(html).toContain('href="https://snowball.test/ticker/schd"');
  });

  it('성공 응답은 s-maxage=86400 / swr=604800 (콘텐츠는 배포에만 바뀐다)', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const cache = (await handler(apiRequest('/api/ticker-html', { name: 'schd' }))).headers.get('cache-control') ?? '';
    expect(cache).toContain('s-maxage=86400');
    expect(cache).toContain('stale-while-revalidate=604800');
  });

  it('크롤러 전용 분기가 없다 — User-Agent 가 달라도 같은 HTML (클로킹 금지)', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const bot = await handler(
      apiRequest('/api/ticker-html', { name: 'schd' }, { headers: { 'user-agent': 'Yeti/1.1 (+http://naver.me/spd)' } })
    );
    stubFetchRoutes([indexHtmlRoute()]);
    const human = await handler(apiRequest('/api/ticker-html', { name: 'schd' }));

    expect(await bot.text()).toBe(await human.text());
  });
});

/**
 * 🔴 상위 보유 종목은 **서버 HTML 안에 텍스트로** 있어야 한다. 앱 화면의 파이 차트는 `<canvas>` 라
 * 크롤러·AI 요약에게는 존재하지 않는 것과 같다 — 화면을 아무리 확인해도 이 손실은 안 보인다.
 * 그래서 여기서 심볼·비중·합계·기준일·출처가 실제 문자열로 나오는지 못 박는다.
 */
describe('api/ticker-html — 상위 보유 종목 (크롤러가 읽는 표)', () => {
  const holdingsOf = (ticker: string) => {
    const content = TICKER_CONTENT_LIST.find((entry) => entry.ticker === ticker);
    const topHoldings = content?.reference.topHoldings;
    if (!topHoldings) throw new Error(`${ticker} 에 topHoldings 가 없다 — 이 테스트의 전제가 깨졌다`);
    return topHoldings;
  };

  it('DGRO: 상위 20종의 티커·종목명·비중이 표로 들어간다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'dgro' }))).text();
    const topHoldings = holdingsOf('DGRO');

    expect(html).toContain('id="top-holdings"');
    expect(html).toContain('<h2>상위 보유 종목</h2>');

    // 데이터의 모든 행이 빠짐없이 HTML 에 있어야 한다(개수를 박지 않고 목록에서 파생).
    topHoldings.holdings.forEach((holding) => {
      expect(html).toContain(`<td>${holding.symbol}</td>`);
      expect(html).toContain(`<td>${holding.weightPercent.toFixed(2)}%</td>`);
    });
    expect(html).toContain('JPMORGAN CHASE &amp; CO');
  });

  it('DGRO: 합계 행이 100%가 아님을 숫자로 말하고, 기준일·출처가 함께 나온다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'dgro' }))).text();
    const topHoldings = holdingsOf('DGRO');
    const covered = `${topHoldings.coveredWeightPercent.toFixed(2)}%`;

    expect(topHoldings.coveredWeightPercent).toBeLessThan(100);
    expect(html).toContain(`<td colspan="3">상위 ${topHoldings.holdings.length}종 합계</td><td>${covered}</td>`);
    expect(html).toContain('나머지 보유 종목은 이 표에 들어 있지 않습니다');
    expect(html).toContain(`기준일 ${topHoldings.asOfDate}`);
    expect(html).toContain(topHoldings.sourceUrl);
    expect(html).toContain(topHoldings.sourceLabel);
  });

  /**
   * 커버드콜의 공시 목록에는 숏 콜옵션이 섞여 있다. 표에는 주식만 담기로 했으므로, **무엇을 왜 뺐는지**가
   * 크롤러가 읽는 HTML 에도 나와야 한다 — 안 그러면 "이 ETF는 옵션을 안 쓴다"로 읽힌다.
   */
  it('QYLD: 옵션 포지션을 제외했다는 사실이 표와 함께 서버 HTML 에 나온다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'qyld' }))).text();
    const topHoldings = holdingsOf('QYLD');

    expect(html).toContain(topHoldings.excludedNote ?? '');
    expect(html).toContain('콜옵션');
    expect(html).toContain('<td>NVDA</td>');
  });

  it('SCHD: 보유 종목 데이터가 없는 티커는 섹션 자체가 없다 (빈 표 금지)', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'schd' }))).text();

    expect(TICKER_CONTENT_LIST.find((entry) => entry.ticker === 'SCHD')?.reference.topHoldings).toBeUndefined();
    expect(html).not.toContain('id="top-holdings"');
    expect(html).not.toContain('<h2>상위 보유 종목</h2>');
  });

  it('KO: 개별 종목은 구성 종목 개념이 없어 섹션이 없다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'ko' }))).text();

    expect(html).not.toContain('id="top-holdings"');
  });

  it('JSON-LD 에는 종목 나열이 아니라 집계 한 줄만 싣는다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'dgro' }))).text();
    const graphs = SCHD_JSON_LD(html);
    const injected = graphs[graphs.length - 1] as Array<{ '@type': string }>;
    const product = injected.find((entry) => entry['@type'] === 'FinancialProduct') as
      | { additionalProperty: Array<{ name: string; value: string }> }
      | undefined;
    const topHoldings = holdingsOf('DGRO');

    const summary = product?.additionalProperty.find((property) =>
      property.name.startsWith(`상위 ${topHoldings.holdings.length}종`)
    );
    expect(summary?.value).toBe(`${topHoldings.coveredWeightPercent.toFixed(2)}% (${topHoldings.asOfDate} 기준)`);

    // 개별 종목이 PropertyValue 로 펴지면 안 된다(구조화 데이터 남용 금지).
    expect(product?.additionalProperty.some((property) => property.name === 'JPM')).toBe(false);
    expect(product?.additionalProperty.length).toBeLessThan(12);
  });
});

describe('api/ticker-html — 없는 티커 / 예외 (5xx 금지, DB 없음)', () => {
  it('콘텐츠가 없는 티커는 404 가 아니라 무치환 셸 200 + no-store', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const res = await handler(apiRequest('/api/ticker-html', { name: 'nope' }));
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(html).not.toContain('<article>');
    expect(html).toContain('<div id="root"></div>');
  });

  it('name 파라미터가 없으면 무치환 셸 200 + no-store', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const res = await handler(apiRequest('/api/ticker-html'));

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('셸을 못 읽는 극단은 5xx 가 아니라 루트로 302', async () => {
    stubFetchRoutes([indexHtmlRoute({ ok: false })]);
    const res = await handler(apiRequest('/api/ticker-html', { name: 'schd' }));

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://snowball.test/');
  });

  it('셸 fetch 자체가 네트워크 레벨에서 죽어도 302 (5xx 없음)', async () => {
    stubFetchRoutes([indexHtmlThrowingRoute()]);
    const res = await handler(apiRequest('/api/ticker-html', { name: 'schd' }));

    expect(res.status).toBe(302);
  });
});

describe('api/ticker-html — /ticker/all 허브', () => {
  it('허브 메타를 렌더하고, 개별 티커 조회보다 먼저 분기한다(all이 콘텐츠 레지스트리 키가 아니어도 404가 아니다)', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const res = await handler(apiRequest('/api/ticker-html', { name: 'all' }));
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain('href="https://snowball.test/ticker/all"');
    expect(html).toContain('배당 ETF·종목 SEO 소개 모음');
  });

  it('카테고리별로 등록된 티커(SCHD)로 링크한다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'all' }))).text();

    expect(html).toContain('href="/ticker/schd"');
    expect(html).toContain('배당성장 ETF');
  });

  it('ItemList JSON-LD 를 주입한다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'all' }))).text();
    const graphs = SCHD_JSON_LD(html);
    const injected = graphs[graphs.length - 1] as { '@type': string; itemListElement: Array<{ url: string }> };

    expect(injected['@type']).toBe('ItemList');
    expect(injected.itemListElement.some((item) => item.url === 'https://snowball.test/ticker/schd')).toBe(true);
  });

  it('허브도 성공 캐시(s-maxage=86400)를 쓴다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const cache = (await handler(apiRequest('/api/ticker-html', { name: 'all' }))).headers.get('cache-control') ?? '';
    expect(cache).toContain('s-maxage=86400');
  });
});

describe('api/ticker-html — 셸 구조 보존', () => {
  it('빈 #root 셸(테스트 픽스처)에도 결정적으로 삽입한다', async () => {
    stubFetchRoutes([indexHtmlRoute({ html: buildIndexHtmlShell() })]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'schd' }))).text();

    const rootOpen = html.match(/<div\s+id="root"[^>]*>/i);
    expect(rootOpen).not.toBeNull();
    const inner = html.slice((rootOpen?.index ?? 0) + (rootOpen?.[0].length ?? 0));
    expect(inner.startsWith('<article>')).toBe(true);
  });
});

/**
 * 2026-07-23 — SCHD 템플릿 확정 후 10종 일괄 추가(VIG·DGRO·DGRW·SCHY·HDV·VYM·SPYD·JEPI·JEPQ·O) 스모크.
 * 전 종목을 다 훑지 않고, 새로 생긴 "형태가 다른" 케이스만 표적으로 검증한다: 콘텐츠가 새로 생긴 관련
 * 티커가 실제로 링크로 바뀌는지(위 SCHD 테스트가 이미 커버), 그래도 여전히 콘텐츠 없는 관련 티커는
 * 텍스트로만 남는지(HDV→NOBL), 액티브 운용 ETF(JEPI)가 추종 지수 없이도 정상 렌더되는지, 개별 종목(O)이
 * 운용보수 없이도 정상 렌더되는지, 허브가 11종 전부를 담는지.
 */
describe('api/ticker-html — 2026-07-23 추가 10종 스모크', () => {
  it('VIG: 메타·h1·FAQ가 정상 렌더되고 토큰이 전부 치환된다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const res = await handler(apiRequest('/api/ticker-html', { name: 'vig' }));
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain('<h1>VIG');
    expect(html).toContain('VIG 배당률은 얼마인가요?');
    expect(html).not.toMatch(/\{\{\s*\w+\s*\}\}/);
  });

  /**
   * 🔴 이 검사의 앵커는 **"그 시점에 콘텐츠가 없는 관련 티커"** 라서, 그 티커에 페이지가 생기면
   * 검사 자체가 무의미해진다(실제로 그렇게 됐다 — 2026-08-02 배치가 NOBL 페이지를 만들자 원래
   * 앵커였던 HDV→NOBL 이 링크로 바뀌어 빨개졌다). 앵커를 옮길 때는 **레지스트리에 없는 심볼**을
   * 골라야 한다 — 아래 `expect(...).toBe(false)` 가 그 전제를 먼저 단정하므로, 다음에 DVY 페이지가
   * 생기면 "링크가 됐다"가 아니라 "앵커 전제가 깨졌다"로 먼저 빨개진다.
   */
  it('SDY: 콘텐츠 없는 관련 티커(DVY)는 링크가 아니라 텍스트로만 남는다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'sdy' }))).text();

    expect(TICKER_CONTENT_LIST.some((entry) => entry.ticker === 'DVY')).toBe(false);
    expect(html).toContain('배당률 자체를 우선한 셀렉트 배당을 원한다면 — DVY');
    expect(html).not.toContain('href="/ticker/dvy"');
  });

  it('JEPI: 액티브 운용이라 추종 지수 프로퍼티 없이도 FinancialProduct JSON-LD가 유효하다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'jepi' }))).text();
    const graphs = SCHD_JSON_LD(html);
    const injected = graphs[graphs.length - 1] as Array<{ '@type': string }>;
    const product = injected.find((entry) => entry['@type'] === 'FinancialProduct') as
      | { additionalProperty: Array<{ name: string; value: string }> }
      | undefined;

    expect(product?.additionalProperty.some((p) => p.name === '운용보수(총보수)' && p.value === '0.35%')).toBe(true);
    expect(product?.additionalProperty.some((p) => p.name === '추종 지수')).toBe(false);
  });

  it('O: 개별 종목이라 운용보수 프로퍼티 없이도 정상 렌더된다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'o' }))).text();
    const graphs = SCHD_JSON_LD(html);
    const injected = graphs[graphs.length - 1] as Array<{ '@type': string }>;
    const product = injected.find((entry) => entry['@type'] === 'FinancialProduct') as
      | { additionalProperty: Array<{ name: string; value: string }> }
      | undefined;

    expect(html).toContain('<h1>O');
    expect(product?.additionalProperty.some((p) => p.name === '상장연도' && p.value === '1994')).toBe(true);
    expect(product?.additionalProperty.some((p) => p.name === '운용보수(총보수)')).toBe(false);
  });

  /**
   * 개수를 박아 두면 티커를 추가할 때마다 이 줄만 고치게 되고, 그 사이 "레지스트리엔 있는데 허브엔
   * 없는" 종목은 계속 통과한다. 그래서 **레지스트리에서 파생한 slug 집합과 양방향으로 비교**한다.
   */
  it('허브: 레지스트리의 모든 종목이 ItemList JSON-LD에 빠짐없이 등장한다', async () => {
    stubFetchRoutes([indexHtmlRoute()]);
    const html = await (await handler(apiRequest('/api/ticker-html', { name: 'all' }))).text();
    const graphs = SCHD_JSON_LD(html);
    const injected = graphs[graphs.length - 1] as { itemListElement: Array<{ url: string }> };

    const expected = TICKER_CONTENT_LIST.map((content) => `https://snowball.test/ticker/${content.slug}`).sort();
    const actual = injected.itemListElement.map((item) => item.url).sort();

    expect(actual).toEqual(expected);
  });
});
