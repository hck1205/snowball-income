/**
 * `/api/market-indices` 조회 **계약** — 표시 전용.
 *
 * 서버 핸들러(`server/handlers/MarketIndices`)가 이 타입 그대로 응답을 만들고, 클라이언트 조회 계층
 * (`jotai/snowball/atoms/marketIndices`)이 `parseMarketIndicesSnapshot` 으로 되읽는다. 형태가 어긋나면
 * **값을 지어내지 않고** 떨어뜨린다.
 *
 * ⚠ 이 값은 참고 시세라 시뮬레이션 입력·저장 payload·공유 URL 어디에도 들어가지 않는다.
 */
import { isMarketIndexSymbol, type MarketIndexSymbol } from './registry';

/** 서버 프록시 경로. 엣지 공유 캐시가 있으므로 클라이언트는 그냥 매번 호출해도 된다. */
export const MARKET_INDICES_ENDPOINT = '/api/market-indices';

/**
 * 지수 한 종의 시세.
 * - `previousClose` 는 **없을 수 있다**(upstream 이 안 주거나 값이 이상한 경우) → 그 지수만 변동률 생략.
 * - `currency` / `asOf` 도 upstream 이 준 경우에만 실린다(둘 다 없어도 가격은 유효하다).
 */
export type MarketIndexQuote = {
  symbol: MarketIndexSymbol;
  price: number;
  previousClose?: number;
  /** upstream 이 알려준 통화 코드(USD/KRW/JPY …). */
  currency?: string;
  /** upstream 이 알려준 이 시세의 시각(ISO). 없으면 키가 없다 — 지어내지 않는다. */
  asOf?: string;
};

/**
 * `/api/market-indices` 성공 payload.
 *
 * `requested` 와 `indices` 의 **차이가 곧 부분 실패**다(빠진 심볼은 아예 키가 없다). 표시 부품은
 * `findMissingSymbols` 로 그 차이를 읽어 "일부 지수를 불러오지 못했습니다" 같은 표식을 낼 수 있다.
 */
export type MarketIndicesSnapshot = {
  /** 이 응답을 만든 시각(서버 시계, ISO). 지수별 시각은 각 항목의 `asOf` 다. */
  asOf: string;
  /** 서버가 조회를 **시도한** 심볼 목록(레지스트리 순서). */
  requested: readonly MarketIndexSymbol[];
  /** 실제로 값을 받아온 지수만. 최소 1개(0개면 서버가 502 로 응답한다). */
  indices: readonly MarketIndexQuote[];
};

/**
 * 지수 스트립의 화면 상태 4종 — 환율 위젯(`ExchangeRateView`)과 같은 모델이다.
 * - `loading`: 첫 조회 중.
 * - `success`: 최신 스냅샷.
 * - `stale`:   직전 성공값은 있으나 최근 갱신이 실패 — 값 + 옅은 갱신 실패 표식.
 * - `error`:   보여줄 값이 없음(가짜 시세 금지).
 */
export type MarketIndicesView =
  | { status: 'loading' }
  | { status: 'success'; snapshot: MarketIndicesSnapshot }
  | { status: 'stale'; snapshot: MarketIndicesSnapshot }
  | { status: 'error' };

/** 유한한 양수인지. 가격·전일 종가는 이 조건을 통과할 때만 값으로 인정한다. */
export const isFinitePositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const parseQuote = (value: unknown): MarketIndexQuote | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;

  const symbol = record.symbol;
  const price = record.price;
  if (!isMarketIndexSymbol(symbol)) return null;
  if (!isFinitePositiveNumber(price)) return null;

  const quote: MarketIndexQuote = { symbol, price };
  if (isFinitePositiveNumber(record.previousClose)) quote.previousClose = record.previousClose;
  if (typeof record.currency === 'string' && record.currency.length > 0) quote.currency = record.currency;
  if (typeof record.asOf === 'string' && record.asOf.length > 0) quote.asOf = record.asOf;
  return quote;
};

const parseRequested = (value: unknown): MarketIndexSymbol[] =>
  Array.isArray(value) ? value.filter(isMarketIndexSymbol) : [];

/**
 * 신뢰할 수 없는 `/api/market-indices` 응답을 스냅샷으로 정규화한다. 아래 중 하나라도면 `null`:
 * 객체가 아님 · `asOf` 가 비어 있음 · `indices` 가 배열이 아님 · 쓸 수 있는 지수가 0개.
 *
 * 개별 항목은 **방어적으로** 걸러진다 — 모르는 심볼·가격 이상·중복은 그 항목만 버리고 나머지는 살린다
 * (비공식 upstream 이라 응답 형태가 예고 없이 바뀔 수 있다).
 *
 * `requested` 가 없거나 알아볼 수 없으면 **받아온 심볼로 대체**한다 — "무엇이 빠졌는지 모른다"를
 * "빠진 게 없다"로 두는 쪽이, 없는 결손을 지어내는 것보다 정직하다.
 */
export const parseMarketIndicesSnapshot = (data: unknown): MarketIndicesSnapshot | null => {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;

  const asOf = record.asOf;
  if (typeof asOf !== 'string' || asOf.length === 0) return null;
  if (!Array.isArray(record.indices)) return null;

  const seen = new Set<MarketIndexSymbol>();
  const indices: MarketIndexQuote[] = [];
  for (const item of record.indices) {
    const quote = parseQuote(item);
    if (quote === null || seen.has(quote.symbol)) continue;
    seen.add(quote.symbol);
    indices.push(quote);
  }
  if (indices.length === 0) return null;

  const parsedRequested = parseRequested(record.requested);
  const requested = parsedRequested.length > 0 ? parsedRequested : indices.map((quote) => quote.symbol);

  return { asOf, requested, indices };
};

/** 조회를 시도했지만 값이 안 온 심볼(=부분 실패). 완전 성공이면 빈 배열. */
export const findMissingSymbols = (snapshot: MarketIndicesSnapshot): MarketIndexSymbol[] =>
  snapshot.requested.filter((symbol) => !snapshot.indices.some((quote) => quote.symbol === symbol));
