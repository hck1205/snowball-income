/*
  ⚠ og.tsx / share-html.ts / post-html.ts 와 동일 규약: 모듈 스코프에서 `import.meta.env` 를 읽는 코드를
  끌고 오면 Vercel Node 런타임에서 함수가 즉사한다. `@/shared/lib/og` 는 순수 문자열 + process.env 조회만
  담고 있어 안전하다. supabase-js 도 끌어오지 않는다 — anon 키 plain REST 직접 호출(postsRest.ts).

  ⚠ 이 핸들러는 **본문을 주입하지 않으므로 sanitize(=jsdom)에 의존하지 않는다** — 제목만 텍스트
  이스케이프한다. serverSanitize 를 import 하지 않아 이 함수 번들에 jsdom 이 실리지 않는다.
*/
import {
  escapeHtmlAttribute,
  escapeHtmlText,
  fetchPublicPostList,
  isPublicPostKind,
  replaceLinkHref,
  replaceMetaContent,
  replaceTitleTag,
  resolveSiteUrl
} from '@/shared/lib/og';
import type { PublicPostKind, PublicPostListItem } from '@/shared/lib/og';
import { toNodeHandler } from '@/shared/lib/server';

/**
 * `/api/post-list?kind=<board|portfolio>` — 커뮤니티 **목록 페이지의 진입 HTML**.
 *
 * ## 목적: 크롤러가 상세 URL 을 발견하게 한다
 * SPA 목록은 JS 로만 글 링크를 그리므로 네이버(Yeti)·다음(Daumoa) 같은 비렌더 크롤러가 상세 글에 닿지
 * 못한다. 여기서 공개 글의 **제목·링크만** `#root` 에 서버 주입해 상세 URL 을 노출한다. 본문이 아니므로
 * sanitize 부담이 없다 — 다만 제목은 텍스트 컨텍스트라 `escapeHtmlText` 로 이스케이프한다.
 *
 * ## 런타임: Node.js — `toNodeHandler` 어댑터 필수 (post-html.ts 와 동일 근거)
 * 웹 표준 `handler` 를 default export 하면 `res.end()` 가 없어 무응답 타임아웃이 된다.
 *
 * ## 라우팅: vercel.json rewrite
 * exact `/community/board`·`/community/portfolio`(트레일링 없음) → 이 함수. `/community/board/<id>` 는
 * 더 구체적 rewrite 가 먼저 매칭해 상세(api/post-html)로 간다. 두 경로 모두 `dist/` 에 대응 파일이 없어
 * 파일시스템 미스 → rewrite 정상 발동(middleware 무관, `?share=` 함정은 경로 `/` 라 무관).
 *
 * ## 크롤러 전용 분기 금지
 * 반환 HTML 은 dist/index.html 그 자체 + 메타·목록 주입뿐이다. 사람 방문자도 같은 HTML 을 받고 그 위에
 * React 앱이 부팅해 실제 목록을 그린다(#root 를 통째로 교체).
 */

/** 종류별 목록 페이지 메타. */
const LIST_META: Record<PublicPostKind, { title: string; description: string }> = {
  portfolio: {
    title: '포트폴리오 갤러리',
    description: '스노우볼 인컴 커뮤니티에 공유된 배당 포트폴리오 시나리오 모음입니다. 월 배당·목표 달성 시점을 살펴보세요.'
  },
  board: {
    title: '자유게시판',
    description: '스노우볼 인컴 자유게시판의 최신 글 목록입니다.'
  }
};

const SITE_SUFFIX = 'Snowball Income';

/**
 * 목록 성공 — 상세(300s)보다 짧은 60초 신선도. 새 글이 최대 1분 내 목록에 노출된다.
 * `stale-while-revalidate=3600`: 1분이 지나도 백그라운드 갱신 동안 캐시본을 즉시 내보낸다.
 */
const CACHE_LIST = 'public, max-age=0, s-maxage=60, stale-while-revalidate=3600';

/** 무치환 셸 / 조회 실패 — 캐시하지 않는다(장애·빈 목록을 엣지에 박제하지 않는다). */
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

/**
 * 목록 메타를 셸에 박는다(제목·설명·canonical·og·twitter). og:type/site_name/이미지 규격/twitter:card 는
 * 불변(share-html·post-html 과 같은 규율). canonical 은 목록 URL(`/community/{kind}`)로 옮긴다.
 */
const applyListMeta = (shell: string, kind: PublicPostKind, siteUrl: string): string => {
  const meta = LIST_META[kind];
  const title = `${meta.title} - ${SITE_SUFFIX}`;
  const canonical = `${siteUrl}/community/${kind}`;

  let html = shell;
  html = replaceTitleTag(html, title);
  html = replaceMetaContent(html, 'name', 'description', meta.description);
  html = replaceLinkHref(html, 'canonical', canonical);
  html = replaceMetaContent(html, 'property', 'og:title', title);
  html = replaceMetaContent(html, 'property', 'og:description', meta.description);
  html = replaceMetaContent(html, 'property', 'og:url', canonical);
  html = replaceMetaContent(html, 'name', 'twitter:title', title);
  html = replaceMetaContent(html, 'name', 'twitter:description', meta.description);
  return html;
};

/**
 * `#root` 여는 태그 **직후**에 글 제목·링크 목록을 주입한다(post-html.ts injectPostBody 와 같은 삽입 패턴).
 * 여는 태그 직후 삽입은 빈 `<div id="root"></div>` 픽스처와 실제 셸(app-shell-fallback 중첩 div 포함)
 * 양쪽에서 결정적이다. 여는 태그가 없으면(방어) 원문 그대로 반환한다.
 *
 * 제목은 텍스트 컨텍스트(a 의 content)라 `escapeHtmlText` 로 이스케이프한다 — `<script>` 제목이 마크업으로
 * 실행되지 않는다. href 의 id 는 uuid 형식만 통과(postsRest toListItem)라 속성값 주입 위험이 없다.
 */
const injectPostList = (shell: string, kind: PublicPostKind, items: PublicPostListItem[]): string => {
  const rootOpenTag = shell.match(/<div\s+id="root"[^>]*>/i);
  if (!rootOpenTag || rootOpenTag.index === undefined) return shell;

  const label = LIST_META[kind].title;
  const listItems = items
    .map((item) => `<li><a href="/community/${item.kind}/${item.id}">${escapeHtmlText(item.title)}</a></li>`)
    .join('');
  // aria-label 은 **속성 컨텍스트**라 큰따옴표까지 이스케이프하는 escapeHtmlAttribute 를 쓴다
  // (escapeHtmlText 는 &<> 만 처리해 " 로 속성 이탈이 가능하다 — metaHtml.ts 규약). label 이 지금은
  // 정적 상수라 악용 불가지만, 규약 일치 + 미래에 label 이 동적화될 때의 속성 주입을 원천 차단한다.
  const nav = `<nav aria-label="${escapeHtmlAttribute(label)}"><ul>${listItems}</ul></nav>`;

  const insertAt = rootOpenTag.index + rootOpenTag[0].length;
  return shell.slice(0, insertAt) + nav + shell.slice(insertAt);
};

/** 웹 표준 핸들러 — `test/api/postList.test.ts` 가 `handler(new Request(...))` 로 직접 호출한다. */
export async function handler(request: Request): Promise<Response> {
  const { origin, searchParams } = new URL(request.url);
  const kindParam = searchParams.get('kind');

  let shell: string;
  try {
    const response = await fetch(new URL('/index.html', origin));
    if (!response.ok) return redirectToRoot(origin);
    shell = await response.text();
  } catch {
    return redirectToRoot(origin);
  }

  // kind 가 아니면(방어) 무치환 셸 200 — 앱 라우터가 처리한다.
  if (!isPublicPostKind(kindParam)) return htmlResponse(shell, 200, CACHE_NO_STORE);

  const siteUrl = resolveSiteUrl(request.url);
  const withMeta = applyListMeta(shell, kindParam, siteUrl);

  // 조회 실패(null: 일시적 실패/env 미설정) → 메타만 붙은 셸 200 + no-store(장애를 캐시하지 않는다).
  const items = await fetchPublicPostList(kindParam);
  if (items === null) return htmlResponse(withMeta, 200, CACHE_NO_STORE);

  // 빈 목록 → 주입할 링크가 없어 메타만. 캐시는 짧게(새 글이 곧 생길 수 있다).
  if (items.length === 0) return htmlResponse(withMeta, 200, CACHE_LIST);

  return htmlResponse(injectPostList(withMeta, kindParam, items), 200, CACHE_LIST);
}

/** ⚠ Vercel 이 실제로 호출하는 진입점. 어댑터를 벗기면 무응답으로 되돌아간다. */
export default toNodeHandler(handler);
