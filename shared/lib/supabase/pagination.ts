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

// ── 검색 ──────────────────────────────────────────────────────────────────

/**
 * ILIKE 검색 대상 컬럼. body(HTML)는 트라이그램 노이즈가 커서 제외 — title/description(plain text)만.
 * 마이그레이션의 scenarios_search_{title,description}_trgm GIN 인덱스와 대상이 일치한다.
 */
export const SEARCH_ILIKE_COLUMNS = ['title', 'description'] as const;

/**
 * 사용자 검색어를 PostgREST/SQL LIKE 메타문자로부터 안전하게 만든다.
 *
 * ⚠ 이 문자열은 supabase-js `.or(...)` 에 그대로 실린다. 위험 문자를 남겨두면:
 *   - `,` `(` `)` → `.or` 필터 목록 문법을 쪼갠다 (필터 주입).
 *   - `%` `_` `*` → SQL/PostgREST 와일드카드로 해석돼 매칭이 폭주한다.
 *   - `"` `\`     → 값 인용/이스케이프를 깨뜨린다.
 * 이들을 공백으로 중화하고 공백을 접는다. 우리가 의도한 `%term%`(contains) 와일드카드만 남긴다.
 * (한글/영문/숫자/`.`/`-`/`&` 등은 값의 뒷부분이라 필터 문법에 안전하므로 보존한다.)
 */
const sanitizeSearchTerm = (raw: string): string =>
  raw
    .replace(/[\\"%_*(),]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * 검색 필터 문자열을 만든다 — **순수 함수**. IO 없음, 테스트 대상.
 *
 * 반환 형태: `title.ilike.%TERM%,description.ilike.%TERM%` (supabase-js `.or()` 인자).
 * 빈/공백/전부-메타문자 검색어는 null → 호출부는 검색 없이 일반 목록으로 폴백한다.
 *
 * 이 필터는 fetchGalleryPage에서 키셋 `.or(...)` 와 **별개의 top-level `.or`** 로 추가된다.
 * PostgREST는 top-level 조건(is_public eq, 키셋 or, 검색 or)을 전부 AND로 결합하므로
 * 결과는 `is_public AND (키셋 튜플) AND (제목 OR 설명)` 이 된다.
 */
/**
 * 검색 기준(qf)별 ILIKE 대상 컬럼.
 * - title/description: pg_trgm GIN 인덱스가 있어 부분일치가 빠르다.
 * - body: 리치 본문 HTML이라 인덱스가 없다 → 비인덱스 ILIKE(데이터가 적을 땐 문제없음).
 * 미지정/알 수 없는 값은 하위호환을 위해 제목+요약(SEARCH_ILIKE_COLUMNS)으로 폴백한다.
 */
export const SEARCH_COLUMNS_BY_FILTER: Record<string, readonly string[]> = {
  title: ['title'],
  body: ['body'],
  description: ['description']
};

export const buildSearchFilter = (
  query: string | null | undefined,
  filter?: string | null
): string | null => {
  if (!query) return null;
  const term = sanitizeSearchTerm(query);
  if (term.length === 0) return null;
  const columns = (filter != null && SEARCH_COLUMNS_BY_FILTER[filter]) || SEARCH_ILIKE_COLUMNS;
  return columns.map((column) => `${column}.ilike.%${term}%`).join(',');
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
