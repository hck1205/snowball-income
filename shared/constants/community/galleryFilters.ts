import type { GalleryFacetFilters } from '@/shared/lib/supabase';
import { COMMUNITY_QUERY_PARAM } from './config';

/**
 * 갤러리 "정밀 검색" 필터 — **UI/URL 계약**(순수 값·함수만, IO·컴포넌트 없음).
 *
 * PrecisionSearch 패널 ↔ URL(`?mdmin=`…) ↔ `useGallery` 세 곳이 이 한 모듈을 공유해
 * "패널에서 넣은 값 = 링크에 실린 값 = 조회에 쓰인 경계"가 어긋나지 않게 한다.
 *
 * 단위는 canonical: 금액=**원(KRW)**, 기간=**년**. UI(PrecisionSearch)만 만원/년으로 표기하고
 * 이 계층엔 원/년으로 넘긴다. 데이터 레이어의 `GalleryFacetFilters`(monthlyMin/…)로는
 * `toFacetFilters`가 키를 매핑한다(값·단위는 동일).
 */
export type GalleryFilters = {
  /** 최종 월 배당 ≥ (원). */
  mdMin?: number;
  /** 최종 월 배당 ≤ (원). */
  mdMax?: number;
  /** 목표 월 배당 ≥ (원) — 이상(≥) 단일. */
  tgtMin?: number;
  /** 투자 기간 ≥ (년). */
  durMin?: number;
  /** 투자 기간 ≤ (년). */
  durMax?: number;
};

/** 값이 실제 경계로 살아있는가(양의 유한 정수). 0/음수/NaN/undefined는 "경계 없음"으로 본다. */
const isActiveBound = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/**
 * URL 문자열 → 경계값. 정수 표기만 허용하고 음수/소수/공백/오염 값은 조용히 버린다(무필터).
 * 0은 무의미한 경계(≥0은 항상 참, ≤0은 빈 결과)라 경계 없음으로 취급한다.
 */
const parseBound = (raw: string | null): number | undefined => {
  if (raw == null || !/^\d+$/.test(raw)) return undefined;
  const n = Number(raw);
  return isActiveBound(n) ? n : undefined;
};

/** URLSearchParams → GalleryFilters (원/년). 오염 URL은 개별 값만 떨어져 나가고 나머지는 유효. */
export const parseGalleryFilters = (params: URLSearchParams): GalleryFilters => ({
  mdMin: parseBound(params.get(COMMUNITY_QUERY_PARAM.mdMin)),
  mdMax: parseBound(params.get(COMMUNITY_QUERY_PARAM.mdMax)),
  tgtMin: parseBound(params.get(COMMUNITY_QUERY_PARAM.tgtMin)),
  durMin: parseBound(params.get(COMMUNITY_QUERY_PARAM.durMin)),
  durMax: parseBound(params.get(COMMUNITY_QUERY_PARAM.durMax))
});

/**
 * GalleryFilters → 갱신된 URLSearchParams. **필터 param만** 세팅/삭제하고 나머지(sort/q/qf)는
 * `prev` 그대로 보존한다 → "초기화"가 정렬·텍스트 검색을 건드리지 않는 근거. 빈 값은 삭제(param 누적 방지).
 */
export const serializeGalleryFilters = (prev: URLSearchParams, filters: GalleryFilters): URLSearchParams => {
  const next = new URLSearchParams(prev);
  const put = (key: string, value: number | undefined): void => {
    if (isActiveBound(value)) next.set(key, String(Math.trunc(value)));
    else next.delete(key);
  };
  put(COMMUNITY_QUERY_PARAM.mdMin, filters.mdMin);
  put(COMMUNITY_QUERY_PARAM.mdMax, filters.mdMax);
  put(COMMUNITY_QUERY_PARAM.tgtMin, filters.tgtMin);
  put(COMMUNITY_QUERY_PARAM.durMin, filters.durMin);
  put(COMMUNITY_QUERY_PARAM.durMax, filters.durMax);
  return next;
};

/**
 * 활성 필터 **그룹** 수(0~3) — 트리거 배지·aria용. 사용자 멘탈모델("몇 개를 걸었나")에 맞춰
 * 월배당(min|max)·목표·기간(min|max)을 각각 1로 센다(경계 2개짜리 range를 2로 부풀리지 않는다).
 */
export const countActiveFilters = (filters: GalleryFilters): number => {
  let count = 0;
  if (isActiveBound(filters.mdMin) || isActiveBound(filters.mdMax)) count += 1;
  if (isActiveBound(filters.tgtMin)) count += 1;
  if (isActiveBound(filters.durMin) || isActiveBound(filters.durMax)) count += 1;
  return count;
};

/** 하나라도 활성 필터가 있는가(빈결과 분기 filteredEmpty 판정). */
export const hasAnyFilter = (filters: GalleryFilters): boolean => countActiveFilters(filters) > 0;

/**
 * UI/URL 모델(GalleryFilters) → 데이터 레이어 계약(GalleryFacetFilters). 키만 바꾼다(값·단위 동일):
 * mdMin→monthlyMin, mdMax→monthlyMax, tgtMin→targetMin, durMin→durationMin, durMax→durationMax.
 */
export const toFacetFilters = (filters: GalleryFilters): GalleryFacetFilters => ({
  monthlyMin: filters.mdMin,
  monthlyMax: filters.mdMax,
  targetMin: filters.tgtMin,
  durationMin: filters.durMin,
  durationMax: filters.durMax
});
