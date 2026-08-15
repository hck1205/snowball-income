/*
  ⚠ 다른 핸들러와 동일 규약: 모듈 스코프에서 `import.meta.env` 를 읽는 코드를 끌고 오면 Vercel Node
  런타임에서 함수가 즉사한다. 아래 둘은 `process.env` 만 보는 서버 세이프 모듈이다.
*/
import { toNodeHandler } from '@/shared/lib/server';
import { handler as kakaoHandler } from '@/server/handlers/KakaoAuth/KakaoAuth';
import { handler as naverHandler } from '@/server/handlers/NaverAuth/NaverAuth';

/**
 * **소셜 로그인 세션 발급 묶음** — `/api/kakao-auth` · `/api/naver-auth` 를 한 함수로 모은다
 * (2026-08-15). `Proxy`(외부 조회 묶음)·`SeoHtml`(정적 콘텐츠 묶음)과 **같은 패턴**이다.
 *
 * ## 왜 합치는가
 * Vercel Hobby 의 서버리스 함수 상한이 12개다. 넘기면 **빌드는 통과하고 배포에서 죽는다**
 * (`test/api/serverlessFunctionBudget` 이 그 실패를 앞당겨 잡는다). 둘 다 작아서
 * (kakao 13KB · naver 11KB) 합쳐도 콜드 스타트가 사실상 안 늘어난다.
 *
 * ## 🔴 OAuth 등록값은 건드리지 않는다 — 여기가 콜백이 **아니다**
 * 카카오·네이버에 등록된 `redirect_uri` 는 **앱 라우트**(`/community/auth/<provider>/callback`)이지 이
 * 엔드포인트가 아니다. 이 함수는 그 화면이 받은 `code` 를 **POST 로** 넘겨받아 세션을 발급하는
 * 뒷단이다. 그래서 함수를 합쳐도 외부 서비스에 등록된 값과 무관하다.
 * ⚠ 반대로 말하면, 앱 콜백 경로를 바꿀 때는 **외부 콘솔도 함께** 고쳐야 한다(그건 이 파일 밖의 일).
 *
 * ## 계약
 * 🔴 분기 키는 **`surface` 쿼리 파라미터**다(`Proxy`·`SeoHtml` 과 같은 규칙). 본문(body)으로
 * 추론하지 않는다 — 두 제공자의 body 모양이 `{ code, state }` 로 **같아서** 추론이 불가능하다.
 * ⚠ 메서드는 POST 이고 본문은 JSON 이다. rewrite 는 메서드·본문을 그대로 넘긴다.
 * 🔴 **공개 URL 은 그대로다.** `vercel.json` rewrite 가 `/api/kakao-auth` → `?surface=kakao` 로 보낸다.
 *    앱 코드(`shared/lib/community/*Auth.ts`)를 손대지 않는다.
 * ⚠ `vercel.json` 과 **한 벌**이다. 한쪽만 바꾸면 로그인이 통째로 죽는다.
 * ⚠ 각 핸들러는 자기 파일에 그대로 남는다(테스트도 그 모듈을 직접 부른다). 이 파일은 **배선만** 한다.
 */
type Surface = 'kakao' | 'naver';

const ROUTES: Record<Surface, (request: Request) => Promise<Response>> = {
  kakao: kakaoHandler,
  naver: naverHandler
};

const isSurface = (value: string | null): value is Surface => value !== null && value in ROUTES;

export async function handler(request: Request): Promise<Response> {
  const surface = new URL(request.url).searchParams.get('surface');

  if (isSurface(surface)) return ROUTES[surface](request);

  /*
   * 모르는 지면 — rewrite 와 이 파일이 어긋났다는 뜻이다. 로그인 경로라 **본문에 단서를 남기지
   * 않는다**(제공자 목록·env 유무 같은 것을 흘리지 않는다). 캐시도 하지 않는다.
   */
  return new Response(JSON.stringify({ error: 'unknown surface' }), {
    status: 404,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

/** ⚠ Vercel 이 실제로 호출하는 진입점. 어댑터를 벗기면 무응답으로 되돌아간다. */
export default toNodeHandler(handler);
