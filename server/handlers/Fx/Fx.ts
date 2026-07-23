/*
  ⚠ og.tsx / sitemap.ts / post-list.ts 와 동일 규약: 모듈 스코프에서 `import.meta.env` 를 읽는 코드를
  끌고 오면 Vercel Node 런타임에서 함수가 즉사한다(모듈 평가 단계라 try/catch 로도 못 잡는다). 이 핸들러는
  앱 배럴을 일절 import 하지 않고 **키가 필요 없는 공개 환율 API 두 곳**만 fetch 한다 — supabase·env 의존이
  전혀 없다(순수 `@/shared/lib/server` 어댑터만 쓴다).
*/
import { toNodeHandler } from '@/shared/lib/server';

/**
 * `/api/fx` — **표시 전용** 원↔달러 환율 프록시.
 *
 * ## 왜 서버 프록시인가
 * 위젯은 브라우저에서 직접 환율 API 를 부를 수도 있지만, ①CORS 무보장 ②API 키 노출 ③방문자 수만큼
 * upstream 을 때리는 문제가 있다. 서버가 대신 불러 **엣지 공유 캐시**에 얹으면 방문자가 아무리 많아도
 * upstream 은 하루 몇 번만 맞는다(아래 캐시 참고). 이 값은 **참고용**이라 시뮬레이션 계산에는 절대
 * 들어가지 않는다(위젯이 엔진에 아무것도 넘기지 않는다).
 *
 * ## 데이터 소스 (둘 다 무키·2026-07 실호출 검증)
 *   1순위 open.er-api.com (exchangerate-api free) — `result:'success'` + `rates.KRW` + `time_last_update_utc`.
 *   폴백  frankfurter (ECB) — `rates.KRW` + `date`(YYYY-MM-DD). ⚠ `api.frankfurter.app` 은 301 리다이렉트라
 *          서버 fetch(리다이렉트 미추종 가능성)를 피해 신 도메인 `api.frankfurter.dev` 를 **직접** 부른다.
 *   둘 다 실패하면 **가짜 환율을 지어내지 않는다** — 에러 JSON(502) + no-store 로 정직하게 실패한다.
 *
 * ## 런타임: Node.js — `toNodeHandler` 어댑터 필수 (sitemap.ts 와 동일 근거)
 * 웹 표준 `handler` 를 그대로 default export 하면 `res.end()` 가 없어 무응답 타임아웃이 된다.
 *
 * ## 라우팅
 * `api/fx.js` 파일이 곧 `/api/fx` 경로다. Vercel 은 rewrite 보다 **파일시스템을 먼저** 조회하므로
 * (vercel.json 의 catch-all `/(.*)→/index.html` 보다 앞선다) 별도 rewrite 가 필요 없다(og.js 와 동일).
 *
 * ## 캐시(= ISR, 무제한 사용의 근거)
 *   - `s-maxage=21600`(6h): 환율은 하루 한두 번만 갱신되는 참고 지표라 6시간 신선도로 충분하다. 방문자
 *     트래픽과 무관하게 upstream 조회를 6시간당 1회로 묶는다.
 *   - `stale-while-revalidate=86400`(24h): upstream 이 흔들려도 하루 동안은 마지막 성공본을 즉시 내보내고
 *     뒤에서 갱신한다(신선도보다 가용성 우선 — 위젯이 빈 실패 상태로 자주 빠지지 않게).
 *   - 실패 응답은 `no-store`: 실패를 엣지에 박제하지 않는다(다음 요청이 곧바로 재시도).
 */

/** 성공 응답 계약. `asOf` 는 **API 가 준 실제 갱신 시각의 ISO** 다(오늘 날짜로 위장하지 않는다). */
type FxSuccess = {
  rate: number;
  base: 'USD';
  quote: 'KRW';
  asOf: string;
};

const BASE = 'USD' as const;
const QUOTE = 'KRW' as const;

const CACHE_SUCCESS = 'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400';
const CACHE_FAILURE = 'no-store';

/** upstream 이 매달리면 함수가 통째로 매달리지 않게 각 소스에 짧은 타임아웃을 건다. */
const UPSTREAM_TIMEOUT_MS = 4000;

const jsonResponse = (body: unknown, status: number, cache: string): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache }
  });

const isFinitePositive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/** RFC2822/ISO 등 Date 가 파싱 가능한 문자열 → ISO. 파싱 불가면 null(as-of 를 지어내지 않는다). */
const toIso = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.length === 0) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

/** 지정 URL 을 JSON 으로 읽는다. 네트워크 장애·비200·비JSON 은 전부 null(폴백을 태운다). */
const fetchJson = async (url: string): Promise<unknown | null> => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

const readKrw = (data: unknown): unknown => {
  if (!data || typeof data !== 'object') return undefined;
  const rates = (data as Record<string, unknown>).rates;
  if (!rates || typeof rates !== 'object') return undefined;
  return (rates as Record<string, unknown>).KRW;
};

/** 1순위: open.er-api.com. `result:'success'` 를 요구하고 as-of 는 `time_last_update_utc`. */
const fromErApi = async (): Promise<FxSuccess | null> => {
  const data = await fetchJson('https://open.er-api.com/v6/latest/USD');
  if (!data || typeof data !== 'object') return null;
  if ((data as Record<string, unknown>).result !== 'success') return null;

  const krw = readKrw(data);
  const asOf = toIso((data as Record<string, unknown>).time_last_update_utc);
  if (!isFinitePositive(krw) || asOf === null) return null;

  return { rate: krw, base: BASE, quote: QUOTE, asOf };
};

/** 폴백: frankfurter(ECB). as-of 는 `date`(YYYY-MM-DD). */
const fromFrankfurter = async (): Promise<FxSuccess | null> => {
  const data = await fetchJson('https://api.frankfurter.dev/v1/latest?base=USD&symbols=KRW');
  const krw = readKrw(data);
  const asOf = toIso(data && typeof data === 'object' ? (data as Record<string, unknown>).date : undefined);
  if (!isFinitePositive(krw) || asOf === null) return null;

  return { rate: krw, base: BASE, quote: QUOTE, asOf };
};

/** 웹 표준 핸들러 — `test/api/fx.test.ts` 가 `handler(new Request(...))` 로 직접 호출한다. */
export async function handler(_request: Request): Promise<Response> {
  const result = (await fromErApi()) ?? (await fromFrankfurter());

  if (result === null) {
    // 둘 다 실패 → 가짜 환율 금지. 502 + no-store(엣지에 실패를 박제하지 않는다).
    return jsonResponse({ error: 'fx_unavailable' }, 502, CACHE_FAILURE);
  }

  return jsonResponse(result, 200, CACHE_SUCCESS);
}

/** ⚠ Vercel 이 실제로 호출하는 진입점. 어댑터를 벗기면 무응답으로 되돌아간다(sitemap.ts 근거). */
export default toNodeHandler(handler);
