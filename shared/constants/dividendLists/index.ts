import { DIVIDEND_LIST_HUB_PATH, DIVIDEND_LIST_IDS, dividendListPath } from '@/shared/constants/routes';
import rawDividendLists from './dividendLists.generated.json';
import rawDividendMetrics from './dividendLists.metrics.generated.json';
import { CURATED_DIVIDEND_LISTS } from './dividendLists.curated';
import { dividendListsSnapshotSchema } from './dividendLists.schema';
import type { DividendList, DividendListId, DividendListsSnapshot } from './dividendLists.types';

export * from './dividendLists.sectors';
export * from './dividendLists.schema';
export * from './dividendLists.streak';
export * from './dividendLists.hiddenStars';
export * from './dividendLists.hiddenStars.data';
export type * from './dividendLists.types';
export { CURATED_DIVIDEND_LISTS, KINGS_STREAK_UNRESOLVED } from './dividendLists.curated';

/*
 * 후보 유니버스는 **타입·스키마만** 내보낸다. 생성물 JSON 은 여기서 import 하지 않는다 —
 * 이 배럴은 라우트 청크가 읽으므로, 264종짜리 수집 원본을 끌어오면 화면이 쓰지도 않는 데이터가
 * 번들에 실린다. 그 파일은 수집기가 fs 로 읽고 쓴다(`scripts/dividendLists/snapshotIo.ts`).
 */
export * from './dividendLists.universe.schema';
export * from './dividendLists.universe.types';

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

/**
 * 종목별 실측 지표(선행 배당률 · 5년 배당성장률)를 티커로 얹는다.
 *
 * ## 🔴 왜 별도 파일인가
 * 수집기의 원본 산출물(`dividendLists.universe.generated.json`)은 **172KB · 262종**이다. 그 안에는
 * 화면이 안 쓰는 것들(소스 ETF·하한·가격·최신지급일·삭감 신고)이 다 들어 있다. 그걸 그대로 import
 * 하면 라우트 청크가 그만큼 무거워진다 — 그래서 수집기가 **목록에 실린 종목만·화면이 쓰는 필드만**
 * 추려 이 파일로 따로 쓴다(117종 · 11KB). 유니버스 원본은 사람이 들여다보는 용도로 남는다.
 *
 * ## 🔴 왜 목록 오버레이와 달리 **종목 단위**인가
 * 위 `overlay()` 는 목록을 통째로 갈아 끼운다 — 편입/제외가 곧 목록의 내용이라 부분 병합하면
 * "빠진 종목"과 "아직 안 받은 종목"이 구분되지 않기 때문이다. 지표는 반대다. 멤버십과 무관하고
 * 종목마다 따로 실패할 수 있어(특별배당·주기 변경으로 계산 거부) **있는 것만 얹는 게** 맞다.
 *
 * ⚠ `undefined` 와 `null` 은 다른 사실이다 — 화면이 두 문장을 갈라 쓴다.
 *   지표 자체가 없으면 필드를 **안 만든다**(undefined = 아직 실측이 안 붙었다).
 *   실측은 했는데 그 종목만 계산 불가면 `null` 이 그대로 온다(예: 이력 6년 미만).
 *
 * 🔴 여기서 throw 하지 마라 — 라우트 청크가 import 한다(위 파서와 같은 이유).
 */
const METRICS: Record<string, { forwardYieldPercent?: number | null; fiveYearGrowthPercent?: number | null }> =
  (rawDividendMetrics as { metrics?: Record<string, { forwardYieldPercent?: number | null; fiveYearGrowthPercent?: number | null }> })
    .metrics ?? {};

const withMetrics = (list: DividendList): DividendList => ({
  ...list,
  members: list.members.map((member) => {
    const m = METRICS[member.ticker];
    if (!m) return member;
    return { ...member, forwardYieldPercent: m.forwardYieldPercent, fiveYearGrowthPercent: m.fiveYearGrowthPercent };
  })
});

export const DIVIDEND_LISTS: Record<DividendListId, DividendList> = Object.fromEntries(
  DIVIDEND_LIST_IDS.map((id) => [id, withMetrics(overlay()[id])])
) as Record<DividendListId, DividendList>;

/** 노출 순서대로의 목록 배열. 허브·사이트맵·크롤러 HTML 이 같은 순서를 쓴다. */
export const DIVIDEND_LIST_ALL: DividendList[] = DIVIDEND_LIST_IDS.map((id) => DIVIDEND_LISTS[id]);

/**
 * 경로·id 는 `shared/constants/routes`(의존성 0 리프)가 정본이다 — 라우터·nav·사이트맵이 목록
 * **데이터**를 끌어오지 않고 경로만 알 수 있어야 하기 때문. 여기서는 편의를 위해 재export 한다.
 */
export { DIVIDEND_LIST_HUB_PATH, dividendListPath };

/**
 * 라우트 파라미터·쿼리에서 온 임의 문자열을 목록 id 로 좁힌다. 모르면 `null`.
 *
 * 🔴 **id 와 경로 세그먼트를 둘 다 받는다.** `hiddenStars`(id) 와 `hidden-stars`(주소) 가 다르기
 *    때문이다(2026-08-08). 종전에는 `id === raw.toLowerCase()` 로 비교했는데, 카멜케이스 id 가
 *    생기는 순간 그 비교는 영영 실패한다 — 소문자로 내린 `hiddenstars` 는 어떤 id 와도 같지 않다.
 *    실제로 `/dividend/hidden-stars` 의 크롤러 HTML 이 빈 껍데기로 나갔고, 테스트가 그것을 잡았다.
 *    양쪽을 같은 방식으로 정규화(소문자 + 하이픈 제거)해 비교한다.
 */
const normalizeListKey = (raw: string): string => raw.trim().toLowerCase().replace(/-/g, '');

export const toDividendListId = (raw: string | null | undefined): DividendListId | null => {
  if (typeof raw !== 'string') return null;
  const key = normalizeListKey(raw);
  if (key.length === 0) return null;
  const found = DIVIDEND_LIST_IDS.find((id) => normalizeListKey(id) === key);
  return found ?? null;
};
