/**
 * 배당 목록 지표 갱신기 — 배당 목록 네 개(킹·귀족·챔피언·히든스타) 종목의 선행 배당률·5년 성장률을 야후로 재서 쓴다.
 *
 * ```sh
 * npm run dividend:metrics                 # 재 보기만(파일 안 씀)
 * npm run dividend:metrics -- --write      # 생성물 갱신
 * npm run dividend:metrics -- --delay=800  # 요청 간격(ms, 기본 1200)
 * ```
 *
 * 왜 따로 재는지·실패를 어떻게 다루는지는 `metrics.ts` 머리말. 이 파일은 I/O 만 한다.
 * ⚠ `refresh-dividend-lists.yml` 에서 `dividend:lists` **뒤에** 돈다 — 그 단계가 귀족 구성을 새로 쓰므로
 *   새 프로세스에서 import 해야 이번 달 구성으로 잰다(이 CLI 가 따로 실행되는 이유).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

import { DIVIDEND_LISTS } from '@/shared/constants/dividendLists';

import { assembleDividendMetrics, collectMeasureTargets, type DividendMetricsFile } from './metrics';
import { collectUniverseMetrics } from './universe';

const LOG = '[dividend-metrics]';
const OUT = resolve(process.cwd(), 'shared/constants/dividendLists/dividendLists.metrics.generated.json');

/**
 * 지표를 얹는 목록 — **넷 다**(배럴의 `withMetrics` 가 네 목록 전부에 이 파일을 얹는다).
 *
 * 🔴 히든스타도 잰다(2026-11-06). 처음에는 "히든스타는 자기 생성물에 유니버스 지표를 싣는다"며 뺐는데,
 *   그 유니버스가 바로 사람 확인 전까지 머지가 멈추는 자료다 — 빼 두면 히든스타 배당률만 다시 그
 *   적체에 묶인다. ⚠ 이 단계는 히든스타 재선정(`dividend:hidden-stars`)보다 **먼저** 돌아 지난달
 *   선정분을 잰다. 이번 달 새로 뽑힌 종목은 다음 달까지 유니버스 값을 그대로 쓴다.
 */
const MEASURED_LIST_IDS = ['kings', 'aristocrats', 'champions', 'hiddenStars'] as const;

const parseArgs = (argv: readonly string[]): { write: boolean; delayMs: number } | string => {
  let write = false;
  let delayMs = 1200;
  for (const arg of argv) {
    if (arg === '--write') write = true;
    else if (arg.startsWith('--delay=')) {
      const value = Number(arg.slice('--delay='.length));
      if (!Number.isFinite(value) || value < 0) return `--delay 값이 숫자가 아니다: ${arg}`;
      delayMs = value;
    } else return `모르는 인자: ${arg}`;
  }
  return { write, delayMs };
};

const readPrevious = (): DividendMetricsFile['metrics'] => {
  try {
    return (JSON.parse(readFileSync(OUT, 'utf8')) as Partial<DividendMetricsFile>).metrics ?? {};
  } catch {
    return {};
  }
};

const main = async (): Promise<number> => {
  const options = parseArgs(process.argv.slice(2));
  if (typeof options === 'string') {
    console.error(`${LOG} ${options}`);
    return 1;
  }

  // KST 기준 날짜 — 워크플로가 TZ=Asia/Seoul 을 심는다(다른 갱신기와 같은 규약).
  const asOf = new Date().toLocaleDateString('sv-SE');
  const targets = collectMeasureTargets(MEASURED_LIST_IDS.map((id) => DIVIDEND_LISTS[id]));
  console.log(`${LOG} ${targets.length}종을 잰다(간격 ${options.delayMs}ms)...`);

  const audits = await collectUniverseMetrics(
    targets.map((target) => ({
      ticker: target.ticker,
      name: target.name,
      nameSource: 'wikipedia' as const,
      // 섹터는 이 파일이 쓰지 않는다. null 이면 `sectorMissing`(막지 않는 신고)만 붙는다.
      sector: null,
      sourceSectorLabel: null,
      sourceEtfs: [],
      minimumStreakYears: target.minimumStreakYears
    })),
    {
      delayMs: options.delayMs,
      currentYear: new Date().getUTCFullYear(),
      nowEpochSeconds: Math.floor(Date.now() / 1000),
      measuredAt: asOf,
      onProgress: (message) => process.stdout.write(`\r${LOG} ${message}          `)
    }
  );
  process.stdout.write('\n');

  const result = assembleDividendMetrics(audits, readPrevious(), asOf);
  if (!result.ok) {
    console.error(`${LOG} ✖ ${result.reason}. 파일을 쓰지 않는다 — 지난 생성물이 그대로 남는다.`);
    console.error(`${LOG}   실패: ${result.failed.join(', ')}`);
    return 1;
  }

  const entries = Object.values(result.file.metrics);
  const withYield = entries.filter((entry) => entry.forwardYieldPercent !== null).length;
  console.log(`${LOG} ${entries.length}종 기록 · 배당률 ${withYield}종 · 검산에 걸려 비움 ${result.blocked.length}종 · 조회 실패로 지난 값 유지 ${result.kept.length}종`);
  for (const audit of audits) {
    for (const issue of audit.issues.filter((item) => item.blocking)) {
      console.warn(`${LOG}   ⚠ ${issue.ticker} [${issue.kind}] ${issue.detail}`);
    }
  }

  if (!options.write) {
    console.log(`${LOG} --write 가 없어 파일을 쓰지 않았다.`);
    return 0;
  }
  writeFileSync(OUT, `${JSON.stringify(result.file, null, 2)}\n`, 'utf8');
  console.log(`${LOG} 갱신 완료 (기준일 ${asOf}).`);
  return 0;
};

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(`${LOG} 예상치 못한 실패:`, error);
    process.exitCode = 1;
  });
