import { space } from '@/shared/styles';

/**
 * 커뮤니티 헤더의 좌우 여백 — `CommunityMain`(본문 컨테이너)과 **같은 값**이어야 헤더와 본문의
 * 좌우 끝선이 맞는다. 나머지 화면은 `AppHeader` 기본값(= `FeatureLayout` 과 같은 값)을 쓴다.
 *
 * 구 `SearchSlot`(헤더 가운데 인라인 검색 폭 산식) · `MobileSearchToggle`(돋보기) · `MobileSearchBar`
 * (헤더 아래 펼침 바) · `DesktopOnly`(글쓰기 라벨 숨김)는 **2026-07-31 에 전부 삭제됐다** —
 * 검색과 글쓰기가 갤러리 본문으로 내려가면서 헤더에는 감출 것도, 폭을 다툴 것도 남지 않았다.
 */
export const COMMUNITY_HEADER_GUTTER = `clamp(${space[3]}, 4vw, ${space[5]})`;
