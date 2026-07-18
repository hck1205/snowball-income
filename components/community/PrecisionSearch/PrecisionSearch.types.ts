/**
 * 갤러리 정밀 검색 드롭다운. 반응형은 @media가 아니라 **layout prop 구조 분기**로 팝오버/인라인을
 * 상호배타 렌더한다(jsdom @media 미평가 함정 회피 — 두 헤더 인스턴스가 이미 display:none으로 배타).
 */
export type PrecisionSearchLayout = 'popover' | 'inline';

export type PrecisionSearchProps = {
  /** popover(데스크톱 앵커 팝오버, 기본) | inline(태블릿↓ in-flow 전체폭). */
  layout?: PrecisionSearchLayout;
};

/**
 * 패널 드래프트(2단계 커밋의 로컬 상태) — **표시 문자열**이다. 금액은 만원(천단위 콤마 가능),
 * 기간은 년. "적용" 시 draftToFilters로 원/년 GalleryFilters로 변환·검증한 뒤 URL에 커밋한다.
 */
export type FilterDraft = {
  mdMin: string;
  mdMax: string;
  tgtMin: string;
  durMin: string;
  durMax: string;
};
