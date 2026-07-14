import type { GalleryCursor, GallerySort, ScenarioListItem } from './types';

/**
 * Keyset(커서) 페이지네이션 — **순수 함수**. IO 없음, 테스트 대상.
 *
 * 왜 OFFSET이 아니라 keyset인가:
 *   - OFFSET은 페이지가 깊어질수록 앞의 행을 전부 스캔한다 (무료 티어에서 그대로 비용).
 *   - 목록이 갱신되면 페이지 경계에서 항목이 중복/누락된다.
 * keyset은 인덱스를 그대로 타고(scenarios_public_recent_idx / _popular_idx) 안정적이다.
 *
 * 정렬 키는 반드시 **유일**해야 한다. created_at만 쓰면 동률에서 행이 새거나 반복되므로
 * 항상 id를 타이브레이커로 붙인다.
 *   recent  : (created_at desc, id desc)
 *   popular : (like_count desc, created_at desc, id desc)
 */

export const GALLERY_PAGE_SIZE = 12;

/** 커서를 URL에 실어도 안전하도록 base64url로 인코딩한다. */
const toBase64Url = (raw: string): string => {
  const base64 = btoa(unescape(encodeURIComponent(raw)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (encoded: string): string => {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return decodeURIComponent(escape(atob(padded)));
};

export const encodeGalleryCursor = (cursor: GalleryCursor): string =>
  toBase64Url(JSON.stringify(cursor));

/** 손상된/조작된 커서는 던지지 않고 null을 반환한다 (첫 페이지로 폴백). */
export const decodeGalleryCursor = (encoded: string | null | undefined): GalleryCursor | null => {
  if (!encoded) return null;
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(encoded));
    if (!parsed || typeof parsed !== 'object') return null;

    const candidate = parsed as Record<string, unknown>;
    if (typeof candidate.createdAt !== 'string' || typeof candidate.id !== 'string') return null;
    if (candidate.likeCount !== undefined && typeof candidate.likeCount !== 'number') return null;

    return {
      createdAt: candidate.createdAt,
      id: candidate.id,
      ...(typeof candidate.likeCount === 'number' ? { likeCount: candidate.likeCount } : {})
    };
  } catch {
    return null;
  }
};

/** 페이지의 마지막 항목에서 다음 커서를 만든다. */
export const toGalleryCursor = (item: ScenarioListItem, sort: GallerySort): GalleryCursor => ({
  createdAt: item.created_at,
  id: item.id,
  ...(sort === 'popular' ? { likeCount: item.like_count } : {})
});

/**
 * PostgREST `.or(...)` 필터 문자열을 만든다 (튜플 비교를 흉내낸다).
 *
 * PostgREST에는 `(a,b) < (x,y)` 같은 행 비교가 없어서 OR로 펼쳐야 한다:
 *   recent  : created_at < T  OR (created_at = T AND id < I)
 *   popular : like_count < L
 *             OR (like_count = L AND created_at < T)
 *             OR (like_count = L AND created_at = T AND id < I)
 *
 * ⚠ 타임스탬프에는 '+'와 ':'가 들어간다. PostgREST 필터 값은 큰따옴표로 감싸야 안전하다.
 */
export const buildKeysetFilter = (sort: GallerySort, cursor: GalleryCursor): string => {
  const createdAt = `"${cursor.createdAt}"`;
  const id = `"${cursor.id}"`;

  if (sort === 'popular') {
    // likeCount가 없는 커서(정렬 전환 등)는 recent 규칙으로 안전하게 폴백한다
    if (typeof cursor.likeCount !== 'number') {
      return `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`;
    }
    const likeCount = cursor.likeCount;
    return [
      `like_count.lt.${likeCount}`,
      `and(like_count.eq.${likeCount},created_at.lt.${createdAt})`,
      `and(like_count.eq.${likeCount},created_at.eq.${createdAt},id.lt.${id})`
    ].join(',');
  }

  return `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`;
};

/** 정렬 키 목록 (supabase-js `.order()` 체이닝에 그대로 쓴다). */
export const getGalleryOrderKeys = (
  sort: GallerySort
): readonly { column: 'like_count' | 'created_at' | 'id'; ascending: boolean }[] =>
  sort === 'popular'
    ? [
        { column: 'like_count', ascending: false },
        { column: 'created_at', ascending: false },
        { column: 'id', ascending: false }
      ]
    : [
        { column: 'created_at', ascending: false },
        { column: 'id', ascending: false }
      ];

/**
 * limit+1개를 받아와서 "다음 페이지가 있는가"를 판별한다.
 * (COUNT 쿼리를 따로 날리지 않으려는 것 — 무료 티어에서 왕복 1회를 아낀다)
 */
export const splitPage = (
  rows: readonly ScenarioListItem[],
  pageSize: number,
  sort: GallerySort
): { items: ScenarioListItem[]; nextCursor: string | null } => {
  const hasMore = rows.length > pageSize;
  const items = hasMore ? rows.slice(0, pageSize) : rows.slice();
  const last = items[items.length - 1];

  return {
    items,
    nextCursor: hasMore && last ? encodeGalleryCursor(toGalleryCursor(last, sort)) : null
  };
};
