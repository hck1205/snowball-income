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
/* `numeric` 은 import 0개·`import.meta` 없음의 순수 모듈이라 위 규약을 깨지 않는다(번들러가 인라인한다). */
import { isFinitePositive } from '@/shared/lib/numeric';

/**
 * `/api/market-indices` — **표시 전용** 주요 지수(현재가 + 전일 종가) 프록시.
 *
 * ## 왜 서버 프록시인가 (Fx.ts 와 같은 근거)
 * 브라우저가 직접 부를 수도 있지만 ①CORS 무보장 ②방문자 수만큼 upstream 을 때리는 문제가 있다.
 * 서버가 대신 불러 **엣지 공유 캐시**에 얹으면 방문자가 아무리 많아도 upstream 조회는 캐시 주기당 1회다.
 * 이 값은 참고 시세라 시뮬레이션 계산에는 절대 들어가지 않는다.
 *
 * ## 데이터 소스 (2026-07 실호출 검증, 무키)
 * `query1.finance.yahoo.com/v8/finance/chart/<심볼>?range=5d&interval=1d` 로 심볼당 요청 1회.
 * 현재가는 `meta.regularMarketPrice`, **전일 종가는 일별 종가 계열의 끝에서 두 번째**다.
 * 🔴 `meta.chartPreviousClose` 를 쓰지 마라 — 그건 "**요청한 range 직전**"의 종가라 range 에 따라 값이 바뀐다
 *    (`readPreviousClose` 주석의 2026-08-02 실측 표 참고).
 *
 * ⚠ `meta` 에 "전일 종가" 후보는 **`chartPreviousClose` 하나뿐**이다(2026-08-02 6심볼 전수 키 덤프 —
 *    `previousClose`·`regularMarketPreviousClose` 는 chart 응답에 아예 없다. 그 이름들은 v7 `quote`/
 *    `quoteSummary` 쪽 필드인데 그 둘은 이제 crumb 없이는 **401** 이라 쓸 수 없다).
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

import { handler as marketPulseHandler } from '../MarketPulse/MarketPulse';

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

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null;

/** Unix 초 → ISO. 값이 이상하면 `null`(시각을 지어내지 않는다). */
const toIsoFromUnixSeconds = (value: unknown): string | null => {
  if (!isFinitePositive(value)) return null;
  const parsed = new Date(value * 1000);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

/**
 * 🔴 **전일 종가는 `meta.chartPreviousClose` 가 아니라 일별 종가 계열에서 뽑는다.**
 *
 * `chartPreviousClose` 는 "**요청한 range 가 시작되기 직전**의 종가"다 — 같은 심볼이라도 range 를 바꾸면
 * 값이 바뀐다. 즉 그 필드 자체가 "전일"을 뜻하지 않는다. 2026-08-02 실측(같은 시각, range 만 교체):
 *
 * ```
 *   심볼      range=1d   range=2d   range=5d   ← 진짜 직전 세션(7/30) 종가
 *   ^GSPC     7437.63    7316.15    7411.98      7437.63
 *   ^IXIC    25122.178  24442.94   24975.82     25122.18
 *   ^KS11     5593.56    5663.24    6690.62      5593.56
 *   ^KQ11      644.78     662.68     748.22       644.78
 *   ^N225    61867.43   61867.43   64931.19     61867.43
 *   KRW=X     1421.34    1442.28    1458.01      1420.60
 * ```
 * 구현이 쓰던 `range=2d` 열은 ^N225 를 빼면 전부 **하루를 건너뛴 값**이다(^N225 만 우연히 맞아, 다섯 중
 * 하나가 맞는 바람에 결함이 더 늦게 드러났다). 화면 라벨은 "전일 대비"(`MARKET_INDEX_COPY.meta`)인데
 * 실제로는 2거래일 대비였다 — **라벨과 계산이 달랐던 것**이 결함이다.
 *
 * 🔴 **틀렸다는 증명(독립 출처, 2026-07-31 한국 증시)**
 * ```
 *   코스피  6,595.45   전일 대비 +1,001pt = +17.91%  (사상 최대 상승률)   ← 화면은 +16.46% 로 표시
 *   코스닥    719.76   전일 대비 +74.98pt = +11.63%  (역대 2위)          ← 화면은  +8.61% 로 표시
 * ```
 * (머니투데이 2026-07-31 보도. 우리 계산 6595.45/5593.56−1 = +17.909%, 719.76/644.78−1 = +11.628% 와 일치.)
 *
 * 🔴 **그래서 "비현실적 변동률이면 감춘다"는 크기 상한 가드를 두지 않는다.** 이 날 참값이 +17.91% 였고
 * 결함값이 +16.46% 로 **참값보다 작았다** — 결함을 잡을 만큼 낮은 상한은 사상 최대 상승률이라는 사실을
 * 먼저 지웠을 것이다. 크기로는 "틀림"과 "격변"을 가를 수 없다. 가드는 **크기가 아니라 날짜 짝짓기**에
 * 걸어야 한다(그게 `test/api/marketIndices.test.ts` 의 실응답 픽스처 가드다).
 *
 * ## 뽑는 규칙
 * 종가 배열의 **마지막 칸 바로 앞에서부터 뒤로 스캔**해 처음 만나는 유효 종가를 쓴다.
 * - 마지막 칸은 언제나 **가장 최근 세션**이고 그 종가가 곧 `regularMarketPrice` 다(장중이면 진행 중 가격,
 *   마감이면 그 세션 종가). 실측에서 6심볼 전부 마지막 칸 == `regularMarketPrice` 였다. 그래서 마지막을
 *   그대로 쓰면 **자기 자신과 비교**해 항상 0.00% 가 된다 — 반드시 그 앞이다.
 * - 중간의 `null`(휴장·결측)은 건너뛴다. 시장마다 거래일이 다른 문제(한국·일본·미국)가 이 방식이면
 *   함께 해소된다 — 창을 넓혀도 "직전 유효 종가" 판정은 같다.
 *
 * ⚠ **`filter` 후 `[length - 2]` 로 하지 마라.** 겉보기엔 같지만 **마지막 칸이 `null` 인 순간**
 * (장 시작 직후 진행 중 캔들에 종가가 아직 없는 형태) 걸러진 배열의 끝에서 두 번째가 **2세션 전**이 돼
 * 방금 고친 결함이 무음으로 되살아난다. 뒤로 스캔하면 그 경우에도 직전 세션 종가를 준다.
 * (이 형태는 2026-08-02 실측에선 관측되지 않았다 — 비공식 API 라 형태 변화에 방어적으로 간다.)
 *
 * ⚠ "마지막이 현재가와 같으면 하나 더 앞" 같은 **값 비교로 판정하지 마라** — 2026-08-02 실측에서
 * `7489.72`(meta) 와 `7489.72021484375`(계열)처럼 **부동소수 표현이 미세하게 달라** 판정이 빗나갔고,
 * 다섯 지수 전부 0.00% 로 찍혔다. 위치로 판정하는 것이 옳다.
 *
 * 🔗 **교차검증 오라클**: 같은 심볼을 `range=1d` 로 부르면 `meta.chartPreviousClose` 가 직전 세션 종가와
 * 같다(위 표 1열 — 지수 5종은 소수점까지 일치, `KRW=X` 만 24시간 통화라 컷오프가 달라 0.05% 차이).
 * 이 값이 여기서 뽑은 값과 어긋나면 upstream 형태가 바뀐 것이다.
 */
const readPreviousClose = (result: Record<string, unknown>): number | null => {
  const indicators = asRecord(result.indicators);
  const quoteSeries = Array.isArray(indicators?.quote) ? asRecord(indicators.quote[0]) : null;
  const closes = Array.isArray(quoteSeries?.close) ? quoteSeries.close : null;
  if (closes === null) return null;

  // 마지막 칸(= 가장 최근 세션 = 현재가)은 건너뛰고, 그 앞에서부터 처음 만나는 유효 종가를 쓴다.
  for (let index = closes.length - 2; index >= 0; index -= 1) {
    const close: unknown = closes[index];
    if (isFinitePositive(close)) return close;
  }
  return null;
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

  const result = asRecord(chart.result[0]);
  if (result === null) return null;
  const meta = asRecord(result.meta);
  if (meta === null) return null;
  if (!isFinitePositive(meta.regularMarketPrice)) return null;

  const quote: MarketIndexQuote = { symbol, price: meta.regularMarketPrice };
  const previousClose = readPreviousClose(result);
  if (previousClose !== null) quote.previousClose = previousClose;
  if (typeof meta.currency === 'string' && meta.currency.length > 0) quote.currency = meta.currency;

  const asOf = toIsoFromUnixSeconds(meta.regularMarketTime);
  if (asOf !== null) quote.asOf = asOf;

  return quote;
};

/** 심볼 하나를 조회한다. 네트워크 장애·비200·비JSON·형태 이상은 전부 `null`(그 심볼만 빠진다). */
const fetchQuote = async (symbol: MarketIndexSymbol): Promise<MarketIndexQuote | null> => {
  // `^` 는 URL 예약문자가 아니지만 인코딩하지 않으면 upstream 이 심볼을 못 찾는다 → `%5E`.
  // 🔴 `range=5d` — 2d 로는 휴장·시차가 낀 시장에서 **직전 유효 종가**가 창 밖으로 밀린다.
  //    (한국·일본·미국의 거래일이 서로 다르다.) 5거래일이면 연휴가 껴도 직전 종가가 창 안에 남는다.
  //    응답 크기 차이는 미미하고 요청 수는 그대로 심볼당 1회다.
  const url = `${CHART_BASE_URL}/${encodeURIComponent(symbol)}?range=5d&interval=1d`;

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

/**
 * 웹 표준 핸들러 — `test/api/marketIndices.test.ts` 가 `handler(new Request(...))` 로 직접 호출한다.
 *
 * ## 🔴 이 함수는 두 화면을 태운다
 *
 * `?surface=pulse` 면 **시장 온도**(`MarketPulse`)로 위임한다. 왜 함수를 따로 만들지 않았나:
 * Vercel Hobby 는 배포 함수 **12개가 상한**이고 이 레포는 이미 12개를 쓴다
 * (`test/api/functionBudget.test.ts` 가 그 상한을 잠근다 — 넘기면 배포가 실패한다).
 * 매니페스트 머리말이 "JSON 응답이 하나 더 필요하면 프록시들을 묶어라"고 예고한 수순이다.
 *
 * ⚠ 두 갈래는 **캐시 수명이 다르다**(지수 15분 / 온도 6시간). 각자 자기 응답에 헤더를 붙이므로
 *   섞이지 않는다 — 여기서 공통 헤더를 씌우지 마라.
 */
export async function handler(request: Request): Promise<Response> {
  if (new URL(request.url).searchParams.get('surface') === 'pulse') {
    return marketPulseHandler(request);
  }

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
