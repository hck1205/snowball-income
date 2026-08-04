import process from 'node:process';
import { inflateRawSync } from 'node:zlib';

import { dividendUniverseSnapshotSchema } from '@/shared/constants/dividendLists';
import type { DividendUniverseSourceEtf } from '@/shared/constants/dividendLists';

import { UNIVERSE_SNAPSHOT_PATH, writeUniverseSnapshotFile } from './snapshotIo';
import {
  fetchProSharesHoldings,
  fetchSdyHoldings,
  fetchWikipediaSectorDictionary,
  ListSourceError,
  todayIso
} from './sources';
import { buildUniverseCandidates, buildUniverseSnapshot, collectUniverseMetrics } from './universe';

/**
 * `npm run dividend:universe` — **후보 유니버스 수집기**.
 *
 * 배당 연속증배 ETF 네 종의 보유내역을 합쳐 후보 풀을 만들고, 각 종목의 현재가·선행 배당률·5년
 * 배당성장률을 야후 chart **한 번**으로 뽑은 뒤, 그 숫자를 **스스로 검산**해 생성물에 남긴다.
 *
 * ```sh
 * npm run dividend:universe                    # 받아서 요약만 출력(파일 안 씀)
 * npm run dividend:universe -- --write         # 생성물에 반영
 * npm run dividend:universe -- --limit=20 --delay=300   # 짧게 돌려 보기
 * ```
 *
 * ## 종료 코드
 * | 코드 | 뜻 |
 * |---|---|
 * | 0 | 정상. 막는 신고가 없다. |
 * | 1 | 소스 수집 실패 또는 스키마 불통과 — **파일을 쓰지 않았다**. |
 * | 2 | 수집은 됐지만 **막는 신고가 있다**. `--write` 면 파일은 썼고 그 안에 신고 목록이 들어 있다. |
 *
 * 🔴 2번을 0으로 뭉개지 마라. 이 파이프라인이 존재하는 이유가 그 줄들이다 — 검산 없이 돌던 시절
 * 배당률이 평균 1.47pp 과대였고 화면은 아무 에러도 내지 않았다.
 *
 * 🔴 외부 서비스에 **쓰기**를 하지 않는다. 읽기만 하고, 결과는 레포의 JSON 한 개에 커밋된다.
 */
const LOG = '[dividend:universe]';

type CliOptions = {
  write: boolean;
  delayMs: number;
  /** 앞에서 몇 종만 돌린다(개발용). `null` 이면 전부. */
  limit: number | null;
};

const parseArgs = (argv: readonly string[]): { ok: true; value: CliOptions } | { ok: false; error: string } => {
  const options: CliOptions = { write: false, delayMs: 1500, limit: null };
  for (const arg of argv) {
    if (arg === '--write') options.write = true;
    else if (arg.startsWith('--delay=')) {
      const value = Number(arg.slice('--delay='.length));
      if (!Number.isFinite(value) || value < 0) return { ok: false, error: `--delay 값이 잘못됐다: ${arg}` };
      options.delayMs = value;
    } else if (arg.startsWith('--limit=')) {
      const value = Number(arg.slice('--limit='.length));
      if (!Number.isInteger(value) || value <= 0) return { ok: false, error: `--limit 값이 잘못됐다: ${arg}` };
      options.limit = value;
    } else return { ok: false, error: `모르는 인자: ${arg}` };
  }
  return { ok: true, value: options };
};

const main = async (): Promise<number> => {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed.ok) {
    console.error(`${LOG} ${parsed.error}`);
    console.error('Usage: npm run dividend:universe -- [--write] [--delay=1500] [--limit=20]');
    return 1;
  }
  const options = parsed.value;
  const asOf = todayIso();
  const startedAt = Date.now();

  /* 1) 소스 세 개(ProShares CSV · SDY xlsx · 위키피디아 세 문서)를 받는다. */
  let sources;
  try {
    console.log(`${LOG} ProShares 전펀드 CSV · SDY xlsx · 위키피디아 S&P 500/400/600 을 받는다...`);
    const proShares = await fetchProSharesHoldings();
    const sdy = await fetchSdyHoldings((compressed) => inflateRawSync(compressed));
    const sectors = await fetchWikipediaSectorDictionary();
    sources = { proShares, sdy, sectors };

    for (const fund of ['NOBL', 'REGL', 'SMDV'] as const) {
      console.log(`${LOG}   ${fund} ${proShares.byFund[fund].length}종`);
    }
    console.log(`${LOG}   SDY ${sdy.holdings.length}종 (종목이 아니라 뺀 행 ${sdy.skipped.length}: ${sdy.skipped.join(' / ') || '없음'})`);
    console.log(
      `${LOG}   위키피디아 섹터 사전 ${sectors.byTicker.size}종 ` +
        `(${sectors.rowCountByPage.map((page) => `${page.page.replace(/List_of_|_companies/g, '')} ${page.rowCount}`).join(' · ')})`
    );
    if (sectors.conflicts.length > 0) {
      console.warn(`${LOG}   ⚠ 문서 간 섹터 충돌 ${sectors.conflicts.length}건: ${sectors.conflicts.join(' | ')}`);
    }
    console.log(`${LOG}   소스 파일 기준일: ProShares ${proShares.fileAsOf ?? '알 수 없음'} / SDY ${sdy.fileAsOf ?? '알 수 없음'}`);
  } catch (error) {
    if (!(error instanceof ListSourceError)) throw error;
    console.error(`${LOG} ✖ 소스 수집 실패: ${error.message}`);
    console.error(`${LOG}   → 파일을 쓰지 않는다. 기존 생성물이 그대로 남는다.`);
    return 1;
  }

  /* 2) 후보 조립 — 여기서 모르는 섹터 문자열이 나오면 실패로 올라온다(조용한 null 금지). */
  let candidates;
  try {
    candidates = buildUniverseCandidates(sources);
  } catch (error) {
    if (!(error instanceof ListSourceError)) throw error;
    console.error(`${LOG} ✖ 후보 조립 실패: ${error.message}`);
    return 1;
  }
  const memberCountByEtf = {} as Record<DividendUniverseSourceEtf, number>;
  for (const candidate of candidates) {
    for (const etf of candidate.sourceEtfs) memberCountByEtf[etf] = (memberCountByEtf[etf] ?? 0) + 1;
  }
  console.log(
    `${LOG} 후보 ${candidates.length}종 ` +
      `(${Object.entries(memberCountByEtf).map(([etf, count]) => `${etf} ${count}`).join(' · ')})`
  );

  const targets = options.limit ? candidates.slice(0, options.limit) : candidates;

  /* 3) 종목별 지표 + 그 자리 검산. 요청 한 번에 가격·배당이력이 같이 온다. */
  console.log(`${LOG} 야후 chart 로 ${targets.length}종의 가격·선행 배당률·5년 성장률을 뽑는다(간격 ${options.delayMs}ms)...`);
  const audits = await collectUniverseMetrics(targets, {
    delayMs: options.delayMs,
    currentYear: new Date().getUTCFullYear(),
    nowEpochSeconds: Math.floor(Date.now() / 1000),
    measuredAt: asOf,
    onProgress: (message) => process.stdout.write(`\r${LOG} ${message}          `)
  });
  process.stdout.write('\n');

  const snapshot = buildUniverseSnapshot(audits, {
    asOf,
    sourceAsOf: { proShares: sources.proShares.fileAsOf, sdy: sources.sdy.fileAsOf },
    memberCountByEtf
  });

  /* 4) 신고 요약 — 사람이 봐야 할 줄을 묻지 않는다. */
  const blocking = snapshot.issues.filter((issue) => issue.blocking);
  const byKind = new Map<string, number>();
  for (const issue of snapshot.issues) byKind.set(issue.kind, (byKind.get(issue.kind) ?? 0) + 1);
  console.log(
    `${LOG} 커버리지: 지표 ${snapshot.coverage.withMetrics}/${snapshot.coverage.total} · ` +
      `섹터 ${snapshot.coverage.withSector}/${snapshot.coverage.total} · ` +
      `5년성장률 ${snapshot.coverage.withGrowth}/${snapshot.coverage.total}`
  );
  console.log(`${LOG} 신고 ${snapshot.issues.length}건 (막는 신고 ${blocking.length}건)`);
  for (const [kind, count] of [...byKind.entries()].sort((left, right) => right[1] - left[1])) {
    console.log(`${LOG}   ${kind}: ${count}`);
  }
  for (const issue of blocking) console.warn(`${LOG}   ⚠ ${issue.ticker} [${issue.kind}] ${issue.detail}`);

  /* 5) 쓰기 전 검증 — 형태가 깨진 스냅샷을 파일에 남기지 않는다(기존 규율). */
  const validated = dividendUniverseSnapshotSchema.safeParse(snapshot);
  if (!validated.success) {
    console.error(`${LOG} ✖ 조립한 스냅샷이 스키마를 통과하지 못했다. 파일을 쓰지 않는다.`);
    console.error(validated.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n'));
    return 1;
  }

  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  if (!options.write) {
    console.log(`${LOG} --write 가 없어 파일을 쓰지 않았다. (${elapsedSeconds}초)`);
    return blocking.length > 0 ? 2 : 0;
  }
  await writeUniverseSnapshotFile(snapshot);
  console.log(`${LOG} ${UNIVERSE_SNAPSHOT_PATH} 갱신 완료. (${elapsedSeconds}초)`);
  return blocking.length > 0 ? 2 : 0;
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(`${LOG} 예상치 못한 실패:`, error);
    process.exitCode = 1;
  });
