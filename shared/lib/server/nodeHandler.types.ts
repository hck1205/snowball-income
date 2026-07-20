/**
 * Vercel **Node 런타임** 어댑터의 구조적 타입들.
 *
 * `node:http` 의 `IncomingMessage`/`ServerResponse` 를 직접 import 하지 않는다 —
 * 이 모듈은 `shared/` 에 살아 `tsconfig.app.json`(types: vite/client, vitest/globals — **node 타입 없음**)
 * 으로도 타입체크되기 때문이다. 그래서 필요한 표면만 구조적으로 선언한다.
 * Vercel 이 실제로 넘기는 객체(IncomingMessage / ServerResponse)는 이 표면의 상위집합이라 그대로 동작한다.
 */

/** `api/*` 가 유지하는 웹 표준 핸들러 시그니처. 테스트가 이걸 직접 호출한다. */
export type WebHandler = (request: Request) => Promise<Response> | Response;

export type NodeIncomingHeaders = Record<string, string | string[] | undefined>;

/** Node `IncomingMessage` 중 어댑터가 읽는 부분만. */
export interface NodeRequestLike {
  method?: string;
  /** Node 는 경로+쿼리만 준다(`/api/og?s=x`). 절대 URL 조립은 `resolveRequestUrl` 이 한다. */
  url?: string;
  headers: NodeIncomingHeaders;
  /**
   * Vercel Node 헬퍼가 **이미 파싱해 둔** 본문(JSON → object, text → string).
   * 이게 있으면 스트림은 이미 소비된 상태이므로 스트림을 읽지 않는다.
   */
  body?: unknown;
  /** 스트림이 이미 끝났는지 — 둘 중 하나라도 true 면 스트림 읽기를 건너뛴다(무한 대기 방지). */
  readableEnded?: boolean;
  complete?: boolean;
  socket?: { encrypted?: boolean };
  on?: (event: string, listener: (chunk?: unknown) => void) => unknown;
}

/** Node `ServerResponse` 중 어댑터가 쓰는 부분만. */
export interface NodeResponseLike {
  statusCode: number;
  statusMessage?: string;
  setHeader: (name: string, value: string | string[]) => unknown;
  end: (chunk?: unknown) => unknown;
}

/** Vercel Node 런타임이 실제로 호출하는 시그니처. 각 `api/*` 의 `export default` 가 이 타입이다. */
export type NodeHandler = (req: NodeRequestLike, res: NodeResponseLike) => Promise<void>;
