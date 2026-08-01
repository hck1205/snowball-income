import AppHeader from '@/components/AppHeader';
import { COMMUNITY_HEADER_GUTTER } from './CommunityHeader.styled';

/**
 * 커뮤니티 화면이 공용 `AppHeader` 에 **더하는 것**만 정의한다 — 지금은 좌우 여백 하나뿐이다.
 *
 * 브랜드/홈 · 라우트 링크 · 로그인(AuthControl) · 테마 · 더보기(⋯)는 전부 `AppHeader` 가 그린다.
 * 이 파일이 헤더를 다시 조립하던 시절에는 같은 형태가 세 곳에 복제돼 서로 조금씩 갈렸다.
 *
 * **여기서 본문으로 내려간 것들**(전부 같은 이유 — 헤더 한 줄에 세울 자리가 없고, 헤더는 전 라우트
 * 공통이라 화면 문맥이 없다):
 *   - "← 목록" → `pages/Community/components/CommunityTopBar` (2026-07-28 사용자 결정)
 *   - 갤러리 검색(+모바일 돋보기 토글·펼침 바) → `CommunityGalleryPage` 본문 첫 줄 (2026-07-31 사용자 지시)
 *   - "글쓰기" → 갤러리는 `CommunityGalleryPage` 컨트롤 줄, 게시판은 `CommunityBoardPage` 상단 (2026-07-31)
 *
 * 이 컴포넌트가 얇다고 지우고 `CommunityLayout` 에서 `AppHeader` 를 직접 부르지 마라 — 커뮤니티 본문
 * 컨테이너(`CommunityMain`)와 좌우 끝선을 맞추는 여백 값의 소유자가 사라진다.
 */
export default function CommunityHeader() {
  return <AppHeader contentGutter={COMMUNITY_HEADER_GUTTER} />;
}
