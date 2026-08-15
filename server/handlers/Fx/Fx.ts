/*
  ⚠ og.tsx / sitemap.ts / post-list.ts 와 동일 규약: 모듈 스코프에서 `import.meta.env` 를 읽는 코드를
  끌고 오면 Vercel Node 런타임에서 함수가 즉사한다(모듈 평가 단계라 try/catch 로도 못 잡는다). 이 핸들러는
  앱 배럴을 일절 import 하지 않고 **키가 필요 없는 공개 환율 API 두 곳**만 fetch 한다 — supabase·env 의존이
  전혀 없다(순수 `@/shared/lib/server` 어댑터만 쓴다).
*/
import { toNodeHandler } from '@/shared/lib/server';
/* `numeric` 은 import 0개·`import.meta` 없음의 순수 모듈이라 위 규약을 깨지 않는다(번들러가 인라인한다). */
import { isFinitePositive } from '@/shared/lib/numeric';

/**
 * `/api/fx` — **표시 전용** 원↔달러 환율 프록시.
 *
 * ## 왜 서버 프록시인가
 * 위젯은 브라우저에서 직접 환율 API 를 부를 수도 있지만, ①CORS 무보장 ②API 키 노출 ③방문자 수만큼
 * upstream 을 때리는 문제가 있다. 서버가 대신 불러 **엣지 공유 캐시**에 얹으면 방문자가 아무리 많아도
 * upstream 은 하루 몇 번만 맞는다(아래 캐시 참고). 이 값은 **참고용**이라 시뮬레이션 계산에는 절대
 * 들어가지 않는다(위젯이 엔진에 아무것도 넘기지 않는다).
 *
 * ## 데이터 소스 (셋 다 무키·실호출 검증)
 *   1순위 Yahoo chart `KRW=X` (2026-07-27 실측) — `meta.regularMarketPrice`(당일) + `meta.chartPreviousClose`
 *          (전일 종가) + `meta.regularMarketTime`(unix초) 를 **한 응답**에 준다. ⚠ `User-Agent` 헤더 없이
 *          호출하면 거부당한다(scripts/tickerRefresh/provider/yahooProvider.ts 와 동일 제약).
 *   폴백1 open.er-api.com (exchangerate-api free) — `result:'success'` + `rates.KRW` + `time_last_update_utc`.
 *   폴백2 frankfurter (ECB) — `rates.KRW` + `date`(YYYY-MM-DD). ⚠ `api.frankfurter.app` 은 301 리다이렉트라
 *          서버 fetch(리다이렉트 미추종 가능성)를 피해 신 도메인 `api.frankfurter.dev` 를 **직접** 부른다.
 *   셋 다 실패하면 **가짜 환율을 지어내지 않는다** — 에러 JSON(502) + no-store 로 정직하게 실패한다.
 *
 * ## 왜 Yahoo 가 1순위인가 (전일 종가를 함께 받으려고)
 *   1. **변동률의 두 값(당일·전일)은 같은 출처·같은 스냅샷이어야 한다.** er-api 의 당일값과 Yahoo 의 전일값을
 *      섞으면 공급자 간 상시 오차(mid-market vs close, 0.1~0.3%p)가 하루치 변동폭과 같은 자릿수라 **없는 변동을
 *      지어내게 된다** — 이 레포의 "관측값과 가정을 섞지 않는다 · 지어낸 숫자 0" 원칙에 정면으로 어긋난다.
 *   2. 이 레포는 **이미 Yahoo chart API 에 의존**한다(티커 시세·배당 갱신 파이프라인 전체) — 새 벤더 의존이 아니다.
 *   3. Yahoo 가 실패해도 기존 두 공급자가 그대로 살아 있어 가용성은 오히려 3중이 된다. 폴백이 이기면 전일 종가가
 *      없고 → **변동률만 생략**된다(부분 실패 허용, 환율 자체는 정상).
 *   ⚠ Yahoo chart 는 비공식 API 라 SLA 가 없다 — 형태가 어긋나면 아래 가드가 전부 null 로 떨어뜨려 폴백을 태운다.
 *
 * ## 지연시간: Yahoo 와 er-api 는 **병렬**(worst case 8초 유지)
 * 순차로 끼우면 4초 x 3 = 12초가 되어 함수 한도에 위험하다. 그래서 1순위·폴백1 을 `Promise.allSettled` 로
 * 동시에 쏘고, 폴백2(frankfurter)만 그 뒤에 순차로 붙인다 → worst case 4 + 4 = 8초로 **기존과 동일**하다.
 * 병렬이라 매 오리진 조회마다 upstream 호출이 1건 늘지만, 아래 6시간 엣지 캐시 때문에 오리진 조회 자체가
 * 하루 4~5회뿐이라(24h / 6h = 4회 + SWR 재검증 여유) 늘어나는 절대량이 무시할 만하다.
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

/**
 * 성공 응답 계약. `asOf` 는 **API 가 준 실제 갱신 시각의 ISO** 다(오늘 날짜로 위장하지 않는다).
 *
 * ⚠ 클라이언트 타입 `FxRate`(shared/lib/fx)와 형태가 같아야 하지만 **여기서 그 배럴을 import 하지 않는다** —
 * 앱 배럴을 끌어오면 모듈 스코프의 `import.meta.env` 때문에 Vercel Node 런타임에서 즉사한다(파일 상단 규약).
 * 서버는 자기 타입을 자기가 갖고, 정합은 이 주석과 `test/api/fx.test.ts` 의 계약 테스트로 못 박는다.
 */
type FxSuccess = {
  rate: number;
  base: 'USD';
  quote: 'KRW';
  asOf: string;
  /**
   * 전일 종가. **없을 수 있다**(전일 종가를 주지 않는 폴백 공급자가 이겼을 때) → 그 경우 `undefined` 를 값으로
   * 넣지 않고 **키 자체를 생략**한다. 값은 유한한 양수일 때만 싣는다.
   */
  previousClose?: number;
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

/** RFC2822/ISO 등 Date 가 파싱 가능한 문자열 → ISO. 파싱 불가면 null(as-of 를 지어내지 않는다). */
const toIso = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.length === 0) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

/** unix 초(Yahoo `regularMarketTime`) → ISO. 숫자가 아니거나 비정상이면 null. */
const toIsoFromUnixSeconds = (value: unknown): string | null => {
  if (!isFinitePositive(value)) return null;
  const parsed = new Date(value * 1000);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

/** 객체면 레코드로, 아니면 null. 신뢰할 수 없는 응답을 한 단계씩 파고들 때 쓴다. */
const readRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;

/** 지정 URL 을 JSON 으로 읽는다. 네트워크 장애·비200·비JSON 은 전부 null(폴백을 태운다). */
const fetchJson = async (url: string, headers?: Record<string, string>): Promise<unknown | null> => {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      ...(headers ? { headers } : {})
    });
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

/** Yahoo chart 는 브라우저 같은 UA 가 없으면 요청을 거부한다(yahooProvider.ts 와 동일한 상수). */
const YAHOO_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

/** `KRW=X` = USD/KRW. `range=2d` 는 전일 종가를 포함하는 최소 창(응답 자체가 `chartPreviousClose` 를 준다). */
const YAHOO_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/KRW=X?range=2d&interval=1d';

/**
 * 1순위: Yahoo chart. **당일 환율과 전일 종가를 한 스냅샷으로** 준다(두 번째 요청 불필요).
 * as-of 는 `meta.regularMarketTime`(unix초) — 없거나 비정상이면 as-of 를 지어내지 않고 통째로 폴백한다.
 * `chartPreviousClose` 만 없는 경우는 **부분 성공**이라 rate 는 그대로 쓰고 전일 종가 키만 생략한다.
 */
const fromYahoo = async (): Promise<FxSuccess | null> => {
  const data = await fetchJson(YAHOO_URL, { 'User-Agent': YAHOO_USER_AGENT });

  const chart = readRecord(readRecord(data)?.chart);
  const results = chart?.result;
  const meta = readRecord(readRecord(Array.isArray(results) ? results[0] : undefined)?.meta);
  if (meta === null) return null;

  const rate = meta.regularMarketPrice;
  const asOf = toIsoFromUnixSeconds(meta.regularMarketTime);
  if (!isFinitePositive(rate) || asOf === null) return null;

  const previousClose = meta.chartPreviousClose;
  if (!isFinitePositive(previousClose)) return { rate, base: BASE, quote: QUOTE, asOf };

  return { rate, base: BASE, quote: QUOTE, asOf, previousClose };
};

/** 폴백1: open.er-api.com. `result:'success'` 를 요구하고 as-of 는 `time_last_update_utc`. */
const fromErApi = async (): Promise<FxSuccess | null> => {
  const data = await fetchJson('https://open.er-api.com/v6/latest/USD');
  if (!data || typeof data !== 'object') return null;
  if ((data as Record<string, unknown>).result !== 'success') return null;

  const krw = readKrw(data);
  const asOf = toIso((data as Record<string, unknown>).time_last_update_utc);
  if (!isFinitePositive(krw) || asOf === null) return null;

  return { rate: krw, base: BASE, quote: QUOTE, asOf };
};

/** 폴백2: frankfurter(ECB). as-of 는 `date`(YYYY-MM-DD). */
const fromFrankfurter = async (): Promise<FxSuccess | null> => {
  const data = await fetchJson('https://api.frankfurter.dev/v1/latest?base=USD&symbols=KRW');
  const krw = readKrw(data);
  const asOf = toIso(data && typeof data === 'object' ? (data as Record<string, unknown>).date : undefined);
  if (!isFinitePositive(krw) || asOf === null) return null;

  return { rate: krw, base: BASE, quote: QUOTE, asOf };
};

/** `allSettled` 결과에서 값만 꺼낸다(거부는 폴백 대상이라 null 로 눕힌다). */
const settledValue = (result: PromiseSettledResult<FxSuccess | null>): FxSuccess | null =>
  result.status === 'fulfilled' ? result.value : null;

/** 웹 표준 핸들러 — `test/api/fx.test.ts` 가 `handler(new Request(...))` 로 직접 호출한다. */
export async function handler(_request: Request): Promise<Response> {
  // 1순위(Yahoo)와 폴백1(er-api)은 **병렬** — 순차로 쌓으면 worst case 가 12초가 된다(상단 "지연시간" 참고).
  const [yahooSettled, erApiSettled] = await Promise.allSettled([fromYahoo(), fromErApi()]);
  const yahoo = settledValue(yahooSettled);
  const erApi = settledValue(erApiSettled);

  // 채택 순서: ①전일 종가까지 완비된 Yahoo → ②er-api(rate only) → ③전일 종가 없는 Yahoo(rate only)
  // → ④frankfurter(그때만 추가 4초를 쓴다).
  const result =
    (yahoo?.previousClose === undefined ? null : yahoo) ?? erApi ?? yahoo ?? (await fromFrankfurter());

  if (result === null) {
    // 전부 실패 → 가짜 환율 금지. 502 + no-store(엣지에 실패를 박제하지 않는다).
    return jsonResponse({ error: 'fx_unavailable' }, 502, CACHE_FAILURE);
  }

  return jsonResponse(result, 200, CACHE_SUCCESS);
}

/** ⚠ Vercel 이 실제로 호출하는 진입점. 어댑터를 벗기면 무응답으로 되돌아간다(sitemap.ts 근거). */
export default toNodeHandler(handler);
