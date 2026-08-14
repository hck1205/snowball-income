/*
  ⚠ ticker-html.js / post-html.js / og.js / sitemap.js 와 동일 규약: 모듈 스코프에서 `import.meta.env` 를
  읽는 코드를 끌고 오면 Vercel Node 런타임에서 함수가 즉사한다(try/catch 로도 못 잡는 모듈 평가 단계).
  `@/shared/lib/og` 는 순수 문자열 + process.env 조회만 담고 있어 안전하다.
  `@/shared/constants/dividendLists` 도 **순수 데이터 + zod 파싱**이라 서버에서 import 해도 안전하다
  (커밋된 JSON 하나와 큐레이션 배열이 전부다 — 외부 I/O 도, 브라우저 API 참조도 없다).
  다만 소비는 **폴더 경로**로만 한다.
*/
import {
  escapeHtmlAttribute,
  escapeHtmlText,
  resolveSiteUrl,
  injectIntoRoot,
  applyDocumentMeta
} from '@/shared/lib/og';
import { toNodeHandler } from '@/shared/lib/server';
import {
  DIVIDEND_LIST_ALL,
  DIVIDEND_LIST_HUB_PATH,
  DIVIDEND_LIST_SECTOR_LABEL,
  DIVIDEND_LISTS,
  dividendListPath,
  toDividendListId
} from '@/shared/constants/dividendLists';
import type { DividendList } from '@/shared/constants/dividendLists';
/*
  🔴 **`@/pages/DividendList` 배럴이 아니라 `copy` 폴더만** 가져온다. 배럴에는 React 페이지가 있어서
  서버 번들이 React·Emotion 을 통째로 끌어온다. `copy` 는 문자열 상수뿐이라 안전하고, 화면과 크롤러
  HTML 이 **같은 문장**을 쓰게 하는 것이 이 import 의 목적이다(둘이 갈리면 색인과 화면이 다른 말을 한다).
*/
import { DIVIDEND_LIST_COPY } from '@/pages/DividendList/copy';
import { SIMULATOR_PATH } from '@/shared/constants/routes';

/**
 * `/api/dividend-list-html?list=<kings|aristocrats|champions|hub>` — 배당 목록 화면의 **진입 HTML**.
 *
 * ## 왜 서버 렌더가 필요한가
 * 이 페이지의 콘텐츠는 **표**다. 앱 표는 React 가 그리므로 JS 를 실행하지 않는 크롤러(Yeti·Daumoa)
 * 에게는 빈 셸이다. 목록·기준·출처가 검색엔진과 AI 요약에 읽히려면 그 텍스트가 이 핸들러가 그리는
 * HTML 안에 있어야 한다(`TickerHtml.ts` 의 `renderTopHoldings` 와 정확히 같은 논리).
 *
 * ## 런타임: Node.js — **`toNodeHandler` 어댑터 필수**
 * `export const config` 가 없으므로 Vercel 은 Node 런타임으로 배포하고 `(req, res)` 로 호출한다. 웹 표준
 * `handler` 를 그대로 default export 하면 `res.end()` 가 없어 **무응답 타임아웃**이 된다(2026-07-20 실제 장애).
 *
 * ## 라우팅
 * `vercel.json` 의 rewrite 가 4개 경로를 이 함수로 보낸다. `/ticker/:name` 처럼 파라미터 하나로 묶지
 * 않은 이유: `/dividend/` 아래에는 이 기능과 무관한 기존 화면(`calendar`·`portfolio`)이 있고, 그것까지
 * 삼키면 두 페이지가 조용히 이 핸들러의 "모르는 목록" 분기로 떨어진다. 그래서 **정확히 아는 4개만**
 * 나열한다.
 *
 * ## 모르는 `list` 값은 무치환 셸 200 (404 가 아니다)
 * rewrite 가 정확한 4개만 보내므로 정상 경로에서는 일어나지 않는다. 함수를 직접 두드리는 경우에
 * 대비한 방어이고, `TickerHtml` 과 같은 이유로 404 대신 셸을 준다 — 앱이 부팅해 라우터가 판단한다.
 */

/**
 * 정적 콘텐츠 성공 캐시 — 24시간 신선도 / 7일 stale 허용. `TickerHtml` 과 같은 값·같은 근거다.
 * 목록은 코드(커밋된 JSON)에만 있으므로 배포가 나가면 함수 코드 자체가 교체된다.
 */
const CACHE_LIST = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800';
const CACHE_NO_STORE = 'no-store';

/** 상세 페이지 메타에 붙일 사이트 접미사 — `TickerHtml`·`PostHtml` 과 같은 관례. */
const SITE_SUFFIX = 'Hungry Hippo';

/** 허브를 가리키는 예약값. 목록 id(`kings`…)와 충돌하지 않는다. */
const HUB_PARAM = 'hub';

const copy = DIVIDEND_LIST_COPY;

const htmlResponse = (html: string, status: number, cache: string): Response =>
  new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': cache }
  });

/** 셸 자체를 못 읽는 극단(자기 도메인 정적 파일 장애)의 폴백. 다른 핸들러와 동일하게 루트로 302. */
const redirectToRoot = (origin: string): Response =>
  new Response(null, {
    status: 302,
    headers: { Location: new URL('/', origin).toString(), 'cache-control': CACHE_NO_STORE }
  });

/** `</script>` 조기 종료를 막는 JSON-LD 안전 직렬화. `<` 를 전부 유니코드 이스케이프한다(표준 기법). */
const escapeJsonForScript = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c');

const jsonLdScript = (graph: unknown): string =>
  `<script type="application/ld+json">${escapeJsonForScript(graph)}</script>`;


/**
 * 화면 푸터의 각주와 **같은 문장**을 크롤러 HTML 에도 낸다. 화면은 `PageFooter` 가 사이트 공통 고지를
 * 함께 그리지만, 여기서는 그 공통 문장이 셸에 없으므로 각주만 낸다 — 두 표면이 같은 사실을 말하되
 * 같은 말을 두 번 하지는 않는다.
 */
const renderFooterNotes = (): string =>
  `<section class="disclaimer"><h2>${escapeHtmlText(copy.page.footerNotesTitle)}</h2><ul>` +
  copy.page.footerNotes.map((note) => `<li>${escapeHtmlText(note)}</li>`).join('') +
  '</ul></section>';

/** 목록의 기준 한 줄. 화면(`pages/DividendList/utils`)과 **같은 규칙**이어야 한다. */
const formatCriterion = (list: DividendList): string =>
  list.maximumStreakYears === undefined
    ? `${list.minimumStreakYears}년 이상`
    : `${list.minimumStreakYears}~${list.maximumStreakYears}년`;

/* -------------------------------------------------------------------------- */
/* 목록 상세                                                                    */
/* -------------------------------------------------------------------------- */

const listCanonical = (siteUrl: string, list: DividendList): string =>
  `${siteUrl}${dividendListPath(list.id)}`;

/**
 * 🔴 **표가 콘텐츠다.** 앱의 정렬 가능한 표는 React 가 그려서 크롤러에게는 존재하지 않는다.
 * 여기서 같은 종목을 텍스트 표로 낸다 — 이 손실은 화면 확인으로는 절대 드러나지 않는다.
 */
const renderMembersTable = (list: DividendList): string => {
  const rows = list.members
    .map(
      (member, index) =>
        `<tr><td>${index + 1}</td><td>${escapeHtmlText(member.ticker)}</td>` +
        `<td>${escapeHtmlText(member.name)}</td>` +
        `<td>${escapeHtmlText(DIVIDEND_LIST_SECTOR_LABEL[member.sector])}</td></tr>`
    )
    .join('');

  return (
    '<section id="members">' +
    `<h2>${escapeHtmlText(copy.page.tableHeading)}</h2>` +
    '<table>' +
    `<caption>${escapeHtmlText(
      `${copy.lists[list.id].title} ${copy.page.tableCaptionSuffix} (${copy.page.asOfLabel} ${list.asOf})`
    )}</caption>` +
    `<thead><tr><th>순위</th><th>${escapeHtmlText(copy.page.columnTicker)}</th>` +
    `<th>${escapeHtmlText(copy.page.columnName)}</th>` +
    `<th>${escapeHtmlText(copy.page.columnSector)}</th></tr></thead>` +
    `<tbody>${rows}</tbody>` +
    '</table>' +
    '</section>'
  );
};

const renderSources = (list: DividendList): string => {
  const items = list.sources
    .map((source) => {
      const role = source.role === 'primary' ? copy.page.sourceRolePrimary : copy.page.sourceRoleCrosscheck;
      return (
        `<li>${escapeHtmlText(role)} — ` +
        `<a href="${escapeHtmlAttribute(source.url)}" rel="nofollow noopener">${escapeHtmlText(source.label)}</a>` +
        ` (${escapeHtmlText(`${copy.page.retrievedAtLabel} ${source.retrievedAt}`)})</li>`
      );
    })
    .join('');

  return (
    '<section id="sources">' +
    `<h2>${escapeHtmlText(copy.page.sourceHeading)}</h2>` +
    `<ul>${items}</ul>` +
    `<h3>${escapeHtmlText(copy.page.coverageHeading)}</h3>` +
    `<p>${escapeHtmlText(list.coverageNote)}</p>` +
    '</section>'
  );
};

/**
 * 히어로 = h1 + 리드 + 기준 + **시뮬레이터로 가는 링크**.
 * 🔴 목적지는 `SIMULATOR_PATH` 다 — 여기가 뒤처지면 크롤러만 엉뚱한 곳으로 가고 화면 확인으로는
 * 드러나지 않는다(`TickerHtml.renderHero` 와 같은 함정).
 */
const renderHero = (list: DividendList): string => {
  const listCopy = copy.lists[list.id];
  return (
    `<h1>${escapeHtmlText(listCopy.title)}</h1>` +
    `<p>${escapeHtmlText(listCopy.lede)}</p>` +
    `<p>${escapeHtmlText(
      `${copy.page.criterionHeading}: ${listCopy.criterionLabel} · ` +
        `${copy.page.asOfLabel} ${list.asOf} · ${copy.page.countLabel} ${list.members.length}${copy.page.countUnit}`
    )}</p>` +
    `<p class="hero-cta"><a href="${SIMULATOR_PATH}">배당 재투자 시뮬레이터로 계산해 보기</a></p>`
  );
};

const renderRelated = (currentId: DividendList['id']): string => {
  const items = DIVIDEND_LIST_ALL.filter((list) => list.id !== currentId)
    .map((list) => {
      const href = escapeHtmlAttribute(dividendListPath(list.id));
      const label = `${copy.lists[list.id].title} — ${formatCriterion(list)} · ${list.members.length}${copy.page.countUnit}`;
      return `<li><a href="${href}">${escapeHtmlText(label)}</a></li>`;
    })
    .join('');
  return (
    '<section id="related">' +
    `<h2>${escapeHtmlText(copy.page.relatedHeading)}</h2>` +
    `<ul>${items}` +
    `<li><a href="${escapeHtmlAttribute(DIVIDEND_LIST_HUB_PATH)}">${escapeHtmlText(copy.page.hubLink)}</a></li>` +
    '</ul></section>'
  );
};

/**
 * `ItemList` — 이 페이지는 **목록 페이지**다. 각 종목을 `Corporation` 으로 펴지 않는 이유:
 * 우리는 회사에 대한 사실(주소·설립연도·매출)을 갖고 있지 않고, 티커와 이름만으로 조직 엔티티를
 * 선언하면 구조화 데이터가 근거 없는 주장을 하게 된다. `name` 만 실어 "이 페이지에 이 종목들이 있다"
 * 까지만 말한다. `FAQPage` 도 두지 않는다 — 이 페이지에는 질문·답변 형식의 콘텐츠가 없다.
 */
const buildListJsonLd = (list: DividendList, canonical: string): string =>
  jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: copy.lists[list.id].metaTitle,
    description: copy.lists[list.id].metaDescription,
    url: canonical,
    numberOfItems: list.members.length,
    itemListElement: list.members.map((member, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `${member.ticker} — ${member.name}`
    }))
  });

const injectListBody = (shell: string, list: DividendList, siteUrl: string): string => {
  const listCopy = copy.lists[list.id];
  const canonical = listCanonical(siteUrl, list);

  const article =
    '<article>' +
    renderHero(list) +
    `<section id="definition"><h2>${escapeHtmlText(copy.page.definitionHeading)}</h2>` +
    `<p>${escapeHtmlText(listCopy.definition)}</p>` +
    `<p>${escapeHtmlText(listCopy.caution)}</p></section>` +
    `<section id="streak"><h2>${escapeHtmlText(copy.page.streakHeading)}</h2>` +
    `<p>${escapeHtmlText(copy.page.streakBody)}</p></section>` +
    renderMembersTable(list) +
    renderSources(list) +
    renderRelated(list.id) +
    renderFooterNotes() +
    '</article>' +
    buildListJsonLd(list, canonical);

  return injectIntoRoot(shell, article);
};

/* -------------------------------------------------------------------------- */
/* 허브                                                                         */
/* -------------------------------------------------------------------------- */

const injectHubBody = (shell: string, siteUrl: string): string => {
  const rows = DIVIDEND_LIST_ALL.map((list) => {
    const href = escapeHtmlAttribute(dividendListPath(list.id));
    return (
      `<tr><td><a href="${href}">${escapeHtmlText(copy.lists[list.id].title)}</a></td>` +
      `<td>${escapeHtmlText(copy.lists[list.id].criterionLabel)}</td>` +
      `<td>${escapeHtmlText(`${list.members.length}${copy.page.countUnit}`)}</td>` +
      `<td>${escapeHtmlText(list.asOf)}</td></tr>`
    );
  }).join('');

  const article =
    '<article>' +
    `<h1>${escapeHtmlText(copy.hub.hero.title)}</h1>` +
    `<p>${escapeHtmlText(copy.hub.hero.lede)}</p>` +
    `<p>${escapeHtmlText(copy.hub.notice)}</p>` +
    `<section id="lists"><h2>${escapeHtmlText(copy.hub.tableHeading)}</h2>` +
    '<table>' +
    `<caption>${escapeHtmlText(copy.hub.tableCaption)}</caption>` +
    `<thead><tr><th>${escapeHtmlText(copy.hub.columns.list)}</th>` +
    `<th>${escapeHtmlText(copy.hub.columns.criterion)}</th>` +
    `<th>${escapeHtmlText(copy.hub.columns.count)}</th>` +
    `<th>${escapeHtmlText(copy.hub.columns.asOf)}</th></tr></thead>` +
    `<tbody>${rows}</tbody></table></section>` +
    renderFooterNotes() +
    '</article>' +
    jsonLdScript({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: copy.hub.meta.title,
      description: copy.hub.meta.description,
      url: `${siteUrl}${DIVIDEND_LIST_HUB_PATH}`,
      itemListElement: DIVIDEND_LIST_ALL.map((list, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteUrl}${dividendListPath(list.id)}`,
        name: copy.lists[list.id].metaTitle
      }))
    });

  return injectIntoRoot(shell, article);
};

/** 웹 표준 핸들러 — `test/api/dividendListHtml.test.ts` 가 `handler(new Request(...))` 로 직접 호출한다. */
export async function handler(request: Request): Promise<Response> {
  const { origin, searchParams } = new URL(request.url);
  const listParam = (searchParams.get('list') ?? '').trim().toLowerCase();

  // 1) index.html 셸. 이 경로는 rewrite 대상이 아니라 재진입이 없다(다른 핸들러와 동일 전제).
  let shell: string;
  try {
    const response = await fetch(new URL('/index.html', origin));
    if (!response.ok) return redirectToRoot(origin);
    shell = await response.text();
  } catch {
    return redirectToRoot(origin);
  }

  const siteUrl = resolveSiteUrl(request.url);

  // 2) 허브 — 목록 조회보다 **먼저** 분기한다(`hub` 는 목록 id 가 될 수 없는 예약어다).
  if (listParam === HUB_PARAM) {
    const html = applyDocumentMeta(shell, { title: `${copy.hub.meta.title} - ${SITE_SUFFIX}`, description: copy.hub.meta.description, canonical: `${siteUrl}${DIVIDEND_LIST_HUB_PATH}` });
    return htmlResponse(injectHubBody(html, siteUrl), 200, CACHE_LIST);
  }

  // 3) 모르는 값은 무치환 셸 200 + no-store (rewrite 가 정확한 4개만 보내므로 정상 경로에는 없다).
  const listId = toDividendListId(listParam);
  if (!listId) return htmlResponse(shell, 200, CACHE_NO_STORE);

  const list = DIVIDEND_LISTS[listId];
  const html = applyDocumentMeta(shell, { title: `${copy.lists[listId].metaTitle} - ${SITE_SUFFIX}`, description: copy.lists[listId].metaDescription, canonical: listCanonical(siteUrl, list) });
  return htmlResponse(injectListBody(html, list, siteUrl), 200, CACHE_LIST);
}

/** ⚠ Vercel 이 실제로 호출하는 진입점. 어댑터를 벗기면 무응답으로 되돌아간다(위 "런타임" 주석). */
export default toNodeHandler(handler);
