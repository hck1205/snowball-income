/**
 * 배당 목록 갱신의 멤버십 변화 판정기 — 커밋된 생성물(HEAD)과 방금 만든 생성물(작업 트리)을 비교한다.
 *
 * ```sh
 * npm run dividend:lists:membership
 * ```
 *
 * - `$GITHUB_OUTPUT` 이 있으면 `changed=true|false` 를 쓴다(워크플로가 자동 머지 여부를 가른다).
 * - `$MEMBERSHIP_SUMMARY` 경로가 있으면 PR 본문용 요약 줄을 그 파일에 쓴다.
 * 판정 규칙은 `listsChange.ts` 머리말.
 *
 * 🔴 어느 파일이든 읽지 못하면 **변화 있음**으로 판정한다 — 모르면 사람에게 넘긴다.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

import { diffDividendListMembership, formatMembershipDeltas } from './listsChange';

const LOG = '[lists-membership]';
const FILES = {
  lists: 'shared/constants/dividendLists/dividendLists.generated.json',
  hiddenStars: 'shared/constants/dividendLists/dividendLists.hiddenStars.generated.json',
  dex: 'shared/constants/dividendDex/dividendDex.generated.json'
} as const;

type Snapshots = { lists: unknown; hiddenStars: unknown; dex: unknown };

const readCommitted = (path: string): unknown =>
  JSON.parse(execFileSync('git', ['show', `HEAD:${path}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
const readWorking = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));

const load = (read: (path: string) => unknown): Snapshots => ({
  lists: read(FILES.lists),
  hiddenStars: read(FILES.hiddenStars),
  dex: read(FILES.dex)
});

const emit = (changed: boolean, lines: readonly string[]): void => {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  if (process.env.MEMBERSHIP_SUMMARY) writeFileSync(process.env.MEMBERSHIP_SUMMARY, `${lines.join('\n')}\n`, 'utf8');
};

const main = (): number => {
  let before: Snapshots;
  let after: Snapshots;
  try {
    before = load(readCommitted);
    after = load(readWorking);
  } catch (error) {
    console.error(`${LOG} 생성물을 읽지 못했다 — 변화 있음으로 판정한다(사람이 본다): ${String(error)}`);
    emit(true, ['- 생성물을 비교하지 못했다 — 변화 여부를 사람이 확인해야 한다.']);
    return 0;
  }

  const deltas = diffDividendListMembership(before, after);
  const lines = formatMembershipDeltas(deltas);
  if (deltas.length === 0) console.log(`${LOG} 멤버십 그대로 — 값만 바뀌었다.`);
  else for (const line of lines) console.log(`${LOG} ${line}`);
  emit(deltas.length > 0, lines);
  return 0;
};

process.exitCode = main();
