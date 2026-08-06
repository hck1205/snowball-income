import process from 'node:process';

import { DIVIDEND_LIST_IDS, dividendListsSnapshotSchema } from '@/shared/constants/dividendLists';
import type { DividendList, DividendListId, DividendListsSnapshot } from '@/shared/constants/dividendLists';

import { buildAristocratsList, collectionAsOf, fetchAristocratSources, verifyLists } from './collect';
import { ListSourceError } from './sources';
import { readSnapshotFile, SNAPSHOT_PATH, writeSnapshotFile } from './snapshotIo';

/**
 * `npm run dividend:lists` — 배당 연속 증배 목록 수집기.
 *
 * ## 무엇을 자동으로 하고, 무엇을 사람에게 남기는가
 * | 목록 | 자동 수집 | 근거 |
 * |---|---|---|
 * | 배당귀족 | ✅ ProShares NOBL 보유내역 + 위키피디아 교차검증 | 2026-08-04 실측 69/69 완전 일치 |
 * | 배당킹 | ❌ 큐레이션(`dividendLists.curated.ts`) | 무료 소스가 54종 vs 47종으로 갈리고 한쪽엔 오류가 있다 |
 * | 배당챔피언 | ❌ 큐레이션 | 공식 파일이 소멸했고 남은 소스가 하나뿐이다 |
 *
 * 세 목록 **전부**에 대해 `--verify` 는 야후 전기간 배당이력으로 **삭감 가드**를 돌린다. 가드는 목록을
 * 고치지 않고 신고만 한다 — 그래야 야후가 하루 이상해져도 화면이 무영향이다.
 *
 * ```sh
 * npm run dividend:lists                      # 받아서 차이만 출력(파일 안 씀)
 * npm run dividend:lists -- --write           # 배당귀족 목록을 생성물에 반영
 * npm run dividend:lists -- --verify --write  # 삭감 가드까지 돌려 함께 기록(약 180종 × 2초)
 * npm run dividend:lists -- --verify --delay=500 --only=kings
 * ```
 *
 * 🔴 외부 서비스에 **쓰기**를 하지 않는다. 읽기만 하고, 결과는 레포의 JSON 한 개에 커밋된다.
 */
const LOG = '[dividend:lists]';

type CliOptions = {
  write: boolean;
  verify: boolean;
  delayMs: number;
  /** 가드를 돌릴 목록을 좁힌다. 배당귀족 **수집**은 이 옵션과 무관하게 항상 시도한다. */
  only: DividendListId[] | null;
};

const parseArgs = (argv: readonly string[]): { ok: true; value: CliOptions } | { ok: false; error: string } => {
  const options: CliOptions = { write: false, verify: false, delayMs: 2000, only: null };
  for (const arg of argv) {
    if (arg === '--write') options.write = true;
    else if (arg === '--verify') options.verify = true;
    else if (arg.startsWith('--delay=')) {
      const value = Number(arg.slice('--delay='.length));
      if (!Number.isFinite(value) || value < 0) return { ok: false, error: `--delay 값이 잘못됐다: ${arg}` };
      options.delayMs = value;
    } else if (arg.startsWith('--only=')) {
      const ids = arg
        .slice('--only='.length)
        .split(',')
        .map((raw) => raw.trim())
        .filter((raw) => raw.length > 0);
      const unknown = ids.filter((id) => !DIVIDEND_LIST_IDS.includes(id as DividendListId));
      if (unknown.length > 0) return { ok: false, error: `모르는 목록: ${unknown.join(', ')}` };
      options.only = ids as DividendListId[];
    } else return { ok: false, error: `모르는 인자: ${arg}` };
  }
  return { ok: true, value: options };
};

const diffTickers = (before: readonly string[], after: readonly string[]) => ({
  added: after.filter((ticker) => !before.includes(ticker)),
  removed: before.filter((ticker) => !after.includes(ticker))
});

const main = async (): Promise<number> => {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed.ok) {
    console.error(`${LOG} ${parsed.error}`);
    console.error('Usage: npm run dividend:lists -- [--write] [--verify] [--delay=2000] [--only=kings,aristocrats]');
    return 1;
  }
  const options = parsed.value;
  const asOf = collectionAsOf();
  const previous = await readSnapshotFile(LOG);

  /* 1) 배당귀족 — 두 소스를 받아 조립한다. 실패하면 그 사실만 보고하고 큐레이션 값을 남긴다. */
  let aristocrats: DividendList | null = null;
  try {
    console.log(`${LOG} NOBL 보유내역 + 위키피디아 구성종목을 받는다...`);
    const { nobl, wikipedia } = await fetchAristocratSources();
    const result = buildAristocratsList(nobl, wikipedia, asOf);
    aristocrats = result.list;
    console.log(
      `${LOG} 배당귀족 ${result.list.members.length}종 (NOBL ${nobl.holdings.length} / 위키 ${wikipedia.length}, ` +
        `파일 기준일 ${result.fileAsOf ?? '알 수 없음'})`
    );
    if (result.unmatched.length > 0) {
      console.warn(`${LOG} ⚠ 위키피디아에 없어 **뺀** NOBL 종목: ${result.unmatched.join(', ')}`);
    }
    if (result.wikipediaOnly.length > 0) {
      console.warn(`${LOG} ⚠ 위키피디아에만 있는 종목(편입 판정은 NOBL 이 한다): ${result.wikipediaOnly.join(', ')}`);
    }
    const before = previous.lists.aristocrats?.members.map((member) => member.ticker) ?? [];
    if (before.length > 0) {
      const { added, removed } = diffTickers(
        before,
        result.list.members.map((member) => member.ticker)
      );
      console.log(`${LOG} 편입 후보: ${added.join(', ') || '없음'} / 제외 후보: ${removed.join(', ') || '없음'}`);
    }
  } catch (error) {
    if (!(error instanceof ListSourceError)) throw error;
    console.error(`${LOG} ✖ 배당귀족 수집 실패: ${error.message}`);
    console.error(`${LOG}   → 목록을 비우지 않는다. 큐레이션 값이 그대로 남는다.`);
  }

  const nextSnapshot: DividendListsSnapshot = {
    asOf: aristocrats ? asOf : previous.asOf,
    source: aristocrats ? 'proshares-nobl+wikipedia' : previous.source,
    lists: { ...previous.lists, ...(aristocrats ? { aristocrats } : {}) },
    verification: previous.verification
  };

  /* 2) 가드 — 세 목록의 종목을 야후 전기간 이력으로 훑어 삭감만 신고한다. */
  if (options.verify) {
    // 가드는 **이번에 쓸 목록**을 본다(방금 받은 배당귀족 + 큐레이션 배당킹·배당챔피언).
    const { DIVIDEND_LISTS } = await import('@/shared/constants/dividendLists');
    const target = {} as Record<DividendListId, DividendList>;
    for (const id of DIVIDEND_LIST_IDS) {
      if (options.only && !options.only.includes(id)) continue;
      target[id] = id === 'aristocrats' && aristocrats ? aristocrats : DIVIDEND_LISTS[id];
    }
    console.log(`${LOG} 삭감 가드를 돌린다(요청 간격 ${options.delayMs}ms). 시간이 걸린다...`);
    const result = await verifyLists(target, {
      delayMs: options.delayMs,
      onProgress: (message) => process.stdout.write(`\r${LOG} ${message}          `)
    });
    process.stdout.write('\n');
    nextSnapshot.verification = { checkedAt: asOf, checkedCount: result.checkedCount, flags: result.flags };
    console.log(`${LOG} 검사 ${result.checkedCount}종, 신고 ${result.flags.length}건`);
    for (const flag of result.flags) {
      console.warn(`${LOG}   ⚠ [${flag.listId}] ${flag.ticker} ${flag.kind}: ${flag.detail}`);
    }
  }

  /* 3) 쓰기 전 검증 — 형태가 깨진 스냅샷을 파일에 남기지 않는다. */
  const validated = dividendListsSnapshotSchema.safeParse(nextSnapshot);
  if (!validated.success) {
    console.error(`${LOG} ✖ 조립한 스냅샷이 스키마를 통과하지 못했다. 파일을 쓰지 않는다.`);
    console.error(validated.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n'));
    return 1;
  }

  if (!options.write) {
    console.log(`${LOG} --write 가 없어 파일을 쓰지 않았다. 반영하려면 --write 를 붙여라.`);
    return 0;
  }

  await writeSnapshotFile(nextSnapshot);
  console.log(`${LOG} ${SNAPSHOT_PATH} 갱신 완료.`);
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
