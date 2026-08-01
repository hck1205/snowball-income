/**
 * 갤러리 정밀 검색 드롭다운.
 *
 * **구(舊) `layout` prop(팝오버/인라인)은 삭제됐다.** 그 분기는 검색 클러스터가 헤더 안 인라인과
 * 헤더 아래 모바일 펼침 바 **두 인스턴스**로 존재하던 시절의 것이다 — 2026-07-31 에 검색이 갤러리
 * 본문 툴바 한 벌로 내려오며 인스턴스가 하나가 되어 전 폭에서 앵커 팝오버를 쓴다.
 * (본문 조상에 `overflow`/`contain` 이 없음을 실측으로 확인했다 — 공용 `Card` 안이었다면 잘렸을 것이다.)
 */

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
