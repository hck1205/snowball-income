/**
 * 진단용 최소 서버리스 함수 — **의존성 0, 로직 0**.
 *
 * 프로덕션에서 `api/*` 전부가 `FUNCTION_INVOCATION_FAILED`(500)로 죽는 현상의 원인을 가르기 위한 것이다.
 * 이 함수가 200을 주면 플랫폼/런타임은 멀쩡하고 각 함수의 코드·의존성이 원인이며,
 * 이것마저 500이면 프로젝트 수준(런타임 설정·빌드·Node 버전)의 문제다.
 *
 * 기존 함수들과 **같은 핸들러 규약**(웹 표준 `Request` → `Response`, `export const config` 없음 = 기본 Node)을
 * 일부러 그대로 쓴다 — 규약 자체가 원인인지도 이 함수 하나로 판별하기 위해서다.
 */
/**
 * ⚠ 진단 2차 — **Edge 런타임 지정**.
 *
 * 1차(런타임 미지정 = Node)에서 이 함수는 60초 넘게 **응답 자체가 없었다**. 로직이 0인 함수가
 * 멈출 수 있는 경우는 하나뿐이다: Vercel이 Node 스타일 `(req, res)`로 호출하는데 우리 코드는
 * 웹 표준 `(Request) => Response`라 `res.end()`가 영원히 안 불리는 것. 그래서 응답을 기다리다 죽는다.
 * `api/*` 6개가 전부 같은 규약이라 전멸했다.
 *
 * Edge 런타임은 웹 표준 시그니처가 네이티브다. 이 한 줄로 200이 나오면 가설이 확정되고,
 * 나머지 함수도 같은 방식(또는 Node 스타일 `(req,res)`로 전환) 중 하나로 고치면 된다.
 */
export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  return new Response(
    JSON.stringify({
      ok: true,
      node: process.version,
      url: request.url,
      // env 이름만 노출한다(값 금지). 어떤 변수가 함수 런타임에 실제로 보이는지 확인용.
      envKeys: Object.keys(process.env)
        .filter((key) => key.startsWith('VITE_') || key === 'SITE_URL')
        .sort()
    }),
    { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } }
  );
}
