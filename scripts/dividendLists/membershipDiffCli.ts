import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

import { UNIVERSE_SNAPSHOT_PATH } from './snapshotIo';
import {
  assessCollectionHealth,
  diffUniverseMembership,
  formatMembershipReport,
  HEALTH_MAX_FETCH_FAILED_RATIO,
  readUniverseMembership
} from './membershipDiff';
import type { UniverseMembershipView } from './membershipDiff';

/**
 * `npm run dividend:universe:diff` — 방금 수집한 후보 유니버스와 **직전 커밋본**을 비교해
 * "이 갱신을 크론이 자동으로 머지해도 되는가"를 판정한다.
 *
 * ```sh
 * # CI: 기준본을 git 에서 꺼내 두고 비교한다
 * git show HEAD:shared/constants/dividendLists/dividendLists.universe.generated.json > base.json
 * npm run dividend:universe:diff -- --base=base.json --summary=pr-body.md --github-output
 *
 * # 로컬: 지금 작업트리의 생성물이 직전 커밋본과 뭐가 다른지만 보고 싶을 때
 * npm run dividend:universe:diff -- --base=base.json
 * ```
 *
 * ## 종료 코드
 * | 코드 | 뜻 |
 * |---|---|
 * | 0 | 비교했다. **막혔는지 여부는 에러가 아니라 출력값**(`blocked`)이다. |
 * | 1 | 인자·파일·형식 문제로 비교 자체를 못 했다. |
 * | 3 | 🔴 수집 건강도 미달(대량 조회 실패) — **커밋하면 안 된다**. 워크플로가 이 코드를 보고 재시도한다. |
 *
 * 3번을 1번과 가른 이유: 1번은 사람이 고쳐야 할 버그고, 3번은 **기다렸다 다시 받으면 되는 상황**이다.
 * 셸에서 둘을 구분할 수 없으면 워크플로는 야후가 잠깐 막았을 때도 그냥 실패하거나, 더 나쁘게는
 * 실측치가 전부 비워진 파일을 커밋한다.
 *
 * 🔴 판정 로직은 여기 없다 — `membershipDiff.ts` 의 순수 함수다. 이 파일은 파일 읽기·출력·종료코드뿐이다.
 */
const LOG = '[dividend:universe:diff]';

type CliOptions = {
  headPath: string;
  basePath: string | null;
  summaryPath: string | null;
  githubOutput: boolean;
  maxFetchFailedRatio: number;
};

const parseArgs = (argv: readonly string[]): { ok: true; value: CliOptions } | { ok: false; error: string } => {
  const options: CliOptions = {
    headPath: UNIVERSE_SNAPSHOT_PATH,
    basePath: null,
    summaryPath: null,
    githubOutput: false,
    maxFetchFailedRatio: HEALTH_MAX_FETCH_FAILED_RATIO
  };
  for (const arg of argv) {
    if (arg === '--github-output') options.githubOutput = true;
    else if (arg.startsWith('--head=')) options.headPath = arg.slice('--head='.length);
    else if (arg.startsWith('--base=')) options.basePath = arg.slice('--base='.length);
    else if (arg.startsWith('--summary=')) options.summaryPath = arg.slice('--summary='.length);
    else if (arg.startsWith('--max-fetch-failed=')) {
      const value = Number(arg.slice('--max-fetch-failed='.length));
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        return { ok: false, error: `--max-fetch-failed 은 0~1 사이여야 한다: ${arg}` };
      }
      options.maxFetchFailedRatio = value;
    } else return { ok: false, error: `모르는 인자: ${arg}` };
  }
  return { ok: true, value: options };
};

const readSnapshot = (path: string, label: string): UniverseMembershipView =>
  readUniverseMembership(JSON.parse(readFileSync(path, 'utf8')), label);

/** GitHub Actions 스텝 출력. 값에 개행이 들어가면 파일 형식이 깨지므로 한 줄로만 쓴다. */
const writeStepOutputs = (outputs: Record<string, string>): void => {
  const target = process.env.GITHUB_OUTPUT;
  if (!target) {
    console.warn(`${LOG} GITHUB_OUTPUT 이 없어 스텝 출력을 건너뛴다(로컬 실행).`);
    return;
  }
  const body = Object.entries(outputs)
    .map(([key, value]) => `${key}=${value.replace(/[\r\n]+/g, ' ')}`)
    .join('\n');
  appendFileSync(target, `${body}\n`, 'utf8');
};

const main = (): number => {
  const parsed = parseArgs(process.argv.slice(2));
  if (!parsed.ok) {
    console.error(`${LOG} ${parsed.error}`);
    console.error('Usage: npm run dividend:universe:diff -- [--head=PATH] [--base=PATH] [--summary=PATH] [--github-output]');
    return 1;
  }
  const options = parsed.value;

  let head: UniverseMembershipView;
  try {
    head = readSnapshot(options.headPath, '이번 수집본');
  } catch (error) {
    console.error(`${LOG} ✖ 이번 수집본을 읽지 못했다(${options.headPath}): ${String(error)}`);
    return 1;
  }

  /*
   * 기준본이 없는 것은 **에러가 아니다** — 이 파이프라인을 처음 도입한 커밋에는 직전 생성물이 없다.
   * 대신 판정은 "막는다"로 간다(`diffUniverseMembership` 이 baselineMissing 을 그렇게 다룬다).
   */
  let base: UniverseMembershipView | null = null;
  if (options.basePath) {
    try {
      base = readSnapshot(options.basePath, '직전 커밋본');
    } catch (error) {
      console.warn(`${LOG} ⚠ 직전 커밋본을 읽지 못했다(${options.basePath}): ${String(error)}`);
      console.warn(`${LOG}   → 비교 없이 "구성 변화 있음"으로 다룬다(자동 머지 금지).`);
    }
  } else {
    console.warn(`${LOG} ⚠ --base 가 없다. 비교 기준이 없으므로 자동 머지를 막는다.`);
  }

  /* 1) 건강도부터 본다. 대량 조회 실패는 비교가 통과해도 커밋하면 안 되는 상태다. */
  const health = assessCollectionHealth(head, options.maxFetchFailedRatio);
  if (!health.ok) {
    console.error(`${LOG} ✖ 수집 건강도 미달: ${health.detail}`);
    console.error(`${LOG}   → 커밋하지 않는다. 잠시 뒤 다시 받아야 한다(종료코드 3).`);
    return 3;
  }

  /* 2) 구성 비교. */
  const diff = diffUniverseMembership(base, head);
  console.log(`${LOG} 후보 ${diff.counts.base}종 → ${diff.counts.head}종 · ${health.detail}`);
  console.log(
    `${LOG} 편입 ${diff.addedTickers.length} · 제외 ${diff.removedTickers.length} · ` +
      `편입ETF 변화 ${diff.etfChanges.length} · 새 막는 신고 ${diff.newBlockingIssues.length}`
  );
  for (const member of diff.removedTickers) console.warn(`${LOG}   − ${member.ticker} ${member.name}`);
  for (const member of diff.addedTickers) console.log(`${LOG}   + ${member.ticker} ${member.name}`);
  for (const change of diff.etfChanges) {
    console.warn(`${LOG}   ~ ${change.ticker} ETF 변화 (빠짐 ${change.left.join('+') || '없음'} / 편입 ${change.joined.join('+') || '없음'})`);
  }
  for (const issue of diff.newBlockingIssues) console.warn(`${LOG}   ⚠ ${issue.ticker} [${issue.kind}] ${issue.detail}`);
  console.log(
    diff.blocked
      ? `${LOG} 🟥 자동 머지 금지 — ${diff.blockReasons.join(' / ')}`
      : `${LOG} 🟩 필드만 바뀌었다 — 예약 실행이면 자동 머지해도 된다.`
  );

  /* 3) PR 본문. 사람이 이 글만 읽고 머지 여부를 정할 수 있어야 한다. */
  if (options.summaryPath) {
    writeFileSync(options.summaryPath, formatMembershipReport(diff, head, health), 'utf8');
    console.log(`${LOG} PR 본문을 ${options.summaryPath} 에 썼다.`);
  }

  if (options.githubOutput) {
    writeStepOutputs({
      blocked: String(diff.blocked),
      membership_changed: String(diff.membershipChanged),
      baseline_missing: String(diff.baselineMissing),
      block_reason: diff.blockReasons.join(' / '),
      added_count: String(diff.addedTickers.length),
      removed_count: String(diff.removedTickers.length),
      etf_change_count: String(diff.etfChanges.length),
      new_issue_count: String(diff.newBlockingIssues.length),
      added: diff.addedTickers.map((member) => member.ticker).join(','),
      removed: diff.removedTickers.map((member) => member.ticker).join(','),
      base_count: String(diff.counts.base),
      head_count: String(diff.counts.head),
      summary_path: options.summaryPath ?? ''
    });
  }
  return 0;
};

try {
  process.exitCode = main();
} catch (error) {
  console.error(`${LOG} 예상치 못한 실패:`, error);
  process.exitCode = 1;
}
