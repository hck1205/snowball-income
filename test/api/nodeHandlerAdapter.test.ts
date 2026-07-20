import { describe, expect, it, vi } from 'vitest';
import { readSetCookies, resolveRequestUrl, toNodeHandler, toWebRequest } from '@/shared/lib/server';
import type { NodeRequestLike, NodeResponseLike } from '@/shared/lib/server';

/**
 * Node 어댑터 계약 테스트.
 *
 * ## 왜 이 스위트가 존재하나
 * 2026-07-20 프로덕션 장애의 본질은 "핸들러가 응답을 **끝내지 않는다**"였다 — `api/*` 6개가 웹 표준
 * `(Request) => Response` 인데 Vercel Node 런타임이 `(req, res)` 로 호출해 `res.end()` 가 영영 안 불렸고,
 * 크롤러만 조용히 실패해서 몇 주간 아무도 몰랐다. 그래서 이 스위트의 최우선 단정은 **"항상 end 된다"** 다.
 *
 * 나머지 4개(상태/헤더 전달, 텍스트·바이너리 본문, set-cookie 다중값)는 어댑터가 응답을 **손실 없이**
 * 옮긴다는 계약이다. 특히 바이너리는 `api/og` 의 PNG 경로라 텍스트 변환이 섞이면 카드가 깨진다.
 */

/** Node `ServerResponse` 를 대신하는 기록용 스텁 — end 호출 여부/횟수와 헤더를 그대로 남긴다. */
const createResponseSpy = () => {
  const headers: Array<[string, string | string[]]> = [];
  const record = {
    statusCode: 0,
    endCalls: 0,
    chunks: [] as Uint8Array[],
    headers,
    setHeader: (name: string, value: string | string[]) => {
      headers.push([name.toLowerCase(), value]);
    },
    // 실제 Node `res.end` 는 Uint8Array 와 문자열을 모두 받는다 — 스텁도 둘 다 받아 바이트로 정규화한다.
    end: (chunk?: unknown) => {
      record.endCalls += 1;
      if (typeof chunk === 'string') record.chunks.push(new TextEncoder().encode(chunk));
      else if (ArrayBuffer.isView(chunk)) {
        record.chunks.push(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
      }
    },
    header(name: string): string | string[] | undefined {
      return headers.find(([key]) => key === name.toLowerCase())?.[1];
    },
    body(): Uint8Array {
      return record.chunks[0] ?? new Uint8Array(0);
    },
    text(): string {
      return new TextDecoder().decode(record.body());
    }
  };
  return record;
};

const nodeRequest = (overrides: Partial<NodeRequestLike> = {}): NodeRequestLike => ({
  method: 'GET',
  url: '/api/thing?x=1',
  headers: { host: 'snowball.test' },
  // 본문 없는 요청은 스트림이 이미 끝난 상태다(어댑터가 여기서 멈추면 안 된다).
  readableEnded: true,
  ...overrides
});

/** 이벤트 기반 Node 요청 스트림 흉내 — data/end 를 마이크로태스크로 흘린다. */
const streamingRequest = (chunks: Array<string | Uint8Array>, overrides: Partial<NodeRequestLike> = {}) => {
  const listeners = new Map<string, (chunk?: unknown) => void>();
  return {
    method: 'POST',
    url: '/api/thing',
    headers: { host: 'snowball.test', 'content-type': 'application/json' },
    on: (event: string, listener: (chunk?: unknown) => void) => {
      listeners.set(event, listener);
      if (event !== 'end') return;
      queueMicrotask(() => {
        for (const chunk of chunks) listeners.get('data')?.(chunk);
        listeners.get('end')?.();
      });
    },
    ...overrides
  } satisfies NodeRequestLike;
};

describe('toNodeHandler — 응답은 반드시 종료된다 (이번 장애의 본질)', () => {
  it('정상 응답에서 res.end 가 정확히 한 번 호출된다', async () => {
    const res = createResponseSpy();
    await toNodeHandler(async () => new Response('ok'))(nodeRequest(), res);

    expect(res.endCalls).toBe(1);
  });

  it('핸들러가 던져도 500 을 쓰고 end 한다 (무응답 금지)', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = createResponseSpy();

    await toNodeHandler(async () => {
      throw new Error('boom');
    })(nodeRequest(), res);

    expect(res.endCalls).toBe(1);
    expect(res.statusCode).toBe(500);
    expect(res.text()).toContain('internal_error');
    consoleError.mockRestore();
  });

  it('핸들러가 Response 가 아닌 값을 줘도(계약 위반) 매달리지 않고 end 한다', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = createResponseSpy();

    await toNodeHandler((() => undefined) as never)(nodeRequest(), res);

    expect(res.endCalls).toBe(1);
    expect(res.statusCode).toBe(500);
    consoleError.mockRestore();
  });
});

describe('toNodeHandler — 상태 코드와 헤더를 그대로 전달한다', () => {
  it('상태 코드와 응답 헤더가 보존된다', async () => {
    const res = createResponseSpy();
    await toNodeHandler(
      async () =>
        new Response('<html></html>', {
          status: 404,
          headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
        })
    )(nodeRequest(), res);

    expect(res.statusCode).toBe(404);
    expect(res.header('content-type')).toBe('text/html; charset=utf-8');
    expect(res.header('cache-control')).toBe('no-store');
  });

  it('302 리다이렉트의 Location 이 살아 있다 (og/share-html 폴백 경로)', async () => {
    const res = createResponseSpy();
    await toNodeHandler(
      async () => new Response(null, { status: 302, headers: { Location: 'https://snowball.test/og-image.png' } })
    )(nodeRequest(), res);

    expect(res.statusCode).toBe(302);
    expect(res.header('location')).toBe('https://snowball.test/og-image.png');
    expect(res.endCalls).toBe(1);
  });

  it('본문 바이트 길이를 content-length 로 알려준다', async () => {
    const res = createResponseSpy();
    await toNodeHandler(async () => new Response('가나다'))(nodeRequest(), res);

    expect(res.header('content-length')).toBe('9'); // UTF-8 3바이트 × 3
  });
});

describe('toNodeHandler — 본문 전달 (텍스트 / 바이너리)', () => {
  it('텍스트 본문이 온전히 전달된다', async () => {
    const res = createResponseSpy();
    const html = '<html lang="ko"><meta property="og:title" content="스노우볼 · 배당 시뮬레이션" /></html>';
    await toNodeHandler(async () => new Response(html))(nodeRequest(), res);

    expect(res.text()).toBe(html);
  });

  it('바이너리(PNG) 본문이 바이트 단위로 동일하게 전달된다 — api/og 경로', async () => {
    // PNG 시그니처 + 텍스트로 변환하면 깨지는 널/고위 바이트.
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff, 0xfe, 0x80]);
    const res = createResponseSpy();

    await toNodeHandler(
      async () => new Response(png, { status: 200, headers: { 'content-type': 'image/png' } })
    )(nodeRequest(), res);

    expect(res.header('content-type')).toBe('image/png');
    expect(Array.from(res.body())).toEqual(Array.from(png));
  });

  it('ReadableStream 본문(ImageResponse.body 형태)도 전부 흘려보낸다', async () => {
    const png = new Uint8Array([0x89, 0x50, 0x00, 0xff]);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(png.slice(0, 2));
        controller.enqueue(png.slice(2));
        controller.close();
      }
    });
    const res = createResponseSpy();

    await toNodeHandler(async () => new Response(stream, { headers: { 'content-type': 'image/png' } }))(
      nodeRequest(),
      res
    );

    expect(Array.from(res.body())).toEqual(Array.from(png));
  });
});

describe('toNodeHandler — set-cookie 다중 값', () => {
  it('여러 개의 set-cookie 가 유실되지 않고 배열로 전달된다', async () => {
    const headers = new Headers({ 'content-type': 'text/plain' });
    // Expires 안의 콤마 때문에 단순 join/split 로는 복원이 불가능한 조합을 일부러 쓴다.
    headers.append('set-cookie', 'a=1; Path=/; Expires=Wed, 09 Jun 2027 10:18:14 GMT');
    headers.append('set-cookie', 'b=2; Path=/; HttpOnly');
    const res = createResponseSpy();

    await toNodeHandler(async () => new Response('ok', { headers }))(nodeRequest(), res);

    expect(res.header('set-cookie')).toEqual([
      'a=1; Path=/; Expires=Wed, 09 Jun 2027 10:18:14 GMT',
      'b=2; Path=/; HttpOnly'
    ]);
  });

  it('set-cookie 가 없으면 헤더 자체를 만들지 않는다', async () => {
    const res = createResponseSpy();
    await toNodeHandler(async () => new Response('ok'))(nodeRequest(), res);

    expect(res.header('set-cookie')).toBeUndefined();
  });

  it('readSetCookies 는 다중 값을 분해해 돌려준다', () => {
    const headers = new Headers();
    headers.append('set-cookie', 'x=1');
    headers.append('set-cookie', 'y=2');

    expect(readSetCookies(headers)).toEqual(['x=1', 'y=2']);
    expect(readSetCookies(new Headers())).toEqual([]);
  });
});

describe('resolveRequestUrl — Node 는 경로만 준다', () => {
  it('host 헤더로 절대 URL 을 조립한다 (핸들러가 new URL(request.url) 을 한다)', () => {
    expect(resolveRequestUrl(nodeRequest({ url: '/api/og?s=abc' }))).toBe('http://snowball.test/api/og?s=abc');
  });

  it('x-forwarded-proto / x-forwarded-host 를 우선한다 (Vercel 프록시)', () => {
    const url = resolveRequestUrl(
      nodeRequest({
        url: '/api/sitemap',
        headers: { host: 'internal.vercel', 'x-forwarded-host': 'snowball.im', 'x-forwarded-proto': 'https' }
      })
    );

    expect(url).toBe('https://snowball.im/api/sitemap');
  });

  it('콤마로 이어진 forwarded 값은 첫 항목만 쓴다', () => {
    const url = resolveRequestUrl(
      nodeRequest({ url: '/x', headers: { 'x-forwarded-host': 'a.test, b.test', 'x-forwarded-proto': 'https,http' } })
    );

    expect(url).toBe('https://a.test/x');
  });

  it('TLS 소켓이면 https 로 본다', () => {
    const url = resolveRequestUrl(nodeRequest({ url: '/x', headers: { host: 'a.test' }, socket: { encrypted: true } }));

    expect(url).toBe('https://a.test/x');
  });

  it('이미 절대 URL 이면 그대로 쓴다', () => {
    expect(resolveRequestUrl(nodeRequest({ url: 'https://given.test/api/og' }))).toBe('https://given.test/api/og');
  });
});

describe('toWebRequest — 요청 메서드 / 헤더 / POST 본문', () => {
  it('메서드와 요청 헤더가 전달된다', async () => {
    const request = await toWebRequest(
      nodeRequest({ method: 'POST', headers: { host: 'a.test', authorization: 'Bearer token-123' } })
    );

    expect(request.method).toBe('POST');
    expect(request.headers.get('authorization')).toBe('Bearer token-123');
  });

  it('스트림 POST 본문을 읽어 request.json() 이 동작한다 — naver-auth / account-delete', async () => {
    const request = await toWebRequest(streamingRequest(['{"code":"abc",', '"state":"xyz"}']));

    await expect(request.json()).resolves.toEqual({ code: 'abc', state: 'xyz' });
  });

  it('Vercel 이 이미 파싱한 req.body(object) 도 JSON 으로 복원한다', async () => {
    // 이 경우 스트림은 이미 소비돼 있다 — 다시 읽으려 하면 영원히 끝나지 않는다.
    const request = await toWebRequest(
      nodeRequest({ method: 'POST', body: { code: 'abc' }, readableEnded: true, complete: true })
    );

    await expect(request.json()).resolves.toEqual({ code: 'abc' });
  });

  it('req.body 가 문자열이면 그대로 실린다', async () => {
    const request = await toWebRequest(nodeRequest({ method: 'POST', body: '{"code":"raw"}' }));

    await expect(request.text()).resolves.toBe('{"code":"raw"}');
  });

  it('GET 에는 본문을 달지 않는다', async () => {
    const request = await toWebRequest(nodeRequest({ method: 'GET' }));

    expect(request.body).toBeNull();
  });

  it('본문 없는 POST 는 스트림 대기 없이 즉시 끝난다', async () => {
    const request = await toWebRequest(nodeRequest({ method: 'POST', complete: true }));

    await expect(request.text()).resolves.toBe('');
  });
});

describe('toNodeHandler — 요청이 핸들러까지 그대로 도달한다', () => {
  it('핸들러가 받는 Request 의 URL·메서드·본문이 Node 요청과 일치한다', async () => {
    const seen: { url?: string; method?: string; body?: unknown } = {};
    const res = createResponseSpy();

    const node: NodeResponseLike = res;
    await toNodeHandler(async (request) => {
      seen.url = request.url;
      seen.method = request.method;
      seen.body = await request.json();
      return new Response('ok');
    })(streamingRequest(['{"code":"c1"}'], { url: '/api/naver-auth' }), node);

    expect(seen.url).toBe('http://snowball.test/api/naver-auth');
    expect(seen.method).toBe('POST');
    expect(seen.body).toEqual({ code: 'c1' });
    expect(res.endCalls).toBe(1);
  });
});
