/*
  ⚠ post-html.js / og.js / sitemap.js 와 동일 규약: 모듈 스코프에서 `import.meta.env` 를 읽는 코드를
  끌고 오면 Vercel Node 런타임에서 함수가 즉사한다(try/catch 로도 못 잡는 모듈 평가 단계). `@/shared/lib/og`
  는 순수 문자열 + process.env 조회만 담고 있어 안전하다. `@/shared/constants/tickers` 도 순수 데이터
  (+`resolveTickerEngineFacts` 는 `DIVIDEND_UNIVERSE` 프리셋을 read 만 한다)라 서버에서 import 해도
  안전하다 — `resolveTickerEngineFacts.ts`/`TickerContent.types.ts` 자체 주석이 이 전제를 명시한다.
  다만 소비는 **폴더 경로**로만 한다(`@/shared/constants/tickers`) — 최상위 `shared/constants` 배럴에는
  의도적으로 미연결이다(registry.ts 주석, 앱 엔트리 번들 오염 방지).
*/
import {
  escapeHtmlAttribute,
  escapeHtmlText,
  replaceLinkHref,
  replaceMetaContent,
  replaceTitleTag,
  resolveSiteUrl
} from '@/shared/lib/og';
import { toNodeHandler } from '@/shared/lib/server';
import {
  findTickerContentBySlug,
  listTickerContentByCategory,
  renderTickerContentTemplate,
  resolveTickerEngineFacts,
  TICKER_CATEGORY_LABEL,
  TICKER_CONTENT_LIST,
  type TickerCategoryId,
  type TickerContent,
  type TickerContentFaq,
  type TickerContentSection,
  type TickerContentStat,
  type TickerEngineFacts,
  type TickerRelatedLink
} from '@/shared/constants/tickers';

/**
 * `/api/ticker-html?name=<slug|all>` — 티커 SEO 랜딩(`/ticker/:name`)의 **진입 HTML**.
 *
 * ## 런타임: Node.js — **`toNodeHandler` 어댑터 필수**
 * `export const config` 가 없으므로 Vercel 은 Node 런타임으로 배포하고 `(req, res)` 로 호출한다. 아래 웹
 * 표준 `handler` 를 그대로 default export 하면 `res.end()` 가 없어 **무응답 타임아웃**이 된다
 * (2026-07-20 실제 장애 — `api/*` 6개 전멸, PostHtml.ts 동일 주석 참고). Edge 는 선택지가 아니다
 * (Edge 번들러가 `@/` alias 를 못 푼다).
 *
 * ## PostHtml 과의 차이 — DB 조회가 없다
 * 글 상세(post-html)는 매 요청 Supabase REST 를 친다(존재/공개여부가 런타임에 바뀔 수 있어서). 티커
 * 콘텐츠는 **코드에 커밋된 정적 데이터**(`TICKER_CONTENT_REGISTRY`)라 이 함수는 외부 I/O 를 전혀 하지
 * 않는다(셸 fetch 제외) — 그래서 "일시적 조회 실패" 분기가 없고, 실패 갈래는 셸 자체를 못 읽는 극단
 * 하나뿐이다.
 *
 * ## "없는 티커"는 404 가 아니라 무치환 셸 200 (PostHtml 과 의도적으로 다르다)
 * `TICKER_CONTENT_REGISTRY` 는 `PresetTickerKey`(계산 유니버스 전체)의 **부분집합**만 담는다(registry.ts
 * 주석). 즉 시뮬레이터에서 계산 가능한 티커 중 SEO 콘텐츠가 없는 쪽이 대다수라는 전제다. 이건 "글이
 * 삭제됐다/비공개다" 같은 예외 상태가 아니라 "이 티커는 아직 콘텐츠를 안 만들었다"는 **정상적으로
 * 흔한 상태**라, 404 로 응답하면 검색엔진이 매 신규 티커 추가마다 일시적으로 404 였던 URL을 오래
 * 기억한다. 대신 셸을 그대로 200 으로 돌려 앱이 부팅하게 하고(라우터가 클라이언트 사이드에서 무엇을
 * 보여줄지 결정), no-store 로 캐시하지 않는다 — 콘텐츠가 다음 배포에 추가되면 다음 크롤에 바로
 * 반영되어야 하기 때문이다.
 *
 * ## `/ticker/all` 허브 (개별 티커가 아니다)
 * `all` 은 `TICKER_CONTENT_REGISTRY` 의 키가 될 수 없는 예약어다(`PresetTickerKey` 는 실제 티커 심볼만
 * 담아 이름 충돌이 없다). rewrite(`vercel.json`)는 `/ticker/:name` 하나로 이 경로도 함께 삼키므로,
 * 여기서 `name==='all'` 을 **가장 먼저** 분기해 개별 조회보다 앞서 허브 전용 메타·본문을 렌더한다 —
 * 이 순서를 바꾸면 허브가 "없는 티커" 취급을 받아 무치환 셸로 떨어진다.
 *
 * ## 본문 정화(sanitize)가 없는 이유
 * `PostHtml.ts` 는 `posts.body` 가 anon 키로 누구나 쓸 수 있는 신뢰 불가 입력이라 서버 DOMPurify를
 * 거친다. 여기 본문은 전부 `shared/constants/tickers/*.ts` 에 **코드로 커밋된** 콘텐츠라 그 위협 모델이
 * 없다 — 신뢰 경계는 "저장 XSS" 가 아니라 "콘텐츠 작성자가 실수로 넣은 마크업이 셸 구조를 깨는가"
 * 뿐이라, 문단·제목·FAQ는 전부 **텍스트 노드**(`escapeHtmlText`)로만 삽입해 애초에 마크업을 허용하지
 * 않는다(콘텐츠 데이터 타입도 문자열 배열이지 HTML이 아니다 — TickerContent.types.ts 참고).
 *
 * ## JSON-LD — 이 서버 경로가 유일한 삽입 지점
 * 런타임 JS로 `<script type="application/ld+json">` 을 넣으면 크롤러가 못 읽는다(analytics.ts:147
 * 주석 근거 — og:meta 런타임 갱신과 같은 함정). `index.html` 의 기존 `#structured-data` 스크립트(WebSite/
 * WebApplication)는 건드리지 않고, 티커 전용 `FinancialProduct`+`FAQPage`(또는 허브의 `ItemList`)를
 * **별도 script 태그**로 본문과 함께 주입한다.
 */

/**
 * 정적 콘텐츠 성공 캐시 — 24시간 신선도 / 7일 stale 허용.
 * 콘텐츠는 배포(코드 변경)에만 바뀌므로 post-html(5분)보다 훨씬 길게 잡아도 안전하다. 새 배포가 나가면
 * 함수 코드 자체가 새 버전으로 교체되므로 낡은 본문이 5분 안에라도 남을 일이 없다 — s-maxage 는
 * "같은 배포 내에서 얼마나 자주 다시 계산할까"의 문제일 뿐이다.
 */
const CACHE_TICKER = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800';

/** 무치환 셸(없는 티커/name 부재) — **캐시하지 않는다**. 다음 배포로 콘텐츠가 생기면 바로 반영돼야 한다. */
const CACHE_NO_STORE = 'no-store';

/** 상세 페이지 메타에 붙일 사이트 접미사 — index.html 기본 title 과 같은 브랜드 표기(PostHtml과 동일 관례). */
const SITE_SUFFIX = 'Snowball Income';

/** `/ticker/all` 예약 슬러그. `PresetTickerKey`(실제 티커 심볼)와 충돌하지 않는다. */
const HUB_SLUG = 'all';
const HUB_PATH = `/ticker/${HUB_SLUG}`;
const HUB_META_TITLE = '배당 ETF·종목 SEO 소개 모음 — 배당률·배당성장·구성 한눈에';

const htmlResponse = (html: string, status: number, cache: string): Response =>
  new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': cache }
  });

/** 셸 자체를 못 읽는 극단(자기 도메인 정적 파일 장애)의 폴백. post-html.ts 와 동일하게 루트로 302 한다. */
const redirectToRoot = (origin: string): Response =>
  new Response(null, {
    status: 302,
    headers: { Location: new URL('/', origin).toString(), 'cache-control': CACHE_NO_STORE }
  });

/** `</script>` 조기 종료를 막는 JSON-LD 안전 직렬화. `<` 를 전부 유니코드 이스케이프한다(표준 기법). */
const escapeJsonForScript = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c');

const jsonLdScript = (graph: unknown): string =>
  `<script type="application/ld+json">${escapeJsonForScript(graph)}</script>`;

/* -------------------------------------------------------------------------- */
/* 공통 메타 치환 — 개별 티커/허브가 공유                                          */
/* -------------------------------------------------------------------------- */

const applyMeta = (shell: string, title: string, description: string, canonical: string): string => {
  let html = shell;
  html = replaceTitleTag(html, title);
  html = replaceMetaContent(html, 'name', 'description', description);
  html = replaceLinkHref(html, 'canonical', canonical);
  html = replaceMetaContent(html, 'property', 'og:title', title);
  html = replaceMetaContent(html, 'property', 'og:description', description);
  html = replaceMetaContent(html, 'property', 'og:url', canonical);
  html = replaceMetaContent(html, 'name', 'twitter:title', title);
  html = replaceMetaContent(html, 'name', 'twitter:description', description);
  return html;
};

/**
 * `<div id="root">` 여는 태그 **직후**에 삽입한다(PostHtml.ts 의 `injectPostBody` 와 같은 지점 선택
 * 이유 — 중첩 div 매칭에 취약한 닫는 태그 방식 대신, 빈 셸/실셸 양쪽에서 결정적이다). 여는 태그가
 * 없으면(방어) 원문 그대로 반환한다.
 */
const injectAtRoot = (shell: string, articleAndScripts: string): string => {
  const rootOpenTag = shell.match(/<div\s+id="root"[^>]*>/i);
  if (!rootOpenTag || rootOpenTag.index === undefined) return shell;
  const insertAt = rootOpenTag.index + rootOpenTag[0].length;
  return shell.slice(0, insertAt) + articleAndScripts + shell.slice(insertAt);
};

/* -------------------------------------------------------------------------- */
/* 개별 티커 페이지                                                              */
/* -------------------------------------------------------------------------- */

const tickerCanonical = (siteUrl: string, content: TickerContent): string => `${siteUrl}/ticker/${content.slug}`;

const applyTickerMeta = (shell: string, content: TickerContent, siteUrl: string): string =>
  applyMeta(shell, `${content.metaTitle} - ${SITE_SUFFIX}`, content.metaDescription, tickerCanonical(siteUrl, content));

const renderText = (text: string, facts: TickerEngineFacts): string =>
  escapeHtmlText(renderTickerContentTemplate(text, facts));

const renderStat = (stat: TickerContentStat | undefined, facts: TickerEngineFacts): string => {
  if (!stat) return '';
  const caption = stat.caption ? `<p>${renderText(stat.caption, facts)}</p>` : '';
  return `<p class="stat"><strong>${renderText(stat.label, facts)}: ${renderText(stat.value, facts)}</strong></p>${caption}`;
};

const renderSection = (section: TickerContentSection, facts: TickerEngineFacts): string => {
  const paragraphs = section.paragraphs.map((paragraph) => `<p>${renderText(paragraph, facts)}</p>`).join('');
  const bullets =
    section.bullets && section.bullets.length > 0
      ? `<ul>${section.bullets.map((bullet) => `<li>${renderText(bullet, facts)}</li>`).join('')}</ul>`
      : '';
  const id = escapeHtmlAttribute(section.id);
  return `<section id="${id}"><h2>${renderText(section.heading, facts)}</h2>${paragraphs}${bullets}${renderStat(section.stat, facts)}</section>`;
};

const renderFaqs = (faqs: TickerContentFaq[], facts: TickerEngineFacts): string => {
  if (faqs.length === 0) return '';
  const items = faqs
    .map((faq) => `<div><h3>${renderText(faq.question, facts)}</h3><p>${renderText(faq.answer, facts)}</p></div>`)
    .join('');
  return `<section id="faq"><h2>자주 묻는 질문</h2>${items}</section>`;
};

/**
 * 관련 티커는 자신도 SEO 콘텐츠가 있을 때만 링크로 걷는다(`findTickerContentBySlug`) — 레지스트리는
 * 부분집합이라 없는 페이지로 링크하면 무치환 셸로 떨어지는 저품질 링크가 된다(registry.ts 주석 근거).
 * 콘텐츠가 아직 없으면 링크 없이 텍스트로만 남긴다.
 */
const renderRelatedTickers = (related: TickerRelatedLink[]): string => {
  if (related.length === 0) return '';
  const items = related
    .map((link) => {
      const label = escapeHtmlText(`${link.relationLabel} — ${link.ticker}`);
      const relatedContent = findTickerContentBySlug(link.ticker.toLowerCase());
      if (!relatedContent) return `<li>${label}</li>`;
      const href = escapeHtmlAttribute(`/ticker/${relatedContent.slug}`);
      return `<li><a href="${href}">${label}</a></li>`;
    })
    .join('');
  return `<section id="related"><h2>관련 티커</h2><ul>${items}</ul></section>`;
};

const renderHero = (content: TickerContent, facts: TickerEngineFacts): string =>
  `<h1>${escapeHtmlText(facts.ticker)} — ${escapeHtmlText(facts.koreanName)} (${escapeHtmlText(facts.englishName)})</h1>` +
  `<p class="hero-tagline">${renderText(content.heroTagline, facts)}</p>`;

/**
 * `FinancialProduct` — 엔진 6필드(가격 제외 배당률·성장률·기대수익·주기)는 `additionalProperty` 로
 * 곁들이되, 계산에 쓰이는 값이 아니라 **서술용 표시값**이라는 점은 `resolveTickerEngineFacts` 계약과
 * 동일(엔진에 절대 대입 안 함). `reference` 의 정적 사실(운용보수·상장연도)이 있으면 함께 싣는다.
 */
const buildFinancialProductSchema = (content: TickerContent, facts: TickerEngineFacts, canonical: string) => {
  const additionalProperty = [
    { '@type': 'PropertyValue', name: '배당률(세전, 명목)', value: facts.dividendYieldDisplay },
    { '@type': 'PropertyValue', name: '연 배당성장률(계산 가정)', value: facts.dividendGrowthDisplay },
    { '@type': 'PropertyValue', name: '기대 총수익률(계산 가정)', value: facts.expectedTotalReturnDisplay },
    { '@type': 'PropertyValue', name: '지급 주기', value: facts.frequencyLabel },
    ...(content.reference.expenseRatioPercent !== undefined
      ? [{ '@type': 'PropertyValue', name: '운용보수(총보수)', value: `${content.reference.expenseRatioPercent}%` }]
      : []),
    ...(content.reference.inceptionYear !== undefined
      ? [{ '@type': 'PropertyValue', name: '상장연도', value: String(content.reference.inceptionYear) }]
      : []),
    ...(content.reference.trackedIndex ? [{ '@type': 'PropertyValue', name: '추종 지수', value: content.reference.trackedIndex }] : [])
  ];

  return {
    '@type': 'FinancialProduct',
    name: `${facts.englishName} (${facts.ticker})`,
    alternateName: facts.koreanName,
    description: content.metaDescription,
    url: canonical,
    category: content.categoryIds.map((categoryId) => TICKER_CATEGORY_LABEL[categoryId]),
    additionalProperty
  };
};

const buildFaqPageSchema = (content: TickerContent, facts: TickerEngineFacts) => ({
  '@type': 'FAQPage',
  mainEntity: content.faqs.map((faq) => ({
    '@type': 'Question',
    name: renderTickerContentTemplate(faq.question, facts),
    acceptedAnswer: {
      '@type': 'Answer',
      text: renderTickerContentTemplate(faq.answer, facts)
    }
  }))
});

const buildTickerJsonLd = (content: TickerContent, facts: TickerEngineFacts, canonical: string): string =>
  jsonLdScript({
    '@context': 'https://schema.org',
    '@graph': [buildFinancialProductSchema(content, facts, canonical), buildFaqPageSchema(content, facts)]
  });

const injectTickerBody = (shell: string, content: TickerContent, siteUrl: string): string => {
  const facts = resolveTickerEngineFacts(content.ticker);
  const canonical = tickerCanonical(siteUrl, content);

  const article =
    '<article>' +
    renderHero(content, facts) +
    content.sections.map((section) => renderSection(section, facts)).join('') +
    renderFaqs(content.faqs, facts) +
    renderRelatedTickers(content.relatedTickers) +
    `<p class="disclaimer">${escapeHtmlText(content.disclaimer)}</p>` +
    '</article>' +
    buildTickerJsonLd(content, facts, canonical);

  return injectAtRoot(shell, article);
};

/* -------------------------------------------------------------------------- */
/* `/ticker/all` 허브                                                          */
/* -------------------------------------------------------------------------- */

const buildHubDescription = (): string =>
  `${TICKER_CONTENT_LIST.length}개 배당 ETF·종목의 배당률·배당성장률·운용보수·구성 기준을 정리했습니다. 관심 있는 티커를 선택해 자세히 확인해 보세요.`;

const HUB_DISCLAIMER =
  '이 페이지는 정보 제공을 목적으로 하며 투자 자문이 아닙니다. 배당률·주가·운용보수·세금 등은 시장 상황과 정책에 따라 변동될 수 있습니다.';

const applyHubMeta = (shell: string, siteUrl: string): string =>
  applyMeta(shell, `${HUB_META_TITLE} - ${SITE_SUFFIX}`, buildHubDescription(), `${siteUrl}${HUB_PATH}`);

const renderHubCategorySections = (): string =>
  (Object.keys(TICKER_CATEGORY_LABEL) as TickerCategoryId[])
    .map((categoryId) => {
      const entries = listTickerContentByCategory(categoryId);
      if (entries.length === 0) return '';
      const items = entries
        .map((entry) => {
          const href = escapeHtmlAttribute(`/ticker/${entry.slug}`);
          const label = escapeHtmlText(`${entry.ticker} — ${entry.metaTitle}`);
          return `<li><a href="${href}">${label}</a></li>`;
        })
        .join('');
      return `<section><h2>${escapeHtmlText(TICKER_CATEGORY_LABEL[categoryId])}</h2><ul>${items}</ul></section>`;
    })
    .join('');

/** 허브는 목록 페이지라 `ItemList` — `BreadcrumbList` 는 상위 계층이 하나뿐이라 생략(과설계 회피). */
const buildHubJsonLd = (siteUrl: string): string =>
  jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: TICKER_CONTENT_LIST.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}/ticker/${entry.slug}`,
      name: `${entry.ticker} — ${entry.metaTitle}`
    }))
  });

const injectHubBody = (shell: string, siteUrl: string): string => {
  const article =
    '<article>' +
    `<h1>${escapeHtmlText(HUB_META_TITLE)}</h1>` +
    `<p>${escapeHtmlText(buildHubDescription())}</p>` +
    renderHubCategorySections() +
    `<p class="disclaimer">${escapeHtmlText(HUB_DISCLAIMER)}</p>` +
    '</article>' +
    buildHubJsonLd(siteUrl);

  return injectAtRoot(shell, article);
};

/** 웹 표준 핸들러 — `test/api/tickerHtml.test.ts` 가 `handler(new Request(...))` 로 직접 호출한다. */
export async function handler(request: Request): Promise<Response> {
  const { origin, searchParams } = new URL(request.url);
  const nameParam = (searchParams.get('name') ?? '').trim().toLowerCase();

  // 1) index.html 셸. 이 경로는 rewrite 대상이 아니라 재진입이 없다(post-html.ts와 동일 전제).
  let shell: string;
  try {
    const response = await fetch(new URL('/index.html', origin));
    if (!response.ok) return redirectToRoot(origin);
    shell = await response.text();
  } catch {
    return redirectToRoot(origin);
  }

  // 2) name이 없으면(방어) 무치환 셸 200. 앱이 부팅해 라우터가 알아서 처리한다.
  if (!nameParam) return htmlResponse(shell, 200, CACHE_NO_STORE);

  const siteUrl = resolveSiteUrl(request.url);

  // 3) `/ticker/all` 허브 — 개별 티커 조회보다 먼저 분기한다(위 "허브" 주석 근거).
  if (nameParam === HUB_SLUG) {
    return htmlResponse(injectHubBody(applyHubMeta(shell, siteUrl), siteUrl), 200, CACHE_TICKER);
  }

  // 4) 콘텐츠가 없는 티커는 404가 아니라 무치환 셸 200 + no-store (위 "없는 티커" 주석 근거).
  const content = findTickerContentBySlug(nameParam);
  if (!content) return htmlResponse(shell, 200, CACHE_NO_STORE);

  return htmlResponse(injectTickerBody(applyTickerMeta(shell, content, siteUrl), content, siteUrl), 200, CACHE_TICKER);
}

/** ⚠ Vercel 이 실제로 호출하는 진입점. 어댑터를 벗기면 무응답으로 되돌아간다(위 "런타임" 주석). */
export default toNodeHandler(handler);
