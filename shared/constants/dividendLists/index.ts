import { DIVIDEND_LIST_HUB_PATH, DIVIDEND_LIST_IDS, dividendListPath } from '@/shared/constants/routes';
import rawDividendLists from './dividendLists.generated.json';
import { CURATED_DIVIDEND_LISTS } from './dividendLists.curated';
import { dividendListsSnapshotSchema } from './dividendLists.schema';
import type { DividendList, DividendListId, DividendListsSnapshot } from './dividendLists.types';

export * from './dividendLists.sectors';
export * from './dividendLists.schema';
export type * from './dividendLists.types';
export { CURATED_DIVIDEND_LISTS } from './dividendLists.curated';

/** 수집기를 한 번도 돌리지 않았거나 파일이 깨졌을 때의 스냅샷. 큐레이션 값만 남는다. */
export const EMPTY_DIVIDEND_LISTS_SNAPSHOT: DividendListsSnapshot = {
  asOf: null,
  source: 'none',
  lists: {}
};

/**
 * 생성물을 **방어적으로** 읽는다. 반쯤 쓰인 파일·스키마 드리프트가 화면을 죽이면 안 된다 —
 * 그 경우 큐레이션 목록으로 조용히 되돌아간다(`marketData` 와 같은 태도).
 *
 * 🔴 여기서 throw 하지 마라. 이 모듈은 라우트 청크가 import 하므로 예외가 나면 페이지가 통째로 빈다.
 */
export const parseDividendListsSnapshot = (raw: unknown): DividendListsSnapshot => {
  const parsed = dividendListsSnapshotSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn('[dividendLists] dividendLists.generated.json 형태가 맞지 않아 큐레이션 목록으로 대체한다.');
    return EMPTY_DIVIDEND_LISTS_SNAPSHOT;
  }
  return parsed.data as DividendListsSnapshot;
};

/** 빌드에 구워진 수집 스냅샷. */
export const DIVIDEND_LISTS_SNAPSHOT: DividendListsSnapshot = parseDividendListsSnapshot(rawDividendLists);

/**
 * 화면이 읽는 최종 목록 = **큐레이션 위에 수집 결과를 덮은 것**.
 *
 * 덮는 단위는 "목록 하나 통째로"다. 종목 단위로 병합하지 않는 이유: 편입/제외가 곧 목록의 내용이라
 * 부분 병합은 "빠진 종목"과 "아직 안 받은 종목"을 구분할 수 없다. 수집이 어떤 목록을 못 받으면 그
 * 목록만 큐레이션 값으로 남고, 나머지는 최신을 쓴다.
 */
const overlay = (): Record<DividendListId, DividendList> => {
  const merged = {} as Record<DividendListId, DividendList>;
  for (const id of DIVIDEND_LIST_IDS) {
    merged[id] = DIVIDEND_LISTS_SNAPSHOT.lists[id] ?? CURATED_DIVIDEND_LISTS[id];
  }
  return merged;
};

export const DIVIDEND_LISTS: Record<DividendListId, DividendList> = overlay();

/** 노출 순서대로의 목록 배열. 허브·사이트맵·크롤러 HTML 이 같은 순서를 쓴다. */
export const DIVIDEND_LIST_ALL: DividendList[] = DIVIDEND_LIST_IDS.map((id) => DIVIDEND_LISTS[id]);

/**
 * 경로·id 는 `shared/constants/routes`(의존성 0 리프)가 정본이다 — 라우터·nav·사이트맵이 목록
 * **데이터**를 끌어오지 않고 경로만 알 수 있어야 하기 때문. 여기서는 편의를 위해 재export 한다.
 */
export { DIVIDEND_LIST_HUB_PATH, dividendListPath };

/** 라우트 파라미터·쿼리에서 온 임의 문자열을 목록 id 로 좁힌다. 모르면 `null`. */
export const toDividendListId = (raw: string | null | undefined): DividendListId | null => {
  const found = DIVIDEND_LIST_IDS.find((id) => id === raw?.trim().toLowerCase());
  return found ?? null;
};
