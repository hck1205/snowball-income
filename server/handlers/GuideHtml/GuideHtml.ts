/*
  ⚠ ticker-html.js / dividend-list-html.js / post-html.js 와 동일 규약: 모듈 스코프에서
  `import.meta.env` 를 읽는 코드를 끌고 오면 Vercel Node 런타임에서 함수가 즉사한다(모듈 평가 단계라
  try/catch 로도 못 잡는다). `@/shared/constants/guides` 는 **순수 문자열 상수**라 안전하다 —
  React 도, 브라우저 API 도, 외부 I/O 도 없다. 소비는 폴더 경로로만 한다.
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
import { GUIDES, findGuide, guidePath } from '@/shared/constants/guides';
import type { GuideContent, GuideSection } from '@/shared/constants/guides';

/**
 * `/api/guide-html?slug=<slug>` — 검색어 랜딩(`/guide/:slug`)의 **진입 HTML**.
 *
 * ## 왜 서버 렌더가 필요한가
 * 이 페이지의 값어치는 **글 그 자체**다. 앱은 React 가 그리므로 JS 를 실행하지 않는 크롤러
 * (Yeti·Daumoa·일부 AI 요약기)에게는 빈 셸이고, 그러면 이 페이지를 만든 이유가 통째로 사라진다
 * (`docs/site-assessment-2026-08-06.md` P0-③: 검색 유입이 유일한 존재 이유인 페이지다).
 *
 * ## 화면과 **같은 콘텐츠**를 읽는다
 * 🔴 문장을 여기 복제하지 않는다 — `shared/constants/guides` 하나를 화면(`pages/Guide`)과 이 핸들러가
 * 함께 읽는다. 두 표면이 다른 말을 하는 사고(색인과 화면의 불일치)를 구조적으로 막는다.
 *
 * ## 런타임: Node.js — `toNodeHandler` 어댑터 필수
 * `export const config` 가 없으므로 Vercel 은 Node 로 배포하고 `(req, res)` 로 호출한다. 웹 표준
 * 핸들러를 그대로 default export 하면 `res.end()` 가 없어 **무응답 타임아웃**이 된다(2026-07-20 장애).
 *
 * ## 모르는 slug 는 무치환 셸 200 (404 가 아니다)
 * rewrite 가 `/guide/:slug` 만 보내므로 정상 경로에서는 없다. 앱이 부팅해 라우터가 판단하게 둔다 —
 * 다른 핸들러와 같은 처방이다.
 */

/** 성공 캐시 — 24시간 신선 / 7일 stale. 가이드 본문은 배포로만 바뀐다(TickerHtml 과 같은 값·근거). */
const CACHE_GUIDE = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800';
const CACHE_NO_STORE = 'no-store';

const htmlResponse = (html: string, status: number, cache: string): Response =>
  new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': cache }
  });

const redirectToRoot = (origin: string): Response =>
  new Response(null, {
    status: 302,
    headers: { Location: new URL('/', origin).toString(), 'cache-control': CACHE_NO_STORE }
  });

/** 문서 제목 끝에 붙는 사이트명. SPA 의 `useDocumentMeta` 와 **같은 값**이어야 두 표면이 갈리지 않는다. */
const SITE_SUFFIX = 'Hungry Hippo';

/** `</script>` 조기 종료 방지. `<` 를 전부 유니코드 이스케이프한다(표준 기법). */
const escapeJsonForScript = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c');

const jsonLdScript = (graph: unknown): string =>
  `<script type="application/ld+json">${escapeJsonForScript(graph)}</script>`;

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

/** `<div id="root">` 여는 태그 **직후**에 삽입 — 다른 핸들러와 같은 지점(닫는 태그 매칭은 취약하다). */
const injectAtRoot = (shell: string, body: string): string => {
  const rootOpenTag = shell.match(/<div\s+id="root"[^>]*>/i);
  if (!rootOpenTag || rootOpenTag.index === undefined) return shell;
  const insertAt = rootOpenTag.index + rootOpenTag[0].length;
  return shell.slice(0, insertAt) + body + shell.slice(insertAt);
};

/**
 * 표 한 장. 🔴 `note`(계산 전제)를 반드시 함께 낸다 — 화면이 그 줄을 필수로 다루는 것과 같은 이유로,
 * 전제 없는 숫자만 크롤러에게 남기면 그쪽이 더 위험하다(요약기가 숫자만 떼어 간다).
 */
const renderTable = (section: GuideSection): string => {
  const table = section.table;
  if (!table) return '';

  const head = table.columns.map((column) => `<th scope="col">${escapeHtmlText(column)}</th>`).join('');
  const body = table.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtmlText(cell)}</td>`).join('')}</tr>`)
    .join('');

  return (
    '<table>' +
    `<caption>${escapeHtmlText(table.caption)}</caption>` +
    `<thead><tr>${head}</tr></thead>` +
    `<tbody>${body}</tbody>` +
    '</table>' +
    (table.note ? `<p class="table-note">${escapeHtmlText(table.note)}</p>` : '')
  );
};

const renderSection = (section: GuideSection): string =>
  `<section id="${escapeHtmlAttribute(section.id)}">` +
  `<h2>${escapeHtmlText(section.heading)}</h2>` +
  section.paragraphs.map((paragraph) => `<p>${escapeHtmlText(paragraph)}</p>`).join('') +
  renderTable(section) +
  (section.caution ? `<p class="caution">${escapeHtmlText(section.caution)}</p>` : '') +
  '</section>';

const renderFaqs = (guide: GuideContent): string =>
  '<section id="faq"><h2>자주 묻는 질문</h2>' +
  guide.faqs
    .map(
      (faq) =>
        `<details><summary>${escapeHtmlText(faq.question)}</summary>` +
        `<p>${escapeHtmlText(faq.answer)}</p></details>`
    )
    .join('') +
  '</section>';

/** 다른 가이드로 가는 내부 링크. 크롤러가 이 가족을 다 찾아가는 유일한 경로다. */
const renderRelated = (guide: GuideContent): string => {
  const others = GUIDES.filter((entry) => entry.slug !== guide.slug);
  if (others.length === 0) return '';

  return (
    '<nav class="related"><h2>다른 가이드</h2><ul>' +
    others
      .map(
        (entry) =>
          `<li><a href="${escapeHtmlAttribute(guidePath(entry.slug))}">${escapeHtmlText(entry.title)}</a>` +
          ` — ${escapeHtmlText(entry.lede)}</li>`
      )
      .join('') +
    '</ul></nav>'
  );
};

/**
 * JSON-LD 두 장 — `Article`(이 글 자체)과 `FAQPage`(질문 목록).
 * ⚠ FAQPage 는 화면에 **실제로 보이는** 질문만 담아야 한다(구글 가이드라인). 화면과 같은 배열을
 *   쓰므로 그 조건이 구조적으로 지켜진다.
 */
const buildJsonLd = (guide: GuideContent, canonical: string): string =>
  jsonLdScript([
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.metaDescription,
      url: canonical,
      inLanguage: 'ko',
      isAccessibleForFree: true
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: guide.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer }
      }))
    }
  ]);

const injectGuideBody = (shell: string, guide: GuideContent, canonical: string): string => {
  const article =
    '<article>' +
    `<h1>${escapeHtmlText(guide.title)}</h1>` +
    `<p>${escapeHtmlText(guide.lede)}</p>` +
    guide.sections.map(renderSection).join('') +
    renderFaqs(guide) +
    `<p class="cta"><a href="${escapeHtmlAttribute(guide.cta.to)}">${escapeHtmlText(guide.cta.label)}</a>` +
    ` — ${escapeHtmlText(guide.cta.note)}</p>` +
    renderRelated(guide) +
    '</article>' +
    buildJsonLd(guide, canonical);

  return injectAtRoot(shell, article);
};

/** 웹 표준 핸들러 — 테스트가 `handler(new Request(...))` 로 직접 호출한다. */
export async function handler(request: Request): Promise<Response> {
  const { origin, searchParams } = new URL(request.url);
  const slug = (searchParams.get('slug') ?? '').trim().toLowerCase();

  // 1) index.html 셸. 이 경로는 rewrite 대상이 아니라 재진입이 없다(다른 핸들러와 같은 전제).
  let shell: string;
  try {
    const response = await fetch(new URL('/index.html', origin));
    if (!response.ok) return redirectToRoot(origin);
    shell = await response.text();
  } catch {
    return redirectToRoot(origin);
  }

  // 2) 모르는 슬러그는 무치환 셸 200 + no-store — 앱이 부팅해 라우터가 판단한다.
  const guide = findGuide(slug);
  if (!guide) return htmlResponse(shell, 200, CACHE_NO_STORE);

  const siteUrl = resolveSiteUrl(request.url);
  const canonical = `${siteUrl}${guidePath(guide.slug)}`;
  /* 🔴 접미사는 **표면이 붙인다**(TickerHtml 과 같은 규칙). 종전에는 콘텐츠의 metaTitle 이 직접
     적고 있었는데, SPA 가 같은 문자열에 접미사를 한 번 더 붙여 화면 제목이 두 번 겹쳤다
     (2026-08-06). 콘텐츠는 검색어에 쓸 앞자리만 소유한다. */
  const html = applyMeta(shell, `${guide.metaTitle} - ${SITE_SUFFIX}`, guide.metaDescription, canonical);

  return htmlResponse(injectGuideBody(html, guide, canonical), 200, CACHE_GUIDE);
}

/** ⚠ Vercel 이 실제로 호출하는 진입점. 어댑터를 벗기면 무응답으로 되돌아간다(위 "런타임" 주석). */
export default toNodeHandler(handler);
