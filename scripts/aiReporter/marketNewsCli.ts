/**
 * 시장 기사 CLI 명령(2026-11-24, 2026-11-25 `cli.ts` 에서 분리) — `cli.ts` 가 부른다.
 *
 *   market-candidates : 종목 페이지가 있는 종목의 일봉 → 주제 후보 JSON(표준 출력). 워크플로가 ai-reporter 브랜치에 남긴다.
 *   check / publish   : factKey 가 `market-news:` 인 초안 — 검사 → 주가 대조 → (publish 면) 게시 · 대장 기록.
 *
 * ⚠ 배럴(`index.ts`)에 넣지 않는다 — `node:fs` 를 쓰므로 앱 tsconfig 로 타입체크되는 테스트가 깨진다(`cli.ts` 와 같은 규율).
 */
import { writeFileSync } from 'node:fs';
import process from 'node:process';
import { kstIsoDate, sendTelegram, telegramTargetFromEnv } from '../common';
import { TICKER_CONTENT_LIST } from '@/shared/constants/tickers';
import { checkMarketNewsDraft, composeMarketNews, MARKET_NEWS_TOPIC, recentlyCoveredTickers, type MarketNewsDraft } from './marketNews';
import { changeOn, fetchDailyCloses, pickMoveCandidates, verifyPriceMoves, type DailyClose } from './marketPrices';
import { publishBoardPost, readReporterEnv } from './publish';
import type { ReporterLedger } from './types';

const isoKst = (): string => kstIsoDate();

/**
 * 시장 기사(2026-11-24) — 사실 준비 단계 없이 루틴이 취재해 쓴 초안을 검사 → 주가 대조 → 게시한다.
 * 검사·대조 중 하나라도 걸리면 발행하지 않는다(`marketNews.ts` 머리말).
 */
export const runMarketNews = async (
  command: 'check' | 'publish',
  draft: MarketNewsDraft,
  ledger: ReporterLedger,
  ledgerPath: string | undefined,
  isPublic: boolean
): Promise<number> => {
  const check = checkMarketNewsDraft(draft, ledger, isoKst());
  const tickers = [...new Set(draft.priceMoves.map((move) => move.ticker))];
  const closes = Object.fromEntries(await Promise.all(tickers.map(async (ticker) => [ticker, await fetchDailyCloses(ticker)] as const)));
  const prices = verifyPriceMoves(draft.priceMoves, closes);
  const errors = [...check.errors, ...prices.errors];
  if (errors.length > 0) {
    console.error(`✗ 검사 실패 ${errors.length}건`);
    for (const error of errors) console.error(`  · ${error}`);
    return 1;
  }
  console.log('✓ 검사 통과(주가 대조 포함)');
  if (command === 'check') return 0;

  const tickerPages = new Map(TICKER_CONTENT_LIST.map((entry) => [entry.ticker, entry.slug] as const));
  const { postId } = await publishBoardPost(readReporterEnv(), {
    title: draft.title.trim(),
    description: draft.description.trim(),
    body: composeMarketNews(draft, prices.verified, tickerPages),
    category: 'news',
    isPublic
  });
  const next: ReporterLedger = {
    entries: [
      ...ledger.entries,
      {
        factKey: draft.factKey,
        topic: MARKET_NEWS_TOPIC,
        title: draft.title.trim(),
        publishedAt: new Date().toISOString(),
        postId,
        tickers: draft.tickers
      }
    ]
  };
  if (ledgerPath) writeFileSync(ledgerPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  console.log(`✓ 게시 ${isPublic ? '(공개)' : '(비공개)'} — /community/board/${postId}`);
  await notifyPublished(draft.title.trim(), postId);
  return 0;
};

/**
 * 시장 기사가 올라가면 텔레그램으로 링크를 보낸다(사람 검토 없이 공개되므로 운영자가 바로 볼 수 있게).
 * 🔴 **절대 발행을 실패로 만들지 않는다** — 이미 게시 · 대장 기록이 끝난 뒤다. 예전엔 이 일을 워크플로 bash 가 했고,
 *    거기서 죽어 inbox → published 이동이 빠진 적이 있다(#392). 실패는 로그 한 줄로 끝낸다.
 */
const notifyPublished = async (title: string, postId: string): Promise<void> => {
  const target = telegramTargetFromEnv(process.env);
  if (!target) return;
  try {
    await sendTelegram(target, `📰 AI 시장 기사가 올라갔습니다
${title}
https://hungry-hippo.xyz/community/board/${postId}`);
  } catch (error) {
    console.warn(`텔레그램 알림 실패(발행은 됐다): ${error instanceof Error ? error.message : String(error)}`);
  }
};

/** 시장 전체 흐름을 보는 지수 ETF — 후보와 따로, 기사 배경("그날 시장 전체는")으로 넘긴다. */
const INDEX_TICKERS = ['SPY', 'QQQ', 'DIA'] as const;

/** 동시에 너무 많이 부르면 Yahoo 가 막는다 — 몇 개씩 나눠 부른다. */
const fetchAllCloses = async (tickers: readonly string[], batch = 6): Promise<Record<string, DailyClose[] | null>> => {
  const out: Record<string, DailyClose[] | null> = {};
  for (let i = 0; i < tickers.length; i += batch) {
    const slice = tickers.slice(i, i + batch);
    const rows = await Promise.all(slice.map(async (ticker) => [ticker, await fetchDailyCloses(ticker)] as const));
    for (const [ticker, closes] of rows) out[ticker] = closes;
  }
  return out;
};

/**
 * 시장 기사 주제 후보(2026-11-24) — 우리 종목 페이지가 있는 종목(레버리지 ETF 제외)의 최근 사흘 큰 등락.
 * 출력은 루틴이 읽는 `market-candidates.json`. 등락률은 여기서 계산한 값이 정본이다(루틴은 옮겨 적기만).
 */
export const runMarketCandidates = async (ledger: ReporterLedger): Promise<number> => {
  const tickers = TICKER_CONTENT_LIST.filter((entry) => !entry.categoryIds.includes('leveraged')).map((entry) => entry.ticker);
  const closes = await fetchAllCloses([...tickers, ...INDEX_TICKERS]);
  const fetched = Object.values(closes).filter(Boolean).length;
  // 거의 다 실패했다면 "움직임 없음"이 아니라 가져오기 실패다 — 조용히 빈 후보를 내지 않고 실패로 끝내 알림을 띄운다.
  if (fetched < tickers.length / 2) throw new Error(`Yahoo 일봉을 ${fetched}/${tickers.length + INDEX_TICKERS.length} 종목만 가져왔다`);
  const today = isoKst();
  const indexMoves = INDEX_TICKERS.flatMap((ticker) => {
    const rows = closes[ticker];
    if (!rows?.length) return [];
    const last = [...rows].sort((a, b) => a.date.localeCompare(b.date)).slice(-3);
    return last.flatMap((row) => {
      const move = changeOn(rows, row.date);
      return move ? [{ ticker, date: row.date, changePercent: Math.round(move.change * 100) / 100 }] : [];
    });
  });
  const candidateCloses = Object.fromEntries(tickers.map((ticker) => [ticker, closes[ticker] ?? null]));
  const candidates = pickMoveCandidates(candidateCloses, recentlyCoveredTickers(ledger, today));
  console.log(
    JSON.stringify(
      {
        generatedAt: today,
        note: '등락률은 Yahoo 일봉 종가로 계산한 값 — 기사에 쓸 때 priceMoves 에 그대로 옮긴다(직접 계산하지 않는다).',
        candidates: candidates.map((candidate) => ({
          ...candidate,
          close: Math.round(candidate.close * 100) / 100,
          // 메타 제목 끝의 "— 엔비디아" 가 사람이 부르는 이름이다.
          name: TICKER_CONTENT_LIST.find((entry) => entry.ticker === candidate.ticker)?.metaTitle.split('—').at(-1)?.trim() ?? candidate.ticker
        })),
        indexMoves
      },
      null,
      2
    )
  );
  return 0;
};
