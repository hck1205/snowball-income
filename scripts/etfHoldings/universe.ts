/**
 * 검색 목록(`index.json`)과 스냅샷 파일의 모양 — **순수**. 파일 입출력은 `cli.ts` 가 한다.
 */
import type { EtfHoldingsSnapshot, EtfUniverse, EtfUniverseEntry } from '@/shared/lib/etfOverlap';

/**
 * ETF 이름 판정(대체 경로).
 *
 * 정식 원천은 `utils/TickerParser/output/etf-listed.json` — 거래소 원본의 `ETF` 열이다. 그 파일이 아직 없을
 * 때(파서가 그 열을 남기기 전에 받아 둔 캐시만 있을 때)만 종목명으로 가늠한다.
 * ⚠ 이름에 `ETF` 가 없는 ETF(`SPDR S&P 500 ETF Trust` 는 있지만 `Invesco QQQ Trust` 는 없다)는 빠진다 —
 *   그래서 명단(`ETF_ROSTER`)의 티커는 이름과 무관하게 목록에 넣는다(`buildUniverse`).
 */
export const looksLikeEtf = (name: string): boolean => /\bETF\b|\bETFs\b/i.test(name);

/**
 * 거래소 원본의 긴 종목명을 화면용으로 줄인다. `- Common Stock` 같은 꼬리만 걷고 나머지는 그대로 둔다.
 */
export const displayEtfName = (raw: string): string =>
  raw
    .replace(/\s+-\s+.*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

export const buildUniverse = (params: {
  /** 티커 → 거래소 종목명. */
  readonly listed: Readonly<Record<string, string>>;
  /** 명단 — 목록에 반드시 들어간다(이름 판정 대체 경로의 누락을 막는다). */
  readonly roster: readonly string[];
  readonly popular: readonly string[];
  /** 보유 종목 파일이 있는 티커 → 스냅샷의 이름(거래소 이름이 없을 때 쓴다). */
  readonly withHoldings: ReadonlyMap<string, string>;
}): EtfUniverse => {
  const names = new Map<string, string>();
  for (const [ticker, name] of Object.entries(params.listed)) names.set(ticker, displayEtfName(name));
  for (const ticker of params.roster) {
    if (!names.has(ticker)) names.set(ticker, params.withHoldings.get(ticker) ?? ticker);
  }
  for (const [ticker, name] of params.withHoldings) {
    if (!names.has(ticker)) names.set(ticker, name);
  }

  const etfs: EtfUniverseEntry[] = [...names.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([ticker, name]) => ({ ticker, name, hasHoldings: params.withHoldings.has(ticker) }));

  return {
    etfs,
    popular: params.popular.filter((ticker) => params.withHoldings.has(ticker))
  };
};

/**
 * 배열 원소를 **한 줄에 하나씩** 쓴다. 전부 한 줄이면 갱신 PR 의 diff 를 읽을 수 없고,
 * 들여쓰기 2칸이면 원소 하나가 여섯 줄이 되어 파일이 두 배가 된다.
 */
const rowsJson = (rows: readonly unknown[]): string =>
  rows.length === 0 ? '[]' : `[\n${rows.map((row) => JSON.stringify(row)).join(',\n')}\n]`;

export const serializeUniverse = (universe: EtfUniverse): string =>
  `{"popular":${JSON.stringify(universe.popular)},\n"etfs":${rowsJson(universe.etfs)}}\n`;

export const serializeSnapshot = (snapshot: EtfHoldingsSnapshot): string => {
  const { holdings, ...meta } = snapshot;
  const head = JSON.stringify(meta).slice(0, -1);
  return `${head},\n"holdings":${rowsJson(holdings)}}\n`;
};
