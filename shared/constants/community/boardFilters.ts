import type { PostCategory } from '@/shared/lib/supabase';
import { COMMUNITY_QUERY_PARAM, POST_CATEGORY_IDS } from './config';

/**
 * 게시판 "글 분류" 필터 — **UI/URL 계약**(순수 값·함수만, IO·컴포넌트 없음).
 *
 * `BoardCategoryFilter`(칩 줄) ↔ URL(`?cat=question,insight`) ↔ `useBoard` 세 곳이 이 한 모듈을
 * 공유해 "누른 칩 = 링크에 실린 값 = 목록에 적용된 조건"이 어긋나지 않게 한다.
 * 구조는 갤러리 정밀검색(`galleryFilters.ts`)의 parse/serialize 쌍을 그대로 미러한다.
 *
 * ## 🔴 All 과 개별 분류의 관계 (2026-08-04 사용자 지시 — 다중 선택)
 * - **선택 집합이 비어 있는 상태 = All** 이다. All 은 여섯 번째 분류가 아니라 "조건 없음"이라서
 *   URL 에도 아무것도 싣지 않는다(param 삭제). 그래서 기본값이 곧 All 이고, 링크를 공유해도
 *   기본 상태가 재현된다.
 * - **All 을 누르면 나머지가 전부 해제된다**(=집합을 비운다). 반대로 개별 분류를 하나라도 누르면
 *   All 은 자동으로 꺼진 것처럼 보인다 — 별도 상태가 아니라 "집합이 비었는가"의 표시일 뿐이다.
 * - **개별 분류를 전부 켜면 다시 All 로 접는다**(`normalize` 가 5개 전부를 빈 집합으로 되돌린다).
 *   5개 전부를 조건으로 거는 것과 조건을 안 거는 것은 결과가 같은데, URL 만 길어지고 "All 이
 *   꺼져 보이는" 모순된 화면이 된다.
 * - **마지막 하나를 다시 누르면**(집합이 비면) 자연히 All 로 돌아간다 — 빈 목록에 갇히지 않는다.
 */

/** URL·집합 표현을 하나로 정규화한다: 미지값 제거 → 중복 제거 → `POST_CATEGORY_IDS` 순서 → 전체면 빈 집합. */
const normalize = (values: readonly string[]): readonly PostCategory[] => {
  const picked = POST_CATEGORY_IDS.filter((id) => values.includes(id));
  // 전부 고른 것은 "필터 없음"과 결과가 같다 — All 로 접어 URL·화면 상태를 하나로 유지한다.
  return picked.length === POST_CATEGORY_IDS.length ? [] : picked;
};

/**
 * URLSearchParams → 선택된 분류들. 오염 값(`?cat=foo,question`)은 개별 항목만 떨어져 나가고
 * 나머지는 유효하다(갤러리 `parseBound` 와 같은 태도 — 조용히 버리고 화면은 살린다).
 */
export const parseBoardCategories = (params: URLSearchParams): readonly PostCategory[] => {
  const raw = params.get(COMMUNITY_QUERY_PARAM.category);
  if (!raw) return [];
  return normalize(raw.split(',').map((value) => value.trim()));
};

/**
 * 선택된 분류들 → 갱신된 URLSearchParams. **분류 param 만** 세팅/삭제하고 나머지는 `prev` 보존.
 * 빈 집합(All)이면 param 을 삭제한다 — 기본 상태의 URL 이 깨끗해야 공유 링크가 짧다.
 */
export const serializeBoardCategories = (
  prev: URLSearchParams,
  categories: readonly PostCategory[]
): URLSearchParams => {
  const next = new URLSearchParams(prev);
  const normalized = normalize(categories);
  if (normalized.length === 0) next.delete(COMMUNITY_QUERY_PARAM.category);
  else next.set(COMMUNITY_QUERY_PARAM.category, normalized.join(','));
  return next;
};

/**
 * 칩 하나를 뒤집은 결과. 화면은 이 함수만 부르고 "지금 켜져 있나"를 스스로 판단하지 않는다
 * (토글 규칙이 두 곳에 생기면 반드시 어긋난다).
 */
export const toggleBoardCategory = (
  categories: readonly PostCategory[],
  id: PostCategory
): readonly PostCategory[] =>
  normalize(categories.includes(id) ? categories.filter((value) => value !== id) : [...categories, id]);

/** 이 글이 선택된 분류에 걸리는가. 빈 집합(All)은 항상 참이다. */
export const matchesBoardCategories = (
  categories: readonly PostCategory[],
  category: PostCategory
): boolean => categories.length === 0 || categories.includes(category);

/** 분류 필터가 걸려 있는가(빈결과를 `filteredEmpty` 로 가를 때 쓴다). */
export const hasBoardCategoryFilter = (categories: readonly PostCategory[]): boolean => categories.length > 0;
