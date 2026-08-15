/*
  ⚠ 다른 핸들러와 동일 규약: 모듈 스코프에서 `import.meta.env` 를 읽는 코드를 끌고 오면 Vercel Node
  런타임에서 함수가 즉사한다. 아래 셋은 모두 `process.env` 만 보는 서버 세이프 모듈이다.
*/
import { toNodeHandler } from '@/shared/lib/server';
import { handler as fxHandler } from '@/server/handlers/Fx/Fx';
import { handler as marketIndicesHandler } from '@/server/handlers/MarketIndices/MarketIndices';
import { handler as unfurlHandler } from '@/server/handlers/Unfurl/Unfurl';

/**
 * **외부 조회 프록시 묶음** — `/api/fx` · `/api/market-indices` · `/api/unfurl` 을 한 함수로 모은다
 * (2026-08-15).
 *
 * ## 왜 합치는가
 * 🔴 Vercel Hobby 의 서버리스 함수 상한이 **12개**인데 정확히 12개였다 — 여유 0. 그 상한을 넘기면
 * **빌드는 통과하고 "Deploying outputs" 에서 죽는다**(2026-08-07 실제로 겪었다). 새 지면이 필요할
 * 때마다 이 벽에 부딪히므로 미리 자리를 만든다. `SeoHtml`(정적 콘텐츠 렌더러 묶음)과 **같은 패턴**이고,
 * 다음 수순으로 이 셋을 지목한 것도 `tools/apiBundle/manifest.mjs` 머리말이다.
 *
 * ## 왜 하필 이 셋인가 — 무거운 것은 건드리지 않는다
 * 셋 다 **작다**(fx 8KB · market-indices 23KB · unfurl 15KB = 합쳐도 46KB). 합쳐도 콜드 스타트가
 * 사실상 안 늘어난다.
 *
 * 🔴 **`og.js`(528KB, Satori)·`account-delete.js` 는 합치지 않는다** — 둘 다 `maxDuration: 30` 이
 *    함수 단위로 걸려 있고, og 의 무게가 다른 지면의 콜드 스타트에 얹힌다.
 * 🔴 **크롤러 HTML 셋(`seo-html` 2.4MB·`share-html` 324KB·`post-html` 81KB)도 합치지 않는다** —
 *    특히 `share-html` 은 **실사용자가 공유 링크를 눌러 들어오는 진입점**이다. 합치면 그 사용자가
 *    2.9MB 콜드 스타트를 기다린다. 함수 한 칸을 아끼자고 사람을 기다리게 하지 않는다.
 *
 * ## 계약
 * 🔴 분기 키는 **`surface` 쿼리 파라미터**다(`SeoHtml` 과 같은 규칙). 각 핸들러가 읽는 파라미터
 * (`url` 등)의 존재로 추론하지 않는다 — 추론은 파라미터가 겹치는 날 조용히 틀린 지면을 부른다.
 *
 * 🔴 **공개 URL 은 그대로다.** `vercel.json` 의 rewrite 가 `/api/fx` → `/api/proxy?surface=fx` 로
 * 보낸다. 앱 코드(`FX_ENDPOINT` 등)와 이미 나간 클라이언트가 손대지 않고 계속 동작한다 —
 * 함수를 합치는 것은 배포 사정이지 API 계약의 변경이 아니다.
 * ⚠ `vercel.json` 과 **한 벌**이다. 한쪽만 바꾸면 그 지면이 404 로 떨어진다.
 * ⚠ 각 핸들러는 자기 파일에 그대로 남는다(테스트도 그 모듈을 직접 부른다). 이 파일은 **배선만** 한다.
 */
type Surface = 'fx' | 'market-indices' | 'unfurl';

const ROUTES: Record<Surface, (request: Request) => Promise<Response>> = {
  fx: fxHandler,
  'market-indices': marketIndicesHandler,
  unfurl: unfurlHandler
};

const isSurface = (value: string | null): value is Surface => value !== null && value in ROUTES;

export async function handler(request: Request): Promise<Response> {
  const surface = new URL(request.url).searchParams.get('surface');

  if (isSurface(surface)) return ROUTES[surface](request);

  /*
   * 모르는 지면 — rewrite 와 이 파일이 어긋났다는 뜻이다. 404 로 답하되 캐시하지 않는다.
   * ⚠ JSON 묶음이라 HTML 셸 폴백이 없다(크롤러 지면과 다른 점). 호출부는 전부 fetch 라
   *   상태코드로 받는 편이 정직하다.
   */
  return new Response(JSON.stringify({ error: 'unknown surface' }), {
    status: 404,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

/** ⚠ Vercel 이 실제로 호출하는 진입점. 어댑터를 벗기면 무응답으로 되돌아간다. */
export default toNodeHandler(handler);
