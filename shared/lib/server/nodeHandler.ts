import type {
  NodeHandler,
  NodeIncomingHeaders,
  NodeRequestLike,
  NodeResponseLike,
  WebHandler
} from './nodeHandler.types';

/**
 * 웹 표준 핸들러(`(Request) => Response`)를 **Vercel Node 런타임 시그니처**(`(req, res)`)로 감싸는 어댑터.
 *
 * ## 왜 이게 필요한가 (지우면 프로덕션이 다시 죽는다)
 * `api/*` 에 `export const config = { runtime: 'edge' }` 가 없으면 Vercel 은 그 함수를 **Node 런타임**으로
 * 배포하고 Node 스타일 `(req, res)` 로 호출한다. 그런데 우리 핸들러는 웹 표준 `(Request) => Response` 라
 * **`res.end()` 가 영원히 안 불린다** → Vercel 이 응답을 기다리다 타임아웃. 로직이 0인 진단 함수
 * (`api/health.ts`)조차 60초 무응답이었던 것이 실측 증거다. `api/*` 6개가 전부 같은 규약이라 전멸했고,
 * 그 결과 공유 링크 OG 미리보기·OG 이미지가 **조용히** 깨져 있었다(크롤러는 실패를 표면화하지 않는다).
 *
 * ## 왜 Edge 로 안 가고 어댑터인가
 * Edge 런타임은 웹 표준 시그니처가 네이티브지만, **Edge 번들러가 tsconfig `paths`(`@/`)를 해석하지 못한다**
 * (middleware.ts 상단 주석 참고). `api/*` 는 `@/shared/lib/og`·`@/pages/Main/...` 를 통해 앱 코드를 깊게
 * 재사용하므로 상대경로 전환의 전이 범위가 앱 전반이 된다 — 실제로 시도했다가 빌드가 깨졌다.
 * 그래서 **Node 런타임을 유지**(=`@/` alias 정상 해석)하고 시그니처만 여기서 맞춘다.
 *
 * ## 그래서 각 `api/*` 의 모양
 * - 웹 표준 핸들러는 **named export `handler`** 로 유지한다(`test/api/*` 30여 개가 이걸 직접 호출한다).
 * - `export default` 는 `toNodeHandler(handler)` 다. **이 default 를 웹 표준 함수로 되돌리지 말 것.**
 */

/** 헤더 값이 배열(중복 헤더)일 수 있으므로 첫 값만, 콤마 목록이면 그 첫 항목만 취한다. */
const firstHeaderValue = (headers: NodeIncomingHeaders, name: string): string | undefined => {
  const raw = headers[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') return undefined;
  const first = value.split(',')[0]?.trim();
  return first && first.length > 0 ? first : undefined;
};

/**
 * Node 가 주는 경로(`/api/og?s=x`)를 **절대 URL** 로 승격한다.
 * `new URL(request.url)` 로 origin 을 읽는 핸들러(share-html·post-html·og·sitemap 전부)가 있어 필수다.
 */
export const resolveRequestUrl = (req: NodeRequestLike): string => {
  const raw = req.url && req.url.length > 0 ? req.url : '/';
  if (/^https?:\/\//i.test(raw)) return raw;

  const host = firstHeaderValue(req.headers, 'x-forwarded-host') ?? firstHeaderValue(req.headers, 'host') ?? 'localhost';
  const proto =
    firstHeaderValue(req.headers, 'x-forwarded-proto') ?? (req.socket?.encrypted === true ? 'https' : 'http');

  return new URL(raw, `${proto}://${host}`).toString();
};

/** Node 헤더 맵 → 웹 `Headers`. 배열 값은 append 로 다중 헤더를 보존한다. */
export const toWebHeaders = (headers: NodeIncomingHeaders): Headers => {
  const web = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) web.append(name, entry);
      continue;
    }
    web.append(name, value);
  }
  return web;
};

/**
 * 수집한 조각을 하나의 `ArrayBuffer` 로 합친다.
 * `Uint8Array` 가 아니라 ArrayBuffer 를 돌려주는 이유: TS 5.7 부터 `Uint8Array` 가 제네릭이라
 * `Uint8Array<ArrayBufferLike>` 는 DOM 의 `BodyInit` 에 대입되지 않는다(SharedArrayBuffer 가능성 때문).
 * ArrayBuffer 는 모호함 없이 BodyInit 이다.
 */
const concatChunks = (chunks: Uint8Array[]): ArrayBuffer => {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged.buffer;
};

const toChunk = (raw: unknown): Uint8Array | undefined => {
  if (raw instanceof Uint8Array) return raw;
  if (typeof raw === 'string') return new TextEncoder().encode(raw);
  return undefined;
};

/**
 * Vercel Node 헬퍼가 이미 파싱해 둔 `req.body` 를 전송 가능한 형태로 되돌린다.
 * 우리 POST 소비처(naver-auth·account-delete)는 전부 `application/json` 이라 object → JSON 직렬화가 정확하다.
 */
const serializeParsedBody = (body: unknown): string | ArrayBuffer | undefined => {
  if (body === undefined || body === null) return undefined;
  if (body instanceof Uint8Array) return body.byteLength > 0 ? new Uint8Array(body).buffer : undefined;
  if (typeof body === 'string') return body.length > 0 ? body : undefined;
  if (typeof body === 'object') return JSON.stringify(body);
  return String(body);
};

/**
 * 요청 본문을 읽는다. 순서가 중요하다:
 *   1) `req.body`(Vercel 이 이미 파싱) → 그걸 쓴다. 이 경우 스트림은 이미 소비돼 다시 읽으면 **영원히 안 끝난다**.
 *   2) 스트림이 이미 끝났으면(`readableEnded`/`complete`) 읽지 않는다.
 *   3) 그 외에는 data/end 이벤트로 수집.
 */
export const readNodeRequestBody = async (req: NodeRequestLike): Promise<string | ArrayBuffer | undefined> => {
  const parsed = serializeParsedBody(req.body);
  if (parsed !== undefined) return parsed;

  if (req.readableEnded === true || req.complete === true) return undefined;
  if (typeof req.on !== 'function') return undefined;

  const chunks = await new Promise<Uint8Array[]>((resolve, reject) => {
    const collected: Uint8Array[] = [];
    req.on?.('data', (chunk) => {
      const encoded = toChunk(chunk);
      if (encoded) collected.push(encoded);
    });
    req.on?.('end', () => resolve(collected));
    req.on?.('error', (error) => reject(error instanceof Error ? error : new Error(String(error))));
  });

  const merged = concatChunks(chunks);
  return merged.byteLength > 0 ? merged : undefined;
};

/** 응답 본문을 바이트로 받는다 — 텍스트/바이너리(og PNG)/스트림을 한 경로로 처리한다. */
const readResponseBytes = async (response: Response): Promise<Uint8Array> => {
  return new Uint8Array(await response.arrayBuffer());
};

/** Node `(req, res)` → 웹 표준 `Request`. GET/HEAD 는 본문을 달 수 없다(undici가 throw). */
export const toWebRequest = async (req: NodeRequestLike): Promise<Request> => {
  const method = (req.method ?? 'GET').toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const body = hasBody ? await readNodeRequestBody(req) : undefined;

  return new Request(resolveRequestUrl(req), {
    method,
    headers: toWebHeaders(req.headers),
    ...(body === undefined ? {} : { body })
  });
};

/**
 * `set-cookie` 는 유일하게 **다중 값이 합쳐지면 안 되는** 헤더다(`Headers.get` 은 콤마로 join 하는데
 * `Expires=Wed, 09 Jun ...` 안에도 콤마가 있어 되돌릴 수 없다). undici 의 `getSetCookie()` 를 우선 쓴다.
 */
export const readSetCookies = (headers: Headers): string[] => {
  const withGetter = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof withGetter.getSetCookie === 'function') return withGetter.getSetCookie();
  const single = headers.get('set-cookie');
  return single === null ? [] : [single];
};

/** 본문 없는 상태 코드 — content-length 를 붙이면 안 된다. */
const BODYLESS_STATUS = new Set([204, 304]);

/**
 * 웹 `Response` 를 Node `res` 에 쓰고 **반드시 종료**한다.
 * 본문은 `arrayBuffer()` 로 받아 텍스트/바이너리를 동일 경로로 처리한다
 * (`api/og` 의 `ImageResponse` 는 PNG 스트림이다 — 여기서 온전히 흘러야 한다).
 */
export const writeWebResponse = async (res: NodeResponseLike, response: Response): Promise<void> => {
  res.statusCode = response.status;

  const setCookies = readSetCookies(response.headers);
  response.headers.forEach((value, name) => {
    if (name.toLowerCase() === 'set-cookie') return;
    res.setHeader(name, value);
  });
  if (setCookies.length > 0) res.setHeader('set-cookie', setCookies);

  const payload = await readResponseBytes(response);
  if (!BODYLESS_STATUS.has(response.status)) res.setHeader('content-length', String(payload.byteLength));

  res.end(payload);
};

/**
 * 웹 표준 핸들러를 Node 핸들러로 감싼다.
 *
 * 핸들러가 던지더라도 **500 을 쓰고 반드시 `res.end()`** 한다 — 무응답(타임아웃)이 이번 장애의 본질이라
 * "실패해도 응답은 끝난다"가 이 어댑터의 최우선 계약이다.
 */
export const toNodeHandler = (webHandler: WebHandler): NodeHandler => {
  return async (req, res) => {
    try {
      const request = await toWebRequest(req);
      const response = await webHandler(request);
      await writeWebResponse(res, response);
    } catch (error) {
      console.error('[node-adapter] handler failed', error);
      try {
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.setHeader('cache-control', 'no-store');
        // ASCII 라 인코딩이 불필요하다 — Node `res.end` 는 문자열도 그대로 받는다.
        res.end(JSON.stringify({ error: 'internal_error' }));
      } catch {
        // 헤더가 이미 나갔거나 소켓이 닫힌 경우 — 그래도 소켓은 닫아야 한다.
        res.end();
      }
    }
  };
};
