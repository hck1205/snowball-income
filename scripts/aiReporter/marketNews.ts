/**
 * AI 리포터 **시장 기사**(2026-11-24) — 화·금 주 2회, 루틴(LLM)이 주제를 골라 웹에서 취재해 쓴다.
 *
 * 다른 회차와 다른 점: 사실이 **우리 데이터가 아니라 바깥 보도**에서 온다. 그래서 사람이 검토하지 않고
 * 자동 공개하는 대신(사용자 결정) 아래 검사를 **전부** 통과해야만 발행한다. 하나라도 걸리면 발행하지 않는다.
 *
 *   1. 출처 3~8개, https, 서로 다른 매체 2곳 이상, 최근 10일 안 — 지어낸 사건을 거른다.
 *   2. **문단마다 출처 번호 [n]**, 숫자가 든 문장도 그 문장 안에 [n] — 출처 없는 주장을 거른다.
 *   3. 주가 등락(priceMoves)은 **Yahoo 일봉으로 다시 계산해 대조**(±0.3%p) — "급등했다"를 숫자로 검증한다.
 *      본문의 % 숫자는 검증된 등락이거나, 출처가 붙은 문장 안에 있어야 한다.
 *   4. 분위기·반응·감정 표현은 "~에 따르면 / 밝혔다 / 말했다" 같은 **인용 꼴 + 출처**일 때만 —
 *      "직원들이 들떠 있다" 같은 단정은 지어낸 이야기가 된다.
 *   5. 권유 · AI 지문 · 겪은 척 · 금지 비유는 다른 회차와 같은 목록으로 거른다(`rules.ts`).
 *
 * 표(주가 반응)와 출처 목록은 프로그램이 붙인다 — LLM 은 손대지 않는다.
 */
import { escapeHtml } from './html';
import { ADVICE_PATTERNS, AI_FINGERPRINTS, BRAND_BANNED, FAKE_EXPERIENCE, titleSimilarity, TITLE_SIMILARITY_LIMIT } from './rules';
import type { ReporterLedger } from './types';

export const MARKET_NEWS_TOPIC = 'market-news' as const;

export type MarketNewsSource = {
  /** 본문의 [n] 과 맞는 번호(1부터 차례로). */
  readonly id: number;
  readonly url: string;
  readonly publisher: string;
  readonly title: string;
  /** YYYY-MM-DD */
  readonly publishedAt: string;
};

export type MarketPriceMove = {
  readonly ticker: string;
  /** 등락이 일어난 거래일(미국 시장, YYYY-MM-DD). */
  readonly date: string;
  /** 그날 종가의 전일 종가 대비 등락률(%). 예: 12.3, -4.5 */
  readonly changePercent: number;
};

export type MarketNewsDraft = {
  /** `market-news:<YYYY-MM-DD>:<slug>` — 날짜는 작성일(KST), slug 는 영문 소문자·숫자·하이픈. */
  readonly factKey: string;
  readonly title: string;
  readonly description: string;
  /** 리드 — 무슨 일이 있었나. 태그 p · strong · em · br. */
  readonly introHtml: string;
  /** 본문 — 소제목 h3 3~5개(무슨 일 · 영향 · 시장 반응 · 사람들의 말 · 같이 볼 것 등). */
  readonly bodyHtml: string;
  readonly sources: readonly MarketNewsSource[];
  readonly priceMoves: readonly MarketPriceMove[];
  /** 기사가 다루는 종목(우리 /ticker 페이지 링크에 쓴다). */
  readonly tickers: readonly string[];
};

export const isMarketNewsKey = (factKey: string): boolean => factKey.startsWith(`${MARKET_NEWS_TOPIC}:`);

export const MARKET_INTRO_MIN = 120;
export const MARKET_INTRO_MAX = 600;
export const MARKET_BODY_MIN = 900;
export const MARKET_BODY_MAX = 3500;
export const MARKET_H3_MIN = 3;
export const MARKET_H3_MAX = 5;
export const MARKET_SOURCES_MIN = 3;
export const MARKET_SOURCES_MAX = 8;
export const MARKET_SOURCE_MAX_AGE_DAYS = 10;
/** 우리 계산과 초안의 등락률 차이 허용치(%p). 반올림·시간외 차이를 덮을 만큼만. */
export const PRICE_TOLERANCE = 0.3;

const INTRO_TAGS = new Set(['p', 'strong', 'em', 'br']);
const BODY_TAGS = new Set(['h3', 'p', 'strong', 'em', 'br', 'ul', 'li']);

/** 분위기 · 반응 · 감정 — 단정하면 지어낸 이야기가 되는 말들. 인용 꼴일 때만 쓴다. */
const MOOD_WORDS = /분위기|반응|기대감|우려|들떠|들뜬|침울|환호|충격|불안|자신감|사기가|술렁|동요|낙관|비관/;
const ATTRIBUTION = /따르면|밝혔|말했|전했|보도|인용|언급|발표|설명했|평가했|답했|썼다|적었/;
const CITATION = /\[(\d+)\]/g;

const tagsOf = (html: string): string[] =>
  [...html.matchAll(/<\s*\/?\s*([a-zA-Z][a-zA-Z0-9]*)/g)].map((match) => match[1]!.toLowerCase());
const stripTags = (html: string): string => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/** 문단(p · li) 단위 텍스트. */
const blocksOf = (html: string): string[] =>
  [...html.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => stripTags(match[2]!)).filter(Boolean);

/** 문장 단위 — 마침표·물음표·느낌표 뒤 공백, 또는 "다." 꼴 끝. 숫자 속 마침표(3.5)는 자르지 않는다. */
export const sentencesOf = (text: string): string[] =>
  text
    .split(/(?<=[.!?。])\s+(?=\S)/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const citedIds = (text: string): number[] => [...text.matchAll(CITATION)].map((match) => Number(match[1]));

const daysBetween = (from: string, to: string): number => (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;

const hostOf = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ? parsed.hostname.replace(/^www\./, '') : null;
  } catch {
    return null;
  }
};

/** 숫자 토큰(쉼표 제거). 출처 번호 [n] 은 뺀다. */
const numbersIn = (sentence: string): string[] =>
  (sentence.replace(CITATION, ' ').match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((token) => token.replace(/,/g, ''));

/** "12.3%" 처럼 % 가 붙은 숫자. */
const percentsIn = (sentence: string): number[] =>
  [...sentence.replace(CITATION, ' ').matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map((match) => Number(match[1]));

export type MarketNewsCheck = { readonly ok: boolean; readonly errors: readonly string[] };

/**
 * 초안 검사(순수). `today` 는 KST 날짜(YYYY-MM-DD). 주가 대조는 따로(`verifyPriceMoves`, 네트워크).
 */
export const checkMarketNewsDraft = (draft: MarketNewsDraft, ledger: ReporterLedger, today: string): MarketNewsCheck => {
  const errors: string[] = [];
  const key = /^market-news:(\d{4}-\d{2}-\d{2}):([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(draft.factKey);
  if (!key) errors.push(`factKey 형식: market-news:<YYYY-MM-DD>:<영문-slug> — 받은 값 ${draft.factKey}`);
  else if (Math.abs(daysBetween(key[1]!, today)) > 2) errors.push(`factKey 날짜(${key[1]})가 오늘(${today})과 2일 넘게 차이 난다`);

  const title = draft.title.trim();
  if (title.length < 6 || title.length > 60) errors.push(`제목 길이 ${title.length}자 — 6~60자`);
  if (!draft.description.trim() || draft.description.length > 120) errors.push(`요약 길이 ${draft.description.length}자 — 1~120자`);

  const intro = stripTags(draft.introHtml);
  const body = stripTags(draft.bodyHtml);
  if (intro.length < MARKET_INTRO_MIN || intro.length > MARKET_INTRO_MAX) errors.push(`리드 ${intro.length}자 — ${MARKET_INTRO_MIN}~${MARKET_INTRO_MAX}자`);
  if (body.length < MARKET_BODY_MIN || body.length > MARKET_BODY_MAX) errors.push(`본문 ${body.length}자 — ${MARKET_BODY_MIN}~${MARKET_BODY_MAX}자`);
  const h3 = tagsOf(draft.bodyHtml).filter((tag) => tag === 'h3').length / 2;
  if (h3 < MARKET_H3_MIN || h3 > MARKET_H3_MAX) errors.push(`본문 소제목(h3) ${h3}개 — ${MARKET_H3_MIN}~${MARKET_H3_MAX}개`);
  for (const tag of tagsOf(draft.introHtml)) if (!INTRO_TAGS.has(tag)) errors.push(`리드에 허용되지 않은 태그 <${tag}>`);
  for (const tag of tagsOf(draft.bodyHtml)) if (!BODY_TAGS.has(tag)) errors.push(`본문에 허용되지 않은 태그 <${tag}>`);

  // 1. 출처
  const sources = draft.sources ?? [];
  if (sources.length < MARKET_SOURCES_MIN || sources.length > MARKET_SOURCES_MAX) {
    errors.push(`출처 ${sources.length}개 — ${MARKET_SOURCES_MIN}~${MARKET_SOURCES_MAX}개`);
  }
  sources.forEach((source, index) => {
    if (source.id !== index + 1) errors.push(`출처 번호는 1부터 차례로 — ${index + 1}번째가 [${source.id}]`);
    if (!hostOf(source.url)) errors.push(`출처 [${source.id}] 주소가 https 가 아니다: ${source.url}`);
    if (!source.publisher?.trim() || !source.title?.trim()) errors.push(`출처 [${source.id}] 매체명·제목이 비었다`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.publishedAt ?? '')) errors.push(`출처 [${source.id}] 날짜 형식(YYYY-MM-DD)`);
    else {
      const age = daysBetween(source.publishedAt, today);
      if (age < -1) errors.push(`출처 [${source.id}] 날짜가 미래다: ${source.publishedAt}`);
      if (age > MARKET_SOURCE_MAX_AGE_DAYS) errors.push(`출처 [${source.id}] 가 ${Math.round(age)}일 전 — ${MARKET_SOURCE_MAX_AGE_DAYS}일 안의 보도만`);
    }
  });
  const hosts = new Set(sources.map((source) => hostOf(source.url)).filter(Boolean));
  if (hosts.size < 2) errors.push(`출처 매체가 ${hosts.size}곳 — 서로 다른 매체 2곳 이상`);
  if ([...hosts].some((host) => host!.includes('hungry-hippo'))) errors.push('우리 사이트는 출처가 될 수 없다');

  // 2. 문단마다 출처 번호, 숫자 문장마다 출처 번호
  const validIds = new Set(sources.map((source) => source.id));
  const blocks = [...blocksOf(draft.introHtml), ...blocksOf(draft.bodyHtml)];
  const used = new Set<number>();
  const verifiedPercents = (draft.priceMoves ?? []).map((move) => Math.abs(move.changePercent));
  for (const block of blocks) {
    const ids = citedIds(block);
    ids.forEach((id) => used.add(id));
    if (ids.length === 0) errors.push(`출처 번호가 없는 문단: "${block.slice(0, 40)}…"`);
    for (const id of ids) if (!validIds.has(id)) errors.push(`없는 출처 번호 [${id}]`);
    for (const sentence of sentencesOf(block)) {
      const hasCitation = citedIds(sentence).length > 0;
      const numbers = numbersIn(sentence).filter((token) => Number(token) > 12); // 0~12 작은 정수는 개수·달
      const percents = percentsIn(sentence);
      const percentsVerified = percents.every((value) => verifiedPercents.some((ok) => Math.abs(ok - value) <= PRICE_TOLERANCE));
      if (numbers.length > 0 && !hasCitation && !(percents.length > 0 && percentsVerified)) {
        errors.push(`숫자가 있는데 출처 번호가 없는 문장: "${sentence.slice(0, 50)}…"`);
      }
      // 4. 분위기·반응은 인용 꼴 + 출처
      if (MOOD_WORDS.test(sentence) && !(ATTRIBUTION.test(sentence) && hasCitation)) {
        errors.push(`분위기·반응 표현은 "~에 따르면/밝혔다" 같은 인용과 출처 번호가 함께 있어야 한다: "${sentence.slice(0, 50)}…"`);
      }
    }
  }
  for (const id of validIds) if (!used.has(id)) errors.push(`본문에서 한 번도 쓰지 않은 출처 [${id}]`);

  // 3. 주가 등락 형식(실제 값 대조는 verifyPriceMoves)
  for (const move of draft.priceMoves ?? []) {
    if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(move.ticker)) errors.push(`주가 등락 종목 기호 형식: ${move.ticker}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(move.date)) errors.push(`주가 등락 날짜 형식: ${move.date}`);
    if (!Number.isFinite(move.changePercent)) errors.push(`주가 등락률이 숫자가 아니다: ${move.ticker}`);
  }

  // 5. 표현
  const everything = `${title}\n${draft.description}\n${intro}\n${body}`;
  for (const [label, patterns] of [
    ['투자 권유 표현', ADVICE_PATTERNS],
    ['AI 지문', AI_FINGERPRINTS],
    ['금지 비유', BRAND_BANNED],
    ['지어낸 경험', FAKE_EXPERIENCE]
  ] as const) {
    for (const pattern of patterns) {
      const hit = everything.replace(CITATION, '').match(pattern);
      if (hit) errors.push(`${label}: "${hit[0].trim()}"`);
    }
  }

  // 중복
  if (ledger.entries.some((entry) => entry.factKey === draft.factKey)) errors.push(`이미 발행한 회차: ${draft.factKey}`);
  for (const entry of ledger.entries) {
    const similarity = titleSimilarity(title, entry.title);
    if (similarity >= TITLE_SIMILARITY_LIMIT) errors.push(`기존 글과 제목이 비슷하다(${Math.round(similarity * 100)}%): "${entry.title}"`);
  }

  return { ok: errors.length === 0, errors };
};

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

/** 대장에서 최근 `days` 일 안에 market-news 로 다룬 종목(초안 tickers 를 대장에 남긴다). */
export const recentlyCoveredTickers = (ledger: ReporterLedger, today: string, days = CANDIDATE_COOLDOWN_DAYS): Set<string> =>
  new Set(
    ledger.entries
      .filter((entry) => entry.topic === MARKET_NEWS_TOPIC && daysBetween(entry.publishedAt.slice(0, 10), today) <= days)
      .flatMap((entry) => entry.tickers ?? [])
  );

/** Yahoo 차트 엔드포인트는 열쇠가 필요 없지만 브라우저 같은 UA 가 없으면 거절한다(`yahooProvider.ts` 와 같은 값). */
const YAHOO_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

/**
 * 최근 1개월 일봉 종가. 실패하면 null(검사가 "확인 불가"로 거부한다 — 확인 못 한 숫자는 발행하지 않는다).
 * 날짜는 거래소 현지 날짜(미국 동부)로 바꾼다 — UTC 로 자르면 장 마감 뒤 시각이 다음 날로 넘어간다.
 */
export const fetchDailyCloses = async (ticker: string, fetchImpl: typeof fetch = fetch): Promise<DailyClose[] | null> => {
  try {
    const response = await fetchImpl(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1mo`, {
      headers: { 'User-Agent': YAHOO_UA }
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      chart?: { result?: { timestamp?: number[]; meta?: { exchangeTimezoneName?: string }; indicators?: { quote?: { close?: (number | null)[] }[] } }[] };
    };
    const result = data.chart?.result?.[0];
    const stamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
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

const signed = (value: number): string => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
const shortDate = (date: string): string => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

/**
 * 본문 조립 — 리드 → 주가 반응 표(검증된 값) → 본문 → 종목 링크 → 출처 목록.
 * 본문의 [n] 은 그대로 둔다(출처 목록 번호와 맞는다).
 */
export const composeMarketNews = (
  draft: MarketNewsDraft,
  verified: readonly VerifiedMove[],
  /** 티커 → 우리 종목 페이지 slug. 페이지가 있는 종목만 링크한다. */
  tickerPages: ReadonlyMap<string, string>
): string => {
  const table = verified.length
    ? `<h3>주가 반응</h3><table><tbody><tr><th>종목</th><th>날짜</th><th>등락률</th><th>종가</th></tr>${verified
        .map(
          (move) =>
            `<tr><td>${escapeHtml(move.ticker)}</td><td>${shortDate(move.date)}</td><td>${signed(move.actualPercent)}</td><td>${move.close.toFixed(2)}</td></tr>`
        )
        .join('')}</tbody></table>`
    : '';
  // 절대 주소 — 게시판 정화 규칙이 http(s) 가 아닌 href 를 지운다(`shared/lib/richtext/sanitize.ts`).
  const tickerLinks = draft.tickers.flatMap((ticker) => {
    const slug = tickerPages.get(ticker);
    return slug ? [`<a href="https://hungry-hippo.xyz/ticker/${encodeURIComponent(slug)}">${escapeHtml(ticker)} 종목 정보</a>`] : [];
  });
  const links = tickerLinks.length ? `<p>${tickerLinks.join(' · ')}</p>` : '';
  const sources = `<h3>출처</h3><ul>${draft.sources
    .map(
      (source) =>
        `<li>[${source.id}] <a href="${escapeHtml(source.url)}">${escapeHtml(source.publisher)} — ${escapeHtml(source.title)}</a> (${escapeHtml(source.publishedAt)})</li>`
    )
    .join('')}</ul>`;
  const note = '<p><em>주가 등락은 Yahoo Finance 일봉 종가로 다시 계산해 확인한 값입니다. 사건 서술은 위 출처의 보도를 따랐습니다.</em></p>';
  return [draft.introHtml.trim(), table, draft.bodyHtml.trim(), links, sources, note].filter(Boolean).join('');
};
