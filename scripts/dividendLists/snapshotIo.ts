import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EMPTY_DIVIDEND_LISTS_SNAPSHOT,
  parseDividendListsSnapshot
} from '@/shared/constants/dividendLists';
import type { DividendListsSnapshot } from '@/shared/constants/dividendLists';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 앱과 수집기가 공유하는 단 하나의 생성물 경로. 두 벌이 되면 조용히 다른 파일을 보게 된다. */
export const SNAPSHOT_PATH = path.resolve(
  __dirname,
  '../../shared/constants/dividendLists/dividendLists.generated.json'
);

export const readSnapshotFile = async (logPrefix: string): Promise<DividendListsSnapshot> => {
  try {
    return parseDividendListsSnapshot(JSON.parse(await readFile(SNAPSHOT_PATH, 'utf8')));
  } catch {
    console.warn(`${logPrefix} ${SNAPSHOT_PATH} 를 읽지 못했다. 빈 스냅샷에서 시작한다.`);
    return EMPTY_DIVIDEND_LISTS_SNAPSHOT;
  }
};

/** 2칸 들여쓰기 + 끝 개행 — 목록 변경이 **git diff 로 사람 눈에 보여야** 이 파이프라인이 뜻을 갖는다. */
export const writeSnapshotFile = async (snapshot: DividendListsSnapshot): Promise<void> => {
  await writeFile(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
};
