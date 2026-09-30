/**
 * ETF 보유 종목 수집기 — `/ticker/overlap`(ETF 조합 짜기) 화면의 데이터.
 *
 * ```sh
 * npm run etf:holdings                          # 명단 전체 — 새 공시가 있는 ETF 만 받는다
 * npm run etf:holdings -- --force               # 접수번호가 같아도 다시 받는다(파서를 고쳤을 때)
 * npm run etf:holdings -- --only=SCHD,VOO       # 일부만
 * npm run etf:holdings -- --offline             # 네트워크 없이 검색 목록(index.json)만 다시 만든다
 * ```
 *
 * 출력: `public/data/etf-holdings/<TICKER>.json`(ETF 하나) · `public/data/etf-holdings/index.json`(검색 목록).
 * 정적 파일이라 화면은 **담을 때만** 그 ETF 파일을 받는다 — 4,000개 목록 전체가 번들에 실리지 않는다.
 *
 * ## 🔴 설계 — 13F 수집기와 같은 규율
 * - **매일 확인하고, 바뀔 때만 갱신한다.** 접수번호가 같으면 받지 않는다(N-PORT 는 분기 공시다).
 * - **실패해도 기존 스냅샷을 망가뜨리지 않는다.** 한 ETF 가 실패하면 그 ETF 의 직전 파일을 둔다.
 *   파싱 결과가 0종목이면 덮어쓰지 않는다.
 * - **공시의 시리즈가 기대와 다르면 버린다.** 엉뚱한 펀드의 보유를 그 ETF 의 것으로 그리는 것이 최악이다.
 * - 스킵·실패는 전부 리포트로 남긴다. 전부 실패하면 종료코드 1(워크플로가 빨개진다).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EtfHoldingsSnapshot } from '@/shared/lib/etfOverlap';
import { parseNport } from './parseNport';
import { ETF_ROSTER, POPULAR_ETFS } from './roster';
import { EtfSecClient } from './sec';
import { buildUniverse, displayEtfName, looksLikeEtf, serializeSnapshot, serializeUniverse } from './universe';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT_DIR = resolve(ROOT, 'public/data/etf-holdings');
const TICKER_OUTPUT = resolve(ROOT, 'utils/TickerParser/output');

type Options = { force: boolean; offline: boolean; only: readonly string[] | null };

const parseOptions = (argv: readonly string[]): Options => {
  const onlyArg = argv.find((arg) => arg.startsWith('--only='));
  return {
    force: argv.includes('--force'),
    offline: argv.includes('--offline'),
    only: onlyArg
      ? onlyArg
          .slice('--only='.length)
          .split(',')
          .map((ticker) => ticker.trim().toUpperCase())
          .filter(Boolean)
      : null
  };
};

const readJson = <T>(path: string): T | null => {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
};

/** 거래소 ETF 목록. 정식 원천이 없으면 종목명으로 가늠한다(`looksLikeEtf` 머리주석). */
const loadListedEtfs = (roster: readonly string[]): { listed: Record<string, string>; source: string } => {
  const etfListed = readJson<Record<string, string>>(resolve(TICKER_OUTPUT, 'etf-listed.json'));
  if (etfListed && Object.keys(etfListed).length > 0) return { listed: etfListed, source: 'etf-listed.json' };

  const listed: Record<string, string> = {};
  for (const file of ['nasdaq-listed.json', 'other-listed.json']) {
    const table = readJson<Record<string, { name: string }>>(resolve(TICKER_OUTPUT, file)) ?? {};
    for (const [ticker, row] of Object.entries(table)) {
      /* 명단의 티커는 이름에 ETF 가 없어도(`Invesco QQQ Trust`) 거래소 이름을 쓴다. */
      if (row?.name && (looksLikeEtf(row.name) || roster.includes(ticker))) listed[ticker] = row.name;
    }
  }
  return { listed, source: 'name heuristic (etf-listed.json missing)' };
};

const snapshotPath = (ticker: string): string => resolve(OUT_DIR, `${ticker}.json`);

const loadExistingSnapshots = (): Map<string, EtfHoldingsSnapshot> => {
  const map = new Map<string, EtfHoldingsSnapshot>();
  if (!existsSync(OUT_DIR)) return map;
  for (const file of readdirSync(OUT_DIR)) {
    if (!file.endsWith('.json') || file === 'index.json') continue;
    const snapshot = readJson<EtfHoldingsSnapshot>(resolve(OUT_DIR, file));
    if (snapshot?.ticker && Array.isArray(snapshot.holdings)) map.set(snapshot.ticker, snapshot);
  }
  return map;
};

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  mkdirSync(OUT_DIR, { recursive: true });

  const roster = [...new Set(ETF_ROSTER)];
  const { listed, source } = loadListedEtfs(roster);
  const snapshots = loadExistingSnapshots();
  const targets = options.only ?? roster;

  const report = { updated: [] as string[], unchanged: [] as string[], skipped: [] as string[], failed: [] as string[] };

  if (!options.offline) {
    const client = new EtfSecClient();
    const seriesByTicker = await client.fetchFundSeries();

    for (const ticker of targets) {
      const series = seriesByTicker.get(ticker);
      if (!series) {
        report.skipped.push(`${ticker}: SEC 펀드 표에 없음(N-PORT 를 내지 않는 상품일 수 있다)`);
        continue;
      }
      try {
        const filing = await client.findLatestNport(series.seriesId);
        if (!filing) {
          report.skipped.push(`${ticker}: N-PORT 공시 없음 (${series.seriesId})`);
          continue;
        }
        const previous = snapshots.get(ticker);
        if (!options.force && previous?.accessionNumber === filing.accessionNumber) {
          report.unchanged.push(ticker);
          continue;
        }

        const parsed = parseNport(await client.fetchNportXml(filing));
        if (parsed.seriesId && parsed.seriesId !== series.seriesId) {
          report.failed.push(`${ticker}: 공시의 시리즈(${parsed.seriesId})가 기대(${series.seriesId})와 다르다 — 버린다`);
          continue;
        }
        if (parsed.holdings.length === 0) {
          report.failed.push(`${ticker}: 담을 보유 종목 0개(행 ${parsed.rowCount}) — 기존 파일 유지`);
          continue;
        }

        const snapshot: EtfHoldingsSnapshot = {
          ticker,
          name: listed[ticker] ? displayEtfName(listed[ticker]!) : (parsed.seriesName ?? ticker),
          seriesId: series.seriesId,
          asOfDate: parsed.reportDate ?? '',
          filingDate: filing.filingDate,
          accessionNumber: filing.accessionNumber,
          sourceUrl: `${filing.directoryUrl}/primary_doc.xml`,
          totalHoldings: parsed.holdingCount,
          coveredWeightPercent: parsed.coveredWeightPercent,
          holdings: parsed.holdings
        };
        writeFileSync(snapshotPath(ticker), serializeSnapshot(snapshot), 'utf8');
        snapshots.set(ticker, snapshot);
        report.updated.push(`${ticker} (${snapshot.asOfDate}, ${parsed.holdingCount}종 중 ${parsed.holdings.length}종)`);
      } catch (error) {
        report.failed.push(`${ticker}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  const withHoldings = new Map([...snapshots.values()].map((snapshot) => [snapshot.ticker, snapshot.name]));
  const universe = buildUniverse({ listed, roster, popular: POPULAR_ETFS, withHoldings });
  writeFileSync(resolve(OUT_DIR, 'index.json'), serializeUniverse(universe), 'utf8');

  console.log(`[etf:holdings] 목록 원천: ${source}`);
  console.log(`[etf:holdings] 검색 목록 ${universe.etfs.length}개 · 보유 종목 있음 ${withHoldings.size}개`);
  if (!options.offline) {
    console.log(`- 갱신 ${report.updated.length}: ${report.updated.join(', ') || '-'}`);
    console.log(`- 그대로 ${report.unchanged.length}`);
    for (const line of report.skipped) console.log(`- 건너뜀 ${line}`);
    for (const line of report.failed) console.log(`- 실패 ${line}`);
    const attempted = report.updated.length + report.unchanged.length + report.failed.length;
    if (attempted > 0 && report.failed.length === attempted) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
