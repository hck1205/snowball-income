/**
 * 커뮤니티 화면 설정 상수 — 순수 값만. IO/컴포넌트 없음.
 *
 * 데이터 레이어(`shared/lib/supabase`)의 상수와 겹치는 값은 여기서 다시 정의하지 않고
 * 그쪽 것을 그대로 쓴다(SCENARIO_TITLE_MAX_LENGTH 등). 여기엔 UI 전용 값만 둔다.
 */

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
  durMax: 'durmax'
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
 * 실제 게시 차단 기준 — 서버 마이그레이션 `scenarios_body_len`의 `octet_length(body) <= 65536`과
 * **동일 기준**(sanitize된 HTML의 UTF-8 바이트). 한글은 코드포인트당 3바이트라 plain 글자수만으로는
 * 서버 거절을 예측할 수 없다 → 저장되는 HTML 바이트로 검증한다.
 */
export const COMMUNITY_BODY_MAX_BYTES = 65_536;

/** 요약 자동 발췌 길이(본문 plain-text 앞부분). */
export const COMMUNITY_DESCRIPTION_EXCERPT_LENGTH = 120;
