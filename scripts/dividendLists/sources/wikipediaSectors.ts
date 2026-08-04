import { ListSourceError, USER_AGENT, canonicalTicker } from './sourceCommon';

/**
 * 위키피디아 `List of S&P 500 / 400 / 600 companies` 세 문서의 구성종목 표에서 **섹터 사전**을 만든다.
 * 후보 유니버스(배당 ETF 보유내역)에는 섹터가 없어서, 이 사전이 없으면 화면이 종목을 분류하지 못한다.
 *
 * ## 🔴 wikitext 로 파싱하지 마라 — 렌더 HTML 을 파싱한다
 * 배당귀족 문서(`wikipediaAristocrats.ts`)는 wikitext 가 잘 맞지만, 이 세 문서는 **표 마크업 형식이
 * 제각각**이라 wikitext 파싱이 실패한다. 렌더 HTML 은 셋 다 `<tr><td>…</td></tr>` 로 동일하게 나온다.
 * 2026-08-04 실측(`action=parse&prop=text&section=1`):
 * ```
 *   S&P 500 : 503행 · S&P 400 : 400행 · S&P 600 : 603행  →  합계 1,506종, 티커 충돌 0건
 *   섹터 문자열은 GICS 11종만 나왔다(Industrials 262 · Financials 260 · Information Technology 189 …)
 * ```
 * 세 표 모두 열 순서가 같다: `Symbol | Security | GICS Sector | …`.
 *
 * ## 라이선스
 * 위키피디아 본문은 **CC BY-SA 4.0** 이다. 이 사전으로 만든 화면에는 **출처 표기가 의무**다.
 */
const WIKIPEDIA_SECTOR_PAGES = [
  'List_of_S%26P_500_companies',
  'List_of_S%26P_400_companies',
  'List_of_S%26P_600_companies'
] as const;

export const WIKIPEDIA_SECTOR_PAGE_URLS = WIKIPEDIA_SECTOR_PAGES.map(
  (page) => `https://en.wikipedia.org/wiki/${page}`
);

export type WikipediaSectorRow = {
  ticker: string;
  name: string;
  /** 위키피디아가 적어 준 GICS 섹터 문자열. 정규화는 호출부가 한다. */
  sectorLabel: string;
};

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' '
};

/** 태그를 걷어내고 엔티티를 되돌린다. 회사명에 `&`(`AT&T`)·`'`(`Lowe's`)가 실제로 들어 있다. */
const toPlainText = (html: string): string =>
  html
    .replace(/<sup[\s\S]*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (whole, name: string) => HTML_ENTITIES[name.toLowerCase()] ?? whole)
    .replace(/\s+/g, ' ')
    .trim();

/** 티커 열로 인정할 형태. 지수 표에는 각주·빈 셀도 섞여 있어 형태로 걸러야 한다. */
const TICKER_PATTERN = /^[A-Z]{1,5}(\.[A-Z])?$/;

/**
 * 렌더 HTML 한 장에서 `Symbol | Security | GICS Sector` 세 열을 뽑는다.
 * 열 순서를 상수로 박지 않고 **헤더 행을 읽어 위치를 찾는다** — 위키 편집으로 열이 하나 늘어도 버틴다.
 */
export const parseWikipediaSectorHtml = (html: string, pageLabel: string): WikipediaSectorRow[] => {
  const headerCells = [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((match) => toPlainText(match[1]));
  const indexOfHeader = (predicate: (label: string) => boolean): number =>
    headerCells.findIndex((label) => predicate(label.toLowerCase()));

  const symbolIndex = indexOfHeader((label) => label === 'symbol' || label === 'ticker');
  const nameIndex = indexOfHeader((label) => label === 'security' || label === 'company');
  const sectorIndex = indexOfHeader((label) => label.includes('sector') && !label.includes('sub-industry'));
  if (symbolIndex < 0 || nameIndex < 0 || sectorIndex < 0) {
    throw new ListSourceError(
      `${pageLabel} 표의 열을 찾지 못했다(symbol ${symbolIndex} / security ${nameIndex} / sector ${sectorIndex}). 문서 구조가 바뀌었다.`
    );
  }

  const rows: WikipediaSectorRow[] = [];
  for (const rowMatch of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) => toPlainText(match[1]));
    if (cells.length <= Math.max(symbolIndex, nameIndex, sectorIndex)) continue;
    const ticker = canonicalTicker(cells[symbolIndex]);
    if (!TICKER_PATTERN.test(ticker)) continue;
    const sectorLabel = cells[sectorIndex];
    if (sectorLabel.length === 0) continue;
    rows.push({ ticker, name: cells[nameIndex], sectorLabel });
  }

  if (rows.length === 0) throw new ListSourceError(`${pageLabel} 표에서 한 행도 뽑지 못했다`);
  return rows;
};

export type WikipediaSectorDictionary = {
  /** 티커 → 행. 세 문서에 같은 티커가 있으면 **먼저 읽은 문서(대형주)**가 이긴다. */
  byTicker: Map<string, WikipediaSectorRow>;
  /** 문서별로 몇 행을 읽었는지. 파싱이 조용히 반쯤 깨지는 것을 CLI 로그가 잡는다. */
  rowCountByPage: Array<{ page: string; rowCount: number }>;
  /** 같은 티커가 두 문서에 다른 섹터로 있던 경우. 실측 0건이지만 0이 아니게 되면 알아야 한다. */
  conflicts: string[];
};

export const mergeWikipediaSectorRows = (
  pages: ReadonlyArray<{ page: string; rows: readonly WikipediaSectorRow[] }>
): WikipediaSectorDictionary => {
  const byTicker = new Map<string, WikipediaSectorRow>();
  const conflicts: string[] = [];
  for (const { rows } of pages) {
    for (const row of rows) {
      const existing = byTicker.get(row.ticker);
      if (!existing) {
        byTicker.set(row.ticker, row);
        continue;
      }
      if (existing.sectorLabel !== row.sectorLabel) {
        conflicts.push(`${row.ticker}: ${existing.sectorLabel} vs ${row.sectorLabel}`);
      }
    }
  }
  return {
    byTicker,
    rowCountByPage: pages.map(({ page, rows }) => ({ page, rowCount: rows.length })),
    conflicts
  };
};

const fetchSectorPage = async (page: string, fetchImpl: typeof fetch): Promise<WikipediaSectorRow[]> => {
  // section=1 은 구성종목 표만 준다 — 문서 전체를 받으면 "최근 변경" 표까지 딸려 와 티커가 섞인다.
  const url =
    `https://en.wikipedia.org/w/api.php?action=parse&page=${page}` +
    '&prop=text&section=1&format=json&formatversion=2';
  let response: Response;
  try {
    response = await fetchImpl(url, { headers: { 'user-agent': USER_AGENT } });
  } catch (error) {
    throw new ListSourceError(`위키피디아 ${page} 요청 실패: ${String(error)}`);
  }
  if (!response.ok) throw new ListSourceError(`위키피디아 ${page} HTTP ${response.status}`);

  const payload = (await response.json()) as { parse?: { text?: string }; error?: { code?: string } };
  if (payload.error) throw new ListSourceError(`위키피디아 ${page} API 오류: ${payload.error.code ?? 'unknown'}`);
  const html = payload.parse?.text;
  if (typeof html !== 'string') throw new ListSourceError(`위키피디아 ${page} 응답에 렌더 HTML 이 없다`);
  return parseWikipediaSectorHtml(html, page);
};

export const fetchWikipediaSectorDictionary = async (
  fetchImpl: typeof fetch = fetch
): Promise<WikipediaSectorDictionary> => {
  const pages: Array<{ page: string; rows: WikipediaSectorRow[] }> = [];
  for (const page of WIKIPEDIA_SECTOR_PAGES) {
    pages.push({ page, rows: await fetchSectorPage(page, fetchImpl) });
  }
  return mergeWikipediaSectorRows(pages);
};
