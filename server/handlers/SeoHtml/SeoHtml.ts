import { toNodeHandler } from '@/shared/lib/server';
import { handler as dividendListHandler } from '../DividendListHtml/DividendListHtml';
import { handler as guideHandler } from '../GuideHtml/GuideHtml';
import { handler as tickerHandler } from '../TickerHtml/TickerHtml';

/**
 * `/api/seo-html` — **크롤러가 읽는 정적 콘텐츠 지면 셋을 한 함수로 모은 진입점**.
 *
 * ## 🔴 왜 합쳤나 — Vercel Hobby 플랜의 함수 12개 상한
 * 2026-08-07 배포가 이 오류로 실패했다:
 * ```
 * errorCode:    exceeded_serverless_functions_per_deployment
 * errorMessage: No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan.
 * ```
 * `api/*.js` 는 **파일 하나가 곧 함수 하나**다. 티커·배당목록·가이드가 각자 파일을 가지면서 13개가
 * 됐고, 빌드는 통과하는데 "Deploying outputs" 단계에서 죽었다(빌드 로그에는 이유가 안 남는다 —
 * Vercel API 의 `errorCode` 로만 보인다. 다음에 같은 증상을 만나면 거기부터 봐라).
 *
 * ## 이 셋을 고른 이유
 * 셋 다 **같은 종류의 일**을 한다: 데이터베이스를 보지 않고 `shared/constants` 의 콘텐츠를 읽어
 * `index.html` 셸에 본문·메타·JSON-LD 를 주입한다. 인증도, 외부 API 도, 쓰기도 없다.
 * 반면 `post-html`·`share-html`·`og` 는 Supabase 나 렌더 런타임에 매인다 — 성격이 달라 섞지 않았다.
 *
 * ## 대가
 * ⚠ 셋이 한 번들이라 **어느 지면을 요청해도 셋의 코드가 전부 로드된다**(합계 약 2.6MB, 대부분이
 *   티커 콘텐츠). 콜드 스타트가 그만큼 늘어난다. 함수 상한이 풀리면(Pro 전환) 되돌리는 것이 낫고,
 *   되돌리기는 이 파일을 지우고 manifest·vercel.json 을 원래 세 줄로 돌리면 끝난다.
 *
 * ## 계약
 * 🔴 분기 키는 **`surface` 쿼리 파라미터**다. 각 핸들러가 읽는 파라미터(`name`·`list`·`slug`)의
 * 존재 여부로 추론하지 않는다 — 추론은 파라미터가 하나 늘거나 겹치는 날 조용히 틀린 지면을 그린다.
 * ⚠ `vercel.json` 의 rewrite 와 **한 벌**이다. 한쪽만 바꾸면 크롤러가 셸만 받는다.
 * ⚠ 각 핸들러는 자기 파일에 그대로 남는다(테스트도 그 모듈을 직접 부른다). 이 파일은 **배선만** 한다.
 */
type Surface = 'ticker' | 'dividend-list' | 'guide';

const ROUTES: Record<Surface, (request: Request) => Promise<Response>> = {
  ticker: tickerHandler,
  'dividend-list': dividendListHandler,
  guide: guideHandler
};

const isSurface = (value: string | null): value is Surface => value !== null && value in ROUTES;

export async function handler(request: Request): Promise<Response> {
  const surface = new URL(request.url).searchParams.get('surface');

  if (isSurface(surface)) return ROUTES[surface](request);

  /*
   * 모르는 지면 — 루트로 보낸다(각 핸들러가 모르는 슬러그에 하는 것과 같은 처방).
   * 이 경로에 닿는 것은 rewrite 와 이 파일이 어긋났다는 뜻이라 캐시하지 않는다.
   */
  return new Response(null, {
    status: 302,
    headers: { Location: new URL('/', request.url).toString(), 'cache-control': 'no-store' }
  });
}

/** ⚠ Vercel 이 실제로 호출하는 진입점. 어댑터를 벗기면 무응답으로 되돌아간다. */
export default toNodeHandler(handler);
