import { CURATED_DIVIDEND_LISTS, normalizeSectorLabel } from '@/shared/constants/dividendLists';
import type {
  DividendList,
  DividendListId,
  DividendListMember,
  DividendListVerificationFlag
} from '@/shared/constants/dividendLists';

import {
  fetchAnnualDividends,
  fetchNoblHoldings,
  fetchWikipediaAristocrats,
  findRecentDividendCut,
  ListSourceError,
  sleep,
  todayIso,
  WIKIPEDIA_PAGE_URL
} from './sources';
import type { NoblHoldingsResult, WikipediaAristocrat } from './sources';

/**
 * 수집기의 **순수 조립 로직**. IO(파일 쓰기·콘솔)는 `cli.ts` 가 한다.
 *
 * 🔴 이 모듈의 규칙은 하나다: **모르면 지어내지 않는다.**
 *  - NOBL 에는 있는데 위키피디아에 없는 종목은 섹터·회사명을 알 수 없다 → 그 종목을 넣지 않고
 *    `unmatched` 로 보고한다. "기타" 섹터로 뭉개면 화면이 조용히 틀린다.
 *  - 두 소스가 크게 어긋나면(아래 `MAX_DIFF_RATIO`) 목록 전체를 쓰지 않고 실패로 올린다.
 */

/** 두 소스의 차이가 이 비율을 넘으면 "한쪽 파싱이 깨졌다"로 보고 목록을 쓰지 않는다. */
const MAX_DIFF_RATIO = 0.1;

export type AristocratsCollectResult = {
  list: DividendList;
  /** 위키피디아에 대응 행이 없어 **뺀** NOBL 종목. 비어 있어야 정상이다. */
  unmatched: string[];
  /** 위키피디아에만 있고 NOBL 에는 없는 종목(참고용 — 편입 판정은 NOBL 이 한다). */
  wikipediaOnly: string[];
  fileAsOf: string | null;
};

/**
 * 배당귀족 목록을 두 소스로 조립한다.
 *
 * 편입 여부의 **1차 판정은 NOBL 보유내역**이다(지수를 추종하는 ETF 가 실제로 들고 있는 것). 위키피디아는
 * 회사명·섹터를 주고, 동시에 "우리가 CSV 를 잘못 읽지 않았는가"를 검증한다.
 */
export const buildAristocratsList = (
  nobl: NoblHoldingsResult,
  wikipedia: readonly WikipediaAristocrat[],
  asOf: string
): AristocratsCollectResult => {
  const wikipediaByTicker = new Map(wikipedia.map((row) => [row.ticker, row]));
  const noblTickers = nobl.holdings.map((holding) => holding.ticker);
  const noblSet = new Set(noblTickers);

  const unmatched = noblTickers.filter((ticker) => !wikipediaByTicker.has(ticker));
  const wikipediaOnly = wikipedia.filter((row) => !noblSet.has(row.ticker)).map((row) => row.ticker);

  const diff = unmatched.length + wikipediaOnly.length;
  if (diff > Math.ceil(noblTickers.length * MAX_DIFF_RATIO)) {
    throw new ListSourceError(
      `두 소스의 차이가 너무 크다(NOBL ${noblTickers.length}종, 위키 ${wikipedia.length}종, 불일치 ${diff}종). ` +
        '파싱이 깨졌을 가능성이 높아 목록을 쓰지 않는다.'
    );
  }

  const members: DividendListMember[] = [];
  for (const ticker of noblTickers) {
    const row = wikipediaByTicker.get(ticker);
    if (!row) continue;
    const sector = normalizeSectorLabel(row.sectorLabel);
    if (!sector) {
      // 모르는 섹터 문자열을 조용히 버리면 대응표가 낡은 것을 아무도 모른다. 실패로 올린다.
      throw new ListSourceError(`모르는 섹터 문자열: "${row.sectorLabel}" (${ticker}). 대응표를 갱신하라.`);
    }
    members.push({
      ticker,
      name: row.name,
      sector,
      sourceSectorLabel: row.sectorLabel,
      confirmedBy: ['ProShares NOBL 보유내역', 'Wikipedia']
    });
  }
  members.sort((left, right) => left.ticker.localeCompare(right.ticker));

  const curated = CURATED_DIVIDEND_LISTS.aristocrats;
  return {
    list: {
      ...curated,
      asOf,
      sources: curated.sources.map((source) => ({ ...source, retrievedAt: asOf })),
      coverageNote:
        'S&P 500 배당귀족 지수를 추종하는 ETF(NOBL)의 보유내역에서 편입 종목을 확인하고, 위키피디아 구성종목 표와 대조했습니다. ' +
        `두 소스는 ${members.length}종에서 일치했습니다.`,
      members
    },
    unmatched,
    wikipediaOnly,
    fileAsOf: nobl.fileAsOf
  };
};

export type VerifyOptions = {
  /** 요청 사이 간격(ms). 비공식 API 를 연달아 두드리지 않는다. */
  delayMs: number;
  /** 진행 상황을 흘려보낼 곳. 테스트는 no-op 을 준다. */
  onProgress?: (message: string) => void;
};

export type VerifyResult = {
  checkedCount: number;
  flags: DividendListVerificationFlag[];
};

/**
 * **가드** — 목록의 각 종목이 최근에 배당을 삭감했는지 야후 전기간 이력으로 확인한다.
 *
 * 🔴 이 함수는 목록을 고치지 않는다. `flags` 만 남기고, 그걸 사람이 본다. 자동으로 종목을 빼면
 * 야후가 하루 이상해진 날 목록이 조용히 무너진다 — 가드는 판정자가 아니라 신고자다.
 */
export const verifyLists = async (
  lists: Record<DividendListId, DividendList>,
  options: VerifyOptions,
  fetchImpl: typeof fetch = fetch
): Promise<VerifyResult> => {
  const currentYear = new Date().getUTCFullYear();
  const flags: DividendListVerificationFlag[] = [];

  // 같은 종목이 여러 목록에 있어도 한 번만 받는다(배당귀족 ∩ 배당킹은 실측 28종).
  const listIdsByTicker = new Map<string, DividendListId[]>();
  for (const [listId, list] of Object.entries(lists) as Array<[DividendListId, DividendList]>) {
    for (const member of list.members) {
      const existing = listIdsByTicker.get(member.ticker);
      if (existing) existing.push(listId);
      else listIdsByTicker.set(member.ticker, [listId]);
    }
  }

  let checkedCount = 0;
  const tickers = [...listIdsByTicker.keys()].sort();
  for (const [index, ticker] of tickers.entries()) {
    if (index > 0) await sleep(options.delayMs);
    options.onProgress?.(`[${index + 1}/${tickers.length}] ${ticker}`);
    const listIds = listIdsByTicker.get(ticker) ?? [];
    try {
      const annual = await fetchAnnualDividends(ticker, fetchImpl);
      checkedCount += 1;
      if (annual.length === 0) {
        for (const listId of listIds) {
          flags.push({ listId, ticker, kind: 'noHistory', detail: '야후에 배당 이벤트가 없다' });
        }
        continue;
      }
      const cut = findRecentDividendCut(annual, currentYear);
      if (cut) {
        const detail = `${cut.fromYear}년 ${cut.fromTotal.toFixed(3)} → ${cut.toYear}년 ${cut.toTotal.toFixed(3)}`;
        for (const listId of listIds) flags.push({ listId, ticker, kind: 'cut', detail });
      }
    } catch (error) {
      // 조회 실패는 "삭감"이 아니다. 사실 그대로 남긴다.
      for (const listId of listIds) {
        flags.push({ listId, ticker, kind: 'noHistory', detail: `조회 실패: ${String(error)}` });
      }
    }
  }

  return { checkedCount, flags };
};

export const collectionAsOf = todayIso;

export const fetchAristocratSources = async (
  fetchImpl: typeof fetch = fetch
): Promise<{ nobl: NoblHoldingsResult; wikipedia: WikipediaAristocrat[] }> => {
  const nobl = await fetchNoblHoldings(fetchImpl);
  const wikipedia = await fetchWikipediaAristocrats(fetchImpl);
  return { nobl, wikipedia };
};

export { WIKIPEDIA_PAGE_URL };
