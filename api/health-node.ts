/**
 * 진단 3차 — **Node 런타임 + import 0** 대조군.
 *
 * 지금까지 확인된 것:
 *   - `api/health.ts`(Edge, import 0) → **200**. Edge 런타임과 웹 표준 시그니처는 정상.
 *   - 나머지 `api/*`(Node, `@/` alias import 다수) → **0.4초 만에 FUNCTION_INVOCATION_FAILED**.
 *     무응답(60초)이 아니라 **즉시 실패**라는 게 핵심이다 — 핸들러가 실행되기도 전에,
 *     즉 **모듈 로드 단계에서 죽는다**는 뜻이다(호출 규약 문제라면 무응답이어야 한다).
 *
 * 가장 유력한 용의자는 **`@/` alias 런타임 미해석**이다. Vercel 은 타입체크에는 tsconfig `paths` 를
 * 쓰지만 함수 번들러가 같은 alias 를 푼다는 보장이 없다(`middleware.ts` 상단에 Edge 쪽 동일 사고 기록).
 *
 * 이 파일은 그 변수를 **하나만 남긴 대조군**이다:
 *   - Node 런타임(= `export const config` 없음)
 *   - **import 0** (어댑터조차 안 쓴다)
 *   - Node 네이티브 `(req, res)` 시그니처 — `res.end()` 를 직접 부르므로 무응답이 불가능하다
 *
 * 판정:
 *   - 200 → Node 런타임 자체는 멀쩡하다. 범인은 **import(=alias 해석)** 로 좁혀진다.
 *   - 500 → Node 런타임/빌드 설정 수준의 문제다(alias 와 무관).
 *
 * ⚠ 원인이 확정되면 이 파일과 `api/health.ts` 는 **둘 다 지운다**. 진단용이고 제품 기능이 아니다.
 */

/** Vercel 이 넘기는 Node 응답 객체 중 여기서 쓰는 표면만 구조적으로 선언한다(node 타입 의존 없음). */
type MinimalNodeResponse = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (chunk?: string) => void;
};

export default function handler(_request: unknown, response: MinimalNodeResponse): void {
  response.statusCode = 200;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('cache-control', 'no-store');
  response.end(
    JSON.stringify({
      ok: true,
      runtime: 'node',
      imports: 0,
      node: process.version
    })
  );
}
