/**
 * 커뮤니티 화면 설정 상수 — 순수 값만. IO/컴포넌트 없음.
 *
 * 데이터 레이어(`shared/lib/supabase`)의 상수와 겹치는 값은 여기서 다시 정의하지 않고
 * 그쪽 것을 그대로 쓴다(POST_TITLE_MAX_LENGTH 등). 여기엔 UI 전용 값만 둔다.
 */

import type { PostCategory } from '@/shared/lib/supabase';

/**
 * URL 쿼리 파라미터 이름. 목록 상태를 링크로 공유/새로고침해도 복원되게 한다.
 *
 * 정밀 검색 facet 파라미터(mdmin·mdmax·tgtmin·durmin·durmax)는 canonical **원(KRW)·년** 단위로
 * 싣는다(sim_summary·엔진과 1:1 — UI만 만원/년으로 표기). 빈 값이면 param을 삭제한다(sort/q 관례와 동일).
 */
export const COMMUNITY_QUERY_PARAM = {
  sort: 'sort',
  query: 'q',
  /** 검색 기준(제목/내용/요약). `fetchGalleryPage`가 ILIKE 대상 컬럼 선택에 사용한다. */
  queryFilter: 'qf',
  /** 최종(마지막 해) 월 배당 ≥ (원) — final_monthly_dividend gte. */
  mdMin: 'mdmin',
  /** 최종(마지막 해) 월 배당 ≤ (원) — final_monthly_dividend lte. */
  mdMax: 'mdmax',
  /** 목표 월 배당 ≥ (원) — target_monthly_dividend gte. 이상(≥) 단일이라 상한 없음. */
  tgtMin: 'tgtmin',
  /** 투자 기간 ≥ (년) — duration_years gte. */
  durMin: 'durmin',
  /** 투자 기간 ≤ (년) — duration_years lte. */
  durMax: 'durmax',
  /**
   * 게시판 글 분류 필터 — 콤마 조인 다중값(`?cat=question,insight`).
   * 비어 있으면(=All) param 자체를 삭제한다(sort/q 관례와 동일). 파싱·직렬화는 `boardFilters.ts`.
   */
  category: 'cat'
} as const;

/**
 * 정밀 검색 "종목(티커)" 필터 게이트. 파생 컬럼·자동완성 소스가 준비되기 전(G2)까지 **false** —
 * 필터 패널에서 티커 섹션 자체를 렌더하지 않는다(dead UI 회피). 준비되면 true로만 바꾼다.
 */
export const TICKER_FILTER_ENABLED = false;

/**
 * 검색 기준 — 실제 검색에 반영된다(데이터 레이어 `buildSearchFilter`가 대상 컬럼을 고른다).
 * - 제목(title) / 요약(description): pg_trgm GIN 인덱스가 있어 ILIKE 부분일치가 빠르다.
 * - 내용(body): 리치 본문 HTML이라 인덱스가 없어 비인덱스 ILIKE로 검색한다(데이터가 적을 땐 문제없음).
 * (작성자 검색은 profiles 조인이 필요해 현재 데이터 레이어가 지원하지 않으므로 노출하지 않는다.)
 */
export const COMMUNITY_SEARCH_FILTERS = [
  { id: 'title', label: '제목' },
  { id: 'body', label: '내용' },
  { id: 'description', label: '요약' }
] as const;

export type CommunitySearchFilterId = (typeof COMMUNITY_SEARCH_FILTERS)[number]['id'];

export const DEFAULT_COMMUNITY_SEARCH_FILTER: CommunitySearchFilterId = 'title';

/** 검색 입력 디바운스(ms). */
export const COMMUNITY_SEARCH_DEBOUNCE_MS = 300;

/** 본문 plain-text 글자수 상한(UX 보조 카운터용). 실제 게시 차단 기준은 아래 바이트 상한. */
export const COMMUNITY_BODY_MAX_LENGTH = 20_000;

/**
 * 실제 게시 차단 기준 — 서버 마이그레이션 `posts_body_len`의 `octet_length(body) <= 65536`과
 * **동일 기준**(sanitize된 HTML의 UTF-8 바이트). 한글은 코드포인트당 3바이트라 plain 글자수만으로는
 * 서버 거절을 예측할 수 없다 → 저장되는 HTML 바이트로 검증한다.
 */
export const COMMUNITY_BODY_MAX_BYTES = 65_536;

/** 요약 자동 발췌 길이(본문 plain-text 앞부분). */
export const COMMUNITY_DESCRIPTION_EXCERPT_LENGTH = 120;

// ── 자유게시판 글 분류(posts.category) ────────────────────────────────────────

/**
 * 분류 기본값. 서버 컬럼 default 와 **같은 값**이어야 한다(마이그레이션 20260726000000).
 * 저장 경로는 "기본값이면 키 자체를 안 보낸다"로 동작하므로 이 값이 어긋나면 조용히 틀어진다.
 */
export const DEFAULT_POST_CATEGORY: PostCategory = 'free';

/**
 * 드롭다운 표시 순서 — 자유 · 질문과 고민 · 인사이트 · 건의사항 · 공지.
 * 글쓴이가 가장 자주 고르는 순서로 두고, 운영자 전용 항목을 마지막에 둔다.
 * ⚠ 여기에 값을 추가하면 `COMMUNITY_COPY.write.categoryLabels` 에도 같은 키가 있어야 하고
 *   (TS 가 강제한다), 서버 CHECK 제약(마이그레이션 20260727000000)도 함께 넓혀야 한다.
 */
export const POST_CATEGORY_IDS: readonly PostCategory[] = [
  'free',
  'question',
  'insight',
  'suggestion',
  'notice'
];

/** 운영자에게만 **선택지로** 노출되는 분류. ⚠ UI 제한일 뿐 서버가 막지 않는다(RLS 없음). */
export const ADMIN_ONLY_POST_CATEGORIES: readonly PostCategory[] = ['notice'];

// ── 파이어족들 지면 (2026-08-09 사용자 결정) ─────────────────────────────────

/**
 * 파이어족들 지면의 **작성 권한**.
 *
 * ## 🔴 이 상수는 방어선이 아니라 안내다
 *
 * 진짜 차단은 **DB 가 한다** — 마이그레이션 `20260810000001` 이 `posts` INSERT 정책에
 * `kind <> 'fire' or profiles.is_admin` 을 걸어 두었다. anon 키로 PostgREST 를 직접 때려도
 * 들어가지 않는다. 이 상수가 하는 일은 **쓸 수 없는 사람에게 버튼을 보이지 않는 것**뿐이다.
 *
 * 그래서 이 값을 `false` 로 바꿔도 아무나 쓰게 되지 않는다(DB 가 여전히 막는다). 반대로 DB
 * 정책만 풀고 이것을 두면 버튼이 안 보일 뿐 쓸 수는 있다 — **둘은 짝이고, 정본은 DB 다.**
 *
 * ⚠ `is_admin` 은 update GRANT 가 없어(20260725000000) 자가 승격이 불가능하다. 그래서 이 값을
 *   권한 조건으로 쓰는 것이 안전하다 — 다른 곳에서 is_admin 을 "표시 힌트"라고 부른 것과
 *   모순처럼 보이지만, 여기서는 **DB 정책이 같은 조건을 쥐고 있어서** 힌트가 아니라 사실이다.
 */
export const COMMUNITY_FIRE_WRITE_ADMIN_ONLY = true;

/**
 * 이 사용자가 파이어족들 영상을 올릴 수 있는가.
 *
 * 🔴 **보기 게이트가 없다.** 종전 뉴스 지면은 "볼 수 없는 사람은 쓸 수도 없다"로 두 게이트를
 *    곱했지만, 파이어족들은 **누구나 본다**. 제한은 쓰기에만 있다.
 */
export const canWriteCommunityFire = (isAdmin: boolean): boolean => !COMMUNITY_FIRE_WRITE_ADMIN_ONLY || isAdmin;

/**
 * 서버가 준 값을 신뢰하지 않고 정규화한다.
 * - 마이그레이션 전 → 컬럼 자체가 없어 `undefined` → 'free'
 * - 다른 클라이언트가 넣은 미지의 값 → 'free'
 */
export const toPostCategory = (value: unknown): PostCategory =>
  POST_CATEGORY_IDS.includes(value as PostCategory) ? (value as PostCategory) : DEFAULT_POST_CATEGORY;

/**
 * 이 사용자가 고를 수 있는 분류 목록. 비운영자는 '공지'가 빠져 4개다.
 * `current`(수정 중인 글의 현재 값)가 목록에 없으면 **뒤에 덧붙인다** — 운영자가 쓴 공지를
 * 작성자 본인(비운영자)이 수정할 때 선택지가 없어 값이 조용히 '자유'로 리셋되는 것을 막는다.
 */
export const getSelectablePostCategories = (
  isAdmin: boolean,
  current?: PostCategory
): readonly PostCategory[] => {
  const allowed = isAdmin
    ? POST_CATEGORY_IDS
    : POST_CATEGORY_IDS.filter((id) => !ADMIN_ONLY_POST_CATEGORIES.includes(id));
  return current && !allowed.includes(current) ? [...allowed, current] : allowed;
};
