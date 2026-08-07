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

// ── 미디어 뉴스 게이트 (2026-08-08 사용자 결정) ───────────────────────────────

/**
 * 미디어 뉴스를 **일반 사용자에게 공개하는가.** 2026-08-08 사용자 결정으로 임시 `false`.
 *
 * 🔴 코드는 한 줄도 지우지 않았다 — 화면·훅·카드·라우트·마이그레이션 전부 그대로 있고,
 *    이 상수를 `true` 로 되돌리면 원래대로 돌아온다. "잠시 닫는다"와 "없앤다"는 다른 일이고,
 *    지웠다가 되살리면 그 사이에 다른 코드가 움직여 되돌리기가 이사가 된다.
 *
 * `false` 일 때 무엇이 사라지나:
 *   - nav 묶음의 '미디어 뉴스' 항목 (PrimaryNav / NavDrawer — 상수 배열에서 뺐다)
 *   - `/community/news`·`news/share`·`news/:id` 진입 (CommunityNewsGate 가 안내로 대체)
 * 관리자(profiles.is_admin)는 **그대로 들어간다** — 닫아 두는 동안에도 운영자가 화면을
 * 확인하고 글을 쌓아 둘 수 있어야 한다는 사용자 결정이다. nav 에는 없으므로 주소로 들어간다
 * (`/community/news`). nav 항목까지 관리자 조건부로 만들지 않은 이유는 PrimaryNav 주석 참고.
 */
export const COMMUNITY_NEWS_PUBLIC = false;

/**
 * 뉴스 글 작성을 **운영자에게만** 여는가. 2026-08-08 사용자 결정으로 `true`.
 *
 * 🔴 이건 `COMMUNITY_NEWS_PUBLIC` 과 **다른 축**이다. 지금은 둘 다 켜져 있어 결과가 같아
 *    보이지만(뉴스 자체가 운영자만 보이니까), 나중에 뉴스를 다시 공개해도
 *    (`COMMUNITY_NEWS_PUBLIC = true`) **작성은 운영자만**으로 남는다. 그 순간을 위해 나눠 둔다.
 *
 * ⚠ **UI 수준 차단이다 — 서버는 막지 않는다.** anon 키로 REST 를 직접 때리면 여전히
 *   `kind='news'` 행을 만들 수 있다. 기존 '공지' 분류(ADMIN_ONLY_POST_CATEGORIES)와 같은 수준이고,
 *   is_admin 을 "권한이 아니라 표시 힌트"로 못 박은 20260725000000 마이그레이션의 방침 그대로다.
 *   DB 로 강제하려면 posts INSERT 정책에 `kind <> 'news' or profiles.is_admin` 를 더하면 된다
 *   (is_admin 은 update GRANT 가 없어 자가 승격이 불가능하므로 그 조건은 안전하다).
 *   2026-08-08 사용자 판단으로 **그 결정은 보류**했다 — 필요해지면 여기 주석을 근거로 올린다.
 */
export const COMMUNITY_NEWS_WRITE_ADMIN_ONLY = true;

/** 이 사용자가 미디어 뉴스 지면을 볼 수 있는가. 닫혀 있어도 운영자는 본다. */
export const canViewCommunityNews = (isAdmin: boolean): boolean => COMMUNITY_NEWS_PUBLIC || isAdmin;

/**
 * 이 사용자가 뉴스 링크를 공유(작성)할 수 있는가.
 * 볼 수 없는 사람은 쓸 수도 없다 — 두 게이트를 곱해 "목록은 막혔는데 작성 화면은 열린" 틈을 없앤다.
 */
export const canWriteCommunityNews = (isAdmin: boolean): boolean =>
  canViewCommunityNews(isAdmin) && (!COMMUNITY_NEWS_WRITE_ADMIN_ONLY || isAdmin);

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
