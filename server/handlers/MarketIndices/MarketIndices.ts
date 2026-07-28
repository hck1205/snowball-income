/*
  ⚠ Fx.ts / og.tsx / sitemap.ts 와 동일 규약: 모듈 스코프에서 `import.meta.env` 를 읽는 코드를 끌고 오면
  Vercel Node 런타임에서 함수가 즉사한다(모듈 평가 단계라 try/catch 로도 못 잡는다). 이 핸들러가 import 하는
  것은 어댑터(`@/shared/lib/server`)와 **완전 순수한** 레지스트리/계약(`@/shared/lib/marketIndices`) 둘뿐이다
  — 후자는 React·env·다른 배럴 의존이 0 이고, 그 사실을 `test/api/marketIndices.test.ts` 가 기계적으로 지킨다.
  (심볼 목록을 서버가 따로 갖는 대안 대신 공용 레지스트리를 고른 이유: 지수를 늘릴 때 서버·클라이언트·표시
  부품 세 곳이 조용히 어긋나는 쪽이 더 위험하다. 순수성은 테스트로 못 박을 수 있지만 목록 표류는 못 잡는다.)
*/
import {
  MARKET_INDEX_SYMBOLS,
  type MarketIndexQuote,
  type MarketIndexSymbol,
  type MarketIndicesSnapshot
} from '@/shared/lib/marketIndices';
import { toNodeHandler } from '@/shared/lib/server';

/**
 * `/api/market-indices` — **표시 전용** 주요 지수(현재가 + 전일 종가) 프록시.
 *
 * ## 왜 서버 프록시인가 (Fx.ts 와 같은 근거)
 * 브라우저가 직접 부를 수도 있지만 ①CORS 무보장 ②방문자 수만큼 upstream 을 때리는 문제가 있다.
 * 서버가 대신 불러 **엣지 공유 캐시**에 얹으면 방문자가 아무리 많아도 upstream 조회는 캐시 주기당 1회다.
 * 이 값은 참고 시세라 시뮬레이션 계산에는 절대 들어가지 않는다.
 *
 * ## 데이터 소스 (2026-07 실호출 검증, 무키)
 * `query1.finance.yahoo.com/v8/finance/chart/<심볼>?range=2d&interval=1d` 의 `meta` 한 덩어리로
 * 현재가(`regularMarketPrice`)와 **전일 종가**(`chartPreviousClose`)를 함께 얻는다 — 심볼당 요청 1회면 된다.
 * ⚠ 브라우저 형태의 `User-Agent` 가 없으면 거부한다(scripts/tickerRefresh/provider/yahooProvider.ts 와 동일).
 * ⚠ 심볼의 `^` 는 URL 에서 `%5E` 로 인코딩해야 한다.
 * ⚠ **비공식 API 라 SLA 가 없고 응답 형태가 예고 없이 바뀔 수 있다** — 파싱은 전부 방어적으로,
 *    형태가 어긋나면 그 심볼만 버리고 나머지는 살린다.
 *
 * ## 런타임: Node.js — `toNodeHandler` 어댑터 필수
 * 웹 표준 `handler` 를 그대로 default export 하면 `res.end()` 가 없어 무응답 타임아웃이 된다(sitemap.ts 근거).
 *
 * ## 라우팅
 * `api/market-indices.js` 파일이 곧 `/api/market-indices` 경로다(Vercel 은 rewrite 보다 파일시스템을 먼저 조회).
 *
 * ## 캐시 (= ISR)
 *   - **성공 `s-maxage=900`(15분)**: FX 는 6시간이지만 환율과 달리 **지수는 장중에 계속 움직인다** →
 *     훨씬 짧아야 한다. 15분을 고른 근거는 용도다 — 랜딩의 **참고 시세 스트립**이지 트레이딩 도구가 아니다.
 *     "장중에 움직이는 느낌"은 충분히 주면서 upstream(비공식 API) 부담을 하루 96회 × 5심볼 = 480 요청으로
 *     묶는다(5분이면 1,440 요청/일인데 이 용도에서 얻는 신선도 차이가 그 비용만큼 크지 않다).
 *     장이 닫힌 시간엔 값이 안 움직이므로 15분은 **상한**이지 낭비가 아니다.
 *   - **부분 성공 `s-maxage=300`(5분)**: 빠진 심볼이 15분간 엣지에 박제되면 안 된다 — 완전본보다 짧게 잡아
 *     빠른 자가치유를 택한다.
 *   - `stale-while-revalidate=86400`(24h): upstream 이 흔들려도 하루 동안 마지막 성공본을 즉시 서빙하고
 *     뒤에서 갱신한다(신선도보다 가용성 우선 — FX 와 같은 판단).
 *   - 전부 실패(502)는 `no-store`: 실패를 엣지에 박제하지 않는다(다음 요청이 곧바로 재시도).
 */

const CHART_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

/** Yahoo chart 엔드포인트는 무인증이지만 브라우저 형태의 UA 가 없는 요청을 거부한다. */
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const CACHE_SUCCESS = 'public, max-age=0, s-maxage=900, stale-while-revalidate=86400';
const CACHE_PARTIAL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400';
const CACHE_FAILURE = 'no-store';

/** upstream 이 매달리면 함수가 통째로 매달리지 않게 심볼마다 짧은 타임아웃을 건다(FX 와 동일). */
const UPSTREAM_TIMEOUT_MS = 4000;

const jsonResponse = (body: unknown, status: number, cache: string): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache }
  });

const isFinitePositive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null;

/** Unix 초 → ISO. 값이 이상하면 `null`(시각을 지어내지 않는다). */
const toIsoFromUnixSeconds = (value: unknown): string | null => {
  if (!isFinitePositive(value)) return null;
  const parsed = new Date(value * 1000);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

/**
 * chart 응답에서 한 지수의 시세를 뽑는다. 현재가가 없으면 그 심볼은 실패로 친다.
 * 전일 종가·통화·시각은 **있을 때만** 싣는다(없으면 키 자체를 생략 — 변동률은 클라이언트가 생략한다).
 */
const readQuote = (symbol: MarketIndexSymbol, data: unknown): MarketIndexQuote | null => {
  const chart = asRecord(asRecord(data)?.chart);
  if (chart === null) return null;
  if (chart.error !== null && chart.error !== undefined) return null;
  if (!Array.isArray(chart.result)) return null;

  const meta = asRecord(asRecord(chart.result[0])?.meta);
  if (meta === null) return null;
  if (!isFinitePositive(meta.regularMarketPrice)) return null;

  const quote: MarketIndexQuote = { symbol, price: meta.regularMarketPrice };
  if (isFinitePositive(meta.chartPreviousClose)) quote.previousClose = meta.chartPreviousClose;
  if (typeof meta.currency === 'string' && meta.currency.length > 0) quote.currency = meta.currency;

  const asOf = toIsoFromUnixSeconds(meta.regularMarketTime);
  if (asOf !== null) quote.asOf = asOf;

  return quote;
};

/** 심볼 하나를 조회한다. 네트워크 장애·비200·비JSON·형태 이상은 전부 `null`(그 심볼만 빠진다). */
const fetchQuote = async (symbol: MarketIndexSymbol): Promise<MarketIndexQuote | null> => {
  // `^` 는 URL 예약문자가 아니지만 인코딩하지 않으면 upstream 이 심볼을 못 찾는다 → `%5E`.
  const url = `${CHART_BASE_URL}/${encodeURIComponent(symbol)}?range=2d&interval=1d`;

  try {
    const response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, accept: 'application/json' },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    });
    if (!response.ok) return null;
    return readQuote(symbol, await response.json());
  } catch {
    return null;
  }
};

/** 웹 표준 핸들러 — `test/api/marketIndices.test.ts` 가 `handler(new Request(...))` 로 직접 호출한다. */
export async function handler(_request: Request): Promise<Response> {
  /*
    5심볼을 **병렬**로 조회한다. 순차면 최악의 경우 5 × 4초 = 20초라 Vercel 함수 실행 한도에 닿는다.
    `fetchQuote` 는 스스로 삼키므로 reject 되지 않지만, upstream 하나의 예외가 전체를 죽이지 않도록
    `allSettled` 로 한 겹 더 감싼다.
  */
  const settled = await Promise.allSettled(MARKET_INDEX_SYMBOLS.map(fetchQuote));

  const indices = settled.flatMap((result) =>
    result.status === 'fulfilled' && result.value !== null ? [result.value] : []
  );

  if (indices.length === 0) {
    // 전부 실패 → 가짜 시세 금지. 502 + no-store(엣지에 실패를 박제하지 않는다).
    return jsonResponse({ error: 'market_indices_unavailable' }, 502, CACHE_FAILURE);
  }

  /*
    **부분 성공도 200 이다** — 하나라도 성공하면 성공한 것만 싣는다(모르면 비운다, 날조하지 않는다).
    빠진 심볼은 키 자체가 없고, `requested` 와의 차이로 클라이언트가 결손을 알 수 있다.
  */
  const body: MarketIndicesSnapshot = {
    asOf: new Date().toISOString(),
    requested: MARKET_INDEX_SYMBOLS,
    indices
  };

  const isComplete = indices.length === MARKET_INDEX_SYMBOLS.length;
  return jsonResponse(body, 200, isComplete ? CACHE_SUCCESS : CACHE_PARTIAL);
}

/** ⚠ Vercel 이 실제로 호출하는 진입점. 어댑터를 벗기면 무응답으로 되돌아간다(sitemap.ts 근거). */
export default toNodeHandler(handler);
