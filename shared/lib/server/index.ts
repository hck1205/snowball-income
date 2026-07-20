/**
 * Vercel 서버리스(Node 런타임) 공용 유틸 배럴.
 *
 * - nodeHandler : 웹 표준 `(Request) => Response` 핸들러를 Node `(req, res)` 로 감싸는 어댑터.
 *                 `api/*` 6개가 전부 이걸 통해 `export default` 된다 — 벗기면 무응답 장애가 재발한다.
 */
export * from './nodeHandler';
export type * from './nodeHandler.types';
