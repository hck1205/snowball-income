/*
  ⚠ og.tsx / account-delete.ts / naver-auth.ts 와 동일 규약: 모듈 스코프에서 `import.meta.env` 를 읽는
  코드를 끌고 오면 Vercel Node 런타임에서 함수가 즉사한다(try/catch 로도 못 잡는 모듈 평가 단계). 그래서
  - `@/shared/lib/og` 는 순수 문자열/서버 세이프 조회(process.env)만,
  - `@/pages/Main/utils/ogCard` 는 **배럴이 아니라 파일을 직접** 가져온다(배럴은 analytics 를 끌어옴).
  둘 다 Og.tsx 가 이미 쓰는 안전한 경로다. 앱 배럴을 우회하는 이 규칙은 폴더가 `server/handlers/` 로
  옮겨져도 그대로 유효하다 — 근거가 Vercel 디렉터리 규약이 아니라 **런타임 제약**이기 때문이다.
*/
import { DB_SHARE_KEY_PATTERN, fetchSharedSnapshotByKey, replaceMetaContent } from '@/shared/lib/og';
import { buildOgShareText, summarizeSharedScenarioForOg, type OgCardModel } from '@/pages/Main/utils/ogCard';
import { CACHE_NO_STORE, CACHE_STATIC_CONTENT, fetchShellHtml, htmlResponse, toNodeHandler } from '@/shared/lib/server';
import { SIMULATOR_PATH } from '@/shared/constants/routes';

/**
 * `/api/share-html?s=<key>` — DB key 공유 링크(`/?s=<key>`)의 진입 HTML.
 *
 * ## 런타임: Node.js — **`toNodeHandler` 어댑터 필수**
 * `export const config` 가 없으므로 Vercel 은 이 함수를 Node 런타임으로 배포하고 `(req, res)` 로 호출한다.
 * 아래 웹 표준 `handler` 를 그대로 `export default` 하면 `res.end()` 가 불리지 않아 **무응답 타임아웃**이 된다
 * (2026-07-20 실제 장애 — 6개 함수 전멸). 그래서 default 는 어댑터로 감싼 Node 핸들러다.
 * Edge 로 옮기는 것은 선택지가 아니다: Edge 번들러가 `@/` alias(tsconfig paths)를 해석하지 못한다.
 * 자세한 경위는 `@/shared/lib/server` 의 nodeHandler.ts 주석.
 *
 * middleware(Edge) 가 `?s=<key>` 요청을 여기로 **rewrite** 한다(브라우저 URL 은 요청 그대로 —
 * 구 링크는 `/?s=<key>`, 신규 링크는 `/simulator?s=<key>`).
 * 무거운 조회·시뮬레이션 요약은 전부 이 Node 함수로 격리하고, middleware 는 rewrite(문자열 매칭 1개)만 한다.
 *
 * ## 왜 크롤러 전용 스텁이 아니라 index.html 셸인가
 * matcher(`/`·`/simulator`) 는 실사용자 클릭도 잡는다. 그래서 반환 HTML 은 **여전히 dist/index.html 그 자체**여야 한다
 * (OG 메타 content 만 다름). React 앱이 그대로 부팅해 클라이언트 `?s=` 복원 로직(트랙 E restore effect)이
 * 시나리오 탭을 이어서 복원한다. script/link 태그는 하나도 건드리지 않는다.
 *
 * ## 절대 5xx 를 내지 않는다
 * 크롤러(카카오톡·페이스북·트위터·네이버)는 미리보기 요청이 실패하면 카드를 **아예 포기**한다. 그래서 모든
 * 실패 경로(key 부재/만료/형식불일치/조회 실패/env 미설정)는 **메타 치환 없이 셸을 200 으로** 반환한다
 * (자연히 정적 기본 카드로 폴백). 셸 자체를 못 읽는 극단(자기 도메인 정적 파일 장애)만 302→`/simulator`.
 *
 * ## 불변식
 * - canonical / og:type / og:image:type·width·height / og:locale / og:site_name / twitter:card 는 **불변**.
 * - og:url 만 실제 `?s=<key>` URL 을, og:image 만 `/api/og?s=<key>` 를 가리킨다(canonical 은 클린 루트 유지).
 */

/*
 * 🔴 캐시 정책·응답 조립·셸 fetch 는 `@/shared/lib/server` 의 공통 계층을 쓴다(2026-08-14 통합).
 *    종전에는 이 파일이 `CACHE_SCENARIO`·`CACHE_FALLBACK`·`htmlResponse`·셸 fetch 를 **글자까지 같은
 *    사본**으로 들고 있었다 — 크롤러 HTML 핸들러 여섯 곳이 같은 상태였고, 그 복사본이 갈리는 것이
 *    이 레포에서 실제로 사고를 만든 경로다(`crawlerHtml.ts` 주석).
 *    이름만 달랐다: `CACHE_SCENARIO` = `CACHE_STATIC_CONTENT`, `CACHE_FALLBACK` = `CACHE_NO_STORE`.
 *
 * ⚠ 다만 **폴백 목적지는 여기만 다르다** — 루트가 아니라 `/simulator` 다. 그래서 `redirectToRoot` 를
 *   쓰지 않고 아래 `redirectToSimulator` 를 남긴다(사유는 그 함수 주석).
 */

/**
 * 시나리오 셸을 못 읽는 극단 폴백(5xx 금지) — **시뮬레이터로** 302.
 *
 * 목적지가 matcher 안(`/simulator`)이지만 `s`·`share` 파라미터를 떼고 보내므로 middleware 는 즉시
 * `next()` 한다 → 루프 없음. 랜딩이 `/` 를 가져간 뒤에도 이 폴백이 도구를 가리키게 하려고
 * 루트가 아니라 경로 상수를 쓴다.
 */
const redirectToSimulator = (origin: string): Response =>
  new Response(null, {
    status: 302,
    headers: { Location: new URL(SIMULATOR_PATH, origin).toString(), 'cache-control': CACHE_NO_STORE }
  });

/** OG/트위터 메타 content 만 치환한다(불변식 태그는 손대지 않는다). */
const applyShareMeta = (shell: string, key: string, origin: string, model: OgCardModel): string => {
  const { title, description, imageAlt } = buildOgShareText(model);

  // og:url 은 이 시나리오의 정본 주소 — 이전 후에도 유효한 `/simulator` 를 가리킨다(middleware 와 동일 규약).
  const shareUrl = new URL(SIMULATOR_PATH, origin);
  shareUrl.searchParams.set('s', key);
  const imageUrl = new URL('/api/og', origin);
  imageUrl.searchParams.set('s', key);
  const image = imageUrl.toString();

  let html = shell;
  html = replaceMetaContent(html, 'property', 'og:title', title);
  html = replaceMetaContent(html, 'property', 'og:description', description);
  html = replaceMetaContent(html, 'property', 'og:url', shareUrl.toString());
  html = replaceMetaContent(html, 'property', 'og:image', image);
  html = replaceMetaContent(html, 'property', 'og:image:alt', imageAlt);
  html = replaceMetaContent(html, 'name', 'twitter:title', title);
  html = replaceMetaContent(html, 'name', 'twitter:description', description);
  html = replaceMetaContent(html, 'name', 'twitter:image', image);
  html = replaceMetaContent(html, 'name', 'twitter:image:alt', imageAlt);
  return html;
};

/** 웹 표준 핸들러 — `test/api/shareHtml.test.ts` 가 `handler(new Request(...))` 로 직접 호출한다. */
export async function handler(request: Request): Promise<Response> {
  const { origin, searchParams } = new URL(request.url);
  const key = searchParams.get('s');

  // 1) index.html 셸을 가져온다. matcher 에 안 걸리는 경로라 middleware 재진입이 없다.
  const shell = await fetchShellHtml(origin);
  if (shell === null) return redirectToSimulator(origin);

  // 2) key 형식이 아니면(방어) 무치환 셸 → 기본 카드. 앱은 그대로 부팅.
  if (!key || !DB_SHARE_KEY_PATTERN.test(key)) return htmlResponse(shell, 200, CACHE_NO_STORE);

  // 3) 조회 + 요약. 어떤 실패도(부재/만료/미설정/네트워크) 무치환 셸로 흡수(5xx 금지).
  try {
    const envelope = await fetchSharedSnapshotByKey(key);
    const model = summarizeSharedScenarioForOg(envelope?.scenario);
    if (!model) return htmlResponse(shell, 200, CACHE_NO_STORE);
    return htmlResponse(applyShareMeta(shell, key, origin, model), 200, CACHE_STATIC_CONTENT);
  } catch {
    return htmlResponse(shell, 200, CACHE_NO_STORE);
  }
}

/** ⚠ Vercel 이 실제로 호출하는 진입점. 어댑터를 벗기면 무응답으로 되돌아간다(위 "런타임" 주석). */
export default toNodeHandler(handler);
