/*
  ⚠ og.tsx / share-html.ts 와 동일 규약: 모듈 스코프에서 `import.meta.env` 를 읽는 코드를 끌고 오면
  Vercel Node 런타임에서 함수가 즉사한다(try/catch 로도 못 잡는 모듈 평가 단계). `@/shared/lib/og` 는
  순수 문자열 + process.env 조회만 담고 있어 안전하다. 앱 배럴을 우회하는 이 규칙은 폴더가 `server/handlers/`
  로 옮겨져도 그대로 유효하다 — 근거가 Vercel 디렉터리 규약이 아니라 **런타임 제약**이기 때문이다.
  supabase-js 도 끌어오지 않는다 — anon 키 plain REST 직접 호출(postsRest.ts).
*/
import {
  escapeHtmlText,
  fetchPublicPostMeta,
  isPublicPostKind,
  POST_ID_PATTERN,
  replaceLinkHref,
  replaceMetaContent,
  replaceTitleTag,
  resolveSiteUrl
} from '@/shared/lib/og';
import type { PublicPostKind, PublicPostMeta } from '@/shared/lib/og';
import { toNodeHandler } from '@/shared/lib/server';
import { sanitizePostBody } from './serverSanitize';

/**
 * `/api/post-html?kind=<board|portfolio>&id=<uuid>` — 커뮤니티 **글 상세의 진입 HTML**.
 *
 * ## 런타임: Node.js — **`toNodeHandler` 어댑터 필수**
 * `export const config` 가 없으므로 Vercel 은 Node 런타임으로 배포하고 `(req, res)` 로 호출한다. 아래 웹 표준
 * `handler` 를 그대로 default export 하면 `res.end()` 가 없어 **무응답 타임아웃**이 된다(2026-07-20 실제 장애 —
 * `api/*` 6개 전멸). Edge 로 옮기는 것은 선택지가 아니다(Edge 번들러가 `@/` alias 미해석).
 * 근거: `@/shared/lib/server` nodeHandler.ts.
 *
 * ## 라우팅: middleware 가 아니라 vercel.json rewrite 다 (판단 근거)
 * 브리핑의 초안은 middleware 에서 형식만 보고 이리로 rewrite 하는 것이었다. 실제로는 **middleware 가
 * 전혀 필요 없다**:
 *   - middleware 가 유일한 수단이었던 이유는 `?share=` 가 **경로 `/`** 라서 `dist/index.html` 이
 *     파일시스템에서 먼저 히트해 rewrite 단계에 도달하지 못하기 때문이다(middleware.ts:24-26).
 *   - `/community/board/<id>` 는 `dist/` 에 대응 파일이 **없다**. 파일시스템이 미스하므로 rewrite 가
 *     정상적으로 발동한다. 즉 이 경로엔 그 함정이 존재하지 않는다.
 * middleware `matcher` 를 넓히는 쪽이 오히려 위험하다 — 기존 `/`(공유 링크) 동작을 건드리고, 넓힌
 * matcher 에 이 함수가 fetch 하는 경로가 걸리면 508 INFINITE_LOOP 이다. 그래서 **middleware.ts 는 이
 * PR 에서 한 글자도 바꾸지 않았다**(회귀 테스트로 못박음: test/api/middlewareShareRouting.test.ts).
 *
 * ## 크롤러 전용 분기 금지
 * User-Agent 로 갈라 봇에게만 다른 HTML 을 주면 클로킹이다. 반환 HTML 은 **dist/index.html 그 자체**이고
 * 메타 content 만 다르다 — 사람 방문자도 같은 HTML 을 받고 그 위에 React 앱이 그대로 부팅해 상세를 그린다.
 * script/link 태그는 하나도 건드리지 않는다.
 *
 * ## 범위
 * 메타 치환(PR-A) + **본문 HTML 주입**(PR-B): 정화된 글 제목·본문을 `#root` 안에 서버 주입해 JS 없이도
 * 크롤러가 글 내용을 읽는다. React 가 마운트하며 `#root` 를 통째로 교체하므로(Vite SPA, 하이드레이션 아님)
 * 사람 방문자 경험은 불변이다.
 *
 * ## og:image 는 왜 기본 이미지인가
 * 기존 `/api/og` 는 `?share=`(lz-string) 또는 `?s=`(shared_snapshots key)로만 카드를 그린다. 게시글은
 * 그 어느 쪽도 아니고(`posts.payload` 는 별개 테이블·별개 형식), 이미지를 만들려면 og.tsx 의
 * `resolveCardModel` 에 posts 조회 분기를 새로 열어야 한다 — 브리핑이 금지한 "기존 동작 변경"이다.
 * 그래서 이 PR 은 **og:image 를 건드리지 않고** 정적 기본 카드를 그대로 쓴다. 포트폴리오 글은
 * `sim_summary` 가 있어 의미 있는 카드가 가능하므로 **후속 트랙 후보**로 남긴다.
 */

/**
 * 성공(공개 글 확인) — 5분 신선도 / 7일 stale 허용.
 *   - `s-maxage=300`: 글 제목·요약 수정이 검색·SNS 미리보기에 **5분 내** 반영된다. 상세는 공유 링크와
 *     달리 원본이 계속 바뀔 수 있으므로 share-html 의 하루(86400)보다 훨씬 짧게 잡는다.
 *   - `stale-while-revalidate=604800`(7일): 5분이 지나도 백그라운드 갱신 동안 캐시본을 즉시 내보낸다.
 *     크롤러가 기다리지 않고, DB 장애 중에도 미리보기가 깨지지 않는다.
 */
const CACHE_POST = 'public, max-age=0, s-maxage=300, stale-while-revalidate=604800';

/**
 * 무치환 셸 / 404 — **캐시하지 않는다**.
 *   - 비공개·부재를 엣지에 얹으면, 비공개였다가 공개로 바뀐 글이 계속 404 로 남는다. 더 나쁜 건 그 반대다:
 *     공개→비공개로 되돌린 글의 HTML 이 엣지에 남아 **URL 을 아는 누구에게나** 계속 노출된다.
 *   - 일시적 조회 실패를 캐시하면 장애가 엣지에 박제된다.
 */
const CACHE_NO_STORE = 'no-store';

/** 상세 페이지 메타에 붙일 사이트 접미사 — index.html 의 기본 title 과 같은 브랜드 표기. */
const SITE_SUFFIX = 'Snowball Income';

/** description 이 없는 글(첨부만 있는 포트폴리오 등)의 기본 설명. 종류별로 문맥이 다르다. */
const FALLBACK_DESCRIPTION: Record<PublicPostKind, string> = {
  portfolio: '스노우볼 인컴 커뮤니티에 공유된 배당 포트폴리오 시나리오입니다. 월 배당·목표 달성 시점을 확인해 보세요.',
  board: '스노우볼 인컴 자유게시판에 올라온 글입니다.'
};

const htmlResponse = (html: string, status: number, cache: string): Response =>
  new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': cache }
  });

/**
 * 셸 자체를 못 읽는 극단(자기 도메인 정적 파일 장애)의 폴백. share-html.ts 와 동일하게 루트로 302 한다.
 * `/` 는 이 함수로 rewrite 되지 않으므로 루프가 없다.
 */
const redirectToRoot = (origin: string): Response =>
  new Response(null, {
    status: 302,
    headers: { Location: new URL('/', origin).toString(), 'cache-control': CACHE_NO_STORE }
  });

/**
 * 글 메타를 셸에 박는다. 바꾸는 것은 **제목·설명·URL 계열뿐**이고 og:type/og:locale/og:site_name/
 * 이미지 규격/twitter:card 는 불변이다(share-html.ts 의 불변식과 같은 규율).
 *
 * `<title>` 과 `<meta name="description">` 까지 바꾸는 이유: 네이버(Yeti)·다음(Daumoa)은 JS 를 렌더하지
 * 않아 **정적 `<title>` 이 곧 검색결과 제목**이다. og:title 만 바꾸면 SNS 카드는 맞아도 검색결과에는
 * 모든 글이 똑같은 제목으로 뜬다. canonical 도 글 URL 로 옮긴다 — 상세를 색인시키는 것이 이 PR 의 목적이라
 * 루트로 고정해 두면 색인이 전부 루트로 접힌다(공유 링크 `?s=` 가 canonical 을 루트로 두는 것과 정반대 의도).
 */
const applyPostMeta = (shell: string, post: PublicPostMeta, siteUrl: string): string => {
  const title = `${post.title} - ${SITE_SUFFIX}`;
  const description = post.description ?? FALLBACK_DESCRIPTION[post.kind];
  const canonical = `${siteUrl}/community/${post.kind}/${post.id}`;

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
 * `#root` 안에 글 제목(h1) + 정화된 본문을 서버 주입한다.
 *
 * ## 삽입 지점 — `<div id="root">` 여는 태그 **직후**
 * 기존 `app-shell-fallback` 을 감싼 `</div>` 를 매칭하는 방식은 `#root` 안에 중첩 div 가 있어 정규식이
 * 취약하다. **여는 태그 직후 삽입**은 빈 `<div id="root"></div>`(테스트 픽스처)와 실제 셸(fallback 포함)
 * **양쪽에서 결정적**이고, 크롤러가 글 제목·본문을 셸 잡동사니보다 먼저 읽는다. 여는 태그가 없으면(방어)
 * 원문 그대로 반환한다.
 *
 * ## HTML 컨텍스트 안전 (XSS 경계)
 * 본문은 **엘리먼트 content 위치**(article 안)에 들어간다. `sanitizePostBody` 는 DOMPurify 가 파싱·정화한
 * **균형 잡힌 안전 HTML** 을 돌려주므로(스크립트·이벤트 핸들러·`javascript:`·style 전부 제거) `</script>`·
 * `</div>` 같은 조기 종료로 셸 구조를 깨지 않는다 — script 태그나 속성값 컨텍스트가 아니기 때문이다.
 * ⚠ 본문을 **절대** `<script>` 태그 안이나 속성값 안에 넣지 마라(그 컨텍스트에선 이 보장이 성립하지 않는다).
 * 제목은 마크업이 아닌 텍스트라 `escapeHtmlText` 로만 이스케이프한다(h1 의 content 위치).
 */
const injectPostBody = (shell: string, post: PublicPostMeta): string => {
  const rootOpenTag = shell.match(/<div\s+id="root"[^>]*>/i);
  if (!rootOpenTag || rootOpenTag.index === undefined) return shell;

  const safeBody = sanitizePostBody(post.body ?? '');
  const article = `<article><h1>${escapeHtmlText(post.title)}</h1>${safeBody}</article>`;

  const insertAt = rootOpenTag.index + rootOpenTag[0].length;
  return shell.slice(0, insertAt) + article + shell.slice(insertAt);
};

/** 웹 표준 핸들러 — `test/api/postHtml.test.ts` 가 `handler(new Request(...))` 로 직접 호출한다. */
export async function handler(request: Request): Promise<Response> {
  const { origin, searchParams } = new URL(request.url);
  const kindParam = searchParams.get('kind');
  const id = searchParams.get('id') ?? '';

  // 1) index.html 셸. 이 경로는 rewrite 대상이 아니라 재진입이 없다.
  let shell: string;
  try {
    const response = await fetch(new URL('/index.html', origin));
    if (!response.ok) return redirectToRoot(origin);
    shell = await response.text();
  } catch {
    return redirectToRoot(origin);
  }

  // 2) kind 가 아니면(방어) 무치환 셸 200. 앱이 부팅해 라우터가 알아서 처리한다.
  if (!isPublicPostKind(kindParam)) return htmlResponse(shell, 200, CACHE_NO_STORE);

  // 3) id 가 uuid 형식이 아니면 애초에 글 id 가 아니다 — rewrite 의 `:id` 는 `/community/portfolio/write`
  //    같은 **예약 세그먼트도 함께 잡는다**(path-to-regexp 로는 구분할 수 없다). 여기서 셸 200 으로 돌려
  //    글쓰기 화면이 "없는 글 404" 로 죽지 않게 한다. 404 로 만들면 앱의 정상 라우트가 사라진다.
  if (!POST_ID_PATTERN.test(id)) return htmlResponse(shell, 200, CACHE_NO_STORE);

  // 4) 조회. 세 갈래를 **구분**한다(postsRest.ts PublicPostMetaResult 주석 참고):
  //    - not-found   : 글이 없거나 비공개 → 404 + no-store. 셸을 본문으로 실어, 사람이 열면 앱이 뜨고
  //                    라우터가 "없는 글" 화면을 그린다(크롤러는 404 를 보고 색인하지 않는다).
  //    - unavailable : 일시적 실패 / env 미설정 → **404 가 아니다**. 셸 200 + no-store 로 앱을 띄워
  //                    클라이언트가 처리하게 한다. 장애를 "글 없음"으로 단정해 색인에서 지우면 회복이 느리다.
  const result = await fetchPublicPostMeta(kindParam, id);

  if (result.status === 'unavailable') return htmlResponse(shell, 200, CACHE_NO_STORE);
  if (result.status === 'not-found') return htmlResponse(shell, 404, CACHE_NO_STORE);

  // 메타 치환 후, ok 경로에서만 본문을 주입한다(not-found/unavailable/예약 세그먼트는 셸 그대로).
  const withMeta = applyPostMeta(shell, result.post, resolveSiteUrl(request.url));
  return htmlResponse(injectPostBody(withMeta, result.post), 200, CACHE_POST);
}

/** ⚠ Vercel 이 실제로 호출하는 진입점. 어댑터를 벗기면 무응답으로 되돌아간다(위 "런타임" 주석). */
export default toNodeHandler(handler);
