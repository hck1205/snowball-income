/**
 * 시장 기사의 **주가 계산**(2026-11-24, 2026-11-25 분리) — 일봉 받기 · 하루 등락률 · 초안 대조 · 주제 후보.
 *
 * 시장 기사에서 숫자가 틀릴 수 있는 곳은 여기뿐이다. 그래서 등락률은 언제나 이 파일의 `changeOn` 하나로 계산한다
 * — 후보를 고를 때(`pickMoveCandidates`)와 발행 전에 대조할 때(`verifyPriceMoves`) 같은 함수를 써야
 * "후보에 적힌 값을 옮겼는데 대조에서 떨어지는" 일이 없다.
 */

export type MarketPriceMove = {
  readonly ticker: string;
  /** 등락이 일어난 거래일(미국 시장, YYYY-MM-DD). */
  readonly date: string;
  /** 그날 종가의 전일 종가 대비 등락률(%). 예: 12.3, -4.5 */
  readonly changePercent: number;
};

/** 우리 계산과 초안의 등락률 차이 허용치(%p). 반올림·시간외 차이를 덮을 만큼만. */
export const PRICE_TOLERANCE = 0.3;

export const daysBetween = (from: string, to: string): number => (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;

export type DailyClose = { readonly date: string; readonly close: number };

/** 그날 종가의 전일 대비 등락률(%). 그날 또는 전일 종가가 없으면 null. */
export const changeOn = (closes: readonly DailyClose[], date: string): { change: number; close: number } | null => {
  const sorted = [...closes].sort((a, b) => a.date.localeCompare(b.date));
  const index = sorted.findIndex((row) => row.date === date);
  if (index <= 0) return null;
  const today = sorted[index]!;
  const before = sorted[index - 1]!;
  return { change: (today.close / before.close - 1) * 100, close: today.close };
};

export type VerifiedMove = MarketPriceMove & { readonly close: number; readonly actualPercent: number };

/** 초안의 주가 등락을 일봉으로 대조한다. 하나라도 다르거나 확인할 수 없으면 오류. */
export const verifyPriceMoves = (
  moves: readonly MarketPriceMove[],
  closesByTicker: Readonly<Record<string, readonly DailyClose[] | null>>
): { readonly verified: VerifiedMove[]; readonly errors: string[] } => {
  const verified: VerifiedMove[] = [];
  const errors: string[] = [];
  for (const move of moves) {
    const closes = closesByTicker[move.ticker];
    const actual = closes ? changeOn(closes, move.date) : null;
    if (!actual) {
      errors.push(`주가 확인 불가: ${move.ticker} ${move.date}(그날 거래 기록이 없다)`);
      continue;
    }
    if (Math.abs(actual.change - move.changePercent) > PRICE_TOLERANCE) {
      errors.push(`주가 등락 불일치: ${move.ticker} ${move.date} 초안 ${move.changePercent}% / 실제 ${actual.change.toFixed(2)}%`);
      continue;
    }
    verified.push({ ...move, close: actual.close, actualPercent: Math.round(actual.change * 100) / 100 });
  }
  return { verified, errors };
};

// ── 주제 후보(프로그램, 2026-11-24) ──────────────────────────────────────────
//
// 루틴(LLM)이 "요즘 무엇이 크게 움직였나"를 스스로 찾고 등락률을 옮겨 적으면, 찾기는 비싸고 숫자는 틀린다
// (검사에서 걸려 그 회차가 통째로 날아간다). 그래서 **무엇이 움직였는지와 얼마나 움직였는지는 코드가 정하고**,
// 루틴은 후보 중 하나를 골라 "왜 움직였나"를 취재해 쓰는 일만 한다. 후보의 등락률은 그대로 priceMoves 에 옮긴다.

/** 후보로 보는 최소 하루 등락(절댓값 %). 대형주·배당주가 이만큼 움직이면 대개 이유가 보도된다. */
export const CANDIDATE_MIN_MOVE = 4;
/** 최근 몇 거래일을 볼까. 화·금 아침에 쓰므로 직전 사흘이면 지난 회차 이후를 덮는다. */
export const CANDIDATE_TRADING_DAYS = 3;
/** 같은 종목을 다시 다루지 않는 기간(일). 대장의 market-news 회차를 본다. */
export const CANDIDATE_COOLDOWN_DAYS = 30;

export type MoveCandidate = { readonly ticker: string; readonly date: string; readonly changePercent: number; readonly close: number };

/**
 * 종목별 일봉 → 최근 거래일들의 큰 등락 후보(절댓값 큰 순). 종목마다 가장 큰 하루 하나만.
 * `recentlyCovered` 에 있는 종목은 뺀다(최근에 이미 기사로 다뤘다).
 */
export const pickMoveCandidates = (
  closesByTicker: Readonly<Record<string, readonly DailyClose[] | null>>,
  recentlyCovered: ReadonlySet<string>,
  { minMove = CANDIDATE_MIN_MOVE, tradingDays = CANDIDATE_TRADING_DAYS, limit = 8 } = {}
): MoveCandidate[] => {
  const candidates: MoveCandidate[] = [];
  for (const [ticker, closes] of Object.entries(closesByTicker)) {
    if (!closes || recentlyCovered.has(ticker)) continue;
    const sorted = [...closes].sort((a, b) => a.date.localeCompare(b.date));
    let best: MoveCandidate | null = null;
    for (const row of sorted.slice(-tradingDays)) {
      const move = changeOn(sorted, row.date);
      if (!move || Math.abs(move.change) < minMove) continue;
      const rounded = Math.round(move.change * 100) / 100;
      if (!best || Math.abs(rounded) > Math.abs(best.changePercent)) best = { ticker, date: row.date, changePercent: rounded, close: move.close };
    }
    if (best) candidates.push(best);
  }
  return candidates.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, limit);
};

/** Yahoo 차트 엔드포인트는 열쇠가 필요 없지만 브라우저 같은 UA 가 없으면 거절한다(`yahooProvider.ts` 와 같은 값). */
const YAHOO_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

type YahooChartResult = {
  readonly timestamp?: number[];
  readonly meta?: {
    readonly exchangeTimezoneName?: string;
    /** 마지막 시세 시각(초). */
    readonly regularMarketTime?: number;
    readonly currentTradingPeriod?: { readonly regular?: { readonly start?: number; readonly end?: number } };
  };
  readonly indicators?: { readonly quote?: { readonly close?: (number | null)[] }[] };
};

/**
 * **끝난 거래일만** 남긴다(2026-11-25). 장이 열려 있는 동안 Yahoo 일봉의 마지막 줄은 "오늘 지금까지"의 값이라,
 * 그대로 쓰면 아직 끝나지 않은 하루의 등락이 후보·대조에 들어간다(실측: 장중 NVDA 마지막 줄이 -7%).
 * 마지막 시세 시각이 오늘 정규장 마감 전이고 마지막 줄이 오늘 장이면 그 줄을 뺀다.
 */
export const completedSessions = (result: YahooChartResult | undefined): { stamps: number[]; closes: (number | null)[] } => {
  const stamps = [...(result?.timestamp ?? [])];
  const closes = [...(result?.indicators?.quote?.[0]?.close ?? [])];
  const session = result?.meta?.currentTradingPeriod?.regular;
  const lastQuote = result?.meta?.regularMarketTime;
  const lastStamp = stamps.at(-1);
  const sessionOpen = session?.start !== undefined && session.end !== undefined && lastQuote !== undefined && lastQuote < session.end;
  if (sessionOpen && lastStamp !== undefined && lastStamp >= session!.start!) {
    stamps.pop();
    closes.pop();
  }
  return { stamps, closes };
};

/**
 * 최근 1개월 일봉 종가. 실패하면 null(검사가 "확인 불가"로 거부한다 — 확인 못 한 숫자는 발행하지 않는다).
 * 날짜는 거래소 현지 날짜(미국 동부)로 바꾼다 — UTC 로 자르면 장 마감 뒤 시각이 다음 날로 넘어간다.
 * 아직 끝나지 않은 오늘 장은 뺀다(`completedSessions`).
 */
export const fetchDailyCloses = async (ticker: string, fetchImpl: typeof fetch = fetch): Promise<DailyClose[] | null> => {
  try {
    const response = await fetchImpl(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1mo`, {
      headers: { 'User-Agent': YAHOO_UA }
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { chart?: { result?: YahooChartResult[] } };
    const result = data.chart?.result?.[0];
    const { stamps, closes } = completedSessions(result);
    const zone = result?.meta?.exchangeTimezoneName ?? 'America/New_York';
    const toLocalDate = (seconds: number): string =>
      new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(seconds * 1000));
    const rows = stamps.flatMap((stamp, index) => {
      const close = closes[index];
      return typeof close === 'number' && Number.isFinite(close) ? [{ date: toLocalDate(stamp), close }] : [];
    });
    return rows.length ? rows : null;
  } catch {
    return null;
  }
};
